import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployFixture,
  makeQuote,
  signQuote,
  signMutual,
  fundedBooking,
  warpTo,
  splitOf,
  Status,
  USDC,
  DAY,
} from "./helpers/fixture";

describe("Signatures (EOA & ERC-1271 Contract Wallets)", () => {
  it("ERC-1271 smart wallet as guide: signs quote, deposit verifies via SignatureChecker", async () => {
    const fx = await loadFixture(deployFixture);

    // Deploy ERC-1271 smart wallet owned by fx.guide
    const walletFactory = await ethers.getContractFactory("MockERC1271Wallet");
    const guideWallet = await walletFactory.deploy(fx.guide.address);
    const guideWalletAddr = await guideWallet.getAddress();

    // Quote with guide = guideWalletAddr
    const q = await makeQuote(fx, { guide: guideWalletAddr });

    // The owner of the smart wallet signs the digest
    const sig = await signQuote(fx, q, fx.guide);

    // Deposit succeeds because GuideBloc checks SignatureChecker.isValidSignatureNow
    await expect(fx.gb.connect(fx.tourist).deposit(q, sig)).to.emit(fx.gb, "Deposited");
  });

  it("ERC-1271 smart wallet as tourist and guide for mutualSettle", async () => {
    const fx = await loadFixture(deployFixture);

    // Deploy contract wallet for tourist
    const walletFactory = await ethers.getContractFactory("MockERC1271Wallet");
    const touristWallet = await walletFactory.deploy(fx.tourist.address);
    const touristWalletAddr = await touristWallet.getAddress();

    // Fund tourist wallet with tokens and approve
    await fx.usdc.mint(touristWalletAddr, USDC(1000));

    const approveCalldata = fx.usdc.interface.encodeFunctionData("approve", [fx.gbAddr, ethers.MaxUint256]);
    await touristWallet.connect(fx.tourist).execute(fx.usdcAddr, approveCalldata);

    // Quote with tourist = touristWalletAddr
    const q = await makeQuote(fx, { tourist: touristWalletAddr });
    const guideSig = await signQuote(fx, q, fx.guide);
    const bookingId = await fx.gb.hashQuote(q);

    // Deposit executed via smart wallet
    const depositCalldata = fx.gb.interface.encodeFunctionData(
      "deposit((address,address,address,uint256,uint64,uint64,uint64,uint64,uint16,uint64,bytes32),bytes)",
      [q, guideSig]
    );
    await touristWallet.connect(fx.tourist).execute(fx.gbAddr, depositCalldata);

    expect((await fx.gb.getBooking(bookingId)).status).to.equal(Status.FUNDED);

    // Now mutual settle: tourist wallet signs via owner, guide signs EOA
    const touristBps = 3500;
    const deadline = (await time.latest()) + DAY;
    const touristSig = await signMutual(fx, fx.tourist, bookingId, touristBps, deadline);
    const guideMutualSig = await signMutual(fx, fx.guide, bookingId, touristBps, deadline);

    await expect(
      fx.gb.connect(fx.keeper).mutualSettle(bookingId, touristBps, deadline, touristSig, guideMutualSig)
    ).to.emit(fx.gb, "Settled");
  });

  it("tampered fields in quote invalidate signature", async () => {
    const fx = await loadFixture(deployFixture);
    const q = await makeQuote(fx, { amount: USDC(100) });
    const sig = await signQuote(fx, q);

    // Tamper amount
    const tamperedAmount = { ...q, amount: USDC(99) };
    await expect(fx.gb.connect(fx.tourist).deposit(tamperedAmount, sig)).to.be.revertedWithCustomError(
      fx.gb,
      "InvalidSignature"
    );

    // Tamper tourist
    const tamperedTourist = { ...q, tourist: fx.other.address };
    await expect(fx.gb.connect(fx.other).deposit(tamperedTourist, sig)).to.be.revertedWithCustomError(
      fx.gb,
      "InvalidSignature"
    );

    // Tamper salt
    const tamperedSalt = { ...q, salt: ethers.ZeroHash };
    await expect(fx.gb.connect(fx.tourist).deposit(tamperedSalt, sig)).to.be.revertedWithCustomError(
      fx.gb,
      "InvalidSignature"
    );
  });

  it("tampered fields in mutualSettle invalidate signature", async () => {
    const fx = await loadFixture(deployFixture);
    const { id } = await fundedBooking(fx);
    const deadline = (await time.latest()) + DAY;

    const touristSig = await signMutual(fx, fx.tourist, id, 5000, deadline);
    const guideSig = await signMutual(fx, fx.guide, id, 5000, deadline);

    // Caller submits 5001 instead of signed 5000
    await expect(
      fx.gb.connect(fx.keeper).mutualSettle(id, 5001, deadline, touristSig, guideSig)
    ).to.be.revertedWithCustomError(fx.gb, "InvalidSignature");
  });
});
