import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";


const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          evmVersion: "cancun",
          optimizer: { enabled: true, runs: 200 }
        }
      }
    ]
  },
};

export default config;
