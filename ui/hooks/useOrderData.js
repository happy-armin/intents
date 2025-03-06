import { configDotenv } from "dotenv";

import { useEffect, useState } from "react";
import { ethers, keccak256, toUtf8Bytes } from "ethers";
import { useAccount, useReadContract } from "wagmi";

import { DeadlineData } from "@/config/constants";
import { abis } from "@/abi";
import { SALT } from "@/config/constants";
import { getContractAddress } from "@/config/networks";
import { BridgeDataHelper } from "@/utils/typeHelper";
import { hexAddress, isTronChain } from "@/utils/tronHelper";
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";

const useOrderData = (manualRequest) => {
  // hooks for use input handleing
  const [sourceChain, setSourceChain] = useState(null);
  const [destChain, setDestChain] = useState(null);
  const [sourceToken, setSourceToken] = useState(null);
  const [destToken, setDestToken] = useState(null);
  const [tokenAmount, setTokenAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [deadlineIndex, setDeadlineIndex] = useState(0);

  // hooks for tron support
  const [sourceBalanceTron, setSourceBalanceTron] = useState(0);
  const [sourceTokenNonceTron, setSourceTokenNonceTron] = useState(0);

  // state for token amount validation (insufficient check)
  const [amountValid, setAmountValid] = useState(false);

  // wagmi hook for user address
  const [address, setAddress] = useState(null);
  const { address: evmAddress } = useAccount();
  const { address: tronAddress } = useWallet();

  useEffect(() => {
    if (!!sourceChain) {
      setAddress(
        isTronChain(sourceChain) ? hexAddress(tronAddress) : evmAddress
      );
    }
  }, [sourceChain, evmAddress, tronAddress]);

  // return type setting hooks
  const [orderData, setOrderData] = useState(null);
  const [permitData, setPermitData] = useState(null);

  // function for getting bridge data from user input
  const getBridgeData = () => {
    const sourceTokenAddress = sourceToken.addresses[sourceChain.id];
    const destTokenAddress = destToken.addresses[destChain.id];

    return {
      filler: "0x0000000000000000000000000000000000000000",
      sourceTokenAddress: hexAddress(sourceTokenAddress),
      sendAmount: !!tokenAmount ? ethers.parseEther(tokenAmount) : 0,
      destinationChainId: destChain.id,
      destinationTokenAddress: hexAddress(destTokenAddress),
      receiveAmount: !!receiveAmount
        ? ethers.parseEther(receiveAmount.toString())
        : 0,
      beneficiary: address,
    };
  };

  // get source token balance using wagmi useReadContract hook
  const { data: sourceTokenBalance } = useReadContract({
    address:
      !!sourceChain && !!sourceToken
        ? sourceToken.addresses[sourceChain.id]
        : null,
    chainId: !!sourceChain ? sourceChain.id : null,
    abi: abis.erc20,
    functionName: "balanceOf",
    args: [evmAddress],
    query: {
      enabled: !!sourceChain && sourceChain.id !== 3448148188,
    },
  });

  // get source token nonce using wagmi useReadContract hook
  const { data: sourceTokenNonce } = useReadContract({
    address:
      !!sourceChain && !!sourceToken
        ? sourceToken.addresses[sourceChain.id]
        : null,
    chainId: !!sourceChain ? sourceChain.id : null,
    abi: abis.erc20,
    functionName: "nonces",
    args: [evmAddress],
  });

  // effect hook for validation checks for send token amount (balance >= amount)
  useEffect(() => {
    if (!!sourceChain && !!sourceToken) {
      if (!isTronChain(sourceChain) && !!tokenAmount && !!sourceTokenBalance) {
        const sendAmount = parseFloat(tokenAmount);
        const avaiableAmount = parseFloat(
          ethers.formatEther(sourceTokenBalance)
        );
        setAmountValid(sendAmount > avaiableAmount);
      } else if (
        isTronChain(sourceChain) &&
        !!tokenAmount &&
        !!sourceBalanceTron
      ) {
        const sendAmount = parseFloat(tokenAmount);
        const avaiableAmount = parseFloat(
          ethers.formatEther(sourceBalanceTron)
        );
        setAmountValid(sendAmount > avaiableAmount);
      }
    }
  }, [tokenAmount, sourceTokenBalance, sourceBalanceTron]);

  // get intent address form intent factory function with order data and salt as input

  const [ephermeralAddress, setEphermeralAddress] = useState(null);
  const [tronEphermeralAddress, setTronEphermeralAddress] = useState(null);
  const { data: evmEphemeralAddress } = useReadContract({
    address: !!sourceChain
      ? getContractAddress(sourceChain.id, "intentFactory")
      : null,
    abi: abis.intentFactory,
    functionName: "getIntentAddress",
    args: [
      {
        ...orderData,
        intentAddress: "0x0000000000000000000000000000000000000000",
      },
      ethers.id(SALT),
    ],
    query: {
      enabled: evmAddress,
    },
  });

  useEffect(() => {
    if (!!sourceChain) {
      setEphermeralAddress(
        isTronChain(sourceChain) ? tronEphermeralAddress : evmEphemeralAddress
      );
    }
  }, [sourceChain, evmEphemeralAddress, tronEphermeralAddress]);

  useEffect(() => {
    if (orderData) {
      if (isTronChain(sourceChain)) {
        const readContract = async () => {
          const intentFactory = window.tron.tronWeb.contract(
            abis.intentFactory_Tron,
            getContractAddress(sourceChain.id, "intentFactory")
          );
          const intentAddress = await intentFactory
            .getIntentAddress(
              Object.values({
                ...orderData,
                intentAddress: "0x0000000000000000000000000000000000000000",
              }),
              ethers.id(SALT)
            )
            .call();
          setTronEphermeralAddress(hexAddress(intentAddress));
        };
        readContract();
      }
    }
  }, [orderData]);

  useEffect(() => {
    if (!!sourceToken && !!sourceChain) {
      if (isTronChain(sourceChain)) {
        const readContract = async () => {
          const trc20 = window.tron.tronWeb.contract(
            abis.erc20,
            sourceToken.addresses[sourceChain.id]
          );

          const tokenBalance = await trc20
            .balanceOf(window.tron.tronWeb.defaultAddress.base58)
            .call();

          setSourceBalanceTron(tokenBalance._hex);

          const tokenNonce = await trc20
            .nonces(window.tron.tronWeb.defaultAddress.base58)
            .call();
          setSourceTokenNonceTron(parseInt(tokenNonce._hex, 16));
        };

        readContract();
      }
    }
  }, [sourceChain, sourceToken]);

  // react hook for setting order data before calculating intent address
  useEffect(() => {
    if (
      !!sourceChain &&
      !!destChain &&
      !!sourceToken &&
      !!destToken &&
      parseFloat(tokenAmount) > 0
    ) {
      const encodedBridgeData = BridgeDataHelper.getEncodedBridgeData(
        getBridgeData()
      );

      const currentTimeStamp = Math.floor(Date.now() / 1000);
      setOrderData({
        intentAddress: "0x0000000000000000000000000000000000000000",
        user: address,
        nonce: currentTimeStamp, // set manually
        sourceChainId: parseInt(sourceChain.id, 10),
        openDeadline: currentTimeStamp + DeadlineData[deadlineIndex].timestamp,
        fillDeadline:
          currentTimeStamp + DeadlineData[deadlineIndex].timestamp + 3600, // set manually
        orderDataType: keccak256(toUtf8Bytes("BRIDGE_TRANSFER_ORDER")),
        orderData: encodedBridgeData,
      });
      setPermitData({
        owner: address,
        spender: "0x0000000000000000000000000000000000000000",
        value: ethers.parseEther(tokenAmount),
        nonce: isTronChain(sourceChain)
          ? sourceTokenNonceTron
          : sourceTokenNonce,
        deadline:
          currentTimeStamp + DeadlineData[deadlineIndex].timestamp + 3600,
      });
    }
  }, [
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    tokenAmount,
    receiveAmount,
    deadlineIndex,
    sourceBalanceTron,
    sourceTokenNonceTron,
    manualRequest,
  ]);

  return [
    { ...orderData, intentAddress: ephermeralAddress },
    { ...permitData, spender: ephermeralAddress },
    {
      amountValid: amountValid,
      sourceTokenBalance: isTronChain(sourceChain)
        ? sourceBalanceTron
        : sourceTokenBalance,
    },
    {
      sourceChain,
      destChain,
      sourceToken,
      destToken,
      tokenAmount,
      receiveAmount,
      deadlineIndex,
    },
    {
      setSourceChain,
      setDestChain,
      setSourceToken,
      setDestToken,
      setTokenAmount,
      setReceiveAmount,
      setDeadlineIndex,
    },
  ];
};

export default useOrderData;
