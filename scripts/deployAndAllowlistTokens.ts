import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy MockUSDT
  console.log("Deploying MockUSDT to Avalanche Fuji...");
  const factory = await ethers.getContractFactory("MockUSDT");
  const usdt = await factory.deploy();
  await usdt.waitForDeployment();
  const usdtAddr = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddr);

  // Allowlist on GuideBloc
  const guideblocAddr = "0xD39883b0C1b6AdFa31d92431141D8d7DD9e8e4AB";
  const gb = await ethers.getContractAt("GuideBloc", guideblocAddr);

  console.log("Allowlisting MockUSDT on GuideBloc...");
  const tx1 = await gb.setTokenConfig(
    usdtAddr,
    true, // enabled
    false, // permitSupported
    5_000_000n, // 5 USDT
    1_000_000_000n, // 1,000 USDT
    50_000_000_000n // 50,000 USDT
  );
  await tx1.wait();
  console.log("MockUSDT allowlisted!");

  // Allowlist MockUSDC (0x2874C7e0C9B27029455f2a46D2332acE7C749DA9)
  console.log("Allowlisting MockUSDC on GuideBloc...");
  const tx2 = await gb.setTokenConfig(
    "0x2874C7e0C9B27029455f2a46D2332acE7C749DA9",
    true,
    false,
    5_000_000n,
    1_000_000_000n,
    50_000_000_000n
  );
  await tx2.wait();
  console.log("MockUSDC allowlisted!");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
