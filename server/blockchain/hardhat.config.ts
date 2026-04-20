import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

// 1. Run 'ipconfig' in your terminal and find your "IPv4 Address"
// 2. Replace the value below with that address (e.g., "192.168.1.15")
// const MY_LOCAL_IP = "10.150.36.106"; 

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          evmVersion: "cancun",
          optimizer: { enabled: true, runs: 200 },
          viaIR: true,
        }
      }
    ]
  },
  // networks: {
  //   // Default localhost
  //   localhost: {
  //     url: "http://127.0.0.1:8545",
  //   },
  //   // The "WiFi" network for external access
  //   wifi: {
  //     url: `http://${MY_LOCAL_IP}:8545`,
  //     accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]
  //   }
  // }
};

export default config;
