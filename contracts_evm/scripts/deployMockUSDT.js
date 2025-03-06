const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying MockUSDT with signer:", deployer.address);

  // Compile and get a contract factory for "IntentFactory", deploy
  const Factory = await hre.ethers.getContractFactory("MockERC20");
  const factory = await Factory.deploy(...["Wrapped Bitcoin", "WBTC", "10000000000000000000000"]);

  console.log("MockUSDT deployed at:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
