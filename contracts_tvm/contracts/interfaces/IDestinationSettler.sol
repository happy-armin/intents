// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDestinationSettler {
	/// @notice Fills a single leg of a particular order on the destination chain.
	function fill(
		bytes32 orderId,
		bytes calldata originData,
		bytes calldata fillerData
	) external;
}
