"use client";

import React, { useState, useEffect } from "react";
import { keccak256, toUtf8Bytes } from "ethers";
import { recoverTypedDataAddress } from "viem";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useSignTypedData,
  useReadContract,
  useSwitchChain,
} from "wagmi";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ethers } from "ethers";

import { SALT } from "@/config/constants";
import { abis } from "@/abi";
import { getContractAddress, getToken, tokenIds } from "@/config/networks";
import DeadlinePreference from "../../components/widgets/SignIntentForm/DeadlinePreference";
import SignPermit from "../../components/widgets/SignIntentForm/SignPermit";

const SignIntentForm = ({
  onSign,
  setOrderSignature,
  setParentTokenAddress,
  setParentAmount,
  setParentChainId,
  setParentDestChainId,
  setParentUserAddress,
  setParentFillDeadline,
  setEphemeralAddress,
  setParentIntentOrder,
  recoveredAddress,
  setRecoveredAddress,
  setPermitData,
  setPermitSignature,
  markStepComplete,
  setEstimateGas,
  setEstimateReward,
}) => {
  // ------------------ State Variables ------------------
  const [chainId, setChainId] = useState("11155111");
  const [destChainId, setDestChainId] = useState("");
  const [nonce, setNonce] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [deadlinePreference, setDeadlinePreference] = useState("Auto");
  const [openDeadline, setOpenDeadline] = useState("");
  const [fillDeadline, setFillDeadline] = useState("");
  const [formError, setFormError] = useState("");
  const [intentOrder, setIntentOrder] = useState(null);
  const [expanded, setExpanded] = useState(true);

  // ------------------ Wagmi Hooks ------------------
  const { isConnected, address, chain: currentChain } = useAccount();
  const { chains, switchChain, isLoading, error } = useSwitchChain();

  // ------------------ Router ------------------
  const router = useRouter();

  // ------------------ Token Map ------------------
  const tokenMap = {
    USDT: "0xBF882Fc99800A93494fe4844DC0002FcbaA79A7A",
    WBTC: "0xc580C2C0005798751cd0c221292667deeb991157",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  };

  // ------------------ Handlers ------------------
  const handleSourceChainChange = async (event) => {
    const selectedChainId = parseInt(event.target.value, 10);
    setChainId(selectedChainId);

    const chain = chains.find((c) => c.id === selectedChainId);
    if (chain) {
      try {
        // Switch wallet network to selected source chain
        await switchChain({ chainId: chain.id });
      } catch (err) {
        console.error("Error switching source chain:", err);
      }
    } else {
      console.error("Selected Source Chain ID is not supported.");
    }
  };

  const handleDestChainChange = (event) => {
    const selectedChainId = parseInt(event.target.value, 10);
    setDestChainId(selectedChainId);

    const chain = chains.find((c) => c.id === selectedChainId);
    if (!chain) {
      console.error("Selected Destination Chain ID is not supported.");
    }
  };

  const getDecimalPrecision = (address) => {
    if (address === tokenMap.USDT) return 2;
    if (address === tokenMap.WBTC) return 8;
    if (address === tokenMap.WETH) return 9;
    return 18;
    // Default ERC-20 token precision
  };

  const handleTokenChange = (e) => {
    setTokenAddress(e.target.value);
    setAmount("");
    // Reset the amount when the token changes
  };

  const decimalPrecision = getDecimalPrecision(tokenAddress);

  const handleAmountChange = (e) => {
    const input = e.target.value;
    const regex = new RegExp(`^\\d*(\\.\\d{0,${decimalPrecision}})?$`);
    if (regex.test(input)) {
      setAmount(input);
    }
  };

  const handleDeadlinePreferenceChange = (preference) => {
    setDeadlinePreference(preference);
    const currentTimeStamp = Math.floor(Date.now() / 1000);

    switch (preference) {
      case "Fast":
        setOpenDeadline(currentTimeStamp + 60); // 1 minute
        setFillDeadline(currentTimeStamp + 3600 * 1); // 1 hour
        break;
      case "Auto":
        setOpenDeadline(currentTimeStamp + 300); // 5 minutes
        setFillDeadline(currentTimeStamp + 3600 * 6); // 6 hours
        break;
      case "Economy":
        setOpenDeadline(currentTimeStamp + 600); // 10 minutes
        setFillDeadline(currentTimeStamp + 3600 * 24); // 24 hours
        break;
      default:
        break;
    }
  };

  // ------------------ Sign Typed Data (Order) ------------------
  const {
    signTypedData: signOrder,
    data: orderSignedData,
    isLoading: orderIsLoading,
    isError: orderIsError,
    isSuccess: orderIsSuccess,
    error: orderError,
    reset: orderReset,
    variables: orderVariables,
  } = useSignTypedData({
    onSuccess: (data) => {
      const formData = {
        chainId,
        nonce,
        tokenAddress,
        amount,
        openDeadline,
        fillDeadline,
        ephemeralAddress: computedAddress,
        address,
      };
      onSign?.(data, formData);
    },
  });

  // ------------------ Read Contract (Ephemeral Address) ------------------
  const { data: computedAddress } = useReadContract({
    address: getContractAddress(chainId, "intentFactory"),
    abi: abis.intentFactory,
    functionName: "getIntentAddress",
    args: [intentOrder, ethers.id(SALT)],
    query: {
      enabled: !!intentOrder,
    },
  });

  // ------------------ Accordion Change ------------------
  const handleAccordionChange = (event, isExpanded) => {
    if (orderSignedData) {
      setExpanded(isExpanded);
      // Allow collapsing only if orderSignedData is true
    }
  };

  // ------------------ useEffects ------------------
  useEffect(() => {
    if (!orderSignedData) {
      setExpanded(true);
    }
  }, [orderSignedData]);

  useEffect(() => {
    (async () => {
      setChainId(currentChain?.id);
      handleDeadlinePreferenceChange("Auto");

      if (orderVariables?.message && orderSignedData && !!computedAddress) {
        try {
          const recoveredAddr = await recoverTypedDataAddress({
            domain: orderVariables.domain,
            types: orderVariables.types,
            primaryType: orderVariables.primaryType,
            message: orderVariables.message,
            signature: orderSignedData,
          });

          setEphemeralAddress(computedAddress);
          setParentTokenAddress(tokenAddress);
          setParentAmount(amount);
          setParentChainId(chainId);
          setParentDestChainId(destChainId);
          setParentUserAddress(address);
          setParentFillDeadline(fillDeadline);
          setParentIntentOrder({
            ...intentOrder,
            intentAddress: computedAddress,
          });

          setRecoveredAddress(recoveredAddr);
        } catch (err) {
          console.error("Error recovering address:", err);
        }
      }
    })();
  }, [orderSignedData, orderVariables?.message, computedAddress]);

  // ------------------ Sign Order ------------------
  const handleSignOrder = async () => {
    setFormError("");

    if (!isConnected) {
      setFormError("Please connect your wallet first.");
      return;
    }

    if (!window.ethereum) {
      setFormError("No wallet provider found.");
      return;
    }

    const parsedChainId = parseInt(chainId, 10);
    const parsedDestChainId = parseInt(destChainId, 10);
    const parsedNonce = parseInt(nonce, 10);
    const parsedOpenDeadline = parseInt(openDeadline, 10);
    const parsedFillDeadline = parseInt(fillDeadline, 10);
    const parsedAmount = parseInt(amount);

    if (isNaN(parsedChainId) || parsedChainId <= 0) {
      setFormError("Please select a source chain.");
      return;
    }

    if (
      isNaN(parsedDestChainId) ||
      parsedChainId <= 0 ||
      parsedChainId === parsedDestChainId
    ) {
      setFormError("Please select a destination chain.");
      return;
    }

    if (!/^0x[0-9A-Fa-f]{40}$/.test(tokenAddress)) {
      setFormError("Please select a token.");
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a positive amount.");
      return;
    }

    if (isNaN(parsedNonce) || parsedNonce < 0) {
      setFormError(
        "Please enter the nonce (must be a valid non-negative integer)."
      );
      return;
    }

    if (isNaN(parsedOpenDeadline) || parsedOpenDeadline <= 0) {
      setFormError(
        "Open Deadline must be a valid positive integer (timestamp)."
      );
      return;
    }

    if (isNaN(parsedFillDeadline) || parsedFillDeadline <= 0) {
      setFormError(
        "Fill Deadline must be a valid positive integer (timestamp)."
      );
      return;
    }

    // user signes GasslessCrossChainOrder
    const usdt = getToken(chainId, tokenIds.usdt);
    const bridgeData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "uint256", "address", "address"],
      [
        "0x0000000000000000000000000000000000000000",
        usdt.address,
        ethers.parseEther(amount),
        parsedDestChainId,
        usdt.address,
        address,
      ]
    );

    const order = {
      intentAddress: "0x0000000000000000000000000000000000000000",
      user: address,
      nonce: parsedNonce,
      sourceChainId: parsedChainId,
      openDeadline: parsedOpenDeadline,
      // calculate manually
      fillDeadline: parsedFillDeadline,
      // calculate manually
      orderDataType: keccak256(toUtf8Bytes("BRIDGE_TRANSFER_ORDER")),
      orderData: bridgeData,
    };

    setIntentOrder(order);

    orderReset();
    try {
      signOrder({
        domain: {
          name: "SignOrder",
          version: "1",
          chainId: chainId,
          verifyingContract: getContractAddress(chainId, "intentFactory"),
        },
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
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
        },
        message: order,
        primaryType: "Order",
      });
    } catch (err) {
      console.error("Signing error:", err);
      setFormError(`Error signing the order: ${err.message || err}`);
    }
  };

  // ------------------ Another useEffect (Order Signed) ------------------
  const orderSignSuccess = orderIsSuccess && orderSignedData;
  useEffect(() => {
    if (orderSignSuccess) {
      setExpanded(false);
    }
  }, [orderSignSuccess]);

  // ------------------ Fill Defaults & Reset ------------------
  const handleFillDefaults = async () => {
    setChainId("11155111");
    setDestChainId("357");
    setTokenAddress("0xBF882Fc99800A93494fe4844DC0002FcbaA79A7A");
    setAmount("100");
    setNonce("1234");
    handleDeadlinePreferenceChange("Auto");
  };

  const handleResetInputs = async () => {
    await switchChain({ chainId: 11155111 });
    setDestChainId("");
    setNonce("");
    setTokenAddress("");
    setAmount("");
    handleDeadlinePreferenceChange("Auto");
    setFormError("");
  };

  // ------------------ Render ------------------
  return (
    <Container
      maxWidth="md"
      sx={{
        border: "1px solid #ccc",
        borderRadius: 2,
        p: 3,
        textAlign: "left",
      }}
    >
      {!isConnected ? (
        <>
          <Typography variant="h5" gutterBottom>
            Your wallet is not connected
          </Typography>
          <Alert severity="warning">
            Please connect your wallet to sign the intent.
          </Alert>
        </>
      ) : (
        <>
          {orderSignSuccess && (
            <SignPermit
              orderSignedData={orderSignedData}
              ephemeralAddress={computedAddress}
              recoveredAddress={recoveredAddress}
              setOrderSignature={setOrderSignature}
              order={{
                amount,
                chainId,
                destChainId,
                tokenAddress,
                userAddress: address,
                fillDeadline,
              }}
              setPermitData={setPermitData}
              setPermitSignature={setPermitSignature}
              intentOrder={intentOrder}
              setEstimateGas={setEstimateGas}
              setEstimateReward={setEstimateReward}
              markStepComplete={markStepComplete}
            />
          )}

          <Accordion
            expanded={expanded}
            onChange={handleAccordionChange}
            sx={{
              boxShadow: "none",
              border: "none",
              "&:before": {
                display: "none",
              },
              cursor: "default",
            }}
          >
            <AccordionSummary
              component={orderSignedData ? "button" : "div"}
              expandIcon={orderSignedData ? <ExpandMoreIcon /> : null}
              sx={{ cursor: "default" }}
            >
              <Box
                display="flex"
                justifyContent="space-around"
                alignItems="flex-end"
                sx={{ py: 1, width: "100%", cursor: "default" }}
              >
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    flex: 2,
                    textTransform: "uppercase",
                    fontWeight: "bold",
                  }}
                  gutterBottom
                >
                  {orderSignedData ? "Signed Intent" : "Sign Intent"}
                </Typography>

                {!orderSignedData && (
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    sx={{ gap: 1 }}
                    mt={2}
                    mb={2}
                  >
                    <Button
                      variant="outlined"
                      onClick={handleFillDefaults}
                      sx={{}}
                    >
                      Demo
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleResetInputs}
                    >
                      Reset
                    </Button>
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              {orderIsError && !formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <strong>Error signing message:</strong> {orderError?.message}
                </Alert>
              )}
              <Box>
                <TextField
                  select
                  label="Source Chain ID"
                  value={currentChain?.id}
                  onChange={handleSourceChainChange}
                  fullWidth
                  margin="normal"
                  disabled={isLoading || orderSignedData}
                  sx={{}}
                >
                  {chains.map((chain) => (
                    <MenuItem key={chain.id} value={chain.id}>
                      {chain.name} ({chain.id})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Destination Chain ID"
                  value={destChainId}
                  onChange={handleDestChainChange}
                  fullWidth
                  margin="normal"
                  disabled={isLoading || orderSignedData}
                  sx={{}}
                >
                  {chains.map(
                    (chain) =>
                      currentChain?.id !== chain.id && (
                        <MenuItem key={chain.id} value={chain.id}>
                          {chain.name} ({chain.id})
                        </MenuItem>
                      )
                  )}
                </TextField>

                <TextField
                  select
                  label="Token"
                  value={tokenAddress}
                  onChange={handleTokenChange}
                  fullWidth
                  margin="normal"
                  disabled={isLoading || orderSignedData}
                >
                  {Object.entries(tokenMap).map(([token, address]) => (
                    <MenuItem key={token} value={address}>
                      {token} ({address})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label={`Amount (${decimalPrecision} decimals max)`}
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder={`Enter amount (${decimalPrecision} decimals max)`}
                  fullWidth
                  margin="normal"
                  disabled={!tokenAddress || isLoading || orderSignedData}
                />

                <TextField
                  type="number"
                  label="Nonce"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  placeholder="e.g. 1234"
                  fullWidth
                  margin="normal"
                  disabled={isLoading || orderSignedData}
                />

                <DeadlinePreference
                  deadlinePreference={deadlinePreference}
                  orderSignedData={orderSignedData}
                  openDeadline={openDeadline}
                  setOpenDeadline={setOpenDeadline}
                  fillDeadline={fillDeadline}
                  setFillDeadline={setFillDeadline}
                  handleDeadlinePreferenceChange={
                    handleDeadlinePreferenceChange
                  }
                />

                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: "#D87068",
                    "&:hover": { backgroundColor: "#c76058" },
                  }}
                  onClick={handleSignOrder}
                  disabled={orderIsLoading || orderSignedData}
                >
                  {orderIsLoading
                    ? "Signing..."
                    : orderSignedData
                    ? "Already Signed"
                    : "Approve Order"}
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </Container>
  );
};

export default SignIntentForm;
