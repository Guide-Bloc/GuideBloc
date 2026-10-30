import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFixture,
  fundedBooking,
  makeQuote,
  signQuote,
  warpTo,
  splitOf,
  Status,
  USDC,
  DAY,
} from "./helpers/fixture";

describe("Regression tests (V2 flaw mitigations)", () => {
  it("test_GuideCannotReleaseBeforeTourEnds: guide has no method to unilaterally release before tourEnd + disputeWindow", async () => {
    const fx = await loadFixture(deployFixture);
    const { q, id } = await fundedBooking(fx, { amount: USDC(100) });

    // 1. Immediately after deposit, guide cannot call confirmCompletion
    await expect(fx.gb.connect(fx.guide).confirmCompletion(id)).to.be.revertedWithCustomError(
      fx.gb,
      "NotTourist"
    );

    // 2. Guide cannot finalize before tourEnd + disputeWindow
    const b = await fx.gb.getBooking(id);
    const finalizeTime = BigInt(b.tourEnd) + BigInt(b.disputeWindow);

    await warpTo(q.tourStart);
    await expect(fx.gb.connect(fx.guide).finalize(id)).to.be.revertedWithCustomError(
      fx.gb,
      "FinalizationTooEarly"
    );

    await warpTo(finalizeTime - 10n);
    await expect(fx.gb.connect(fx.guide).finalize(id)).to.be.revertedWithCustomError(
      fx.gb,
      "FinalizationTooEarly"
    );

    // 3. Only after dispute window elapses can finalization occur
    await warpTo(finalizeTime);
    await expect(fx.gb.connect(fx.guide).finalize(id)).to.emit(fx.gb, "Settled");
  });

  it("test_TouristCannotRefundAfterTourStart: tourist cannot unilaterally cancel after tourStart", async () => {
    const fx = await loadFixture(deployFixture);
    const { q, id } = await fundedBooking(fx);

    await warpTo(q.tourStart);
    await expect(fx.gb.connect(fx.tourist).cancelByTourist(id)).to.be.revertedWithCustomError(
      fx.gb,
      "TourAlreadyStarted"
    );
  });

  it("test_NoAdminFunctionCanMoveTokens: verifies zero rescue/sweep/withdraw backdoor exists in ABI or bytecode", async () => {
    const fx = await loadFixture(deployFixture);
    const { q } = await fundedBooking(fx, { amount: USDC(500) });

    // Check all function names on the GuideBloc interface
    const fragmentNames = fx.gb.interface.fragments
      .filter((f) => f.type === "function")
      .map((f) => f.name.toLowerCase());

    const forbidden = ["rescue", "sweep", "drain", "emergency", "transfertoken", "recover"];
    for (const name of fragmentNames) {
      for (const bad of forbidden) {
        expect(name).to.not.include(bad);
      }
    }

    // Verify admin calling withdraw for unowed tokens reverts
    await expect(fx.gb.connect(fx.admin).withdraw(q.token)).to.be.revertedWithCustomError(
      fx.gb,
      "NothingToWithdraw"
    );
  });

  it("test_BookingIdCannotBeSquatted: bookingId is strictly EIP-712 quote digest; third party frontrun impossible", async () => {
    const fx = await loadFixture(deployFixture);
    const q = await makeQuote(fx);
    const sig = await signQuote(fx, q);

    // Attacker tries to front-run deposit with attacker's address as caller
    await expect(fx.gb.connect(fx.other).deposit(q, sig)).to.be.revertedWithCustomError(
      fx.gb,
      "NotTourist"
    );

    // Attacker modifies tourist address in quote to self -> guide's signature is invalid
    const badQ = { ...q, tourist: fx.other.address };
    await expect(fx.gb.connect(fx.other).deposit(badQ, sig)).to.be.revertedWithCustomError(
      fx.gb,
      "InvalidSignature"
    );

    // Legitimate tourist successfully deposits
    await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.emit(fx.gb, "Deposited");
  });

  it("test_BlacklistedRecipientDoesNotBlockOthers: pull-pattern isolates blacklisted accounts", async () => {
    const fx = await loadFixture(deployFixture);
    const { q, id } = await fundedBooking(fx, { amount: USDC(100) });

    // Blacklist the guide on the token
    await fx.usdc.setBlacklisted(q.guide, true);

    // Settle booking: settlement CREDITS claimable and NEVER transfers directly!
    await warpTo(q.tourStart);
    await expect(fx.gb.connect(fx.tourist).confirmCompletion(id)).to.emit(fx.gb, "Settled");

    // Treasury (not blacklisted) can withdraw their commission seamlessly!
    const treasuryBalBefore = await fx.usdc.balanceOf(fx.treasury.address);
    const comm = splitOf(q.amount, 0, 1000).commission;

    await expect(fx.gb.connect(fx.treasury).withdraw(q.token)).to.emit(fx.gb, "Withdrawn");
    expect(await fx.usdc.balanceOf(fx.treasury.address)).to.equal(treasuryBalBefore + comm);

    // Guide's withdrawal reverts on token blacklist, but nobody else is affected!
    await expect(fx.gb.connect(fx.guide).withdraw(q.token)).to.be.revertedWith("Blacklisted");
  });

  it("test_FeeChangeDoesNotAffectExistingBookings: snapshotted commissionBps is immutable per booking", async () => {
    const fx = await loadFixture(deployFixture);
    // Booking 1 created with commission 1000 (10%)
    const { q: q1, id: id1 } = await fundedBooking(fx, { amount: USDC(100) });

    // Admin updates fee to 1500 (15%) for future bookings
    await fx.gb.connect(fx.admin).setCommissionBps(1500);

    // Booking 2 created with commission 1500 (15%)
    const { q: q2, id: id2 } = await fundedBooking(fx, { amount: USDC(100) });

    // Settle booking 1
    await warpTo(q1.tourStart);
    await fx.gb.connect(fx.tourist).confirmCompletion(id1);

    // Booking 1 pays exactly 10% commission (10 USDC), NOT 15%
    const split1 = splitOf(q1.amount, 0, 1000);
    expect(await fx.gb.claimable(fx.treasury.address, q1.token)).to.equal(split1.commission);

    // Settle booking 2
    await warpTo(q2.tourStart);
    await fx.gb.connect(fx.tourist).confirmCompletion(id2);

    // Booking 2 pays 15% commission (15 USDC)
    const split2 = splitOf(q2.amount, 0, 1500);
    expect(await fx.gb.claimable(fx.treasury.address, q2.token)).to.equal(
      split1.commission + split2.commission
    );
  });

  it("test_TreasuryChangeIsTwoStep: requires explicit proposal by admin and acceptance by new treasury", async () => {
    const fx = await loadFixture(deployFixture);
    const newTreasury = fx.other;

    // Proposal
    await fx.gb.connect(fx.admin).proposeTreasury(newTreasury.address);
    expect(await fx.gb.treasury()).to.equal(fx.treasury.address);

    // Acceptance
    await fx.gb.connect(newTreasury).acceptTreasury();
    expect(await fx.gb.treasury()).to.equal(newTreasury.address);
  });
});
