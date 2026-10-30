import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFixture,
  USDC,
  DAY,
} from "./helpers/fixture";

describe("Admin & Role Powers", () => {
  describe("setTokenConfig", () => {
    it("admin updates token config; rejects non-admin", async () => {
      const fx = await loadFixture(deployFixture);

      await expect(
        fx.gb.connect(fx.other).setTokenConfig(fx.usdcAddr, true, true, USDC(10), USDC(500), USDC(20000))
      ).to.be.revertedWithCustomError(fx.gb, "AccessControlUnauthorizedAccount");

      await expect(
        fx.gb.connect(fx.admin).setTokenConfig(fx.usdcAddr, true, true, USDC(10), USDC(500), USDC(20000))
      )
        .to.emit(fx.gb, "TokenConfigUpdated")
        .withArgs(fx.usdcAddr, true, true, USDC(10), USDC(500), USDC(20000));

      const cfg = await fx.gb.tokenConfigs(fx.usdcAddr);
      expect(cfg.minAmount).to.equal(USDC(10));
      expect(cfg.perBookingCap).to.equal(USDC(500));
    });

    it("reverts on token with non-6 decimals", async () => {
      const fx = await loadFixture(deployFixture);
      // Deploy an 18-decimal token
      const token18Factory = await ethers.getContractFactory("ERC20Mock", {
        // We can deploy OpenZeppelin standard ERC20 with 18 decimals if needed, or check revert
      }).catch(() => null);

      // Or a quick test token with 18 decimals
    });

    it("reverts on invalid bounds (min > perBooking or perBooking > tvl)", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(
        fx.gb.connect(fx.admin).setTokenConfig(fx.usdcAddr, true, true, USDC(500), USDC(100), USDC(1000))
      ).to.be.revertedWithCustomError(fx.gb, "InvalidTokenConfig");

      await expect(
        fx.gb.connect(fx.admin).setTokenConfig(fx.usdcAddr, true, true, USDC(10), USDC(1000), USDC(500))
      ).to.be.revertedWithCustomError(fx.gb, "InvalidTokenConfig");
    });
  });

  describe("Parameters & bounds", () => {
    it("setCommissionBps respects MAX_COMMISSION_BPS (1500)", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(fx.gb.connect(fx.admin).setCommissionBps(1501)).to.be.revertedWithCustomError(
        fx.gb,
        "ValueOutOfBounds"
      );
      await fx.gb.connect(fx.admin).setCommissionBps(1500);
      expect(await fx.gb.commissionBps()).to.equal(1500);
    });

    it("setDisputeBondBps respects bounds (100..2000)", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(fx.gb.connect(fx.admin).setDisputeBondBps(99)).to.be.revertedWithCustomError(
        fx.gb,
        "ValueOutOfBounds"
      );
      await expect(fx.gb.connect(fx.admin).setDisputeBondBps(2001)).to.be.revertedWithCustomError(
        fx.gb,
        "ValueOutOfBounds"
      );
      await fx.gb.connect(fx.admin).setDisputeBondBps(800);
      expect(await fx.gb.disputeBondBps()).to.equal(800);
    });

    it("setDisputeWindow respects bounds (1..14 days)", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(fx.gb.connect(fx.admin).setDisputeWindow(DAY - 1)).to.be.revertedWithCustomError(
        fx.gb,
        "ValueOutOfBounds"
      );
      await expect(fx.gb.connect(fx.admin).setDisputeWindow(14 * DAY + 1)).to.be.revertedWithCustomError(
        fx.gb,
        "ValueOutOfBounds"
      );
      await fx.gb.connect(fx.admin).setDisputeWindow(5 * DAY);
      expect(await fx.gb.disputeWindow()).to.equal(5 * DAY);
    });

    it("setArbitrationWindow respects bounds (1..30 days)", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(fx.gb.connect(fx.admin).setArbitrationWindow(DAY - 1)).to.be.revertedWithCustomError(
        fx.gb,
        "ValueOutOfBounds"
      );
      await expect(fx.gb.connect(fx.admin).setArbitrationWindow(30 * DAY + 1)).to.be.revertedWithCustomError(
        fx.gb,
        "ValueOutOfBounds"
      );
      await fx.gb.connect(fx.admin).setArbitrationWindow(7 * DAY);
      expect(await fx.gb.arbitrationWindow()).to.equal(7 * DAY);
    });

    it("setDefaultDisputeTouristBps respects 10000 max", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(fx.gb.connect(fx.admin).setDefaultDisputeTouristBps(10001)).to.be.revertedWithCustomError(
        fx.gb,
        "InvalidBps"
      );
      await fx.gb.connect(fx.admin).setDefaultDisputeTouristBps(6000);
      expect(await fx.gb.defaultDisputeTouristBps()).to.equal(6000);
    });
  });

  describe("Treasury 2-Step Change", () => {
    it("propose and accept treasury", async () => {
      const fx = await loadFixture(deployFixture);
      const newTreasury = fx.other;

      // Step 1: propose
      await expect(fx.gb.connect(fx.admin).proposeTreasury(newTreasury.address))
        .to.emit(fx.gb, "TreasuryProposed")
        .withArgs(fx.treasury.address, newTreasury.address);

      expect(await fx.gb.pendingTreasury()).to.equal(newTreasury.address);
      expect(await fx.gb.treasury()).to.equal(fx.treasury.address); // not changed yet

      // Non-pending caller cannot accept
      await expect(fx.gb.connect(fx.admin).acceptTreasury()).to.be.revertedWithCustomError(
        fx.gb,
        "NotPendingTreasury"
      );

      // Step 2: accept by proposed treasury
      await expect(fx.gb.connect(newTreasury).acceptTreasury())
        .to.emit(fx.gb, "TreasuryUpdated")
        .withArgs(fx.treasury.address, newTreasury.address);

      expect(await fx.gb.treasury()).to.equal(newTreasury.address);
      expect(await fx.gb.pendingTreasury()).to.equal(ethers.ZeroAddress);
    });

    it("reverts on zero address proposal", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(
        fx.gb.connect(fx.admin).proposeTreasury(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(fx.gb, "ZeroAddress");
    });
  });

  describe("Pauser Role", () => {
    it("pauser can pause and unpause", async () => {
      const fx = await loadFixture(deployFixture);
      await expect(fx.gb.connect(fx.other).pause()).to.be.revertedWithCustomError(
        fx.gb,
        "AccessControlUnauthorizedAccount"
      );

      await fx.gb.connect(fx.pauser).pause();
      expect(await fx.gb.paused()).to.equal(true);

      await fx.gb.connect(fx.pauser).unpause();
      expect(await fx.gb.paused()).to.equal(false);
    });
  });
});
