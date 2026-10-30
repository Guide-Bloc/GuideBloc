import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { deployFixture, makeQuote, signQuote, fundedBooking, USDC, Status, DAY, HOUR } from "./helpers/fixture";

describe("Deposit", () => {
  it("funds a booking, snapshots config and emits Deposited", async () => {
    const fx = await loadFixture(deployFixture);
    const q = await makeQuote(fx);
    const sig = await signQuote(fx, q);
    const id = await fx.gb.hashQuote(q);

    await expect(fx.gb.connect(fx.tourist).deposit(q, sig))
      .to.emit(fx.gb, "Deposited")
      .withArgs(id, q.tourist, q.guide, q.token, q.amount, q.tourStart, q.tourEnd);

    const b = await fx.gb.getBooking(id);
    expect(b.status).to.equal(Status.FUNDED);
    expect(b.tourist).to.equal(q.tourist);
    expect(b.guide).to.equal(q.guide);
    expect(b.token).to.equal(q.token);
    expect(b.amount).to.equal(q.amount);
    expect(b.commissionBps).to.equal(1000);
    expect(b.disputeBondBps).to.equal(500);
    expect(b.disputeWindow).to.equal(72 * HOUR);
    expect(b.arbitrationWindow).to.equal(96 * HOUR);
    expect(b.defaultDisputeTouristBps).to.equal(5000);
    expect(b.partialRefundBps).to.equal(5000);
    expect(await fx.gb.totalLocked(q.token)).to.equal(q.amount);
    expect(await fx.usdc.balanceOf(fx.gbAddr)).to.equal(q.amount);
  });

  it("returns the bookingId equal to hashQuote", async () => {
    const fx = await loadFixture(deployFixture);
    const q = await makeQuote(fx);
    const sig = await signQuote(fx, q);
    const id = await fx.gb.hashQuote(q);
    expect(await fx.gb.connect(fx.tourist).deposit.staticCall(q, sig)).to.equal(id);
  });

  it("works with a USDT-style token (no return values, approve reset rule)", async () => {
    const fx = await loadFixture(deployFixture);
    const q = await makeQuote(fx, { token: fx.usdtAddr });
    const sig = await signQuote(fx, q);
    // Frontend flow for USDT: reset allowance to 0 before approving a new amount.
    await fx.usdt.connect(fx.tourist).approve(fx.gbAddr, 0);
    await fx.usdt.connect(fx.tourist).approve(fx.gbAddr, q.amount);
    await fx.gb.connect(fx.tourist).deposit(q, sig);
    expect(await fx.usdt.balanceOf(fx.gbAddr)).to.equal(q.amount);
    expect(await fx.usdt.allowance(fx.tourist.address, fx.gbAddr)).to.equal(0);
  });

  describe("reverts", () => {
    it("NotTourist when caller is not q.tourist", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.other).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "NotTourist");
    });

    it("ZeroAddress for a zero guide", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx, { guide: ethers.ZeroAddress });
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "ZeroAddress");
    });

    it("ZeroAddress for a zero tourist (only reachable past the caller check via the validator)", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx, { tourist: ethers.ZeroAddress });
      const sig = await signQuote(fx, q);
      // msg.sender can never be address(0), so the caller check fires first.
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "NotTourist");
    });

    it("SameTouristAndGuide", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx, { guide: fx.tourist.address });
      const sig = await signQuote(fx, q, fx.tourist);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(
        fx.gb,
        "SameTouristAndGuide",
      );
    });

    it("QuoteExpired", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      await time.increaseTo(q.quoteExpiry);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "QuoteExpired");
    });

    it("QuoteIsCancelled after the guide cancels the quote", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      const id = await fx.gb.hashQuote(q);
      await expect(fx.gb.connect(fx.guide).cancelQuote(id))
        .to.emit(fx.gb, "QuoteCancelled")
        .withArgs(fx.guide.address, id);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "QuoteIsCancelled");
    });

    it("a third party cannot cancel someone else's quote", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      const id = await fx.gb.hashQuote(q);
      await fx.gb.connect(fx.other).cancelQuote(id); // scoped to `other` as guide: no effect on this quote
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.emit(fx.gb, "Deposited");
    });

    it("BookingAlreadyExists on a replayed quote", async () => {
      const fx = await loadFixture(deployFixture);
      const { q, sig } = await fundedBooking(fx);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(
        fx.gb,
        "BookingAlreadyExists",
      );
    });

    it("TokenNotAllowed for a non-allowlisted token", async () => {
      const fx = await loadFixture(deployFixture);
      const other = await (await ethers.getContractFactory("MockUSDC")).deploy();
      const q = await makeQuote(fx, { token: await other.getAddress() });
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "TokenNotAllowed");
    });

    it("AmountOutOfBounds below the minimum", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx, { amount: USDC(5) - 1n });
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(
        fx.gb,
        "AmountOutOfBounds",
      );
    });

    it("accepts exactly the minimum and exactly the per-booking cap", async () => {
      const fx = await loadFixture(deployFixture);
      await fundedBooking(fx, { amount: USDC(5) });
      await fundedBooking(fx, { amount: USDC(1000) });
    });

    it("PerBookingCapExceeded above the cap", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx, { amount: USDC(1000) + 1n });
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(
        fx.gb,
        "PerBookingCapExceeded",
      );
    });

    it("TvlCapExceeded when total locked would pass the cap", async () => {
      const fx = await loadFixture(deployFixture);
      await fx.gb.connect(fx.admin).setTokenConfig(fx.usdcAddr, true, true, USDC(5), USDC(150), USDC(150));
      await fundedBooking(fx, { amount: USDC(100) });
      const q = await makeQuote(fx, { amount: USDC(51) });
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "TvlCapExceeded");
      const ok = await makeQuote(fx, { amount: USDC(50) });
      await expect(fx.gb.connect(fx.tourist).deposit(ok, await signQuote(fx, ok))).to.emit(fx.gb, "Deposited");
    });

    it("InvalidTimestamps for each ordering violation", async () => {
      const fx = await loadFixture(deployFixture);
      const now = await time.latest();
      const bad: Array<Record<string, number>> = [
        { fullRefundDeadline: now }, // not strictly in the future
        { fullRefundDeadline: now + 9 * DAY, partialRefundDeadline: now + 8 * DAY }, // full > partial
        { partialRefundDeadline: now + 11 * DAY }, // partial > tourStart
        { tourEnd: now + 10 * DAY }, // tourStart == tourEnd
      ];
      for (const o of bad) {
        const q = await makeQuote(fx, o);
        const sig = await signQuote(fx, q);
        await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(
          fx.gb,
          "InvalidTimestamps",
        );
      }
    });

    it("accepts equal fullRefundDeadline/partialRefundDeadline/tourStart", async () => {
      const fx = await loadFixture(deployFixture);
      const now = await time.latest();
      await fundedBooking(fx, {
        fullRefundDeadline: now + 5 * DAY,
        partialRefundDeadline: now + 5 * DAY,
        tourStart: now + 5 * DAY,
        tourEnd: now + 6 * DAY,
      });
    });

    it("InvalidBps when partialRefundBps > 10000", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx, { partialRefundBps: 10001 });
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "InvalidBps");
    });

    it("InvalidSignature for a signature by the wrong signer", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q, fx.other);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(
        fx.gb,
        "InvalidSignature",
      );
    });

    it("InvalidSignature for a malformed signature", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx);
      await expect(fx.gb.connect(fx.tourist).deposit(q, "0x1234")).to.be.revertedWithCustomError(
        fx.gb,
        "InvalidSignature",
      );
    });

    it("reverts when the tourist has no allowance (SafeERC20 failure)", async () => {
      const fx = await loadFixture(deployFixture);
      await fx.usdc.connect(fx.tourist).approve(fx.gbAddr, 0);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.reverted;
    });

    it("is blocked while paused, but works again after unpause", async () => {
      const fx = await loadFixture(deployFixture);
      await fx.gb.connect(fx.pauser).pause();
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.be.revertedWithCustomError(fx.gb, "EnforcedPause");
      await fx.gb.connect(fx.pauser).unpause();
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.emit(fx.gb, "Deposited");
    });
  });

  describe("depositWithPermit", () => {
    async function permitSig(fx: Awaited<ReturnType<typeof deployFixture>>, value: bigint, deadline: number) {
      const nonce = await fx.usdc.nonces(fx.tourist.address);
      const chainId = (await ethers.provider.getNetwork()).chainId;
      return ethers.Signature.from(
        await fx.tourist.signTypedData(
          { name: "USD Coin", version: "1", chainId, verifyingContract: fx.usdcAddr },
          {
            Permit: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
              { name: "value", type: "uint256" },
              { name: "nonce", type: "uint256" },
              { name: "deadline", type: "uint256" },
            ],
          },
          { owner: fx.tourist.address, spender: fx.gbAddr, value, nonce, deadline },
        ),
      );
    }

    it("deposits using a permit without a prior approval", async () => {
      const fx = await loadFixture(deployFixture);
      await fx.usdc.connect(fx.tourist).approve(fx.gbAddr, 0);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      const deadline = (await time.latest()) + DAY;
      const p = await permitSig(fx, q.amount, deadline);
      await expect(fx.gb.connect(fx.tourist).depositWithPermit(q, sig, deadline, p.v, p.r, p.s)).to.emit(
        fx.gb,
        "Deposited",
      );
    });

    it("survives a front-run permit when allowance is already sufficient", async () => {
      const fx = await loadFixture(deployFixture);
      await fx.usdc.connect(fx.tourist).approve(fx.gbAddr, 0);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      const deadline = (await time.latest()) + DAY;
      const p = await permitSig(fx, q.amount, deadline);
      // A griefer front-runs the permit with the victim's own signature.
      await fx.usdc.connect(fx.other).permit(fx.tourist.address, fx.gbAddr, q.amount, deadline, p.v, p.r, p.s);
      await expect(fx.gb.connect(fx.tourist).depositWithPermit(q, sig, deadline, p.v, p.r, p.s)).to.emit(
        fx.gb,
        "Deposited",
      );
    });

    it("InsufficientAllowance when permit fails and allowance is too low", async () => {
      const fx = await loadFixture(deployFixture);
      await fx.usdc.connect(fx.tourist).approve(fx.gbAddr, 0);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      const deadline = (await time.latest()) + DAY;
      const p = await permitSig(fx, q.amount - 1n, deadline); // signature for the wrong value
      await expect(
        fx.gb.connect(fx.tourist).depositWithPermit(q, sig, deadline, p.v, p.r, p.s),
      ).to.be.revertedWithCustomError(fx.gb, "InsufficientAllowance");
    });

    it("PermitNotSupported for a token without the permitSupported flag (USDT)", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx, { token: fx.usdtAddr });
      const sig = await signQuote(fx, q);
      await expect(
        fx.gb.connect(fx.tourist).depositWithPermit(q, sig, 0, 27, ethers.ZeroHash, ethers.ZeroHash),
      ).to.be.revertedWithCustomError(fx.gb, "PermitNotSupported");
      // The plain path works for the very same token and quote.
      await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.emit(fx.gb, "Deposited");
    });

    it("InsufficientAllowance when the flag is set but the token has no permit function", async () => {
      const fx = await loadFixture(deployFixture);
      await fx.gb.connect(fx.admin).setTokenConfig(fx.usdtAddr, true, true, USDC(5), USDC(1000), USDC(50000));
      await fx.usdt.connect(fx.tourist).approve(fx.gbAddr, 0);
      const q = await makeQuote(fx, { token: fx.usdtAddr });
      const sig = await signQuote(fx, q);
      await expect(
        fx.gb.connect(fx.tourist).depositWithPermit(q, sig, 0, 27, ethers.ZeroHash, ethers.ZeroHash),
      ).to.be.revertedWithCustomError(fx.gb, "InsufficientAllowance");
    });

    it("NotTourist and TokenNotAllowed guards run before the permit", async () => {
      const fx = await loadFixture(deployFixture);
      const q = await makeQuote(fx);
      const sig = await signQuote(fx, q);
      await expect(
        fx.gb.connect(fx.other).depositWithPermit(q, sig, 0, 27, ethers.ZeroHash, ethers.ZeroHash),
      ).to.be.revertedWithCustomError(fx.gb, "NotTourist");
      const unlisted = await (await ethers.getContractFactory("MockUSDC")).deploy();
      const q2 = await makeQuote(fx, { token: await unlisted.getAddress() });
      await expect(
        fx.gb
          .connect(fx.tourist)
          .depositWithPermit(q2, await signQuote(fx, q2), 0, 27, ethers.ZeroHash, ethers.ZeroHash),
      ).to.be.revertedWithCustomError(fx.gb, "TokenNotAllowed");
    });

    it("is blocked while paused", async () => {
      const fx = await loadFixture(deployFixture);
      await fx.gb.connect(fx.pauser).pause();
      const q = await makeQuote(fx);
      await expect(
        fx.gb
          .connect(fx.tourist)
          .depositWithPermit(q, await signQuote(fx, q), 0, 27, ethers.ZeroHash, ethers.ZeroHash),
      ).to.be.revertedWithCustomError(fx.gb, "EnforcedPause");
    });
  });
});
