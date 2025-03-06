import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"

import "dotenv/config"

const OPSTACKROLLUP_RPC_URL = "https://rpc-jam-ccw030wxbz.t.conduit.xyz/Pwe4skpfPaM8HSTPwHDhXzoJoKqdpjfRQ"
const INK_SEPOLIA_RPC_URL = "https://rpc-gel-sepolia.inkonchain.com"
const SEPOLIA_RPC_URL = `https://sepolia.infura.io/v3/${process.env.SEPOLIA_INFURA_KEY}`
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? ""

const config: HardhatUserConfig = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			forking: {
				url: SEPOLIA_RPC_URL,
				blockNumber: 7552830,
			},
		},
		opstackrollup: {
			url: OPSTACKROLLUP_RPC_URL,
			accounts: [PRIVATE_KEY],
		},
		inkSepolia: {
			url: INK_SEPOLIA_RPC_URL,
			accounts: [PRIVATE_KEY],
		},
		sepolia: {
			url: SEPOLIA_RPC_URL,
			accounts: [PRIVATE_KEY],
		},
	},
	etherscan: {
		apiKey: {
			sepolia: "5BSHVNUZ4N21U46JEBW1PAR6T3YVDTYRHN",
			opstackrollup: "T8LBtc3EottbQfBfVq8vhof8uMSZwnQX",
			inkSepolia: "fe2d7d2d-ecc3-4143-afa5-537ef401fc14",
		},
		customChains: [
			{
				network: "opstackrollup",
				chainId: 357,
				urls: {
					apiURL: "https://explorer-jam-ccw030wxbz.t.conduit.xyz/api",
					browserURL: "https://explorer-jam-ccw030wxbz.t.conduit.xyz:443",
				},
			},
			{
				network: "inkSepolia",
				chainId: 763373,
				urls: {
					apiURL: "https://explorer-sepolia.inkonchain.com/api",
					browserURL: "https://explorer-sepolia.inkonchain.com",
				},
			},
		],
	},
	solidity: {
		compilers: [
			{
				version: "0.8.27",
			},
		],
	},
	mocha: {
		timeout: 200000, // 200 seconds
	},
}

export default config
