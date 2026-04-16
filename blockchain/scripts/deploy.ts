import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy AccessControl first
  const CarbonAccessControl = await ethers.getContractFactory("CarbonAccessControl");
  const accessControl = await CarbonAccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl deployed to:", accessControlAddress);

  // 2. Deploy CarbonCreditToken
  const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
  const token = await CarbonCreditToken.deploy(accessControlAddress, "https://api.carbon.credit/metadata/");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("CarbonCreditToken deployed to:", tokenAddress);

  // 3. Deploy CreditRegistry with the AccessControl and Token address
  const CreditRegistry = await ethers.getContractFactory("CreditRegistry");
  const registry = await CreditRegistry.deploy(accessControlAddress, tokenAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  // 4. Grant REGULATOR_ROLE to CreditRegistry so it can mint tokens
  const REGULATOR_ROLE = await accessControl.REGULATOR_ROLE();
  await accessControl.grantRole(REGULATOR_ROLE, registryAddress);
  console.log("Granted REGULATOR_ROLE to CreditRegistry");

  // 5. Grant roles to the deployer so the backend server's Admin wallet can act as Regulator and Minter
  const MINTER_ROLE = await accessControl.MINTER_ROLE();
  await accessControl.grantRole(REGULATOR_ROLE, deployer.address);
  await accessControl.grantRole(MINTER_ROLE, deployer.address);
  console.log("Granted REGULATOR_ROLE and MINTER_ROLE to Admin/Deployer");

  // THIS IS YOUR REGISTRY_ADDRESS
  console.log("-----------------------------------------------");
  console.log("DEPLOYMENT COMPLETE");
  console.log("REGISTRY_ADDRESS:", registryAddress);
  console.log("TOKEN_ADDRESS:", tokenAddress);
  console.log("-----------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });