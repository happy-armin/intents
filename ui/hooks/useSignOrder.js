import { useEffect, useState } from "react";
import { useSignTypedData } from "wagmi";
import { getContractAddress } from "@/config/networks";
import { isTronChain, tronAddress } from "@/utils/tronHelper";

const useSignOrder = (orderData) => {
  const [orderSignedData, setOrderSignedData] = useState(null);
  const [orderIsError, setOrderIsError] = useState(null);
  const [orderIsSuccess, setOrderIsSuccess] = useState(null);

  const {
    signTypedData: signOrder,
    data: evmOrderSignedData,
    isError: evmOrderIsError,
    isSuccess: evmOrderIsSuccess,
  } = useSignTypedData();
  const [tronOrderSignedData, setTronOrderSignedData] = useState(null);
  const [tronOrderIsError, setTronOrderIsError] = useState(null);
  const [tronOrderIsSuccess, setTronOrderIsSuccess] = useState(null);

  useEffect(() => {
    if (orderData) {
      setOrderSignedData(
        isTronChain(orderData) ? tronOrderSignedData : evmOrderSignedData
      );
    }
  }, [orderData, evmOrderSignedData, tronOrderSignedData]);

  useEffect(() => {
    if (orderData) {
      setOrderIsSuccess(
        isTronChain(orderData) ? tronOrderIsSuccess : evmOrderIsSuccess
      );
    }
  }, [orderData, evmOrderIsSuccess, tronOrderIsSuccess]);

  useEffect(() => {
    if (orderData) {
      setOrderIsError(
        isTronChain(orderData) ? tronOrderIsError : evmOrderIsError
      );
    }
  }, [orderData, evmOrderIsError, tronOrderIsError]);

  const orderDomain = orderData
    ? {
        name: "SignOrder",
        version: "1",
        chainId: orderData.sourceChainId,
        verifyingContract: getContractAddress(
          orderData.sourceChainId,
          "intentFactory"
        ),
      }
    : null;
  const orderType = {
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

  const doEvmSignOrder = () => {
    try {
      signOrder({
        domain: orderDomain,
        types: orderType,
        message: orderData,
        primaryType: "Order",
      });
    } catch (e) {
      console.log("Error: ", e.message);
    }
  };

  const doTronSignOrder = () => {
    try {
      console.log("orderDomain: ", orderDomain);
      console.log("orderType: ", orderType);
      console.log("orderData: ", orderData);
      const tOrderData = {
        ...orderData,
        intentAddress: tronAddress(orderData.intentAddress),
        user: tronAddress(orderData.user),
      };
      console.log("tOrderData: ", tOrderData);

      const sign = async () => {
        const signature = await window.tron.tronWeb.trx._signTypedData(
          orderDomain,
          orderType,
          tOrderData
        );
        console.log("signature: ", signature);
        setTronOrderSignedData(signature);
        setTronOrderIsSuccess(true);
        setTronOrderIsError(false);
      };
      sign();
    } catch (e) {
      console.log("Error: ", e.message);
      setTronOrderIsSuccess(false);
      setTronOrderIsError(true);
    }
  };

  const doSignOrder = () => {
    if (orderData) {
      if (isTronChain(orderData)) {
        doTronSignOrder();
      } else {
        doEvmSignOrder();
      }
    } else {
      console.log("Order data is not available");
    }
  };

  return {
    doSignOrder,
    orderIsError,
    orderIsSuccess,
    orderSignedData,
  };
};

export default useSignOrder;
