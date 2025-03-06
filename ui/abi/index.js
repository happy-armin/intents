import {
  IntentFactory_ABI,
  IntentFactory_ABI_TRON,
} from "./json/IntentFactory.js";
import { MockERC20_ABI } from "./json/MockERC20.js";
import { DualChainIntent_ABI } from "./json/DualChainIntent.js";

export const abis = {
  intentFactory: IntentFactory_ABI,
  intentFactory_Tron: IntentFactory_ABI_TRON,
  dualChainIntent: DualChainIntent_ABI,
  erc20: MockERC20_ABI,
};
