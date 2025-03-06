import {
	AddressLike,
	BytesLike,
	ContractFactory,
	SignatureLike,
	Signer,
	Typed,
	TypedDataDomain,
	TypedDataField,
	keccak256,
	parseEther,
	parseUnits,
} from "ethers"
import { ethers } from "hardhat"
import { expect } from "chai"
import { IntentFactory, MockERC20, DualChainIntent, SP1Groth16Verifier, IGroth16Verifier } from "typechain-types"
import { GaslessCrossChainOrderStruct } from "typechain-types/contracts/IntentFactory"
import { advanceTimeAndBlock, getLatestBlockTimestamp, getSnapShot, revertEvm } from "./utils/Helpers"

describe("Logic Work Flow Testing (ERC-7686 and ZK Proof of Finality)", () => {
	const VERIFIER_ADDRESS = "0x397A5f7f3dBd538f23DE225B51f532c34448dA9B"

	let deployer: Signer, alice: Signer, bob: Signer // Declare signers (alice is user, bob is filler)
	let verifier: SP1Groth16Verifier
	let intentFactory: IntentFactory // Declare IntentFactory contract instance
	let sourceToken: MockERC20, destToken: MockERC20 // Declare Mock ERC20 token instances
	let sourceIntent: DualChainIntent, destIntent: DualChainIntent // Declare DualChainIntent instances

	let groth: IGroth16Verifier

	let currentTimestamp: number // Variable to hold the current timestamp
	let chainId: bigint // Variable to hold the chain ID

	let bridgeData: BytesLike // Variable to hold bridge data that user signs
	let bridgeDataAfterDeploy: BytesLike // Variable to hold bridge data after deployment (user signs + add some)
	let order: GaslessCrossChainOrderStruct // Variable to hold the order structure
	const salt = "SALT_0x1234567890ABCDEF" // Salt for generating unique addresses

	const BRIDGE_AMOUNT = parseEther("100") // Amount of tokens to bridge

	let computedAddress: string // Variable to hold the computed address for the ephemeral contract
	let signature: string // Variable to hold the signature of the order
	let orderMessage: string // Variable to hold the encoded order message

	let permitDomain: TypedDataDomain
	let permitTypes: Record<string, TypedDataField[]>
	let permitValues: Record<string, any>
	let permitSignature: SignatureLike | undefined

	let orderId: any

	let snapshotId: any
	let snapshotId1: any

	before(async () => {
		// Get signers for the test
		;[deployer, alice, bob] = await ethers.getSigners()

		// Deploy the IntentFactory contract
		// const VerifierFactory = await ethers.getContractFactory("SP1Groth16Verifier")
		// verifier = await VerifierFactory.connect(deployer).deploy()
		// console.log("VerifierFactory deployed to:", await verifier.getAddress()) // Log the deployed address

		// const Groth16VerifierFactory = await ethers.getContractFactory("Groth16Verifier")
		// groth = await Groth16VerifierFactory.connect(deployer).deploy()
		// console.log("Groth16Verifier deployed to:", await groth.getAddress()) // Log the deployed address

		groth = (await ethers.getContractAt("IGroth16Verifier", VERIFIER_ADDRESS)) as IGroth16Verifier

		// Deploy the IntentFactory contract
		const IntentFactoryFactory = await ethers.getContractFactory("IntentFactory")
		intentFactory = await IntentFactoryFactory.connect(deployer).deploy()
		await intentFactory.setVerifier(VERIFIER_ADDRESS)
		console.log("IntentFactory deployed to:", await intentFactory.getAddress()) // Log the deployed address

		// Deploy Mock ERC20 tokens
		const MockERC20Factory = await ethers.getContractFactory("MockERC20")
		sourceToken = await MockERC20Factory.connect(deployer).deploy("SourceToken", "SRT", parseEther("10000")) // Deploy source token
		destToken = await MockERC20Factory.connect(deployer).deploy("DestToken", "DST", parseEther("10000")) // Deploy destination token

		// Transfer tokens to Alice and Bob
		await sourceToken.transfer(alice.getAddress(), parseEther("1000")) // Transfer 1000 source tokens to Alice
		await destToken.transfer(bob.getAddress(), parseEther("1000")) // Transfer 1000 destination tokens to Bob
	})

	it("Alice signs GaslessCrossChainOrder", async () => {
		// Get the current timestamp
		currentTimestamp = Math.floor(Date.now() / 1000)
		// Get the current chain ID
		chainId = (await ethers.provider.getNetwork()).chainId

		// Encode bridge data for the order
		bridgeData = ethers.AbiCoder.defaultAbiCoder().encode(
			["address", "address", "uint256", "uint256", "address", "address"], // Specify the types
			[
				ethers.ZeroAddress, // Placeholder for filler address
				await sourceToken.getAddress(), // Source token address
				BRIDGE_AMOUNT, // Amount to bridge
				chainId, // Chain ID
				await destToken.getAddress(), // Destination token address
				await alice.getAddress(), // Alice's address
			]
		)

		// Encode bridge data after deployment
		bridgeDataAfterDeploy = ethers.AbiCoder.defaultAbiCoder().encode(
			["address", "address", "uint256", "uint256", "address", "address"], // Specify the types
			[
				await bob.getAddress(), // Bob's address
				await sourceToken.getAddress(), // Source token address
				BRIDGE_AMOUNT, // Amount to bridge
				chainId, // Chain ID
				await destToken.getAddress(), // Destination token address
				await alice.getAddress(), // Alice's address
			]
		)

		// Create the order structure
		order = {
			intentAddress: ethers.ZeroAddress, // Placeholder for intent address
			user: await alice.getAddress(), // Alice's address
			nonce: 10001, // Unique nonce for the order
			sourceChainId: chainId, // Chain ID
			openDeadline: currentTimestamp + 300, // Open deadline (current time + 5 minutes)
			fillDeadline: currentTimestamp + 600, // Fill deadline (current time + 10 minutes)
			orderDataType: ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_TRANSFER_ORDER")), // Hash of order data type
			orderData: bridgeData, // Encoded bridge data
		}

		// Encode the order message for signing
		orderMessage = ethers.AbiCoder.defaultAbiCoder().encode(
			["address", "address", "uint256", "uint256", "uint32", "uint32", "bytes32", "bytes"], // Specify the types
			[
				order.intentAddress, // Intent address
				order.user, // User address
				order.nonce, // Nonce
				order.sourceChainId, // Source chain ID
				order.openDeadline, // Open deadline
				order.fillDeadline, // Fill deadline
				order.orderDataType, // Order data type
				order.orderData, // Order data
			]
		)

		// Sign the order message with Alice's private key
		signature = await alice.signMessage(orderMessage)
	})

	it("Alice signs the permit to ephemeral contract address spend his token using ERC20Permit", async () => {
		// Get the computed address for the ephemeral contract
		computedAddress = await intentFactory.connect(alice).getIntentAddress(order, ethers.id(salt))
		console.log("Ephemeral Contract will be deployed to:", computedAddress) // Log the computed address

		const deadline = order.fillDeadline
		const nonces = await sourceToken.nonces(await alice.getAddress())
		permitDomain = {
			name: await sourceToken.name(),
			version: "1",
			chainId: chainId,
			verifyingContract: await sourceToken.getAddress(),
		}
		permitTypes = {
			Permit: [
				{
					name: "owner",
					type: "address",
				},
				{
					name: "spender",
					type: "address",
				},
				{
					name: "value",
					type: "uint256",
				},
				{
					name: "nonce",
					type: "uint256",
				},
				{
					name: "deadline",
					type: "uint256",
				},
			],
		}
		permitValues = {
			owner: await alice.getAddress(),
			spender: computedAddress,
			value: BRIDGE_AMOUNT,
			nonce: nonces,
			deadline: deadline,
		}

		permitSignature = await alice.signTypedData(permitDomain, permitTypes, permitValues)
	})

	it("Bob receives and verifies order, deploy intents on both source and destination chain", async () => {
		// Verify that the signer of the order message is Alice
		const signer = await ethers.verifyMessage(orderMessage, signature)
		expect(await alice.getAddress()).to.eq(signer) // Assert that the signer is Alice

		// Verify that the permit signature is valid for the computed address
		const sig = ethers.Signature.from(permitSignature)
		const recovered = ethers.verifyTypedData(permitDomain, permitTypes, permitValues, sig)

		expect(recovered).to.be.equal(await alice.getAddress())

		// Create the intent on behalf of Bob
		const txReceipt = await intentFactory.connect(bob).createIntent(order, ethers.id(salt))
		// Expect the IntentDeployed event to be emitted with the correct arguments
		await expect(txReceipt)
			.to.emit(intentFactory, "IntentDeployed")
			.withArgs(computedAddress, [
				ethers.ZeroAddress, // Intent address
				await alice.getAddress(), // User address
				10001, // Nonce
				chainId, // Chain ID
				currentTimestamp + 300, // Open deadline
				currentTimestamp + 600, // Fill deadline
				ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_TRANSFER_ORDER")), // Order data type
				bridgeData, // Bridge data
			])

		// Get the source intent contract instance
		sourceIntent = await ethers.getContractAt("DualChainIntent", computedAddress)
		// Get the destination intent contract instance
		destIntent = await ethers.getContractAt("DualChainIntent", computedAddress)

		// Check that the filler address in the bridge data is Bob's address
		expect((await sourceIntent.bridgeData()).filler).to.eq(await bob.getAddress())
		expect((await destIntent.bridgeData()).filler).to.eq(await bob.getAddress())

		// Set the intent address and order data for the order
		order.intentAddress = computedAddress
		order.orderData = bridgeDataAfterDeploy

		// Encode the order for submission
		const orderEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
			[
				"tuple(address intentAddress,address user,uint256 nonce,uint256 sourceChainId,uint32 openDeadline,uint32 fillDeadline,bytes32 orderDataType,bytes orderData)", // Specify the tuple structure
			],
			[order] // Pass the order
		)

		// Compute the order ID by hashing the encoded order
		orderId = keccak256(orderEncoded)

		// submitPermit
		await sourceIntent.connect(bob).submitPermit(orderId, sig.v, sig.r, sig.s)

		console.log("SourceToken balance at intent contract: ", await sourceToken.balanceOf(computedAddress))

		snapshotId = await getSnapShot()
	})

	it("Bob bridges tokens to destination chain", async () => {
		// Set the intent address and order data for the order
		order.intentAddress = computedAddress
		order.orderData = bridgeDataAfterDeploy

		// Encode the order for submission
		const orderEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
			[
				"tuple(address intentAddress,address user,uint256 nonce,uint256 sourceChainId,uint32 openDeadline,uint32 fillDeadline,bytes32 orderDataType,bytes orderData)", // Specify the tuple structure
			],
			[order] // Pass the order
		)

		// Compute the order ID by hashing the encoded order
		orderId = keccak256(orderEncoded)

		// Approve the destination intent to spend Bob's tokens
		await destToken.connect(bob).approve(destIntent, BRIDGE_AMOUNT)

		snapshotId1 = await getSnapShot()

		// @notice no fee token
		// Fill the order on the destination intent
		await destIntent.connect(bob).fill(orderId, "0x", "0x")

		// Check that Alice's balance of destination tokens is correct
		expect(await destToken.balanceOf(await alice.getAddress())).to.eq(BRIDGE_AMOUNT)

		// Check that the destination intent has been fulfilled
		expect(await destIntent.destinationFulfilled()).to.be.equal(true)

		await revertEvm(snapshotId1)

		// @notice usdt (0.01%)
		await intentFactory.setFeeInfo(await destToken.getAddress(), 1)
		// Fill the order on the destination intent
		await destIntent.connect(bob).fill(orderId, "0x", "0x")

		// Check that Alice's balance of destination tokens is correct
		expect(await destToken.balanceOf(await alice.getAddress())).to.eq(
			(BRIDGE_AMOUNT * BigInt(9999)) / BigInt(10000)
		)

		// Check that the destination intent has been fulfilled
		expect(await destIntent.destinationFulfilled()).to.be.equal(true)
	})

	it("Bob generates SP1 Groth16", async () => {
		// set SP1 Groth16 verify parameters
		const programVKey = "0x004eb6a15619fdfd870ceb7ee0307f2316fe698e52887b9560f0a84f2cebab75"
		const publicValues =
			"0x2000000000000000ecdc9dde35836e1f0334fe763dfef9c07931f98fa67cb6213be543f0ee7470031400000000000000a1a3a3ab81168ecfc0f7f39489754b877b6ffe852000000000000000000000000000000000000000000000000000000000000000000000000000000e20000000000000000000000000000000000000000000000000000000000000000000000000000001"
		const proofBytes =
			"0x11b6a09d21265a0ed431b3fa79fef4bdfa8588d22b22633808802398291a4872bb2acd4928efd11a46b9a65fac1c78b304e293e574bca5522dd7a1d49e8be736222668950b09c6b2acdd3f0a9419106e55a3a543648dfc2ba86d8f46edaf393b13e211710fe1e0b190307dc6e1220ae6dcdaba276d4d3f046e43519ba70447dd402a592a1e24b19a8b19866964ff166a357f801f6cbe5e1754b9ed0bdbf3e79fd1760a38101b77321dac27a57ff00cbcb1a35584c9c6102371686063430757a699995efc2556f9582d64086995bed255cad949429f6a81267b86d18615334aeda53d37220c294e7a2f33c423344aaacf0d9172fa519e215109c0a0fd3dc2279ece238062"

		// Placeholder for finalizing the origin intent
		// Calculate bob balance before finalize
		const beforeBobBalance = await sourceToken.balanceOf(await bob.getAddress())

		// Finalize origin, unscrow locked token
		await sourceIntent.finalizeOnOrigin(programVKey, publicValues, proofBytes)

		// Calculate bob balance after finalize
		const afterBobBalance = await sourceToken.balanceOf(await bob.getAddress())

		// Check that bob gets BRIDGE_AMOUNT of source token
		expect(afterBobBalance - beforeBobBalance).to.be.equal(BRIDGE_AMOUNT)

		// Check that intent origin complemeted
		expect(await sourceIntent.originCompleted()).to.be.equal(true)

		// Everything must be clarified here
		expect(await sourceToken.balanceOf(await sourceIntent.getAddress())).to.be.equal(0)
		expect(await destToken.balanceOf(await destIntent.getAddress())).to.be.equal(0)

		const timestamp = await getLatestBlockTimestamp()
		await advanceTimeAndBlock(Number(order.fillDeadline) - timestamp + 1200 + 10000)
		await expect(sourceIntent.connect(alice).withdraw(orderId)).to.be.revertedWith(
			"Order already completed by filler"
		)
	})

	it("Check withdraw function when filler only deploy and submit permit, but not fill and finalize", async () => {
		await revertEvm(snapshotId)
		// Calculate wrong order
		order.intentAddress = ethers.ZeroAddress
		const worderEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
			[
				"tuple(address intentAddress,address user,uint256 nonce,uint256 sourceChainId,uint32 openDeadline,uint32 fillDeadline,bytes32 orderDataType,bytes orderData)", // Specify the tuple structure
			],
			[order] // Pass the order
		)
		const worderId = keccak256(worderEncoded)

		// Set the intent address and order data for the order
		order.intentAddress = computedAddress
		order.orderData = bridgeDataAfterDeploy

		// Encode the order for submission
		const orderEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
			[
				"tuple(address intentAddress,address user,uint256 nonce,uint256 sourceChainId,uint32 openDeadline,uint32 fillDeadline,bytes32 orderDataType,bytes orderData)", // Specify the tuple structure
			],
			[order] // Pass the order
		)

		// Compute the order ID by hashing the encoded order
		const orderId = keccak256(orderEncoded)

		await expect(sourceIntent.connect(alice).withdraw(worderId)).to.be.revertedWith("Invalid order")
		await expect(sourceIntent.connect(bob).withdraw(orderId)).to.be.revertedWith("Only user can call this function")
		await expect(sourceIntent.connect(alice).withdraw(orderId)).to.be.revertedWith(
			"Can withdraw after 5 minutes from the fillDeadline"
		)

		const timestamp = await getLatestBlockTimestamp()
		await advanceTimeAndBlock(Number(order.fillDeadline) - timestamp + 10000)

		const beforeAliceBalance = await sourceToken.balanceOf(await alice.getAddress())

		await sourceIntent.connect(alice).withdraw(orderId)

		const afterAliceBalance = await sourceToken.balanceOf(await alice.getAddress())

		expect(await sourceToken.balanceOf(computedAddress)).to.be.equal(0)
		expect(afterAliceBalance - beforeAliceBalance).to.be.equal(BRIDGE_AMOUNT)
	})
})
