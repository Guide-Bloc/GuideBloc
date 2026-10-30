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

describe("Cancellation", () => {
  describe("cancelByTourist", () => {
    it("tier 1: before fullRefundDeadline -> 100% refund to tourist, 0 commission", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });

      await warpTo(q.fullRefundDeadline - 100);

      await expect(fx.gb.connect(fx.tourist).cancelByTourist(id))
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.CANCELLED, q.amount, 0, 0);

      expect((await fx.gb.getBooking(id)).status).to.equal(Status.CANCELLED);
      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(q.amount);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(0);
      expect(await fx.gb.claimable(fx.treasury.address, q.token)).to.equal(0);
    });

    it("tier 2: before partialRefundDeadline -> partialRefundBps to tourist, remainder to guide minus commission", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, {
        amount: USDC(100),
        partialRefundBps: 6000, // 60%
      });

      // Warp to between fullRefundDeadline and partialRefundDeadline
      await warpTo(q.fullRefundDeadline + 10);

      const split = splitOf(q.amount, 6000, 1000); // 60 tourist, 36 guide, 4 commission

      await expect(fx.gb.connect(fx.tourist).cancelByTourist(id))
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.CANCELLED, split.tourist, split.guide, split.commission);

      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(split.tourist);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(split.guide);
      expect(await fx.gb.claimable(fx.treasury.address, q.token)).to.equal(split.commission);
    });

    it("tier 3: after partialRefundDeadline but before tourStart -> 0% refund to tourist, all to guide minus commission", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });

      // Warp to between partialRefundDeadline and tourStart
      await warpTo(q.partialRefundDeadline + 10);

      const split = splitOf(q.amount, 0, 1000); // 0 tourist, 90 guide, 10 commission

      await expect(fx.gb.connect(fx.tourist).cancelByTourist(id))
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.CANCELLED, split.tourist, split.guide, split.commission);

      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(0);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(split.guide);
      expect(await fx.gb.claimable(fx.treasury.address, q.token)).to.equal(split.commission);
    });

    it("reverts if called after tourStart", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await expect(fx.gb.connect(fx.tourist).cancelByTourist(id)).to.be.revertedWithCustomError(
        fx.gb,
        "TourAlreadyStarted"
      );
    });

    it("reverts if called by non-tourist", async () => {
      const fx = await loadFixture(deployFixture);
      const { id } = await fundedBooking(fx);
      await expect(fx.gb.connect(fx.guide).cancelByTourist(id)).to.be.revertedWithCustomError(
        fx.gb,
        "NotTourist"
      );
    });
  });

  describe("cancelByGuide", () => {
    it("guide cancels: 100% refund to tourist, 0 commission", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });

      await expect(fx.gb.connect(fx.guide).cancelByGuide(id))
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.CANCELLED, q.amount, 0, 0);

      expect((await fx.gb.getBooking(id)).status).to.equal(Status.CANCELLED);
      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(q.amount);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(0);
    });

    it("reverts if called by non-guide", async () => {
      const fx = await loadFixture(deployFixture);
      const { id } = await fundedBooking(fx);
      await expect(fx.gb.connect(fx.tourist).cancelByGuide(id)).to.be.revertedWithCustomError(
        fx.gb,
        "NotGuide"
      );
    });

    it("reverts if status is not FUNDED (e.g. DISPUTED)", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      await expect(fx.gb.connect(fx.guide).cancelByGuide(id)).to.be.revertedWithCustomError(
        fx.gb,
        "InvalidStatus"
      );
    });
  });
});
