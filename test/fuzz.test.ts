import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFixture,
  fundedBooking,
  warpTo,
  splitOf,
  Status,
  USDC,
  DAY,
} from "./helpers/fixture";

// Deterministic PRNG for reproducible fuzzing
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Fuzz / Property Tests", () => {
  const prng = mulberry32(1337);

  function randomBetween(min: number, max: number): number {
    return Math.floor(prng() * (max - min + 1)) + min;
  }

  it("fuzz test 50 random dispute resolutions: conservation of funds holds exactly with zero dust lost", async () => {
    const fx = await loadFixture(deployFixture);

    for (let i = 0; i < 50; i++) {
      const amount = BigInt(randomBetween(5, 1000)) * 1_000_000n + BigInt(randomBetween(0, 999_999));
      const commissionBps = randomBetween(0, 1500);
      const touristBps = randomBetween(0, 10000);

      // Set commission
      await fx.gb.connect(fx.admin).setCommissionBps(commissionBps);

      const { q, id } = await fundedBooking(fx, { amount });
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      const b = await fx.gb.getBooking(id);
      const bond = BigInt(b.bondAmount);

      const claimableTouristBefore = await fx.gb.claimable(q.tourist, q.token);
      const claimableGuideBefore = await fx.gb.claimable(q.guide, q.token);
      const claimableTreasuryBefore = await fx.gb.claimable(fx.treasury.address, q.token);

      // Resolve dispute
      await fx.gb.connect(fx.arbitrator).resolveDispute(id, touristBps);

      const claimableTouristAfter = await fx.gb.claimable(q.tourist, q.token);
      const claimableGuideAfter = await fx.gb.claimable(q.guide, q.token);
      const claimableTreasuryAfter = await fx.gb.claimable(fx.treasury.address, q.token);

      const touristReceived = claimableTouristAfter - claimableTouristBefore;
      const guideReceived = claimableGuideAfter - claimableGuideBefore;
      const treasuryReceived = claimableTreasuryAfter - claimableTreasuryBefore;

      // Invariant: sum of payouts + bond movements == amount + bond
      expect(touristReceived + guideReceived + treasuryReceived).to.equal(amount + bond);

      // Tourist share check
      const expectedTourist = (amount * BigInt(touristBps)) / 10000n;
      const expectedGuideGross = amount - expectedTourist;
      const expectedComm = (expectedGuideGross * BigInt(commissionBps)) / 10000n;
      const expectedGuideNet = expectedGuideGross - expectedComm;

      expect(treasuryReceived).to.equal(expectedComm);

      if (touristBps > 5000) {
        // Opener (tourist) won bond
        expect(touristReceived).to.equal(expectedTourist + bond);
        expect(guideReceived).to.equal(expectedGuideNet);
      } else {
        // Counterparty (guide) won bond
        expect(touristReceived).to.equal(expectedTourist);
        expect(guideReceived).to.equal(expectedGuideNet + bond);
      }
    }
  });

  it("fuzz test 30 random cancellation amounts and tiers: conservation of funds holds", async () => {
    const fx = await loadFixture(deployFixture);

    for (let i = 0; i < 30; i++) {
      const amount = BigInt(randomBetween(5, 1000)) * 1_000_000n;
      const partialRefundBps = randomBetween(0, 10000);

      const { q, id } = await fundedBooking(fx, { amount, partialRefundBps });

      const claimableTouristBefore = await fx.gb.claimable(q.tourist, q.token);
      const claimableGuideBefore = await fx.gb.claimable(q.guide, q.token);
      const claimableTreasuryBefore = await fx.gb.claimable(fx.treasury.address, q.token);

      // Cancel between full and partial deadline (tier 2)
      await warpTo(q.fullRefundDeadline + 10);
      await fx.gb.connect(fx.tourist).cancelByTourist(id);

      const claimableTouristAfter = await fx.gb.claimable(q.tourist, q.token);
      const claimableGuideAfter = await fx.gb.claimable(q.guide, q.token);
      const claimableTreasuryAfter = await fx.gb.claimable(fx.treasury.address, q.token);

      const touristReceived = claimableTouristAfter - claimableTouristBefore;
      const guideReceived = claimableGuideAfter - claimableGuideBefore;
      const treasuryReceived = claimableTreasuryAfter - claimableTreasuryBefore;

      // Invariant 4: total distributed == amount
      expect(touristReceived + guideReceived + treasuryReceived).to.equal(amount);
    }
  });
});
