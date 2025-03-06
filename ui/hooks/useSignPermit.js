import { useEffect, useState } from "react";
import { useSignTypedData, useReadContract } from "wagmi";
import { BridgeDataHelper } from "@/utils/typeHelper";
import { abis } from "@/abi";
import { isTronChain, tronAddress } from "@/utils/tronHelper";

const useSignPermit = (orderData, permitData) => {
  const [permitSignedData, setPermitSignedData] = useState(null);
  const [permitIsError, setPermitIsError] = useState(null);
  const [permitIsSuccess, setPermitIsSuccess] = useState(null);

  const {
    signTypedData: signPermit,
    data: evmPermitSignedData,
    isError: evmPermitIsError,
    isSuccess: evmPermitIsSuccess,
  } = useSignTypedData();

  const [tronPermitSignedData, setTronPermitSignedData] = useState(null);
  const [tronPermitIsError, setTronPermitIsError] = useState(null);
  const [tronPermitIsSuccess, setTronPermitIsSuccess] = useState(null);

  useEffect(() => {
    if (orderData) {
      setPermitSignedData(
        isTronChain(orderData) ? tronPermitSignedData : evmPermitSignedData
      );
    }
  }, [orderData, evmPermitSignedData, tronPermitSignedData]);

  useEffect(() => {
    if (orderData) {
      setPermitIsSuccess(
        isTronChain(orderData) ? tronPermitIsSuccess : evmPermitIsSuccess
      );
    }
  }, [orderData, evmPermitIsSuccess, tronPermitIsSuccess]);

  useEffect(() => {
    if (orderData) {
      setPermitIsError(
        isTronChain(orderData) ? tronPermitIsError : evmPermitIsError
      );
    }
  }, [orderData, evmPermitIsError, tronPermitIsError]);

  const sourceTokenAddress = orderData
    ? BridgeDataHelper.getDecodedBridgeData(orderData.orderData)
        .sourceTokenAddress
    : null;

  const { data: sourceTokenName } = useReadContract({
    address: sourceTokenAddress,
    abi: abis.erc20,
    functionName: "name",
    query: {
      enabled: !!sourceTokenAddress,
    },
  });

  const permitDomain =
    orderData && permitData
      ? {
          name: sourceTokenName,
          version: "1",
          chainId: orderData.sourceChainId,
          verifyingContract: sourceTokenAddress,
        }
      : null;
  const permitType = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const doEvmSignPermit = () => {
    console.log("doEvmSignPermit");
    try {
      signPermit({
        domain: permitDomain,
        types: permitType,
        message: permitData,
        primaryType: "Permit",
      });
    } catch (e) {
      console.log("Error: ", e.message);
    }
  };

  const doTronSignPermit = () => {
    try {
      const sign = async () => {
        const tokenAddress = tronAddress(sourceTokenAddress);
        const trc20 = window.tron.tronWeb.contract(abis.erc20, tokenAddress);
        const tokenName = await trc20.name().call();

        permitDomain.name = tokenName;
        permitDomain.verifyingContract = tokenAddress;

        permitData.value = "0x" + permitData.value.toString(16);
        const signature = await window.tron.tronWeb.trx._signTypedData(
          permitDomain,
          permitType,
          permitData
        );
        console.log(permitDomain);
        console.log(permitType);
        console.log(permitData);
        console.log("signature: ", signature);
        setTronPermitSignedData(signature);
        setTronPermitIsSuccess(true);
        setTronPermitIsError(false);
      };
      sign();
    } catch (e) {
      console.log("Error: ", e.message);
      setTronPermitIsSuccess(false);
      setTronPermitIsError(true);
    }
  };

  const doSignPermit = () => {
    if (orderData) {
      if (isTronChain(orderData)) {
        doTronSignPermit();
      } else {
        doEvmSignPermit();
      }
    } else {
      console.log("Permit data is not available");
    }
  };

  return {
    doSignPermit,
    permitIsError,
    permitIsSuccess,
    permitSignedData,
  };
};

export default useSignPermit;
