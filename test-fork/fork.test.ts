import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { USDC, DAY, HOUR, Status, QUOTE_TYPES } from "../test/helpers/fixture";

describe("Avalanche C-Chain Fork Tests (Real USDC & USDT)", function () {
  this.timeout(120000); // Allow time for RPC fetch

  const AVAX_USDC = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
  const AVAX_USDT = "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7";

  let gb: any;
  let admin: any;
  let treasury: any;
  let arbitrator: any;
  let pauser: any;
  let tourist: any;
  let guide: any;

  before(async () => {
    // Dynamically fork Avalanche C-Chain
    await ethers.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
        },
      },
    ]);

    [admin, treasury, arbitrator, pauser, tourist, guide] = await ethers.getSigners();

    const tokenInits = [
      {
        token: AVAX_USDC,
        permitSupported: true,
        minAmount: USDC(5),
        perBookingCap: USDC(1000),
        tvlCap: USDC(50000),
      },
      {
        token: AVAX_USDT,
        permitSupported: false,
        minAmount: USDC(5),
        perBookingCap: USDC(1000),
        tvlCap: USDC(50000),
      },
    ];

    const gbFactory = await ethers.getContractFactory("GuideBloc");
    gb = await gbFactory.deploy(
      admin.address,
      treasury.address,
      arbitrator.address,
      pauser.address,
      tokenInits
    );
    await gb.waitForDeployment();
  });

  after(async () => {
    // Reset back to local network
    await ethers.provider.send("hardhat_reset", []);
  });

  it("verifies real Avalanche USDC and USDT have 6 decimals", async () => {
    const erc20Abi = ["function decimals() view returns (uint8)", "function symbol() view returns (string)"];
    const usdc = new ethers.Contract(AVAX_USDC, erc20Abi, ethers.provider);
    const usdt = new ethers.Contract(AVAX_USDT, erc20Abi, ethers.provider);

    expect(await usdc.decimals()).to.equal(6);
    expect(await usdc.symbol()).to.equal("USDC");

    expect(await usdt.decimals()).to.equal(6);
    expect(await usdt.symbol()).to.equal("USDt");
  });

  it("verifies USDT on fork rejects depositWithPermit with PermitNotSupported", async () => {
    const now = await time.latest();
    const q = {
      tourist: tourist.address,
      guide: guide.address,
      token: AVAX_USDT,
      amount: USDC(50),
      tourStart: now + 5 * DAY,
      tourEnd: now + 5 * DAY + 4 * HOUR,
      fullRefundDeadline: now + 2 * DAY,
      partialRefundDeadline: now + 3 * DAY,
      partialRefundBps: 5000,
      quoteExpiry: now + 1 * DAY,
      salt: ethers.encodeBytes32String("fork_test_1"),
    };

    const chainId = (await ethers.provider.getNetwork()).chainId;
    const domain = { name: "GuideBloc", version: "1", chainId, verifyingContract: await gb.getAddress() };
    const sig = await guide.signTypedData(domain, QUOTE_TYPES, q);

    await expect(
      gb.connect(tourist).depositWithPermit(q, sig, 0, 27, ethers.ZeroHash, ethers.ZeroHash)
    ).to.be.revertedWithCustomError(gb, "PermitNotSupported");
  });

  it("verifies real token configs stored properly in GuideBloc on Avalanche", async () => {
    const usdcCfg = await gb.tokenConfigs(AVAX_USDC);
    expect(usdcCfg.enabled).to.be.true;
    expect(usdcCfg.permitSupported).to.be.true;

    const usdtCfg = await gb.tokenConfigs(AVAX_USDT);
    expect(usdtCfg.enabled).to.be.true;
    expect(usdtCfg.permitSupported).to.be.false;
  });
});
