"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button, Box, Typography, MenuItem } from "@mui/material";
import { quicksand } from "@/utils/fontHelper";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";

const TronConnectButton = () => {
  const {
    wallet,
    address,
    connected,
    select,
    connect,
    disconnect,
    signMessage,
    signTransaction,
  } = useWallet();

  const handleClick = async () => {
    if (!connected) {
      try {
        select("TronLink");
        connect();
      } catch (error) {}
    } else {
      disconnect();
    }
  };

  return (
    <Button
      sx={{
        height: "42px",
        border: "none",
        borderRadius: "10px",
        backgroundColor: "#3C63FF",
        marginTop: "0.75rem",
        paddingInline: "0.75rem",
        width: "100%",
        ":hover": {
          backgroundColor: "#5C63FF",
        },
      }}
      onClick={handleClick}
    >
      <Typography
        variant="s"
        textTransform="none"
        className={quicksand.className}
        fontSize="1rem"
        fontWeight="600"
        color="#F5F5F5"
        width="100%"
      >
        {connected ? address : "Connect"}
      </Typography>
    </Button>
  );
};

const ConnectWallet = () => {
  const [menuDropped, setMenuDropped] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelectClick = () => {
    setMenuDropped(!menuDropped);
  };

  // ---------------------------------------------------------------
  // start - use Ref handlers for hide dropdown when clicked outside
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setMenuDropped(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // end - use Ref handlers for hide dropdown when clicked outside
  // -------------------------------------------------------------
  return (
    <Box ref={dropdownRef}>
      <Button
        sx={{
          height: "42px",
          border: "none",
          borderRadius: "10px",
          backgroundColor: "#3C63FF",
          paddingInline: "0.75rem",
          width: "100%",
          ":hover": {
            backgroundColor: "#5C63FF",
          },
        }}
        onClick={handleSelectClick}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <Typography
            variant="s"
            textTransform="none"
            className={quicksand.className}
            fontSize="1rem"
            fontWeight="600"
            color="#F5F5F5"
            width="100%"
          >
            Connect Wallet
          </Typography>
        </Box>
      </Button>

      {menuDropped && (
        <Box
          position="absolute"
          sx={{
            top: "3.75rem",
            right: "1.4rem",
            backgroundColor: "#5C63FF20",
            border: "1px solid #5C63FF40",
            borderRadius: "10px",
            padding: "0.25rem",
            zIndex: "9999",
            padding: 1,
          }}
        >
          <ConnectButton></ConnectButton>
          <TronConnectButton></TronConnectButton>
        </Box>
      )}
    </Box>
  );
};

export default ConnectWallet;
