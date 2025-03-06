"use client";

import React, { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { zeroAddress } from "viem";

import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { Box, Container, Link, Typography } from "@mui/material";

import { abis } from "@/abi";
import {
  getContractAddress,
  ExplorerLink,
  getToken,
  tokenIds,
  networkIds,
} from "@/config/networks";
import { quicksand } from "@/utils/fontHelper";
import { tronAddress } from "@/utils/tronHelper";

const WatcherItem = ({ title, status, chainId, txHash }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingInline: "0.5rem",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
          width: "100%",
          gap: "0.5rem",
        }}
      >
        <Typography
          variant="h3"
          noWrap={false}
          sx={{
            fontWeight: "600",
            fontSize: "1rem",
            fontFamily: "quicksand",
          }}
        >
          {title}
        </Typography>

        {status && (
          <Link href={`${ExplorerLink(chainId)}tx\\${txHash}`} underline="none">
            <Typography
              variant="h2"
              sx={{
                fontWeight: "normal",
                fontSize: "0.85rem",
                fontFamily: "quicksand",
              }}
            >
              view on explorer
            </Typography>
          </Link>
        )}
      </Box>

      <Typography
        variant="h3"
        noWrap={false}
        sx={{
          fontWeight: "normal",
          fontSize: "1rem",
          fontFamily: "quicksand",
          backgroundColor: status ? "#2378ff" : "#f0f0f0",
          borderRadius: "0.5rem",
          width: "100px",
          paddingBlock: "0.5rem",
          cursor: "pointer",
          color: status ? "white" : "black",
        }}
      >
        {status ? "Done" : "Pending"}
      </Typography>
    </Box>
  );
};

const DepolymentWatcher = ({
  sourceChainId,
  ephemeralAddress,
  destChainId,
  tokenAmount,
}) => {
  // ------------------ Wagmi ------------------
  const { isConnected, address } = useAccount();

  // ------------------ Local States ------------------
  const [sourceDeployed, setSourceDeployed] = useState(false);
  const [sourceDeployTx, setSourceDeployTx] = useState("");
  const [userTransferDone, setUserTransferDone] = useState(false);
  const [userTransferTx, setUserTransferTx] = useState("");

  const [destDeployed, setDestDeployed] = useState(false);
  const [destDeployTx, setDestDeployTx] = useState("");
  const [fillerTransferDone, setFillerTransferDone] = useState(false);
  const [fillerTransferTx, setFillerTransferTx] = useState("");

  const [tranferFrom, setTransferFrom] = useState("");
  const [tranferTo, setTransferTo] = useState("");

  // ------------------ Convert Chain IDs to Numbers ------------------
  sourceChainId = parseInt(sourceChainId, 10);
  destChainId = parseInt(destChainId, 10);

  // ------------------ Read Contract: bridgeData ------------------
  const { data: bridgeData, refetch: refetchBridgeData } = useReadContract({
    address: ephemeralAddress,
    abi: abis.dualChainIntent,
    functionName: "bridgeData",
  });

  useEffect(() => {
    if (destDeployTx) {
      refetchBridgeData();
    }
  }, [destDeployTx]);

  // 2) Destination Intent Deploy Watcher
  try {
    useWatchContractEvent({
      address: getContractAddress(destChainId, "intentFactory"),
      chainId: destChainId,
      abi: abis.intentFactory,
      eventName: "IntentDeployed",
      onLogs(logs) {
        console.log("DestChainIntent: ", logs);
        if (logs.length) {
          setDestDeployed(true);
          setDestDeployTx(logs[0].transactionHash);
        }
      },
    });
  } catch (e) {
    console.log("Error setting Destination Watcher:", e);
  }

  // 4) Filler Transfer Watcher
  try {
    useWatchContractEvent({
      address: getToken(destChainId, tokenIds.usdt).address,
      chainId: destChainId,
      abi: abis.erc20,
      args: {
        to: address?.toLowerCase() || "",
      },
      eventName: "Transfer",
      onLogs(logs) {
        if (logs.length) {
          console.log("Filler Token Transfer: ", logs);
          const fillerAddress = bridgeData
            ? bridgeData[0].toLowerCase()
            : zeroAddress;
          const beneficiary = bridgeData
            ? bridgeData[5].toLowerCase()
            : zeroAddress;

          logs.forEach((log) => {
            const from = log.args.from.toLowerCase();
            const to = log.args.to.toLowerCase();

            console.log(from);
            console.log(to);
            console.log(fillerAddress);
            console.log(beneficiary);
            console.log(sourceChainId);
            console.log(networkIds.nile);

            if (sourceChainId !== networkIds.nile) {
              if (from === fillerAddress && to === beneficiary) {
                // Fix: set filler transfer done
                setFillerTransferDone(true);
                setFillerTransferTx(logs[0].transactionHash);
              }
            } else {
              setTranferFrom(from);
              setTransferTo(to);
            }
          });
        }
      },
    });
  } catch (e) {
    console.log("Error setting Filler Transfer Watcher:", e);
  }

  // ------------------ Contract Events: Watchers ------------------
  if (sourceChainId != networkIds.nile) {
    // 1) Source Intent Deploy Watcher
    try {
      useWatchContractEvent({
        address: getContractAddress(sourceChainId, "intentFactory"),
        chainId: sourceChainId,
        abi: abis.intentFactory,
        eventName: "IntentDeployed",
        onLogs(logs) {
          console.log("SourceChainIntent: ", logs);
          if (logs.length) {
            setSourceDeployed(true);
            setSourceDeployTx(logs[0].transactionHash);
          }
        },
      });
    } catch (e) {
      console.log("Error setting Source Watcher:", e);
    }

    // 3) User Transfer Watcher
    try {
      useWatchContractEvent({
        address: getToken(sourceChainId, tokenIds.usdt).address,
        chainId: sourceChainId,
        abi: abis.erc20,
        args: {
          from: address?.toLowerCase() || "",
          to: ephemeralAddress?.toLowerCase() || "",
        },
        eventName: "Transfer",
        onLogs(logs) {
          if (logs.length) {
            console.log("User Token Transfer: ", logs);
            logs.forEach((log) => {
              const from = log.args.from.toLowerCase();
              const to = log.args.to.toLowerCase();
              const value = log.args.value;

              if (
                from === address?.toLowerCase() &&
                to === ephemeralAddress?.toLowerCase() &&
                value === tokenAmount
              ) {
                setUserTransferDone(true);
                setUserTransferTx(logs[0].transactionHash);
              }
            });
          }
        },
      });
    } catch (e) {
      console.log("Error setting User Transfer Watcher:", e);
    }
  }

  useEffect(() => {
    if (sourceChainId === networkIds.nile) {
      // In the case of tron bridging
      let factoryInterval = setInterval(async () => {
        try {
          const intentContract = window.tron.tronWeb.contract(
            abis.dualChainIntent,
            tronAddress(ephemeralAddress)
          );

          if (intentContract.deployed === true) {
            // state
            if (!sourceDeployed) setSourceDeployed(true);
            //setSourceDeployTx(events[i].transaction);

            const originCompleted = await intentContract
              .originCompleted()
              .call();
            if (originCompleted === true) {
              setUserTransferDone(true);
              setFillerTransferDone(true);
              clearInterval(factoryInterval);
              factoryInterval = null;
            }
          }
        } catch (err) {}
      }, 1000 * 5);

      return () => {
        if (factoryInterval) clearInterval(factoryInterval);
      };
    }
  }, []);

  return (
    <Container
      maxWidth="md"
      sx={{
        border: "none",
        borderRadius: 4,
        background: "rgb(255 , 255 , 255)",
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          border: "none",
          gap: 3,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="start"
            gap={1}
          >
            <Typography
              variant="h4"
              className={quicksand.className}
              sx={{
                fontSize: "1.25rem",
                fontWeight: "800",
              }}
            >
              Observe deployment
            </Typography>
            <Typography
              variant="h4"
              className={quicksand.className}
              sx={{
                fontSize: "1rem",
              }}
            >
              Observing intent deployment and token transfers.
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <WatcherItem
            title={"Source Chain Deployed"}
            status={sourceDeployed}
            chainId={sourceChainId}
            txHash={sourceDeployTx}
          />
          <WatcherItem
            title={"Destination Chain Deployed"}
            status={destDeployed}
            chainId={destChainId}
            txHash={destDeployTx}
          />
          <WatcherItem
            title={"Source Chain User Transfer"}
            status={userTransferDone}
            chainId={sourceChainId}
            txHash={userTransferTx}
          />
          <WatcherItem
            title={"Destination Filler Transfer"}
            status={fillerTransferDone}
            chainId={destChainId}
            txHash={fillerTransferTx}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default DepolymentWatcher;
