// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing some necessary contracts from somewhere other
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IGroth16Verifier } from "./interfaces/IGroth16Verifier.sol";
import { IIntentFactory } from "./interfaces/IIntentFactory.sol";
import { IDestinationSettler } from "./interfaces/IDestinationSettler.sol";
import { MockERC20 } from "./MockERC20.sol";

// Struct representing a GaslessCrossChainOrder (user signs the off-chain order with some values)
struct GaslessCrossChainOrder {
	address intentAddress; // Address of the intent contract (DualChainIntent contract)
	address user; // User who created the order
	uint256 nonce; // Unique identifier for the order
	uint256 sourceChainId; // ID of the source chain
	uint32 openDeadline; // Expiration time for opening the order
	uint32 fillDeadline; // Expiration time for filling the order
	bytes32 orderDataType; // Type of order data
	bytes orderData; // Encoded order data (BridgeTransferData)
}

// Struct for bridge transfer data (GaslessCrossChainOrder consists this struct at the end of the data structure - [bytes orderData])
struct BridgeTransferData {
	address filler; // Address of the filler (filler - who handles the user's order)
	address sourceToken; // Token to be transferred from the source chain
	uint256 sendAmount; // Amount of tokens to transfer from source chain
	uint256 destinationChainId; // ID of the dest chain
	address destinationToken; // Token to be received on the dest chain
	uint256 receiveAmount; // Amount of tokens to receive from the dest chain
	address beneficiary; // Address of the beneficiary receiving the tokens from the dest chain
}

// The Ephemeral Contract that handles the order with user and filler, and bridge token via two separeted chains
contract DualChainIntent is IDestinationSettler {
	using SafeERC20 for IERC20;

	// State variables
	GaslessCrossChainOrder public order; // The current order
	BridgeTransferData public bridgeData; // Data related to the bridge transfer

	// Flags to track the state of fulfillment
	bool public destinationFulfilled; // Indicates if the destination has been fulfilled
	bool public originCompleted; // Indicates if the origin process is completed

	// Address of the intent factory
	address public intentFactory;

	// Event emitted when an order is opened and fullfilled, withdrawn
	event Open(bytes32 indexed orderId, address filler);
	event Completed(bytes32 indexed orderId);
	event Withdraw(bytes32 indexed orderId);

	/**
	 * @dev Constructor to initialize the DualChainIntent contract with a user order
	 *
	 * @param _order The GaslessCrossChainOrder containing the details of the order.
	 *
	 * Requirements:
	 * - The orderDataType must be "BRIDGE_TRANSFER_ORDER".
	 * - The current timestamp must be less than or equal to the openDeadline.
	 */
	constructor(GaslessCrossChainOrder memory _order) {
		// Set intent factory address as a msg.sender
		intentFactory = msg.sender;

		// Store the provided order in the contract state
		order = _order;

		// Set the intent address to the address of this contract - at this time order.intentAdress is zero because address is computed after the user signs order
		order.intentAddress = address(this);

		// Ensure the order data type is valid
		require(
			_order.orderDataType == keccak256("BRIDGE_TRANSFER_ORDER"),
			"Invalid orderDataType"
		);

		// Check that the order has not expired based on the openDeadline
		require(
			(block.timestamp <= _order.openDeadline),
			"Order open deadline expeired"
		);

		// Decode the order data into individual components
		(
			,
			address srcToken, // Source token for the transfer
			uint256 samt, // Amount of tokens to transfer
			uint256 destChain, // Destination chain ID
			address destToken, // Token to be received on the destination chain
			uint256 ramt, // Amount of tokens to receive
			address benef // Beneficiary receiving the tokens
		) = abi.decode(
				_order.orderData,
				(address, address, uint256, uint256, address, uint256, address)
			);

		// Initialize the bridge transfer data structure with decoded values
		bridgeData = BridgeTransferData({
			filler: address(0), // Initially set filler to zero address
			sourceToken: srcToken, // Set the source token
			sendAmount: samt, // Set the transfer amount
			destinationChainId: destChain, // Set the destination chain ID
			destinationToken: destToken, // Set the destination token
			receiveAmount: ramt, // Set the receive amount
			beneficiary: benef // Set the beneficiary address
		});
	}

	/**
	 * @dev Initializes the filler for the bridge transfer.
	 *
	 * @param _filler The address of the filler.
	 *
	 * @notice This function must be called at once after the constructor
	 *
	 * Requirements:
	 * - Bridgedata.filler must be zero, not initialized
	 *
	 * Emits an Open event upon successful initialization.
	 */
	function initializeFiller(address _filler) external {
		// Verify that the filler is not initialized
		require(bridgeData.filler == address(0), "Filler already initialized");

		// Set the filler address in the bridge transfer data
		bridgeData.filler = _filler;

		// Regenerate bridge data encode for the correct value of order.orderData
		order.orderData = abi.encode(bridgeData);

		// Emit an Open event to signal that the order has been initialized
		emit Open(generateOrderId(order), _filler);
	}

	// /**
	//  * @dev Sets the verifier address for testing purposes.
	//  *
	//  * @param _verifier The address of the new verifier.
	//  */
	// function setVerifier(address _verifier) external {
	// 	SP1VERIFIER_ADDRESS = _verifier;
	// }

	/**
	 * @dev Permit the ephemeral contract to spend token behalf of the user and send tokens.
	 *
	 * @param orderId The ID of the order being fulfilled.
	 * @param v The v parameter of user signature
	 * @param r The r parameter of user signature
	 * @param s The s parameter of user signature
	 *
	 * Requirements:
	 * - The provided orderId must match the hashed order.
	 * - The transaction must be on the source chain.
	 * - The caller must be the designated filler.
	 * - The current timestamp must be less than or equal to the fillDeadline.
	 */
	function submitPermit(
		bytes32 orderId,
		uint8 v,
		bytes32 r,
		bytes32 s
	) external {
		// Verify that the provided orderId matches the current order's ID
		require(orderId == generateOrderId(order), "Invalid orderId");

		// Ensure the transaction is occurring on the correct source chain
		require(block.chainid == order.sourceChainId, "Not source chain");

		// Confirm that the caller is the designated filler for this transfer
		require(msg.sender == bridgeData.filler, "Only filler can submit permit");

		// Verify that the order has not expired
		require(
			block.timestamp <= order.fillDeadline,
			"Order expired (fillDeadline)"
		);

		// Submit permit that ephemeral contract to spend tokens behalf of the user
		MockERC20(bridgeData.sourceToken).permit(
			order.user,
			order.intentAddress,
			bridgeData.sendAmount,
			order.fillDeadline,
			v,
			r,
			s
		);

		// Transfer token from user to ephemeral contract
		IERC20(bridgeData.sourceToken).safeTransferFrom(
			order.user,
			order.intentAddress,
			bridgeData.sendAmount
		);
	}

	/**
	 * @dev Fulfills the bridge transfer on the destination chain.
	 *
	 * @param orderId The ID of the order being fulfilled.
	 * @param originData Data from the origin chain - (not used for now).
	 * @param fillerData Data for the filler - (not used for now).
	 *
	 * Requirements:
	 * - The provided orderId must match the hashed order.
	 * - The transaction must be on the destination chain.
	 * - The transfer must not have been fulfilled already.
	 * - The caller must be the designated filler.
	 * - The current timestamp must be less than or equal to the fillDeadline.
	 */
	function fill(
		bytes32 orderId,
		bytes calldata originData,
		bytes calldata fillerData
	) external {
		// Verify that the provided orderId matches the current order's ID
		require(orderId == generateOrderId(order), "Invalid orderId");

		// Ensure the transaction is occurring on the correct destination chain
		require(
			block.chainid == bridgeData.destinationChainId,
			"Not destination chain"
		);

		// Check that the transfer has not already been fulfilled
		require(!destinationFulfilled, "Already fulfilled");

		// Confirm that the caller is the designated filler for this transfer
		require(
			msg.sender == bridgeData.filler,
			"Only filler can finalize destination"
		);

		// Verify that the order has not expired
		require(
			block.timestamp <= order.fillDeadline,
			"Order expired (fillDeadline)"
		);

		// Mark the destination as fulfilled
		destinationFulfilled = true;

		// Transfer tokens from the filler to the beneficiary
		IERC20(bridgeData.destinationToken).safeTransferFrom(
			bridgeData.filler, // From: filler address
			bridgeData.beneficiary, // To: beneficiary address
			bridgeData.receiveAmount // Amount to transfer
		);
	}

	/**
	 * @dev Finalizes the order on the origin chain after proof verification.
	 *
	 * @param programVKey The verification key for the proof.
	 * @param publicValues The public values used in the proof.
	 * @param proofBytes The proof data.
	 *
	 * Requirements:
	 * - The chain ID must match the source chain ID.
	 * - The order must not have been completed already.
	 * - The current timestamp must be less than or equal to the fillDeadline.
	 */
	function finalizeOnOrigin(
		bytes32 programVKey,
		bytes calldata publicValues,
		bytes calldata proofBytes
	) external {
		// Ensure the transaction is occurring on the correct origin chain
		require(block.chainid == order.sourceChainId, "Not origin chain");

		// Check that the origin escrow has not already been released
		require(!originCompleted, "Origin escrow already released");

		// Verify that the order has not expired
		require(
			block.timestamp <= order.fillDeadline,
			"Order expired (fillDeadline)"
		);

		// Verify the SP1 Groth16 proof using the specified verifier contract
		IGroth16Verifier(IIntentFactory(intentFactory).verifier()).verifyProof(
			programVKey, // Verification key
			publicValues, // Public values for the proof
			proofBytes // Serialized proof data
		);

		// Check the balance of escrowed tokens in this contract
		uint256 bal = IERC20(bridgeData.sourceToken).balanceOf(address(this));
		require(bal >= bridgeData.sendAmount, "Not enough escrow in contract");

		// Transfer the escrowed tokens from this contract to the filler
		IERC20(bridgeData.sourceToken).safeTransfer(
			bridgeData.filler, // Recipient: filler address
			bridgeData.sendAmount // Amount to transfer
		);

		// Mark the origin transfer as completed
		originCompleted = true;

		// Generate and emit the order ID for the completed transfer
		emit Completed(generateOrderId(order));
	}

	/**
	 * @dev Finalizes the order with withdrawn by user on the origin chain due to no filler.
	 *
	 * @param orderId The ID of the order being withdrawn from the origin chain.
	 *
	 * Requirements:
	 * - The chain ID must match the source chain ID.
	 * - The order ID must match the generated orderId.
	 * - The msg.sender must match the order.user.
	 * - The order must not be fulfilled.
	 * - The current timestamp must be greater than or equal to the fillDeadline and 5 minutes.
	 */
	function withdraw(bytes32 orderId) external {
		// Ensure the transaction is occurring on the correct origin chain
		require(block.chainid == order.sourceChainId, "Not origin chain");

		// Verify that the provided orderId matches the current order's ID
		require(orderId == generateOrderId(order), "Invalid order");

		// Veify that only user can call this function
		require(msg.sender == order.user, "Only user can call this function");

		// Verify that the order is expired base on the fillDeadline
		require(
			block.timestamp >= (order.fillDeadline + 300),
			"Can withdraw after 5 minutes from the fillDeadline"
		);

		// Verify that the order is not Fulfilled
		require(!originCompleted, "Order already completed by filler");

		// Transfer tokens back to the user
		IERC20(bridgeData.sourceToken).safeTransfer(
			order.user,
			bridgeData.sendAmount
		);

		// Emit the withdraw event that the user has withdrawn tokens back
		emit Withdraw(orderId);
	}

	/**
	 * @dev Generates a unique order ID by hashing the provided order data.
	 *
	 * @param _order The GaslessCrossChainOrder for which the ID is being generated.
	 * @return bytes32 The generated unique order ID.
	 */
	function generateOrderId(
		GaslessCrossChainOrder memory _order
	) public pure returns (bytes32) {
		// Return the keccak256 hash of the encoded order data
		return keccak256(abi.encode(_order));
	}
}
