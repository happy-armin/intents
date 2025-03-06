const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying IntentFactory with signer:", deployer.address);

  // Compile and get a contract factory for "IntentFactory", deploy
  const Factory = await hre.ethers.getContractFactory("IntentFactory");
  const factory = await Factory.deploy(); 

  console.log("IntentFactory deployed at:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
