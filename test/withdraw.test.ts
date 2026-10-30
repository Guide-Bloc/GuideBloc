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

describe("Withdrawals & Payout Address", () => {
  describe("withdraw", () => {
    it("withdraws caller's claimable tokens to caller and updates totalLocked", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).confirmCompletion(id);

      const split = splitOf(q.amount, 0, 1000);
      const claimableGuide = await fx.gb.claimable(q.guide, q.token);
      expect(claimableGuide).to.equal(split.guide);

      const guideBalBefore = await fx.usdc.balanceOf(q.guide);
      const totalLockedBefore = await fx.gb.totalLocked(q.token);

      await expect(fx.gb.connect(fx.guide).withdraw(q.token))
        .to.emit(fx.gb, "Withdrawn")
        .withArgs(q.guide, q.guide, q.token, split.guide);

      expect(await fx.usdc.balanceOf(q.guide)).to.equal(guideBalBefore + split.guide);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(0);
      expect(await fx.gb.totalLocked(q.token)).to.equal(totalLockedBefore - split.guide);
    });

    it("reverts NothingToWithdraw if balance is 0", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(fx.gb.connect(fx.other).withdraw(fx.usdcAddr)).to.be.revertedWithCustomError(
        fx.gb,
        "NothingToWithdraw"
      );
    });
  });

  describe("withdrawFor", () => {
    it("anyone can trigger withdrawal for an account; sends to account by default", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).confirmCompletion(id);

      const split = splitOf(q.amount, 0, 1000);
      const guideBalBefore = await fx.usdc.balanceOf(q.guide);

      await expect(fx.gb.connect(fx.keeper).withdrawFor(q.guide, q.token))
        .to.emit(fx.gb, "Withdrawn")
        .withArgs(q.guide, q.guide, q.token, split.guide);

      expect(await fx.usdc.balanceOf(q.guide)).to.equal(guideBalBefore + split.guide);
      expect(await fx.gb.claimable(q.guide, q.token)).to.equal(0);
    });

    it("sends to registered payoutAddress if one was confirmed", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, id } = await fundedBooking(fx, { amount: USDC(100) });
      await warpTo(q.tourStart);
      await fx.gb.connect(fx.tourist).confirmCompletion(id);

      const split = splitOf(q.amount, 0, 1000);
      const payoutWallet = fx.other; // designated cold wallet

      // Request and confirm payout address change
      await fx.gb.connect(fx.guide).requestPayoutChange(payoutWallet.address);
      const pending = await fx.gb.pendingPayoutChange(fx.guide.address);
      await warpTo(pending.readyAt);
      await fx.gb.connect(fx.guide).confirmPayoutChange();

      expect(await fx.gb.payoutAddress(fx.guide.address)).to.equal(payoutWallet.address);

      const payoutBalBefore = await fx.usdc.balanceOf(payoutWallet.address);

      // withdrawFor redirects to payoutAddress
      await expect(fx.gb.connect(fx.keeper).withdrawFor(q.guide, q.token))
        .to.emit(fx.gb, "Withdrawn")
        .withArgs(q.guide, payoutWallet.address, q.token, split.guide);

      expect(await fx.usdc.balanceOf(payoutWallet.address)).to.equal(payoutBalBefore + split.guide);
    });
  });

  describe("Payout address change lifecycle", () => {
    it("request, delay, confirm, and cancel", async () => {
      const fx = await loadFixture(deployFixture);

      // Request
      await fx.gb.connect(fx.guide).requestPayoutChange(fx.other.address);
      const pending = await fx.gb.pendingPayoutChange(fx.guide.address);
      expect(pending.newAddress).to.equal(fx.other.address);

      // Cannot confirm too early
      await warpTo(pending.readyAt - 10n);
      await expect(fx.gb.connect(fx.guide).confirmPayoutChange()).to.be.revertedWithCustomError(
        fx.gb,
        "PayoutChangeNotReady"
      );

      // Cancel
      await expect(fx.gb.connect(fx.guide).cancelPayoutChange())
        .to.emit(fx.gb, "PayoutChangeCancelled")
        .withArgs(fx.guide.address, fx.other.address);

      expect((await fx.gb.pendingPayoutChange(fx.guide.address)).newAddress).to.equal(ethers.ZeroAddress);

      // Cannot confirm after cancelled
      await expect(fx.gb.connect(fx.guide).confirmPayoutChange()).to.be.revertedWithCustomError(
        fx.gb,
        "NoPendingChange"
      );
    });

    it("reverts on zero address request", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(
        fx.gb.connect(fx.guide).requestPayoutChange(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(fx.gb, "ZeroAddress");
    });
  });
});
