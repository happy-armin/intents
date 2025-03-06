// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./IGroth16Verifier.sol";

interface IERC20 {
	function balanceOf(address account) external view returns (uint256);
	function transfer(address recipient, uint256 amount) external returns (bool);
}

/**
 * @dev Interface for a SP1 Groth Verifier contracts
   https://docs.succinct.xyz/docs/verification/onchain/contract-addresses#groth16
 */
interface IGroth16Verifier {
	/**
     * @dev Verifies a proof with given public values and vkey.
       It is expected that the first 4 bytes of proofBytes must match the first 4 bytes of target verifier's VERIFIER_HASH.
     */
	function verifyProof(
		bytes32 programVKey,
		bytes publicValues,
		proofData proofBytes
	) external view returns (bool);
}

struct GaslessCrossChainOrder {
	/// @dev The intent address with CREATE2
	address originSettler;
	/// @dev The address of the user who is initiating the cross-chain bridge,
	/// whose input tokens will be taken and escrowed
	address user;
	/// @dev Nonce to be used as replay protection for the order
	uint256 nonce;
	/// @dev The chainId of the origin chain, where the user's tokens are escrowed
	uint256 originChainId;
	/// @dev The timestamp by which the order must be opened
	uint32 openDeadline;
	/// @dev The timestamp by which the order must be filled on the destination chain
	uint32 fillDeadline;
	/// @dev Type identifier for the order data. This is an EIP-712 typehash.
	bytes32 orderDataType;
	/// @dev BridgeTransferData struct
	/// Can be used to define tokens, amounts, destination chains, fees, settlement parameters,
	/// or any other order-type specific information
	bytes orderData;
}

/**
 * @dev Example bridging data that can be embedded in GaslessCrossChainOrder.orderData.
 *      This can be extended to include more information about bridging
 *      parameters, fees, or other chain-specific details.
 */
struct BridgeTransferData {
	address sourceToken; // The token on the origin chain (escrowed in the ephemeral contract)
	uint256 amount; // The amount of tokens to be bridged
	uint256 destinationChainId; // Chain ID of the destination chain
	address destinationToken; // Address of the corresponding token on the destination chain
	address beneficiary; // Who on the destination chain receives the bridged funds
}

/// @title ResolvedCrossChainOrder type
/// @notice An implementation-generic representation of an order intended for filler consumption
/// @dev Defines all requirements for filling an order by unbundling the implementation-specific orderData.
/// @dev Intended to improve integration generalization by allowing fillers to compute the exact input and output information of any order
struct ResolvedCrossChainOrder {
	/// @dev The address of the user who is initiating the transfer
	address user;
	/// @dev The chainId of the origin chain
	uint256 originChainId;
	/// @dev The timestamp by which the order must be opened
	uint32 openDeadline;
	/// @dev The timestamp by which the order must be filled on the destination chain(s)
	uint32 fillDeadline;
	/// @dev The unique identifier for this order within this settlement system
	bytes32 orderId;
	/// @dev The max outputs that the filler will send. It's possible the actual amount depends on the state of the destination
	///      chain (destination dutch auction, for instance), so these outputs should be considered a cap on filler liabilities.
	Output[] maxSpent;
	/// @dev The minimum outputs that must be given to the filler as part of order settlement. Similar to maxSpent, it's possible
	///      that special order types may not be able to guarantee the exact amount at open time, so this should be considered
	///      a floor on filler receipts. Setting the `recipient` of an `Output` to address(0) indicates that the filler is not
	///      known when creating this order.
	Output[] minReceived;
	/// @dev Each instruction in this array is parameterizes a single leg of the fill. This provides the filler with the information
	///      necessary to perform the fill on the destination(s).
	FillInstruction[] fillInstructions;
}

/// @notice Tokens that must be received for a valid order fulfillment
struct Output {
	/// @dev The address of the ERC20 token on the destination chain
	/// @dev address(0) used as a sentinel for the native token
	bytes32 token;
	/// @dev The amount of the token to be sent
	uint256 amount;
	/// @dev The address to receive the output tokens
	bytes32 recipient;
	/// @dev The destination chain for this output
	uint256 chainId;
}

/// @title FillInstruction type
/// @notice Instructions to parameterize each leg of the fill
/// @dev Provides all the origin-generated information required to produce a valid fill leg
struct FillInstruction {
	/// @dev The chain that this instruction is intended to be filled on
	uint256 destinationChainId;
	/// @dev The contract address that the instruction is intended to be filled on
	bytes32 destinationSettler;
	/// @dev The data generated on the origin chain needed by the destinationSettler to process the fill
	bytes originData;
}

/* ------------------------------------------------------------------
 * These are settlement interfaces for origin & destination.
 * ------------------------------------------------------------------ */
interface IOriginSettler {
	/// @notice Opens a gasless cross-chain order on behalf of a user.
	function openFor(
		GaslessCrossChainOrder calldata order,
		bytes calldata signature,
		bytes calldata originFillerData
	) external;

	/// @notice Opens a cross-chain order on-chain by the user.
	function open(OnchainCrossChainOrder calldata order) external;

	/// @notice Resolves a GaslessCrossChainOrder into a generic ResolvedCrossChainOrder.
	function resolveFor(
		GaslessCrossChainOrder calldata order,
		bytes calldata originFillerData
	) external view returns (ResolvedCrossChainOrder memory);

	/// @notice Resolves an OnchainCrossChainOrder into a generic ResolvedCrossChainOrder.
	function resolve(
		OnchainCrossChainOrder calldata order
	) external view returns (ResolvedCrossChainOrder memory);
}

interface IDestinationSettler {
	/// @notice Fills a single leg of a particular order on the destination chain.
	function fill(
		bytes32 orderId,
		bytes calldata originData,
		bytes calldata fillerData
	) external;
}

/* ------------------------------------------------------------------
 * Minimal ephemeral contract implementing BOTH IOriginSettler &
 * IDestinationSettler, purely for demonstration.
 * ------------------------------------------------------------------ */
contract DualChainIntent is IOriginSettler, IDestinationSettler {
	/// @dev The user-signed order struct (gasless type).
	GaslessCrossChainOrder public order;

	/// @dev Decoded bridging fields from `order.orderData`.
	BridgeTransferData public bridgeData;

	/// @notice True if bridging is finalized on the destination chain.
	bool public destinationFulfilled;

	/// @notice True if the origin escrow has been unlocked.
	bool public originCompleted;

	/// @dev (Optional) Event that can be emitted on "open".
	/// @notice Signals that an order has been opened
	/// @param orderId a unique order identifier within this settlement system
	/// @param resolvedOrder resolved order that would be returned by resolve if called instead of Open
	event Open(bytes32 indexed orderId, ResolvedCrossChainOrder resolvedOrder);

	/**
	 * @dev In a typical ephemeral flow, everything is set in the constructor
	 *      at contract creation via CREATE2. The user's tokens are already
	 *      sent here prior to deployment.
	 *
	 * @param _order The GaslessCrossChainOrder stored in this ephemeral contract.
	 */
	constructor(GaslessCrossChainOrder memory _order) {
		// 1) Store the GaslessCrossChainOrder
		order = _order;

		// 2) Basic checks
		require(
			_order.orderDataType == keccak256("BRIDGE_TRANSFER_ORDER"),
			"Invalid orderDataType"
		);
		require(
			block.timestamp <= _order.openDeadline,
			"Order expired (openDeadline)"
		);

		// 3) Decode bridging data from orderData
		(
			address fillerAddr,
			address srcToken,
			uint256 amt,
			uint256 destChain,
			address destToken,
			address benef
		) = abi.decode(
				_order.orderData,
				(address, address, uint256, uint256, address, address)
			);

		bridgeData = BridgeTransferData({
			filler: fillerAddr,
			sourceToken: srcToken,
			amount: amt,
			destinationChainId: destChain,
			destinationToken: destToken,
			beneficiary: benef
		});

		// 4) (Optional) We can emit the "Open" event right away
		bytes32 orderId = keccak256(abi.encode(_order));
		emit Open(orderId, msg.sender);
	}

	// ===============================================================
	//                  IDestinationSettler LOGIC
	// ===============================================================

	/**
	 * @notice Called on the destination chain to "fill" the order
	 *         (i.e. finalize bridging for this ephemeral contract).
	 * @param orderId     Unique order identifier (should match keccak256 of `order`).
	 * @param originData  Data emitted on origin to parameterize the fill (not used here).
	 * @param fillerData  Additional data from the filler (not used here).
	 *
	 * For demonstration, we are simply reusing your "finalizeOnDestination" logic.
	 */
	function fill(
		bytes32 orderId,
		bytes calldata originData,
		bytes calldata fillerData
	) external override {
		// 1) Validate order ID matches the ephemeral order
		require(orderId == keccak256(abi.encode(order)), "Invalid orderId");

		// 2) Must be on the destination chain
		require(
			block.chainid == bridgeData.destinationChainId,
			"Not destination chain"
		);

		// 3) Must not already be fulfilled
		require(!destinationFulfilled, "Already fulfilled");

		// 4) Must be called by the filler
		require(
			msg.sender == bridgeData.filler,
			"Only filler can finalize destination"
		);

		// Mark the destination bridging as fulfilled
		destinationFulfilled = true;

		// (Optionally do bridging logic here, or store `originData`, etc.)
	}

	// ===============================================================
	//                   IOriginSettler LOGIC
	// ===============================================================

	/**
	 * @notice Emulates an "openFor" call. In a standard aggregator/settler
	 *         design, this method would:
	 *         1) Validate signature,
	 *         2) Transfer tokens into escrow,
	 *         3) Emit an `Open` event,
	 *         4) Possibly store the order for future reference.
	 *
	 * In the ephemeral design, we skip these steps because:
	 *         - The contract is already constructed with `order`.
	 *         - Tokens are already here (pre-funded).
	 * Hence, we revert to show that ephemeral usage does not rely on this function.
	 */
	function openFor(
		GaslessCrossChainOrder calldata /* _order */,
		bytes calldata /* signature */,
		bytes calldata /* originFillerData */
	) external override {
		revert("Ephemeral contract: 'openFor' not used");
	}

	/**
	 * @notice Emulates an "open" call for an OnchainCrossChainOrder.
	 *         Similarly, ephemeral usage does not rely on this function.
	 */
	function open(
		OnchainCrossChainOrder calldata /* order */
	) external override {
		revert("Ephemeral contract: 'open' not used");
	}

	/**
	 * @notice Resolves a GaslessCrossChainOrder into a generic ResolvedCrossChainOrder.
	 *         This is a read-only “adapter” function that helps aggregator code standardize
	 *         how orders are interpreted.
	 */
	function resolveFor(
		GaslessCrossChainOrder calldata _order,
		bytes calldata /* originFillerData */
	) external view override returns (ResolvedCrossChainOrder memory) {
		// Typically you'd parse the order and return a fully-populated ResolvedCrossChainOrder.
		// Here, we just do a basic demonstration.
		ResolvedCrossChainOrder memory r;
		r.orderType = "GASLESS_CROSS_CHAIN";
		r.offerToken = bridgeData.sourceToken;
		r.offerAmount = bridgeData.amount;
		r.wantToken = bridgeData.destinationToken;
		r.wantAmount = bridgeData.amount;
		r.user = _order.user;
		r.filler = bridgeData.filler;

		return r;
	}

	/**
	 * @notice Resolves an OnchainCrossChainOrder. Not used in ephemeral approach.
	 */
	function resolve(
		OnchainCrossChainOrder calldata /* order */
	) external view override returns (ResolvedCrossChainOrder memory) {
		// Return an empty struct or revert
		revert("No onchain order to resolve in ephemeral contract");
	}

	// ===============================================================
	//                ORIGIN UNLOCK (not in the interfaces)
	// ===============================================================

	/**
	 * @notice Called on the 'origin' chain. The filler provides a Groth16 proof
	 *         that bridging on the destination chain was finalized. If valid,
	 *         the escrowed tokens are released to the filler.
	 *
	 *         This method is NOT part of IOriginSettler or IDestinationSettler
	 *         but you still need it for the ephemeral bridging flow.
	 */
	function finalizeOnOrigin(bytes calldata proofData) external {
		require(block.chainid == order.originChainId, "Not origin chain");
		require(!originCompleted, "Origin escrow already released");
		require(
			block.timestamp <= order.fillDeadline,
			"Order expired (fillDeadline)"
		);

		// In a real scenario, call the on-chain verifier, e.g.
		// bool validProof = IGroth16Verifier(zkVerifier).verifyProof(proofData);
		// Here, do a trivial check:
		bool validProof = (proofData.length > 0);
		require(validProof, "Invalid Groth16 proof");

		// Transfer escrowed tokens from this contract to the filler
		uint256 bal = IERC20(bridgeData.sourceToken).balanceOf(address(this));
		require(bal >= bridgeData.amount, "Not enough escrow in contract");

		IERC20(bridgeData.sourceToken).transfer(
			bridgeData.filler,
			bridgeData.amount
		);

		// Mark as completed
		originCompleted = true;
	}
}

/**
 * @title IntentFactory
 * @notice Deterministically computing the ephemeral address. The user can send tokens to that
 *         address, which will only be created if/when the filler calls createIntent(...).
 */
contract IntentFactory {
	event IntentDeployed(
		address indexed intentAddr,
		GaslessCrossChainOrder order
	);

	/**
	 * @notice Deploy a DualChainIntent (which now implements IOriginSettler + IDestinationSettler) using CREATE2.
	 *
	 * @param _order The GaslessCrossChainOrder struct to pass to the contract's constructor
	 * @param _salt  A salt used in the CREATE2 address derivation
	 * @return intentAddr The address of the deployed DualChainIntent contract
	 */
	function createIntent(
		GaslessCrossChainOrder memory _order,
		bytes32 _salt
	) external returns (address intentAddr) {
		// 1) Encode constructor arguments
		bytes memory constructorData = abi.encode(_order);

		// 2) Build the full contract bytecode for CREATE2 (runtime + constructor args)
		bytes memory bytecode = abi.encodePacked(
			type(DualChainIntent).creationCode, // The runtime code
			constructorData // Encoded constructor
		);

		// 3) Perform the CREATE2 call
		assembly {
			intentAddr := create2(0, add(bytecode, 0x20), mload(bytecode), _salt)
		}
		require(intentAddr != address(0), "CREATE2 failed");

		emit IntentDeployed(intentAddr, _order);
	}

	/**
	 * @notice Computes the CREATE2 address for the given GaslessCrossChainOrder & salt,
	 *         without actually deploying the contract. Useful for off-chain computations.
	 *
	 * @param _order The GaslessCrossChainOrder struct
	 * @param _salt  The salt used in CREATE2
	 * @return The deterministic address of the ephemeral contract, if deployed
	 */
	function getIntentAddress(
		GaslessCrossChainOrder memory _order,
		bytes32 _salt
	) external view returns (address) {
		bytes memory constructorData = abi.encode(_order);
		bytes memory bytecode = abi.encodePacked(
			type(DualChainIntent).creationCode,
			constructorData
		);
		bytes32 codeHash = keccak256(bytecode);

		// CREATE2 formula: keccak256(0xff ++ this + _salt + keccak256(init_code))
		return
			address(
				uint160(
					uint256(
						keccak256(
							abi.encodePacked(
								bytes1(0xff),
								address(this),
								_salt,
								codeHash
							)
						)
					)
				)
			);
	}
}
