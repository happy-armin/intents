import hre, { ethers, network } from "hardhat"

export const unlockAccount = async (address: string) => {
	await hre.network.provider.send("hardhat_impersonateAccount", [address])
	return address
}

export const increaseTime = async (sec: number) => {
	await hre.network.provider.send("evm_increaseTime", [sec])
	await hre.network.provider.send("evm_mine")
}

export const mineBlocks = async (blockCount: number) => {
	for (let i = 0; i < blockCount; ++i) {
		await hre.network.provider.send("evm_mine")
	}
}

export const getBlockNumber = async () => {
	const blockNumber = await hre.network.provider.send("eth_blockNumber")
	return parseInt(blockNumber.slice(2), 16)
}

export const getTimeStamp = async () => {
	const blockNumber = await hre.network.provider.send("eth_blockNumber")
	const blockTimestamp = (await hre.network.provider.send("eth_getBlockByNumber", [blockNumber, false])).timestamp
	return parseInt(blockTimestamp.slice(2), 16)
}

export const getSnapShot = async () => {
	return await hre.network.provider.send("evm_snapshot")
}

export const revertEvm = async (snapshotID: any) => {
	await hre.network.provider.send("evm_revert", [snapshotID])
}

export const getLatestBlockTimestamp = async (): Promise<number> => {
	const latestBlock = await ethers.provider.getBlock("latest")
	return latestBlock?.timestamp || 0
}

export const getLatestBlockNumber = async (): Promise<number> => {
	const latestBlock = await ethers.provider.getBlock("latest")
	return latestBlock?.number || 0
}

export const advanceTime = async (time: number): Promise<void> =>
	new Promise((resolve, reject) => {
		network.provider.send("evm_increaseTime", [time]).then(resolve).catch(reject)
	})

export const advanceBlock = (): Promise<void> =>
	new Promise((resolve, reject) => {
		network.provider.send("evm_mine").then(resolve).catch(reject)
	})

export const advanceTimeAndBlock = async (time: number): Promise<void> => {
	await advanceTime(time)
	await advanceBlock()
}
