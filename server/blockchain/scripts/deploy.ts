import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const backendAdminAddress = process.env.ADMIN_WALLET_ADDRESS?.trim() || deployer.address;
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Backend admin wallet:", backendAdminAddress);

  // 1. Deploy AccessControl first
  const CarbonAccessControl = await ethers.getContractFactory("CarbonAccessControl");
  const accessControl = await CarbonAccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl deployed to:", accessControlAddress);

  // Ensure the backend signer can administer roles on the fresh localhost chain.
  const DEFAULT_ADMIN_ROLE = await accessControl.DEFAULT_ADMIN_ROLE();
  if (backendAdminAddress.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log(`Granting DEFAULT_ADMIN_ROLE to backend admin: ${backendAdminAddress}`);
    const adminTx = await accessControl.grantRole(DEFAULT_ADMIN_ROLE, backendAdminAddress);
    await adminTx.wait();
  }

  // 2. Deploy CarbonCreditToken
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  const token = await CarbonCreditToken.deploy(accessControlAddress, "https://api.carbon.credit/metadata/");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("CarbonCreditToken deployed to:", tokenAddress);

  // 3. Deploy CreditRegistry
  const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy(accessControlAddress, tokenAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  // 4. Grant REGULATOR_ROLE to CreditRegistry
  const REGULATOR_ROLE = await accessControl.REGULATOR_ROLE();
  await accessControl.grantRole(REGULATOR_ROLE, registryAddress);
  console.log("Granted REGULATOR_ROLE to CreditRegistry");

  // 5. Grant roles to the deployer/admin
  const MINTER_ROLE = await accessControl.MINTER_ROLE();
  const PRODUCER_ROLE = await accessControl.PRODUCER_ROLE();
  const BUYER_ROLE = await accessControl.BUYER_ROLE();

  const functionalRoles = [REGULATOR_ROLE, MINTER_ROLE, PRODUCER_ROLE, BUYER_ROLE];

  for (const role of functionalRoles) {
    await accessControl.grantRole(role, deployer.address);
    if (backendAdminAddress.toLowerCase() !== deployer.address.toLowerCase()) {
      await accessControl.grantRole(role, backendAdminAddress);
    }
  }
  
  console.log("-----------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("REGISTRY_ADDRESS:", registryAddress);
  console.log("ACCESS_CONTROL_ADDRESS:", accessControlAddress); // Added for your records
  console.log("TOKEN_ADDRESS:", tokenAddress);
  console.log("-----------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
