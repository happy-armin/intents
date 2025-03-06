# Intent-Based Cross-Chain Bridge UI

1. **Sign an ERC-7683 Intent and EIP-2612 Permit** (`GaslessCrossChainOrder`).
2. **Transfer tokens** to a deterministic ephemeral address (via `CREATE2`).
3. **Observe** the filler (sponsoring gas) deploy the ephemeral contract on both the source and the destination chains.
4. **View** the bridged tokens on the destination chain.

## Next Steps (WIP)

1. [UI]  

- BTC+USD Oracle Pricing
- TBD

Map this preference into reasonable openDeadline & fillDeadline as you see fit.

2. [Script] Deploy for USDC+USDT+cbBTC+WBTC on 4 Ethereum L1+L2 (Ethereum, Arbitrum, Base, Ink) by writing a deployment script that you test on Testnet.
