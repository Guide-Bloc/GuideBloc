import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {
  deployFixture,
  fundedBooking,
  warpTo,
  splitOf,
  Status,
  USDC,
  DAY,
  HOUR,
} from "./helpers/fixture";

describe("Disputes", () => {
  describe("openDispute", () => {
    it("tourist opens dispute: pulls bond (floor of 10 USDC), sets DISPUTED, records disputedAt and opener", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) }); // 5% of 100 = 5 < 10 floor => bond = 10 USDC

      await warpTo(q.tourStart);

      const expectedBond = USDC(10);
      const balanceBefore = await fx.usdc.balanceOf(fx.tourist.address);

      await expect(fx.gb.connect(fx.tourist).openDispute(id))
        .to.emit(fx.gb, "DisputeOpened")
        .withArgs(id, fx.tourist.address, expectedBond, anyValue);

      const b = await fx.gb.getBooking(id);
      expect(b.status).to.equal(Status.DISPUTED);
      expect(b.disputeOpenedByGuide).to.equal(false);
      expect(b.bondAmount).to.equal(expectedBond);
      expect(await fx.usdc.balanceOf(fx.tourist.address)).to.equal(balanceBefore - expectedBond);
      expect(await fx.gb.totalLocked(q.token)).to.equal(q.amount + expectedBond);
    });

    it("guide opens dispute with percentage above floor", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(300) }); // 5% of 300 = 15 > 10 => bond = 15 USDC

      await warpTo(q.tourStart);

      const expectedBond = USDC(15);
      await expect(fx.gb.connect(fx.guide).openDispute(id))
        .to.emit(fx.gb, "DisputeOpened")
        .withArgs(id, fx.guide.address, expectedBond, anyValue);

      const b = await fx.gb.getBooking(id);
      expect(b.disputeOpenedByGuide).to.equal(true);
      expect(b.bondAmount).to.equal(expectedBond);
    });

    it("reverts if called before tourStart", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart - 10);
      await expect(fx.gb.connect(fx.tourist).openDispute(id)).to.be.revertedWithCustomError(
        fx.gb,
        "DisputeWindowClosed"
      );
    });

    it("reverts if called at/after tourEnd + disputeWindow", async () => {
      const fx = await loadFixture(deployFixture);
      const { id } = await fundedBooking(fx);
      const b = await fx.gb.getBooking(id);
      await warpTo(BigInt(b.tourEnd) + BigInt(b.disputeWindow));
      await expect(fx.gb.connect(fx.tourist).openDispute(id)).to.be.revertedWithCustomError(
        fx.gb,
        "DisputeWindowClosed"
      );
    });

    it("reverts if called by third party", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await expect(fx.gb.connect(fx.other).openDispute(id)).to.be.revertedWithCustomError(
        fx.gb,
        "NotParty"
      );
    });
  });

  describe("submitEvidence", () => {
    it("party can submit evidence hash while DISPUTED", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("photos_and_receipts"));
      await expect(fx.gb.connect(fx.tourist).submitEvidence(id, evidenceHash))
        .to.emit(fx.gb, "EvidenceSubmitted")
        .withArgs(id, fx.tourist.address, evidenceHash);

      await expect(fx.gb.connect(fx.guide).submitEvidence(id, evidenceHash))
        .to.emit(fx.gb, "EvidenceSubmitted")
        .withArgs(id, fx.guide.address, evidenceHash);
    });

    it("reverts if not DISPUTED or not a party", async () => {
      const fx = await loadFixture(deployFixture);
      const { id } = await fundedBooking(fx);
      const hash = ethers.ZeroHash;
      await expect(fx.gb.connect(fx.tourist).submitEvidence(id, hash)).to.be.revertedWithCustomError(
        fx.gb,
        "InvalidStatus"
      );
    });
  });

  describe("resolveDispute", () => {
    it("arbitrator resolves: opener gets > 50% => bond returned to opener", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id); // Tourist opened dispute

      const touristBps = 7000; // Tourist gets 70% (> 50% for tourist/opener)
      const split = splitOf(q.amount, touristBps, 1000);
      const bond = USDC(10);

      await expect(fx.gb.connect(fx.arbitrator).resolveDispute(id, touristBps))
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.SETTLED, split.tourist, split.guide, split.commission)
        .and.to.emit(fx.gb, "BondSettled")
        .withArgs(id, fx.tourist.address, bond)
        .and.to.emit(fx.gb, "DisputeResolved")
        .withArgs(id, fx.arbitrator.address, touristBps, false);

      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(split.tourist + bond);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(split.guide);
    });

    it("arbitrator resolves: opener gets <= 50% => bond awarded to counterparty", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id); // Tourist opened dispute

      const touristBps = 3000; // Tourist gets 30% (<= 50% for tourist/opener) -> bond goes to Guide
      const split = splitOf(q.amount, touristBps, 1000);
      const bond = USDC(10);

      await expect(fx.gb.connect(fx.arbitrator).resolveDispute(id, touristBps))
        .to.emit(fx.gb, "BondSettled")
        .withArgs(id, fx.guide.address, bond);

      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(split.tourist);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(split.guide + bond);
    });

    it("reverts if called by non-arbitrator", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      await expect(fx.gb.connect(fx.other).resolveDispute(id, 5000)).to.be.revertedWithCustomError(
        fx.gb,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("reverts if called at/after arbitrationWindow elapsed", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      const b = await fx.gb.getBooking(id);
      await warpTo(BigInt(b.disputedAt) + BigInt(b.arbitrationWindow));

      await expect(fx.gb.connect(fx.arbitrator).resolveDispute(id, 5000)).to.be.revertedWithCustomError(
        fx.gb,
        "ArbitrationWindowClosed"
      );
    });
  });

  describe("resolveExpiredDispute", () => {
    it("anyone can resolve expired dispute: applies default split and returns bond to opener", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      const b = await fx.gb.getBooking(id);
      await warpTo(BigInt(b.disputedAt) + BigInt(b.arbitrationWindow));

      const split = splitOf(q.amount, 5000, 1000); // 50/50 default
      const bond = USDC(10);

      await expect(fx.gb.connect(fx.keeper).resolveExpiredDispute(id))
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.SETTLED, split.tourist, split.guide, split.commission)
        .and.to.emit(fx.gb, "BondSettled")
        .withArgs(id, fx.tourist.address, bond)
        .and.to.emit(fx.gb, "DisputeResolved")
        .withArgs(id, fx.keeper.address, 5000, true);

      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(split.tourist + bond);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(split.guide);
    });

    it("reverts if arbitrationWindow is still open", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      const b = await fx.gb.getBooking(id);
      await warpTo(BigInt(b.disputedAt) + BigInt(b.arbitrationWindow) - 10n);

      await expect(fx.gb.connect(fx.keeper).resolveExpiredDispute(id)).to.be.revertedWithCustomError(
        fx.gb,
        "ArbitrationWindowOpen"
      );
    });
  });
});
