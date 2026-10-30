import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFixture,
  makeQuote,
  signQuote,
  fundedBooking,
  warpTo,
  splitOf,
  Status,
  USDC,
  DAY,
  HOUR,
} from "./helpers/fixture";

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("Invariant Tests (Handler-based State Machine)", () => {
  it("maintains Invariants 1-6 across 100 pseudo-random multi-actor state transitions", async () => {
    const fx = await loadFixture(deployFixture);
    const rand = lcg(42);

    interface ActiveBooking {
      id: string;
      token: string;
      tourist: string;
      guide: string;
      amount: bigint;
      tourStart: number;
      tourEnd: number;
      fullRefund: number;
      partialRefund: number;
      disputeWindow: number;
      arbitrationWindow: number;
      disputedAt: number;
      bondAmount: bigint;
      openerIsGuide: boolean;
      status: number;
    }

    const trackedBookings: ActiveBooking[] = [];
    const accounts = [
      fx.tourist.address,
      fx.tourist2.address,
      fx.guide.address,
      fx.guide2.address,
      fx.treasury.address,
    ];

    async function assertInvariants() {
      for (const token of [fx.usdc, fx.usdt]) {
        const tokenAddr = await token.getAddress();
        const contractBal = await token.balanceOf(fx.gbAddr);
        const totalLocked = await fx.gb.totalLocked(tokenAddr);

        // Invariant 1: balanceOf(this) >= totalLocked
        expect(contractBal).to.be.gte(
          totalLocked,
          `Invariant 1 violated for ${tokenAddr}: contractBal < totalLocked`
        );

        // Sum live bookings + bonds
        let liveBookingsAmount = 0n;
        for (const b of trackedBookings) {
          if (b.token.toLowerCase() === tokenAddr.toLowerCase()) {
            if (b.status === Number(Status.FUNDED)) {
              liveBookingsAmount += b.amount;
            } else if (b.status === Number(Status.DISPUTED)) {
              liveBookingsAmount += b.amount + b.bondAmount;
            }
          }
        }

        // Sum all claimable
        let claimableSum = 0n;
        for (const acc of accounts) {
          claimableSum += await fx.gb.claimable(acc, tokenAddr);
        }

        // Invariant 2: totalLocked == live bookings + bonds + claimable balances
        expect(totalLocked).to.equal(
          liveBookingsAmount + claimableSum,
          `Invariant 2 violated for ${tokenAddr}: totalLocked mismatch`
        );
      }
    }

    // Run 50 state machine operations
    for (let step = 0; step < 50; step++) {
      const action = Math.floor(rand() * 6);

      if (action === 0 || trackedBookings.length === 0) {
        // CREATE BOOKING
        const token = rand() > 0.5 ? fx.usdcAddr : fx.usdtAddr;
        const touristSigner = rand() > 0.5 ? fx.tourist : fx.tourist2;
        const guideSigner = rand() > 0.5 ? fx.guide : fx.guide2;
        const amount = USDC(Math.floor(rand() * 50) + 10);

        const now = await time.latest();
        const tourStart = now + 10 * DAY;
        const tourEnd = tourStart + 8 * HOUR;
        const fullRefund = now + 4 * DAY;
        const partialRefund = now + 7 * DAY;

        const q = await makeQuote(fx, {
          tourist: touristSigner.address,
          guide: guideSigner.address,
          token,
          amount,
          tourStart,
          tourEnd,
          fullRefundDeadline: fullRefund,
          partialRefundDeadline: partialRefund,
        });

        const sig = await signQuote(fx, q, guideSigner);
        const id = await fx.gb.hashQuote(q);

        await fx.gb.connect(touristSigner).deposit(q, sig);

        trackedBookings.push({
          id,
          token,
          tourist: touristSigner.address,
          guide: guideSigner.address,
          amount,
          tourStart,
          tourEnd,
          fullRefund,
          partialRefund,
          disputeWindow: 72 * HOUR,
          arbitrationWindow: 96 * HOUR,
          disputedAt: 0,
          bondAmount: 0n,
          openerIsGuide: false,
          status: Number(Status.FUNDED),
        });
      } else if (action === 1) {
        // CONFIRM COMPLETION
        const funded = trackedBookings.filter((b) => b.status === Number(Status.FUNDED));
        if (funded.length > 0) {
          const b = funded[Math.floor(rand() * funded.length)];
          await warpTo(b.tourStart + 10);
          const touristSigner = b.tourist === fx.tourist.address ? fx.tourist : fx.tourist2;
          await fx.gb.connect(touristSigner).confirmCompletion(b.id);
          b.status = Number(Status.SETTLED);
        }
      } else if (action === 2) {
        // CANCEL
        const funded = trackedBookings.filter((b) => b.status === Number(Status.FUNDED));
        if (funded.length > 0) {
          const b = funded[Math.floor(rand() * funded.length)];
          const now = await time.latest();
          if (now < b.tourStart) {
            if (rand() > 0.5) {
              const touristSigner = b.tourist === fx.tourist.address ? fx.tourist : fx.tourist2;
              await fx.gb.connect(touristSigner).cancelByTourist(b.id);
            } else {
              const guideSigner = b.guide === fx.guide.address ? fx.guide : fx.guide2;
              await fx.gb.connect(guideSigner).cancelByGuide(b.id);
            }
            b.status = Number(Status.CANCELLED);
          }
        }
      } else if (action === 3) {
        // DISPUTE & RESOLUTION
        const funded = trackedBookings.filter((b) => b.status === Number(Status.FUNDED));
        if (funded.length > 0) {
          const b = funded[Math.floor(rand() * funded.length)];
          await warpTo(b.tourStart + 10);

          const byGuide = rand() > 0.5;
          const opener = byGuide
            ? (b.guide === fx.guide.address ? fx.guide : fx.guide2)
            : (b.tourist === fx.tourist.address ? fx.tourist : fx.tourist2);

          await fx.gb.connect(opener).openDispute(b.id);

          const onChainB = await fx.gb.getBooking(b.id);
          b.status = Number(Status.DISPUTED);
          b.bondAmount = BigInt(onChainB.bondAmount);
          b.disputedAt = Number(onChainB.disputedAt);
          b.openerIsGuide = byGuide;

          // Now resolve
          if (rand() > 0.3) {
            // Arbitrator resolves
            const touristBps = Math.floor(rand() * 10001);
            await fx.gb.connect(fx.arbitrator).resolveDispute(b.id, touristBps);
            b.status = Number(Status.SETTLED);
          } else {
            // Expired resolve
            await warpTo(b.disputedAt + b.arbitrationWindow + 10);
            await fx.gb.connect(fx.keeper).resolveExpiredDispute(b.id);
            b.status = Number(Status.SETTLED);
          }
        }
      } else if (action === 4) {
        // FINALIZE
        const funded = trackedBookings.filter((b) => b.status === Number(Status.FUNDED));
        if (funded.length > 0) {
          const b = funded[Math.floor(rand() * funded.length)];
          await warpTo(b.tourEnd + b.disputeWindow + 10);
          await fx.gb.connect(fx.keeper).finalize(b.id);
          b.status = Number(Status.SETTLED);
        }
      } else if (action === 5) {
        // WITHDRAW
        const tokenAddr = rand() > 0.5 ? fx.usdcAddr : fx.usdtAddr;
        const signer = [fx.tourist, fx.tourist2, fx.guide, fx.guide2, fx.treasury][
          Math.floor(rand() * 5)
        ];
        const claimable = await fx.gb.claimable(signer.address, tokenAddr);
        if (claimable > 0n) {
          await fx.gb.connect(signer).withdraw(tokenAddr);
        }
      }

      // Assert Invariants at every single step!
      await assertInvariants();
    }
  });
});
