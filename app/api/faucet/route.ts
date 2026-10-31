import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// In-memory rate limiter: Record timestamp of last request per IP or recipient
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 30 * 1000; // 30 seconds

const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
const MOCK_USDC_ADDRESS = "0x2874C7e0C9B27029455f2a46D2332acE7C749DA9";
const MOCK_USDT_ADDRESS = "0xad76726fb9de507811c2aa6721a6d23cbffc9f67";

const ERC20_ABI = [
  "function mint(address to, uint256 amount)",
  "function balanceOf(address account) view returns (uint256)",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipient, token = "ALL" } = body;

    // Validate recipient
    if (!recipient || !ethers.isAddress(recipient) || recipient === ethers.ZeroAddress) {
      return NextResponse.json(
        { error: "Invalid recipient address. Please enter a valid 0x wallet address." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
    const now = Date.now();
    const rateLimitKey = `${ip}_${recipient.toLowerCase()}`;

    const lastRequest = rateLimitMap.get(rateLimitKey);
    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequest)) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Please wait ${remainingSeconds}s before requesting again.` },
        { status: 429 }
      );
    }

    const relayerPk = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPk) {
      return NextResponse.json(
        { error: "Faucet service is temporarily unavailable (relayer not configured)." },
        { status: 503 }
      );
    }

    const formattedPk = relayerPk.startsWith("0x") ? relayerPk : `0x${relayerPk}`;
    const provider = new ethers.JsonRpcProvider(FUJI_RPC);
    const relayerWallet = new ethers.Wallet(formattedPk, provider);

    const mintAmount = 100_000_000n; // 100 tokens (6 decimals)
    const txHashes: { token: string; txHash: string }[] = [];

    const usdcContract = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, relayerWallet);
    const usdtContract = new ethers.Contract(MOCK_USDT_ADDRESS, ERC20_ABI, relayerWallet);

    if (token === "USDC" || token === "ALL") {
      const tx = await usdcContract.mint(recipient, mintAmount);
      await tx.wait();
      txHashes.push({ token: "USDC", txHash: tx.hash });
    }

    if (token === "USDT" || token === "ALL") {
      const tx = await usdtContract.mint(recipient, mintAmount);
      await tx.wait();
      txHashes.push({ token: "USDT", txHash: tx.hash });
    }

    // Update rate limit timestamp
    rateLimitMap.set(rateLimitKey, now);

    // Housekeeping rateLimitMap to prevent unbounded memory growth
    if (rateLimitMap.size > 2000) {
      for (const [key, ts] of rateLimitMap.entries()) {
        if (now - ts > RATE_LIMIT_WINDOW_MS * 2) {
          rateLimitMap.delete(key);
        }
      }
    }

    return NextResponse.json({
      success: true,
      recipient,
      amount: "100",
      txHashes,
      message: `Successfully transferred testnet tokens to ${recipient.slice(0, 6)}...${recipient.slice(-4)}!`,
    });
  } catch (error: any) {
    console.error("Faucet error:", error);
    return NextResponse.json(
      { error: error?.reason || error?.message || "Failed to execute faucet transaction." },
      { status: 500 }
    );
  }
}
