import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { HDNodeWallet, Signer } from "ethers";

export const USDC = (n: number | string) => ethers.parseUnits(String(n), 6);

export const Status = { NONE: 0n, FUNDED: 1n, DISPUTED: 2n, SETTLED: 3n, CANCELLED: 4n } as const;

export const HOUR = 3600;
export const DAY = 86400;

export const QUOTE_TYPES = {
  Quote: [
    { name: "tourist", type: "address" },
    { name: "guide", type: "address" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "tourStart", type: "uint64" },
    { name: "tourEnd", type: "uint64" },
    { name: "fullRefundDeadline", type: "uint64" },
    { name: "partialRefundDeadline", type: "uint64" },
    { name: "partialRefundBps", type: "uint16" },
    { name: "quoteExpiry", type: "uint64" },
    { name: "salt", type: "bytes32" },
  ],
};

export const MUTUAL_TYPES = {
  MutualSettle: [
    { name: "bookingId", type: "bytes32" },
    { name: "touristBps", type: "uint16" },
    { name: "deadline", type: "uint256" },
  ],
};

export interface QuoteStruct {
  tourist: string;
  guide: string;
  token: string;
  amount: bigint;
  tourStart: number;
  tourEnd: number;
  fullRefundDeadline: number;
  partialRefundDeadline: number;
  partialRefundBps: number;
  quoteExpiry: number;
  salt: string;
}

/** Deploys the whole test world once; tests use `loadFixture(deployFixture)`. */
export async function deployFixture() {
  const [admin, treasury, arbitrator, pauser, tourist, guide, other, keeper, tourist2, guide2] =
    await ethers.getSigners();

  const usdc = await (await ethers.getContractFactory("MockPermitUSDC")).deploy();
  const usdt = await (await ethers.getContractFactory("MockUSDT")).deploy();
  await usdc.waitForDeployment();
  await usdt.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  const usdtAddr = await usdt.getAddress();

  const tokenInit = (token: string, permitSupported: boolean) => ({
    token,
    permitSupported,
    minAmount: USDC(5),
    perBookingCap: USDC(1000),
    tvlCap: USDC(50000),
  });

  const gb = await (
    await ethers.getContractFactory("GuideBloc")
  ).deploy(admin.address, treasury.address, arbitrator.address, pauser.address, [
    tokenInit(usdcAddr, true),
    tokenInit(usdtAddr, false),
  ]);
  await gb.waitForDeployment();
  const gbAddr = await gb.getAddress();

  for (const user of [tourist, tourist2, guide, guide2, other]) {
    await usdc.mint(user.address, USDC(100000));
    await usdt.mint(user.address, USDC(100000));
    await usdc.connect(user).approve(gbAddr, ethers.MaxUint256);
    await usdt.connect(user).approve(gbAddr, ethers.MaxUint256);
  }

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const domain = { name: "GuideBloc", version: "1", chainId, verifyingContract: gbAddr };

  return {
    gb,
    gbAddr,
    usdc,
    usdt,
    usdcAddr,
    usdtAddr,
    domain,
    admin,
    treasury,
    arbitrator,
    pauser,
    tourist,
    guide,
    other,
    keeper,
    tourist2,
    guide2,
  };
}

export type Fixture = Awaited<ReturnType<typeof deployFixture>>;

let saltCounter = 0n;

/** Builds a valid quote with generous default timings relative to the current block time. */
export async function makeQuote(fx: Fixture, overrides: Partial<QuoteStruct> = {}): Promise<QuoteStruct> {
  const now = await time.latest();
  saltCounter += 1n;
  return {
    tourist: fx.tourist.address,
    guide: fx.guide.address,
    token: fx.usdcAddr,
    amount: USDC(100),
    tourStart: now + 10 * DAY,
    tourEnd: now + 10 * DAY + 8 * HOUR,
    fullRefundDeadline: now + 5 * DAY,
    partialRefundDeadline: now + 8 * DAY,
    partialRefundBps: 5000,
    quoteExpiry: now + 1 * DAY,
    salt: ethers.zeroPadValue(ethers.toBeHex(saltCounter + BigInt(Date.now())), 32),
    ...overrides,
  };
}

export async function signQuote(
  fx: Fixture,
  q: QuoteStruct,
  signer: Signer | HDNodeWallet = fx.guide,
): Promise<string> {
  return signer.signTypedData(fx.domain, QUOTE_TYPES, q);
}

export async function signMutual(
  fx: Fixture,
  signer: Signer | HDNodeWallet,
  bookingId: string,
  touristBps: number,
  deadline: bigint | number,
): Promise<string> {
  return signer.signTypedData(fx.domain, MUTUAL_TYPES, { bookingId, touristBps, deadline });
}

/** Creates and funds a booking; returns its id and quote. */
export async function fundedBooking(fx: Fixture, overrides: Partial<QuoteStruct> = {}) {
  const q = await makeQuote(fx, overrides);
  const sig = await signQuote(fx, q);
  const id = await fx.gb.hashQuote(q);
  const payer = [fx.tourist, fx.tourist2, fx.guide, fx.guide2, fx.other].find(
    (s) => s.address.toLowerCase() === q.tourist.toLowerCase(),
  )!;
  await fx.gb.connect(payer).deposit(q, sig);
  return { q, sig, id };
}

export async function warpTo(ts: number | bigint) {
  const current = BigInt(await time.latest());
  const target = BigInt(ts);
  if (target > current) {
    await time.increaseTo(target);
  }
}

/** Sets the timestamp of the NEXT mined block (the next transaction). */
export async function nextBlockAt(ts: number | bigint) {
  await time.setNextBlockTimestamp(ts);
}

export function bpsShare(amount: bigint, bps: number | bigint) {
  return (amount * BigInt(bps)) / 10000n;
}

/** Expected settlement split for a booking amount, tourist bps and commission bps. */
export function splitOf(amount: bigint, touristBps: number | bigint, commissionBps = 1000n) {
  const tourist = bpsShare(amount, touristBps);
  const gross = amount - tourist;
  const commission = (gross * BigInt(commissionBps)) / 10000n;
  return { tourist, guide: gross - commission, commission };
}
