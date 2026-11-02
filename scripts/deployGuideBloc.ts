import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * ============================================================================
 * GUIDEBLOC (V3) DEPLOYMENT SCRIPT
 * ============================================================================
 * Deploys the immutable, production-grade GuideBloc escrow contract.
 *
 * Avalanche Fuji Testnet (Chain ID 43113) & Avalanche Mainnet (Chain ID 43114)
 * ============================================================================
 */

interface DeploymentNetworkConfig {
  name: string;
  chainId: number;
  treasury: string;
  tokens: Array<{
    name: string;
    address: string;
    permitSupported: boolean;
    minAmount: bigint;
    perBookingCap: bigint;
    tvlCap: bigint;
  }>;
}

const NETWORKS: Record<string, DeploymentNetworkConfig> = {
  avalanche_fuji: {
    name: "Avalanche Fuji Testnet",
    chainId: 43113,
    treasury: process.env.TREASURY_ADDRESS || "0x079D9c349741C27565ee04e31E4174F640F512aE",
    tokens: [
      {
        name: "MockUSDC (Fuji)",
        address: "0x2874C7e0C9B27029455f2a46D2332acE7C749DA9",
        permitSupported: false,
        minAmount: 100_000n, // 0.1 USDC
        perBookingCap: 1_000_000_000n, // 1,000 USDC
        tvlCap: 50_000_000_000n, // 50,000 USDC
      },
      {
        name: "MockUSDT (Fuji)",
        address: "0xad76726fb9de507811c2aa6721a6d23cbffc9f67",
        permitSupported: false,
        minAmount: 100_000n, // 0.1 USDT
        perBookingCap: 1_000_000_000n, // 1,000 USDT
        tvlCap: 50_000_000_000n, // 50,000 USDT
      },
      {
        name: "Circle USDC (Fuji)",
        address: "0x5425890298aed601595a70AB815c96711a31Bc65",
        permitSupported: true,
        minAmount: 100_000n, // 0.1 USDC
        perBookingCap: 1_000_000_000n, // 1,000 USDC
        tvlCap: 50_000_000_000n, // 50,000 USDC
      },
    ],
  },
  avalanche: {
    name: "Avalanche C-Chain Mainnet",
    chainId: 43114,
    treasury: process.env.TREASURY_ADDRESS || "0x079D9c349741C27565ee04e31E4174F640F512aE",
    tokens: [
      {
        name: "Circle Native USDC",
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        permitSupported: true,
        minAmount: 5_000_000n,
        perBookingCap: 1_000_000_000n,
        tvlCap: 50_000_000_000n,
      },
      {
        name: "Tether USD (USDT)",
        address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
        permitSupported: false,
        minAmount: 5_000_000n,
        perBookingCap: 1_000_000_000n,
        tvlCap: 50_000_000_000n,
      },
    ],
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const netName = network.name;
  const cfg = NETWORKS[netName];

  if (!cfg) {
    throw new Error(`Unsupported network: ${netName}. Supported: avalanche_fuji, avalanche`);
  }

  console.log("====================================================");
  console.log(`Deploying GuideBloc V3 to: ${cfg.name} (Chain ID: ${cfg.chainId})`);
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Treasury address: ${cfg.treasury}`);
  console.log("====================================================");

  // Admin multisig / timelock
  const adminAddress = process.env.ADMIN_MULTISIG_ADDRESS || deployer.address;
  const arbitratorAddress = process.env.ARBITRATOR_ADDRESS || deployer.address;
  const pauserAddress = process.env.PAUSER_ADDRESS || deployer.address;

  console.log(`Configured Roles:`);
  console.log(`- Default Admin: ${adminAddress}`);
  console.log(`- Arbitrator:    ${arbitratorAddress}`);
  console.log(`- Pauser:        ${pauserAddress}`);

  const tokenInits = cfg.tokens.map((t) => ({
    token: t.address,
    permitSupported: t.permitSupported,
    minAmount: t.minAmount,
    perBookingCap: t.perBookingCap,
    tvlCap: t.tvlCap,
  }));

  console.log("\nInitial Tokens to allowlist:");
  cfg.tokens.forEach((t) => {
    console.log(`- ${t.name}: ${t.address} (permit: ${t.permitSupported})`);
  });

  const GuideBlocFactory = await ethers.getContractFactory("GuideBloc");
  const gb = await GuideBlocFactory.deploy(
    adminAddress,
    cfg.treasury,
    arbitratorAddress,
    pauserAddress,
    tokenInits
  );

  console.log("\nTransaction broadcasted, waiting for confirmation...");
  await gb.waitForDeployment();

  const deployedAddress = await gb.getAddress();
  console.log(`\n>>> GuideBloc (V3) SUCCESSFULLY DEPLOYED AT: ${deployedAddress} <<<`);
  console.log("====================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
