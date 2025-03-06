const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer, user, filler] = await ethers.getSigners();

  // 1) Deploy a mock ERC20 token
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("MockToken", "MCK", 18);
  await token.deployed();
  console.log("MockERC20 deployed at:", token.address);

  // Mint user some tokens for demonstration
  await token.mint(user.address, ethers.utils.parseUnits("1000", 18));

  // 2) Construct a GaslessCrossChainOrder
  const now = Math.floor(Date.now() / 1000);
  const orderDataType = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("BRIDGE_TRANSFER_ORDER")
  );
  const amount = ethers.utils.parseUnits("100", 18);

  // Encode bridging data:
  // (filler, token, amount, destinationChainId, destinationToken, beneficiary)
  const bridgingData = ethers.utils.defaultAbiCoder.encode(
    ["address","address","uint256","uint256","address","address"],
    [
      filler.address,      // filler
      token.address,       // sourceToken
      amount,              // amount
      9999,                // destinationChainId (placeholder)
      "0x000000000000000000000000000000000000dEaD", // destinationToken placeholder
      "0xBBBBbbbbBBBBbbbbBBBBbbbbbbbbBBBBbbbbBBBB"  // beneficiary placeholder
    ]
  );

  const order = {
    user: user.address,
    nonce: 4001,
    originChainId: 31337,
    openDeadline: now + 300,
    fillDeadline: now + 600,
    orderDataType,
    orderData: bridgingData
  };

  // 3) Retrieve the deployed IntentFactory (replace with actual address!)
  const factoryAddress = "<REPLACE_WITH_DEPLOYED_FACTORY_ADDRESS>";
  const factory = await ethers.getContractAt("IntentFactory", factoryAddress);

  // 4) Precompute ephemeral address
  const salt = ethers.utils.id("mySalt123"); // any random salt
  const ephemeralAddr = await factory.getIntentAddress(order, salt);
  console.log("Ephemeral address computed:", ephemeralAddr);

  // 5) User transfers tokens directly to the ephemeral address
  await token.connect(user).transfer(ephemeralAddr, amount);
  console.log(
    "User transferred",
    amount.toString(),
    "tokens to ephemeral address"
  );

  // 6) Deploy ephemeral contract using CREATE2 (filler pays gas)
  const txCreate = await factory.connect(filler).createIntent(order, salt);
  const receiptCreate = await txCreate.wait();
  console.log("Deployed ephemeral contract at:", ephemeralAddr);

  // Verify ephemeral contract's token balance
  const balEphemeral = await token.balanceOf(ephemeralAddr);
  console.log("Ephemeral contract token balance:", balEphemeral.toString());

  // 7) Simulate finalizing bridging on the "destination" chain using IDestinationSettler.fill()
  //    In a real multi-chain flow, this call happens on chainId = 9999, but for local demo, we'll just do it here.
  //    We need an orderId that matches the ephemeral contract's logic: keccak256(abi.encode(order))
  const orderEncoded = ethers.utils.defaultAbiCoder.encode(
    [
      "tuple(address user,uint256 nonce,uint256 originChainId,uint256 openDeadline,uint256 fillDeadline,bytes32 orderDataType,bytes orderData)"
    ],
    [order]
  );
  const orderId = ethers.utils.keccak256(orderEncoded);

  // Call "fill(orderId, originData, fillerData)"
  // We'll just pass empty bytes for originData and fillerData
  const ephemeralContract = await ethers.getContractAt("DualChainIntent", ephemeralAddr);
  const txFill = await ephemeralContract.connect(filler).fill(orderId, "0x", "0x");
  await txFill.wait();
  console.log("Destination fill() completed (simulated).");

  // 8) Provide a (fake) proof to finalize on the origin
  //    In reality, you'd provide a real Groth16 proof. We'll use a non-empty bytes placeholder.
  const proofData = "0x1234";
  const txOrigin = await ephemeralContract.connect(filler).finalizeOnOrigin(proofData);
  await txOrigin.wait();
  console.log("Origin finalized, escrow unlocked.");

  // Check filler balance after unlocking escrow
  const balFiller = await token.balanceOf(filler.address);
  console.log("Filler's token balance:", balFiller.toString());
}

module.exports = main;

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
