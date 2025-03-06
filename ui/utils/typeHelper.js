const { ethers } = require("ethers");

export const OrderDataHelper = {
  getIntentAddress: (data) => {
    return data.intentAddress;
  },
  getUserAddress: (data) => {
    return data.user;
  },
  getNonce: (data) => {
    return data.nonce;
  },
  getSourceChainId: (data) => {
    return data.sourceChainId;
  },
  getOpenDeadline: (data) => {
    return data.openDeadline;
  },
  getFillDeadline: (data) => {
    return data.fillDeadline;
  },
  getBridgeData: (data) => {
    return data.OrderData;
  },
};

export const BridgeDataHelper = {
  getFillerAddress: (data) => {
    return data.filler;
  },
  getSourceTokenAddress: (data) => {
    return data.sourceTokenAddress;
  },
  getAmount: (data) => {
    return data.sendAmount;
  },
  getReceiveAmount: (data) => {
    return data.receiveAmount;
  },
  getDestinationChainId: (data) => {
    return data.destinationChainId;
  },
  getDestinationTokenAddress: (data) => {
    return data.destinationTokenAddress;
  },
  getBeneficiaryAddress: (data) => {
    return data.beneficiary;
  },
  getEncodedBridgeData: (data) => {
    const encodedBridge = ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "address",
        "uint256",
        "address",
      ],
      [
        BridgeDataHelper.getFillerAddress(data),
        BridgeDataHelper.getSourceTokenAddress(data),
        BridgeDataHelper.getAmount(data),
        BridgeDataHelper.getDestinationChainId(data),
        BridgeDataHelper.getDestinationTokenAddress(data),
        BridgeDataHelper.getReceiveAmount(data),
        BridgeDataHelper.getBeneficiaryAddress(data),
      ]
    );
    return encodedBridge;
  },
  getDecodedBridgeData: (data) => {
    const decodedBridge = ethers.AbiCoder.defaultAbiCoder().decode(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "address",
        "uint256",
        "address",
      ],
      data
    );
    return {
      filler: decodedBridge[0],
      sourceTokenAddress: decodedBridge[1],
      sendAmount: decodedBridge[2],
      destinationChainId: decodedBridge[3],
      destinationTokenAddress: decodedBridge[4],
      receiveAmount: decodedBridge[5],
      beneficiary: decodedBridge[6],
    };
  },
};
