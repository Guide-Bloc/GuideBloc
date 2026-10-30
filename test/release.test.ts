import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFixture,
  fundedBooking,
  signMutual,
  warpTo,
  splitOf,
  Status,
  USDC,
  DAY,
  HOUR,
} from "./helpers/fixture";

describe("Release paths", () => {
  describe("confirmCompletion", () => {
    it("tourist confirms after tourStart: settles 100% to guide minus commission", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });

      await warpTo(q.tourStart);

      const split = splitOf(q.amount, 0, 1000); // 0% tourist, 100% gross to guide, 10% commission

      await expect(fx.gb.connect(fx.tourist).confirmCompletion(id))
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.SETTLED, split.tourist, split.guide, split.commission)
        .and.to.emit(fx.gb, "Credited")
        .withArgs(q.guide, q.token, split.guide)
        .and.to.emit(fx.gb, "Credited")
        .withArgs(fx.treasury.address, q.token, split.commission);

      const b = await fx.gb.getBooking(id);
      expect(b.status).to.equal(Status.SETTLED);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(split.guide);
      expect(await fx.gb.claimable(fx.treasury.address, q.token)).to.equal(split.commission);
      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(0);
    });

    it("reverts if called before tourStart", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart - 10);
      await expect(fx.gb.connect(fx.tourist).confirmCompletion(id)).to.be.revertedWithCustomError(
        fx.gb,
        "TourNotStarted"
      );
    });

    it("reverts if called by non-tourist (e.g. guide)", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await expect(fx.gb.connect(fx.guide).confirmCompletion(id)).to.be.revertedWithCustomError(
        fx.gb,
        "NotTourist"
      );
    });

    it("reverts if booking is not FUNDED (e.g. already SETTLED)", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).confirmCompletion(id);
      await expect(fx.gb.connect(fx.tourist).confirmCompletion(id)).to.be.revertedWithCustomError(
        fx.gb,
        "InvalidStatus"
      );
    });
  });

  describe("finalize", () => {
    it("permissionlessly settles to guide after tourEnd + disputeWindow", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });
      const b = await fx.gb.getBooking(id);

      const finalizeTime = BigInt(b.tourEnd) + BigInt(b.disputeWindow);
      await warpTo(finalizeTime);

      const split = splitOf(q.amount, 0, 1000);

      // Anyone (e.g. keeper) can call
      await expect(fx.gb.connect(fx.keeper).finalize(id))
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.SETTLED, split.tourist, split.guide, split.commission);

      expect((await fx.gb.getBooking(id)).status).to.equal(Status.SETTLED);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(split.guide);
    });

    it("reverts if called before tourEnd + disputeWindow", async () => {
      const fx = await loadFixture(deployFixture);
      const { id } = await fundedBooking(fx);
      const b = await fx.gb.getBooking(id);

      const finalizeTime = BigInt(b.tourEnd) + BigInt(b.disputeWindow);
      await warpTo(finalizeTime - 10n);

      await expect(fx.gb.connect(fx.keeper).finalize(id)).to.be.revertedWithCustomError(
        fx.gb,
        "FinalizationTooEarly"
      );
    });

    it("reverts if status is not FUNDED (e.g. DISPUTED, CANCELLED)", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx);
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      const b = await fx.gb.getBooking(id);
      const finalizeTime = BigInt(b.tourEnd) + BigInt(b.disputeWindow);
      await warpTo(finalizeTime + 100n);

      await expect(fx.gb.connect(fx.keeper).finalize(id)).to.be.revertedWithCustomError(
        fx.gb,
        "InvalidStatus"
      );
    });
  });

  describe("mutualSettle", () => {
    it("settles with custom split when both sign while FUNDED", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(200) });

      const touristBps = 4000; // 40% tourist, 60% guide gross
      const deadline = (await time.latest()) + DAY;
      const touristSig = await signMutual(fx, fx.tourist, id, touristBps, deadline);
      const guideSig = await signMutual(fx, fx.guide, id, touristBps, deadline);

      const split = splitOf(q.amount, touristBps, 1000);

      await expect(
        fx.gb.connect(fx.other).mutualSettle(id, touristBps, deadline, touristSig, guideSig)
      )
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.SETTLED, split.tourist, split.guide, split.commission);

      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(split.tourist);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(split.guide);
      expect(await fx.gb.claimable(fx.treasury.address, q.token)).to.equal(split.commission);
    });

    it("settles while DISPUTED and returns bond to opener", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).openDispute(id);

      const b = await fx.gb.getBooking(id);
      expect(b.status).to.equal(Status.DISPUTED);

      const touristBps = 7000;
      const deadline = (await time.latest()) + DAY;
      const touristSig = await signMutual(fx, fx.tourist, id, touristBps, deadline);
      const guideSig = await signMutual(fx, fx.guide, id, touristBps, deadline);

      const split = splitOf(q.amount, touristBps, 1000);

      await expect(
        fx.gb.connect(fx.keeper).mutualSettle(id, touristBps, deadline, touristSig, guideSig)
      )
        .to.emit(fx.gb, "Settled")
        .withArgs(id, Status.SETTLED, split.tourist, split.guide, split.commission)
        .and.to.emit(fx.gb, "BondSettled")
        .withArgs(id, q.tourist, b.bondAmount);

      expect(await fx.gb.claimable(q.tourist, q.token)).to.equal(split.tourist + BigInt(b.bondAmount));
    });

    it("reverts on expired deadline", async () => {
      const fx = await loadFixture(deployFixture);
      const { id } = await fundedBooking(fx);
      const touristBps = 5000;
      const deadline = (await time.latest()) + 100;
      const touristSig = await signMutual(fx, fx.tourist, id, touristBps, deadline);
      const guideSig = await signMutual(fx, fx.guide, id, touristBps, deadline);

      await warpTo(deadline + 1);
      await expect(
        fx.gb.connect(fx.keeper).mutualSettle(id, touristBps, deadline, touristSig, guideSig)
      ).to.be.revertedWithCustomError(fx.gb, "DeadlineExpired");
    });

    it("reverts on invalid signature or invalid bps", async () => {
      const fx = await loadFixture(deployFixture);
      const { id } = await fundedBooking(fx);
      const deadline = (await time.latest()) + DAY;

      // Invalid BPS
      await expect(
        fx.gb.connect(fx.keeper).mutualSettle(id, 10001, deadline, "0x", "0x")
      ).to.be.revertedWithCustomError(fx.gb, "InvalidBps");

      // Invalid sig
      const touristSig = await signMutual(fx, fx.tourist, id, 5000, deadline);
      const badSig = await signMutual(fx, fx.other, id, 5000, deadline);
      await expect(
        fx.gb.connect(fx.keeper).mutualSettle(id, 5000, deadline, touristSig, badSig)
      ).to.be.revertedWithCustomError(fx.gb, "InvalidSignature");
    });
  });
});
