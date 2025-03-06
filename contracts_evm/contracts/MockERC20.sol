// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing the ERC20 standard from OpenZeppelin
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Permit } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// MockERC20 is a simple ERC20 token implementation for testing purposes
contract MockERC20 is ERC20, ERC20Permit {
	// Constructor function to initialize the token with its name, symbol, and initial supply
	constructor(
		string memory _name, // The name of the token - "Tether USDT or Wrapped Bitcoin"
		string memory _symbol, // The symbol of the token (e.g., "TOKEN") - "USDT or WBTC"
		uint256 _initialSupply // The initial supply of tokens to mint
	) ERC20(_name, _symbol) ERC20Permit(_name) {
		// Mint the initial supply to the contract deployer (msg.sender)
		_mint(msg.sender, _initialSupply);
	}

	// Function to mint new tokens
	// Only the owner or authorized accounts should be able to call this in a real implementation
	function mint(uint256 amount) external {
		// Mint new tokens to the specified address
		_mint(msg.sender, amount);
	}

	// Function to burn tokens from the caller's account
	function burn(uint256 amount) external {
		// Burn tokens from the caller's account
		_burn(msg.sender, amount);
	}
}
