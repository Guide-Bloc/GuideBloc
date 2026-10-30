import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFixture,
  fundedBooking,
  makeQuote,
  signQuote,
  warpTo,
  nextBlockAt,
  splitOf,
  Status,
  USDC,
  DAY,
  HOUR,
} from "./helpers/fixture";

describe("Strict Boundaries & Edge Timing", () => {
  it("test_DisputedBookingCanNeverBeFinalized: finalize reverts on DISPUTED even after window", async () => {
    const fx = await loadFixture(deployFixture);
    const { q, id } = await fundedBooking(fx);
    await warpTo(q.tourStart);
    await fx.gb.connect(fx.tourist).openDispute(id);

    const b = await fx.gb.getBooking(id);
    const finalizeTime = BigInt(b.tourEnd) + BigInt(b.disputeWindow);

    await warpTo(finalizeTime + 1000n);
    await expect(fx.gb.connect(fx.keeper).finalize(id)).to.be.revertedWithCustomError(
      fx.gb,
      "InvalidStatus"
    );
  });

  it("boundary tourEnd + disputeWindow: at boundary - 1 openDispute succeeds; at boundary finalize succeeds and openDispute reverts", async () => {
    const fx = await loadFixture(deployFixture);

    // Create both bookings with identical explicit tour times
    const now = await time.latest();
    const tourStart = now + 10 * DAY;
    const tourEnd = tourStart + 8 * HOUR;
    const { q: q1, id: id1 } = await fundedBooking(fx, { tourStart, tourEnd });
    const { q: q2, id: id2 } = await fundedBooking(fx, { tourStart, tourEnd });

    const b1 = await fx.gb.getBooking(id1);
    const boundary = BigInt(b1.tourEnd) + BigInt(b1.disputeWindow);

    // 1. Boundary - 1: openDispute succeeds
    await nextBlockAt(boundary - 1n);
    await expect(fx.gb.connect(fx.tourist).openDispute(id1)).to.emit(fx.gb, "DisputeOpened");

    // 2. Boundary: openDispute reverts on b2
    await nextBlockAt(boundary);
    await expect(fx.gb.connect(fx.tourist).openDispute(id2)).to.be.revertedWithCustomError(
      fx.gb,
      "DisputeWindowClosed"
    );

    // Boundary + 1: finalize succeeds on b2
    await nextBlockAt(boundary + 1n);
    await expect(fx.gb.connect(fx.keeper).finalize(id2)).to.emit(fx.gb, "Settled");
  });

  it("boundary disputedAt + arbitrationWindow: at boundary - 1 resolveDispute succeeds; at boundary resolveExpiredDispute succeeds", async () => {
    const fx = await loadFixture(deployFixture);
    const { q, id } = await fundedBooking(fx);

    await warpTo(q.tourStart);
    await fx.gb.connect(fx.tourist).openDispute(id);

    const b = await fx.gb.getBooking(id);
    const arbBoundary = BigInt(b.disputedAt) + BigInt(b.arbitrationWindow);

    // At boundary - 1: resolveExpiredDispute reverts
    await nextBlockAt(arbBoundary - 1n);
    await expect(fx.gb.connect(fx.keeper).resolveExpiredDispute(id)).to.be.revertedWithCustomError(
      fx.gb,
      "ArbitrationWindowOpen"
    );

    // At boundary: resolveDispute reverts, resolveExpiredDispute succeeds
    await nextBlockAt(arbBoundary);
    await expect(fx.gb.connect(fx.arbitrator).resolveDispute(id, 5000)).to.be.revertedWithCustomError(
      fx.gb,
      "ArbitrationWindowClosed"
    );

    await nextBlockAt(arbBoundary + 1n);
    await expect(fx.gb.connect(fx.keeper).resolveExpiredDispute(id)).to.emit(fx.gb, "Settled");
  });

  it("boundary fullRefundDeadline: at boundary - 1 -> tier 1 full refund; at boundary -> tier 2 partial refund", async () => {
    const fx = await loadFixture(deployFixture);

    // At boundary - 1: 100% full refund
    const { q: q1, id: id1 } = await fundedBooking(fx, { amount: USDC(100) });
    await nextBlockAt(BigInt(q1.fullRefundDeadline) - 1n);
    await expect(fx.gb.connect(fx.tourist).cancelByTourist(id1))
      .to.emit(fx.gb, "Settled")
      .withArgs(id1, Status.CANCELLED, USDC(100), 0, 0);

    // At boundary: partial refund (tier 2)
    const { q: q2, id: id2 } = await fundedBooking(fx, { amount: USDC(100), partialRefundBps: 5000 });
    const split = splitOf(USDC(100), 5000, 1000);
    await nextBlockAt(BigInt(q2.fullRefundDeadline));
    await expect(fx.gb.connect(fx.tourist).cancelByTourist(id2))
      .to.emit(fx.gb, "Settled")
      .withArgs(id2, Status.CANCELLED, split.tourist, split.guide, split.commission);
  });

  it("boundary quoteExpiry: at boundary - 1 deposit succeeds; at boundary deposit reverts", async () => {
    const fx = await loadFixture(deployFixture);
    const q1 = await makeQuote(fx);
    const sig1 = await signQuote(fx, q1);

    await nextBlockAt(BigInt(q1.quoteExpiry) - 1n);
    await expect(fx.gb.connect(fx.tourist).deposit(q1, sig1)).to.emit(fx.gb, "Deposited");

    const q2 = await makeQuote(fx);
    const sig2 = await signQuote(fx, q2);

    await nextBlockAt(BigInt(q2.quoteExpiry));
    await expect(fx.gb.connect(fx.tourist).deposit(q2, sig2)).to.be.revertedWithCustomError(
      fx.gb,
      "QuoteExpired"
    );
  });

  it("rejects fee-on-transfer tokens on deposit with BalanceDeltaMismatch", async () => {
    const fx = await loadFixture(deployFixture);
    const feeToken = await (await ethers.getContractFactory("MockFeeOnTransferToken")).deploy();
    const feeAddr = await feeToken.getAddress();

    // Enable fee token in config
    await fx.gb.connect(fx.admin).setTokenConfig(feeAddr, true, false, USDC(5), USDC(1000), USDC(50000));

    await feeToken.mint(fx.tourist.address, USDC(1000));
    await feeToken.connect(fx.tourist).approve(fx.gbAddr, ethers.MaxUint256);

    const q = await makeQuote(fx, { token: feeAddr, amount: USDC(100) });
    const sig = await signQuote(fx, q);

    await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(
      fx.gb,
      "BalanceDeltaMismatch"
    );
  });

  it("verifies storage layout packing: Booking occupies exactly 5 slots (160 bytes)", async () => {
    const fs = require("fs");
    const path = require("path");
    const dir = "artifacts/build-info";
    const files = fs.readdirSync(dir).filter((x: string) => x.endsWith(".json"));
    let found = false;

    for (const f of files) {
      const bi = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      const c = bi.output.contracts?.["src/guidebloc.sol"]?.GuideBloc;
      if (!c?.storageLayout) continue;

      const types = c.storageLayout.types;
      const bookingType = Object.entries(types).find(([k]) => k.startsWith("t_struct(Booking)")) as any;
      expect(bookingType).to.not.be.undefined;

      const bytes = Number(bookingType[1].numberOfBytes);
      expect(bytes).to.equal(160); // 160 bytes = exactly 5 slots of 32 bytes
      found = true;
      break;
    }

    expect(found).to.be.true;
  });
});
