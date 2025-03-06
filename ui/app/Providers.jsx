// app/Providers.js
"use client"; // Required to use client-side hooks

import "@rainbow-me/rainbowkit/styles.css";
import React, { useCallback, useMemo } from "react";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { inkSepolia, sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import { TronLinkAdapter } from "@tronweb3/tronwallet-adapters";
import { WalletProvider } from "@tronweb3/tronwallet-adapter-react-hooks";
import { WalletModalProvider } from "@tronweb3/tronwallet-adapter-react-ui";

const opstackrollup = {
  id: 357,
  name: "OP Stack Rollup",
  nativeCurrency: { name: "OP Stack Rollup", symbol: "OP", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        "https://rpc-jam-ccw030wxbz.t.conduit.xyz/Pwe4skpfPaM8HSTPwHDhXzoJoKqdpjfRQ",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://explorer-jam-ccw030wxbz.t.conduit.xyz",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 11_907_934,
    },
  },
};

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "3cca155cce0954b0e72ea4f0f5e86aa0",
  chains: [sepolia, inkSepolia, opstackrollup],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

const Providers = ({ children }) => {
  const adapters = useMemo(function () {
    const tronLinkAdapter = new TronLinkAdapter();
    return [tronLinkAdapter];
  }, []);

  return (
    <>
      <WalletProvider
        autoConnect={true}
        disableAutoConnectOnLoad={true}
        adapters={adapters}
      >
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </WalletProvider>
    </>
  );
};

export default Providers;
