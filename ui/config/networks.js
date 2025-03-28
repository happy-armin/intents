import { zeroAddress } from "viem";
import { TronWeb } from "tronweb";

export const networkIds = {
  opstack: 357,
  sepolia: 11155111,
  ink: 763373,
  nile: 3448148188,
};

const knownNetworks = {
  [networkIds.sepolia]: {
    name: "Sepolia",
    chainId: 11155111,
    rpc: "",
    wss: "",
    explorer: "https://sepolia.etherscan.io/",
    icon: "https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png",
  },
  [networkIds.ink]: {
    name: "Ink Sepolia",
    chainId: 763373,
    rpc: "https://rpc-gel-sepolia.inkonchain.com",
    wss: "wss://rpc-gel-sepolia.inkonchain.com",
    explorer: "https://explorer-sepolia.inkonchain.com/",
    docs: "https://blog.kraken.com/product/ink-testnet",
    icon: "http://localhost:3000/ink_sepolia.svg",
  },
  [networkIds.opstack]: {
    name: "OP Stack Rollup",
    chainId: 357,
    rpc: "https://rpc-jam-ccw030wxbz.t.conduit.xyz/Pwe4skpfPaM8HSTPwHDhXzoJoKqdpjfRQ",
    wss: "wss://rpc-jam-ccw030wxbz.t.conduit.xyz/Pwe4skpfPaM8HSTPwHDhXzoJoKqdpjfRQ",
    explorer: "https://explorer-jam-ccw030wxbz.t.conduit.xyz/",
    icon: "http://localhost:3000/op_stack.jpeg",
  },
  [networkIds.nile]: {
    name: "Nile",
    chainId: 3448148188,
    rpc: "https://nile.trongrid.io/jsonrpc/",
    wss: "wss://nile.trongrid.io/jsonrpc/",
    explorer: "https://nile.tronscan.org/",
    icon: "https://api.rango.exchange/blockchains/tron.svg",
  },
};

const knownContracts = {
  intentFactory: {
    [networkIds.sepolia]: "0xED98C7acC5d974D2bDcA426bf0B9dE8ceE2E3972",
    [networkIds.ink]: "0xF6e88089371f875620Ad4D287E375E40DFDF7b89",
    [networkIds.opstack]: "0xED98C7acC5d974D2bDcA426bf0B9dE8ceE2E3972",
    [networkIds.nile]: "TDkT1GLv9hcKSDDr4o3UV1fCSidDB2DXQb",
  },
};

export const ExplorerLink = (chainId) => {
  return knownNetworks[chainId].explorer;
};

export const ChainIconLink = (chainId) => {
  return knownNetworks[chainId].icon;
};

export const getContractAddress = (chainId, name) => {
  try {
    return knownContracts[name][chainId];
  } catch (error) {
    return zeroAddress;
  }
};

export const tokenIds = {
  usdt: "usdt",
  wbtc: "wbtc",
};

const knownTokens = {
  usdt: {
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    icon: "https://static.cx.metamask.io/api/v1/tokenIcons/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
    addresses: {
      [networkIds.sepolia]: "0xBF882Fc99800A93494fe4844DC0002FcbaA79A7A",
      [networkIds.ink]: "0xBF882Fc99800A93494fe4844DC0002FcbaA79A7A",
      [networkIds.opstack]: "0xBF882Fc99800A93494fe4844DC0002FcbaA79A7A",
      [networkIds.nile]: "TCDPaTa98iJzhKbGhiGKNVYe8PcCkcDwqV",
    },
  },
  wbtc: {
    name: "wrapped BTC",
    symbol: "WBTC",
    decimals: 18,
    icon: "https://static.cx.metamask.io/api/v1/tokenIcons/1/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
    addresses: {
      [networkIds.sepolia]: "0xc580C2C0005798751cd0c221292667deeb991157",
      [networkIds.ink]: "0xc580C2C0005798751cd0c221292667deeb991157",
      [networkIds.opstack]: "0xc580C2C0005798751cd0c221292667deeb991157",
      [networkIds.nile]: "TFQEom3VBtHznrWeZqwrzRkKajUXpocrmp",
    },
  },
};

export const getToken = (chainId, symbol) => {
  try {
    return {
      ...knownTokens[symbol],
      addresses: undefined,
      address: knownTokens[symbol].addresses[chainId],
    };
  } catch (error) {
    return {
      name: "",
      symbol: "",
      decimals: 18,
      icon: "",
      address: zeroAddress,
    };
  }
};

export const getTokens = () => {
  return [knownTokens.usdt, knownTokens.wbtc];
};

export const nileTronWeb = new TronWeb({
  fullHost: "https://nile.trongrid.io",
});
