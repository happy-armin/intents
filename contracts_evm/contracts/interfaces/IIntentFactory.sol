// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for the Intent Factory contract
interface IIntentFactory {
	// Function to get the address of the verifier
	// @return The address of the verifier contract
	function verifier() external view returns (address);

	// Function to retrieve fee information for a specific token
	// @param token The address of the token for which to get fee info
	// @return fee The fee amount associated with the token
	// @return multiplier The multiplier that may apply to the fee
	function getFeeInfo(
		address token
	) external view returns (uint256 fee, uint256 multiplier);
}
