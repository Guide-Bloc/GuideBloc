import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFixture,
  USDC,
  Status,
} from "./helpers/fixture";

describe("Direct Marketplace Deposit & Release", () => {
  it("funds a booking directly via deposit(bytes32,address,address,uint256)", async () => {
    const fx = await loadFixture(deployFixture);
    const amount = USDC(50);
    const bookingId = ethers.encodeBytes32String("BK_DIRECT_101");

    // Tourist approves gb
    await fx.usdc.connect(fx.tourist).approve(fx.gbAddr, amount);

    // Call direct deposit
    await expect(
      fx.gb.connect(fx.tourist)["deposit(bytes32,address,address,uint256)"](
        bookingId,
        fx.guide.address,
        fx.usdcAddr,
        amount
      )
    )
      .to.emit(fx.gb, "Deposited")
      .withArgs(bookingId, fx.tourist.address, fx.guide.address, fx.usdcAddr, amount, (ts: any) => ts > 0, (te: any) => te > 0);

    const b = await fx.gb.getBooking(bookingId);
    expect(b.tourist).to.equal(fx.tourist.address);
    expect(b.guide).to.equal(fx.guide.address);
    expect(b.token).to.equal(fx.usdcAddr);
    expect(b.amount).to.equal(amount);
    expect(b.status).to.equal(Status.FUNDED);

    // Check bookings view alias
    const viewB = await fx.gb.bookings(bookingId);
    expect(viewB.tourist).to.equal(fx.tourist.address);
    expect(viewB.amount).to.equal(amount);
    expect(viewB.status).to.equal(Status.FUNDED);
  });

  it("releases directly to guide and treasury upon tourist release()", async () => {
    const fx = await loadFixture(deployFixture);
    const amount = USDC(100);
    const bookingId = ethers.encodeBytes32String("BK_DIRECT_102");

    await fx.usdc.connect(fx.tourist).approve(fx.gbAddr, amount);
    await fx.gb.connect(fx.tourist)["deposit(bytes32,address,address,uint256)"](
      bookingId,
      fx.guide.address,
      fx.usdcAddr,
      amount
    );

    const guideBefore = await fx.usdc.balanceOf(fx.guide.address);
    const treasuryBefore = await fx.usdc.balanceOf(fx.treasury.address);

    // Tourist calls release
    await fx.gb.connect(fx.tourist).release(bookingId);

    const b = await fx.gb.getBooking(bookingId);
    expect(b.status).to.equal(Status.SETTLED);

    // Commission is 10% (1000 bps)
    const guideAfter = await fx.usdc.balanceOf(fx.guide.address);
    const treasuryAfter = await fx.usdc.balanceOf(fx.treasury.address);

    expect(guideAfter - guideBefore).to.equal(USDC(90));
    expect(treasuryAfter - treasuryBefore).to.equal(USDC(10));
  });

  it("refunds 100% to tourist upon guide refund()", async () => {
    const fx = await loadFixture(deployFixture);
    const amount = USDC(100);
    const bookingId = ethers.encodeBytes32String("BK_DIRECT_103");

    await fx.usdc.connect(fx.tourist).approve(fx.gbAddr, amount);
    await fx.gb.connect(fx.tourist)["deposit(bytes32,address,address,uint256)"](
      bookingId,
      fx.guide.address,
      fx.usdcAddr,
      amount
    );

    const touristBefore = await fx.usdc.balanceOf(fx.tourist.address);

    // Guide calls refund
    await fx.gb.connect(fx.guide).refund(bookingId);

    const b = await fx.gb.getBooking(bookingId);
    expect(b.status).to.equal(Status.CANCELLED);

    const touristAfter = await fx.usdc.balanceOf(fx.tourist.address);
    expect(touristAfter - touristBefore).to.equal(USDC(100));
  });
});
