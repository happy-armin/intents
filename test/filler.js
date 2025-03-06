/*
node filler.js '{\""permitsignature\"":\""0xff3ceb7bc063d79c17dedd078c16442d2a14454234a7bf796d60391bdf542b2807be6bbc444462d51765a260fe0cb3c75465f4fa58359d1062532316b9e21ab11c\"",\""permitrawbytes\"":\""0x000000000000000000000000e8b890e5e0e7f62e42aafa2477054e8bfcb48004000000000000000000000000f43a23374edb9092125bd2e8664d48cb5ce40a9a0000000000000000000000000000000000000000000000004563918244f40000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000679d4d85\"",\""ordersignature\"":\""0x87c8a4820c5559d52f6374a023e7450d31caf78d9ae79139481f7b1f996d7afc1e3a8131c0a4bf398e16c95a27e17e5a36f2c2d69b9136b7ac72a684847dd02d1c\"",\""orderrawbytes\"":\""0x000000000000000000000000f43a23374edb9092125bd2e8664d48cb5ce40a9a000000000000000000000000e8b890e5e0e7f62e42aafa2477054e8bfcb4800400000000000000000000000000000000000000000000000000000000679d3e490000000000000000000000000000000000000000000000000000000000aa36a700000000000000000000000000000000000000000000000000000000679d3f7500000000000000000000000000000000000000000000000000000000679d4d85e7916c0abb18c8d4e936c90c4b274f18cfea48ab9203ec4dd4e48f45a126d482000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000bf882fc99800a93494fe4844dc0002fcbaa79a7a0000000000000000000000000000000000000000000000004563918244f400000000000000000000000000000000000000000000000000000000000000000165000000000000000000000000bf882fc99800a93494fe4844dc0002fcbaa79a7a000000000000000000000000e8b890e5e0e7f62e42aafa2477054e8bfcb48004\""}'
*/

require("dotenv").config();

const { providers, Wallet, ethers } = require("ethers");
const { formatEther } = require("ethers/lib/utils");

// import contract abis
const intentFactoryAbi = require("./abi/IntentFactory.json");
const dualChainIntentAbi = require("./abi/DualChainIntent.json");
const mockUSDTAbi = require("./abi/MockERC20.json");

// define chain urls
const providerUrls = {
  opstack:
    "https://rpc-jam-ccw030wxbz.t.conduit.xyz/Pwe4skpfPaM8HSTPwHDhXzoJoKqdpjfRQ",
  sepolia: "https://sepolia.infura.io/v3/38cd1dee58ab4d4c868298180a6519ed",
  ink: "https://rpc-gel-sepolia.inkonchain.com",
};

// network chain ids
const sepoliaChainId = 11155111;
const opChainId = 357;
const inkChainId = 763373;

// define intent factory address on both network (in this case, sepolia and opstack)
const ADDRESS_INTENT_FACTORY = {
  opstack: "0x9065Bd9D33770B38cDAf0761Bc626cf5fA45ae68",
  sepolia: "0x9065Bd9D33770B38cDAf0761Bc626cf5fA45ae68",
  ink: "0x9065Bd9D33770B38cDAf0761Bc626cf5fA45ae68",
};
// intent factory addresses are same on both network
const ADDRESS_INTENT_FACTORY_GLOBAL =
  "0x9065Bd9D33770B38cDAf0761Bc626cf5fA45ae68";

// filler's wallet private key
const fillerPrivateKey = process.env.FILLER_PRIVATE_KEY_EVM;
// variable for transation runtime result
let txRecipt;

let input;

// store calculated values from input
let orderData;
let bridgeData;
let permitData;
let sig_v;
let sig_r;
let sig_s;
let intentSource;
let intentDest;

let sourceProvider;
let destProvider;
let fillerSource;
let fillerDest;
let intentFactory;
let intentFactoryDest;

// function to validate signature
const validateSignature = async (inputData) => {
  // 1. Decode orderRawbytes first
  orderData = ethers.utils.defaultAbiCoder.decode(
    [
      "address",
      "address",
      "uint256",
      "uint256",
      "uint32",
      "uint32",
      "bytes32",
      "bytes",
    ],
    inputData.orderrawbytes
  );

  // 2. Get some necessary information (chainID, factory address)
  const chainId = Number(orderData[3]);

  // 3. Verify OrderSignature
  const domain = {
    name: "SignOrder",
    version: "1",
    chainId: chainId,
    verifyingContract: "0x9065Bd9D33770B38cDAf0761Bc626cf5fA45ae68",
  };
  const types = {
    Order: [
      { name: "intentAddress", type: "address" },
      { name: "user", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "sourceChainId", type: "uint256" },
      { name: "openDeadline", type: "uint32" },
      { name: "fillDeadline", type: "uint32" },
      { name: "orderDataType", type: "bytes32" },
      { name: "orderData", type: "bytes" },
    ],
  };
  const values = {
    intentAddress: orderData[0],
    user: orderData[1],
    nonce: Number(orderData[2]),
    sourceChainId: Number(orderData[3]),
    openDeadline: orderData[4],
    fillDeadline: orderData[5],
    orderDataType: orderData[6],
    orderData: orderData[7],
  };
  const recoveredAddressFromOrder = ethers.utils.verifyTypedData(
    domain,
    types,
    values,
    inputData.ordersignature
  );

  // 4. Decode permit data
  permitData = ethers.utils.defaultAbiCoder.decode(
    ["address", "address", "uint256", "uint256", "uint256"],
    inputData.permitrawbytes
  );

  // 5. Prepare some information
  bridgeData = ethers.utils.defaultAbiCoder.decode(
    [
      "address",
      "address",
      "uint256",
      "uint256",
      "address",
      "uint256",
      "address",
    ],
    values.orderData
  );

  // ---------------------- start initializing filler and factory --------------------
  // source and dest chain providers
  const sourceUrl =
    parseInt(orderData[3]) === sepoliaChainId
      ? providerUrls.sepolia
      : parseInt(orderData[3]) === opChainId
      ? providerUrls.opstack
      : providerUrls.ink;
  const destUrl =
    parseInt(bridgeData[3]) === sepoliaChainId
      ? providerUrls.sepolia
      : parseInt(bridgeData[3]) === opChainId
      ? providerUrls.opstack
      : providerUrls.ink;
  sourceProvider = new providers.JsonRpcProvider(sourceUrl);
  destProvider = new providers.JsonRpcProvider(destUrl);

  // filler's source and dest wallet
  fillerSource = new Wallet(fillerPrivateKey, sourceProvider); // receive user's token
  fillerDest = new Wallet(fillerPrivateKey, destProvider); // send dest token to user

  // get depolyed intent factory and erc-20 token address on both chains
  intentFactory = new ethers.Contract(
    ADDRESS_INTENT_FACTORY_GLOBAL,
    intentFactoryAbi,
    sourceProvider
  );
  intentFactoryDest = new ethers.Contract(
    ADDRESS_INTENT_FACTORY_GLOBAL,
    intentFactoryAbi,
    destProvider
  );
  // ---------------------- end initializing filler and factory --------------------

  const tokenAddress = bridgeData[1];
  const tokenContract = new ethers.Contract(
    tokenAddress,
    mockUSDTAbi,
    sourceProvider
  );

  // 6. Verify Permit
  const permitDomain = {
    name: await tokenContract.name(),
    version: "1",
    chainId: chainId,
    verifyingContract: tokenAddress,
  };
  const permitTypes = {
    Permit: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
      {
        name: "nonce",
        type: "uint256",
      },
      {
        name: "deadline",
        type: "uint256",
      },
    ],
  };
  const permitValues = {
    owner: permitData[0],
    spender: permitData[1],
    value: permitData[2],
    nonce: permitData[3],
    deadline: permitData[4],
  };
  const recoverdAddressFromPermit = ethers.utils.verifyTypedData(
    permitDomain,
    permitTypes,
    permitValues,
    inputData.permitsignature
  );

  // split permit signature
  const sig = ethers.utils.splitSignature(inputData.permitsignature);
  sig_v = sig.v;
  sig_r = sig.r;
  sig_s = sig.s;
  console.log(
    " - split permit signature: " + sig_v + ", " + sig_r + ", " + sig_s
  );

  console.log(" - recovered address from order: " + recoveredAddressFromOrder);
  console.log(" - calculated address from order raw bytes: " + orderData[1]);
  console.log(" - recovered address from permit: " + recoverdAddressFromPermit);
  console.log(" - calculated address from permit raw bytes: " + permitData[0]);

  return (
    recoveredAddressFromOrder === orderData[1] &&
    recoverdAddressFromPermit === permitData[0] &&
    orderData[1] === permitData[0]
  );
};

// function to deploy ephemeral contract on both chains
const dployEphemeralContracts = async () => {
  let beforeOrderData = [...orderData];
  beforeOrderData[0] = "0x0000000000000000000000000000000000000000";
  // deploy to source
  txRecipt = await intentFactory
    .connect(fillerSource)
    .createIntent(beforeOrderData, ethers.utils.id("SALT_0x1234567890ABCDEF"));
  await sourceProvider.waitForTransaction(txRecipt.hash);
  console.log(" - deploy ephermeral contract on source", txRecipt.hash);

  // deploy to dest
  txRecipt = await intentFactoryDest
    .connect(fillerDest)
    .createIntent(beforeOrderData, ethers.utils.id("SALT_0x1234567890ABCDEF"));
  await destProvider.waitForTransaction(txRecipt.hash);
  console.log(" - deploy ephermeral contract on dest chain", txRecipt.hash);
};

// function to subit permit by filler (approve & transfer user token to source chain [filler pays gas])
const submitPermit = async () => {
  // get depolyed ephemeral contract from both chains
  const computedAddress = orderData[0];
  intentSource = new ethers.Contract(
    computedAddress,
    dualChainIntentAbi,
    fillerSource
  );
  intentDest = new ethers.Contract(
    computedAddress,
    dualChainIntentAbi,
    fillerDest
  );

  // calculate orderId on source chain
  let bridgeDataAfterDeploy = [...bridgeData];
  bridgeDataAfterDeploy[0] = await fillerSource.getAddress();
  const bridgeEncoded = ethers.utils.defaultAbiCoder.encode(
    [
      "address",
      "address",
      "uint256",
      "uint256",
      "address",
      "uint256",
      "address",
    ], // Specify the types
    bridgeDataAfterDeploy
  );

  let contractOrderData = [...orderData];
  contractOrderData[7] = bridgeEncoded;

  const orderEncoded = ethers.utils.defaultAbiCoder.encode(
    [
      "tuple(address intentAddress,address user,uint256 nonce,uint256 sourceChainId,uint32 openDeadline,uint32 fillDeadline,bytes32 orderDataType,bytes orderData)", // Specify the tuple structure
    ],
    [contractOrderData]
  );

  const orderId = ethers.utils.keccak256(orderEncoded);

  // call submitPermit function on source chain
  txRecipt = await intentSource
    .connect(fillerSource)
    .submitPermit(orderId, sig_v, sig_r, sig_s);
  await sourceProvider.waitForTransaction(txRecipt.hash);

  console.log(
    `Ephermeral contract token balance: ${formatEther(bridgeData[2])} MOCK`
  );
};

// function to fill the order by filler (send dest token to user [filler pays gas])
const fillOrder = async () => {
  // calculate orderId from destination chain
  let bridgeDataAfterDeploy = [...bridgeData];
  bridgeDataAfterDeploy[0] = await fillerDest.getAddress();
  const bridgeEncoded = ethers.utils.defaultAbiCoder.encode(
    [
      "address",
      "address",
      "uint256",
      "uint256",
      "address",
      "uint256",
      "address",
    ], // Specify the types
    bridgeDataAfterDeploy
  );

  let contractOrderData = [...orderData];
  contractOrderData[7] = bridgeEncoded;

  const orderEncoded = ethers.utils.defaultAbiCoder.encode(
    [
      "tuple(address intentAddress,address user,uint256 nonce,uint256 sourceChainId,uint32 openDeadline,uint32 fillDeadline,bytes32 orderDataType,bytes orderData)", // Specify the tuple structure
    ],
    [contractOrderData]
  );

  const orderId = ethers.utils.keccak256(orderEncoded);

  // get dest token contract
  const destTokenContract = new ethers.Contract(
    bridgeData[4],
    mockUSDTAbi,
    fillerDest
  );

  // approve destination ephemeral contract to spend filler's dest token
  txRecipt = await destTokenContract
    .connect(fillerDest)
    .approve(orderData[0], bridgeData[2]);
  console.log("approve", txRecipt.hash);
  await destProvider.waitForTransaction(txRecipt.hash);

  console.log(orderId);

  // call fill function on destinationn chain (send dest token to user)
  txRecipt = await intentDest.connect(fillerDest).fill(orderId, "0x", "0x");
  await destProvider.waitForTransaction(txRecipt.hash);
  console.log(`Destination finalized: ${txRecipt.hash}`);

  // expect destinationFulfilled state to be true
  const destinationFulfilled = await intentDest.destinationFulfilled();
  console.log("destinationFulfilled", destinationFulfilled);
};

// function to finalize order (receive user's source token to filler)
const finalizeOrder = async () => {
  // call finalizeOnOrigin function with static proof key and value
  const tx = await intentSource
    .connect(fillerSource)
    .finalizeOnOrigin(
      "0x004eb6a15619fdfd870ceb7ee0307f2316fe698e52887b9560f0a84f2cebab75",
      "0x2000000000000000ecdc9dde35836e1f0334fe763dfef9c07931f98fa67cb6213be543f0ee7470031400000000000000a1a3a3ab81168ecfc0f7f39489754b877b6ffe852000000000000000000000000000000000000000000000000000000000000000000000000000000e20000000000000000000000000000000000000000000000000000000000000000000000000000001",
      "0x11b6a09d21265a0ed431b3fa79fef4bdfa8588d22b22633808802398291a4872bb2acd4928efd11a46b9a65fac1c78b304e293e574bca5522dd7a1d49e8be736222668950b09c6b2acdd3f0a9419106e55a3a543648dfc2ba86d8f46edaf393b13e211710fe1e0b190307dc6e1220ae6dcdaba276d4d3f046e43519ba70447dd402a592a1e24b19a8b19866964ff166a357f801f6cbe5e1754b9ed0bdbf3e79fd1760a38101b77321dac27a57ff00cbcb1a35584c9c6102371686063430757a699995efc2556f9582d64086995bed255cad949429f6a81267b86d18615334aeda53d37220c294e7a2f33c423344aaacf0d9172fa519e215109c0a0fd3dc2279ece238062"
    );

  console.log(tx.hash);
  await sourceProvider.waitForTransaction(tx.hash);

  // expect originCompleted state to be true
  const originCompleted = await intentSource.originCompleted();
  console.log("originCompleted", originCompleted);
};

// filler flow logic for user order
(async () => {
  // Check if an argument is provided
  if (process.argv.length < 3) {
    console.log("Please provide a JSON string as an argument.");
    process.exit(1);
  }
  // Get the JSON argument from the command line
  const argument = process.argv[2];
  try {
    // Parse the JSON string
    input = JSON.parse(argument);
  } catch (error) {
    console.error("Invalid JSON string:", error.message);
    process.exit(1);
  }

  // 1. Filler validates order & permit data from posted JSONBLOB by user
  console.log(
    "First, filler validates order & permit data from user posted JSONBLOB"
  );
  const isSignatureValid = await validateSignature(input);
  if (!isSignatureValid) {
    return;
  }
  console.log(
    "------------------------------ validation success ------------------------------"
  );
  // 2. Filler depolys ephemeral contract (DualChainIntent.sol) to source and dest chain
  console.log(
    "Second, filler deploys ephemeral contract to source and dest chain"
  );
  await dployEphemeralContracts();
  console.log(
    "------------------------------ ephemeral contract deployed ------------------------------"
  );
  // 3. Filler submits permit (approve & transfer user token to source chain [filler pays gas])
  console.log(
    "Third, filler submits permit (approve & transfer user token to source chain [filler pays gas])"
  );
  await submitPermit();
  console.log(
    "------------------------------ user permit approved and sent to source chain ------------------------------"
  );
  // 4. Filler fills the order (send dest token to user [filler pays gas])
  console.log(
    "Fourth, filler fills the order (send dest token to user [filler pays gas])"
  );
  await fillOrder();
  console.log(
    "------------------------------ user's source token sent to filler ------------------------------"
  );
  // 5. Filler finalizes the order (receive user's source token to filler)
  console.log(
    "Fifth, filler finalizes the order (receive user's source token to filler)"
  );
  await finalizeOrder();
  console.log(
    "------------------------------ user's source token received from filler ------------------------------"
  );
  console.log(
    "------------------------------ flow completed ------------------------------"
  );
})();
