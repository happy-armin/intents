// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing the DualChainIntent contract
import "./DualChainIntent.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// IntentFactory is a contract that deploys instances of DualChainIntent
contract IntentFactory is Ownable {
    // State variable to store the verifier address
    address public verifier;

    // Constant multiplier used for fee calculations
    uint256 public constant MULTIPLIER = 10000;

    // Mapping to store fee information for each address
    // The key is the address, and the value is the associated fee amount
    mapping(address => uint256) public feeInfo;

    // Event emitted when a new intent is deployed
    event IntentDeployed(
        address indexed intentAddr, // Address of the deployed intent
        GaslessCrossChainOrder order // The order associated with the intent
    );

    /**
     * @dev Constructor that initializes the contract and sets the deployer as the owner.
     *      Uses the Ownable constructor from OpenZeppelin.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Function to set the fee information for a specific token
     * @param token The address of the token for which the fee is being set
     * @param fee The fee amount to be set for the specified token
     * @notice Only the owner of the contract can call this function
     */
    function setFeeInfo(address token, uint256 fee) external onlyOwner {
        // Ensure that the fee is less than 1% of the MULTIPLIER
        require(fee < MULTIPLIER / 100, "Invalid fee");

        // Set the fee information for the specified token
        feeInfo[token] = fee;
    }
    /**
     * @dev Function to retrieve the fee information for a specific token
     * @param token The address of the token for which to get fee info
     * @return fee The fee amount associated with the specified token
     * @return multiplier The constant multiplier used for fee calculations
     */
    function getFeeInfo(
        address token
    ) external view returns (uint256 fee, uint256 multiplier) {
        // Retrieve the fee amount for the specified token
        fee = feeInfo[token];

        // Return the constant MULTIPLIER
        multiplier = MULTIPLIER;
    }

    /**
     * @dev Function to set the verifier address.
     *      Can only be called by the owner of the contract.
     * @param _verifier The address to set as the verifier.
     */
    function setVerifier(address _verifier) external onlyOwner {
        // Verify the address
        require(_verifier != address(0), "Invaild verifier address");

        // set verifier address as _verifier
        verifier = _verifier;
    }

    /**
     * @dev Creates a new intent contract using the provided order and salt (CREATE2 opcode).
     *
     * @param _order The GaslessCrossChainOrder associated with the intent.
     * @param _salt A unique salt value to ensure the address of the deployed contract is unique.
     *
     * @return intentAddr The address of the newly deployed intent contract (DualChainIntent contract).
     *
     * Emits an IntentDeployed event upon successful deployment.
     *
     * Requirements:
     * - The contract must not revert during creation.
     */
    function createIntent(
        GaslessCrossChainOrder memory _order, // The order to be associated with the intent
        bytes32 _salt // Salt for CREATE2 to ensure unique address
    ) external returns (address intentAddr) {
        // Encode the order data for the constructor
        bytes memory constructorData = abi.encode(_order);

        // Prepare the bytecode for the new contract
        bytes memory bytecode = abi.encodePacked(
            type(DualChainIntent).creationCode, // Get the creation code of DualChainIntent
            constructorData // Append the constructor data
        );

        // Use assembly to deploy the contract using CREATE2
        assembly {
            intentAddr := create2(
                0,
                add(bytecode, 0x20),
                mload(bytecode),
                _salt
            )
        }

        // Ensure the contract was created successfully
        require(intentAddr != address(0), "CREATE2 failed");

        // Initialize the newly created intent with the sender's address and order
        DualChainIntent(intentAddr).initializeFiller(msg.sender);

        // Emit the IntentDeployed event
        emit IntentDeployed(intentAddr, _order);
    }

    /**
     * @dev Computes the address of a future intent contract without deploying it (CREATE2 contract deployment prediction).
     *
     * @param _order The GaslessCrossChainOrder associated with the intent.
     * @param _salt A unique salt value used in the address computation.
     *
     * @return The anticipated address of the intent contract.
     *
     * This function uses the CREATE2 opcode to determine the address based on the factory's address,
     * the salt, and the bytecode of the intended contract.
     */
    function getIntentAddress(
        GaslessCrossChainOrder memory _order, // The order to be associated with the intent
        bytes32 _salt // Salt for CREATE2 to ensure unique address
    ) external view returns (address) {
        // Encode the order data for the constructor
        bytes memory constructorData = abi.encode(_order);

        // Prepare the bytecode for the new contract
        bytes memory bytecode = abi.encodePacked(
            type(DualChainIntent).creationCode, // Get the creation code of DualChainIntent
            constructorData // Append the constructor data
        );

        // Calculate the code hash of the intended contract
        bytes32 codeHash = keccak256(bytecode);

        // Calculate and return the anticipated address of the intent
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0x41), // Prefix for CREATE2
                                address(this), // Address of the factory
                                _salt, // Salt
                                codeHash // Code hash
                            )
                        )
                    )
                )
            );
    }
}
