import { TronWeb } from "tronweb";
import { networkIds } from "@/config/networks";

export const isTronChain = (chain) => {
  if (chain === null || chain === undefined) return false;
  return (
    chain.id === networkIds.nile || chain.sourceChainId === networkIds.nile
  );
};

export const hexAddress = (address) => {
  if (address.startsWith("T")) {
    return "0x" + TronWeb.address.toHex(address).substring(2);
  } else if (address.startsWith("41")) {
    return "0x" + address.substring(2);
  }
  return address;
};

export const tronAddress = (address) => {
  if (address.startsWith("0x")) {
    return TronWeb.address.fromHex("41" + address.substring(2));
  }
  return address;
};

export const getWalletName = (_providerName) => {
  if (_providerName === "metamask") return "Metamask";
  else if (_providerName === "tron-link") return "TronLink";
};
