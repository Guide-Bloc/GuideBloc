import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY;
const accounts = deployerKey ? [deployerKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // Avalanche C-Chain (mainnet and Fuji) supports the Cancun fork.
      evmVersion: "cancun",
      outputSelection: {
        "*": {
          "*": [
            "abi",
            "evm.bytecode",
            "evm.deployedBytecode",
            "evm.methodIdentifiers",
            "metadata",
            "storageLayout",
          ],
          "": ["ast"],
        },
      },
    },
  },
  paths: {
    sources: "./src",
  },
  networks: {
    avalanche_fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: accounts,
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: accounts,
    },
  },
  etherscan: {
    apiKey: process.env.SNOWTRACE_API_KEY || ""
  },
  sourcify: {
    enabled: true
  }
};

export default config;
