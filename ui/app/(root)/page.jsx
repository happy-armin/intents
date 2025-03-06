"use client";

import React, { useEffect, useState } from "react";
import { Box, Container } from "@mui/material";

import BridgeToken from "@/components/containers/BridgeToken";
import useSignOrder from "@/hooks/useSignOrder";
import useSignPermit from "@/hooks/useSignPermit";
import DeploymentWatcher from "@/components/containers/DeploymentWatcher";
import { useSubmitOrder } from "@/hooks/useSubmitOrder";
import { BridgeDataHelper } from "@/utils/typeHelper";

const SignerPage = () => {
  // Require variables for submitSignatures (order data, order signature, permit data, permit signature)
  const [orderData, setOrderData] = useState(null);
  const [permitData, setPermitData] = useState(null);
  const [observeData, setObserveData] = useState(null);
  const [userSignProcess, setUserSignProcess] = useState(0);

  // -------------------- start sign order & permit --------------------
  const { doSignOrder, orderIsError, orderIsSuccess, orderSignedData } =
    useSignOrder(orderData);

  const { doSignPermit, permitIsError, permitIsSuccess, permitSignedData } =
    useSignPermit(orderData, permitData);

  const handleSign = (order, permit) => {
    setOrderData(order);
    setPermitData(permit);

    // calculate deployment watcher parameters
    const sourceChainId = order.sourceChainId;
    const ephemeralAddress = order.intentAddress;
    const destChainId = BridgeDataHelper.getDecodedBridgeData(
      order.orderData
    ).destinationChainId;
    const tokenAmount = BridgeDataHelper.getDecodedBridgeData(
      order.orderData
    ).amount;

    setObserveData({
      sourceChainId,
      ephemeralAddress,
      destChainId,
      tokenAmount,
    });

    setUserSignProcess(1); // user sign process (request to sign order)
  };

  useEffect(() => {
    if (userSignProcess === 1) {
      doSignOrder();
      setUserSignProcess(2); // user sign process (request to sign permit)
    } else if (userSignProcess === 2) {
      if (orderIsSuccess) {
        doSignPermit();
        setUserSignProcess(3); // user sign process (request to observe)
      }
      if (orderIsError) {
        setUserSignProcess(0); // user sign process (request to reset)
      }
    } else if (userSignProcess === 3) {
      if (permitIsSuccess) {
        setUserSignProcess(4); // submit to server
      }
      if (permitIsError) {
        setUserSignProcess(0); // user sign process (request to reset)
      }
    }
  }, [
    userSignProcess,
    orderIsSuccess,
    orderIsError,
    permitIsSuccess,
    permitIsError,
  ]);

  useSubmitOrder(
    orderSignedData,
    permitSignedData,
    orderData,
    permitData,
    userSignProcess
  );
  // -------------------- end sign order & permit --------------------

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "transparent",
        textAlign: "center",
        px: 2,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <BridgeToken handleSign={handleSign} />
        {userSignProcess === 4 && <DeploymentWatcher {...observeData} />}
      </Container>
    </Box>
  );
};

export default SignerPage;
