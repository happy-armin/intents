// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IGroth16Verifier} from "./interfaces/IGroth16Verifier.sol";
import {Groth16Verifier} from "./Groth16Verifier.sol";

/// @title SP1 Verifier
/// @author Succinct Labs
/// @notice This contracts implements a solidity verifier for SP1.
contract SP1Groth16Verifier is Groth16Verifier, IGroth16Verifier {
    /// @notice Thrown when the verifier selector from this proof does not match the one in this
    /// verifier. This indicates that this proof was sent to the wrong verifier.
    /// @param received The verifier selector from the first 4 bytes of the proof.
    /// @param expected The verifier selector from the first 4 bytes of the VERIFIER_HASH().
    error WrongVerifierSelector(bytes4 received, bytes4 expected);

    /// @notice Thrown when the proof is invalid.
    error InvalidProof();

    function VERSION() external pure returns (string memory) {
        return "v5.0.0";
    }

    function VERIFIER_HASH() public pure returns (bytes32) {
        return
            0x9f8c5982a2e3c4e188738b98b2d0c33b84d963d4e2974f613ad0d6203fdf75b3;
    }

    /// @notice Hashes the public values to a field elements inside Bn254.
    /// @param publicValues The public values.
    function hashPublicValues(
        bytes calldata publicValues
    ) public pure returns (bytes32) {
        return sha256(publicValues) & bytes32(uint256((1 << 253) - 1));
    }

    /// @notice Verifies a proof with given public values and vkey.
    /// @param programVKey The verification key for the RISC-V program.
    /// @param publicValues The public values encoded as bytes.
    /// @param proofBytes The proof of the program execution the SP1 zkVM encoded as bytes.
    function verifyProof(
        bytes32 programVKey,
        bytes calldata publicValues,
        bytes calldata proofBytes
    ) external view {
        bytes4 receivedSelector = bytes4(proofBytes[:4]);
        bytes4 expectedSelector = bytes4(VERIFIER_HASH());
        if (receivedSelector != expectedSelector) {
            revert WrongVerifierSelector(receivedSelector, expectedSelector);
        }

        // bytes32 publicValuesDigest = hashPublicValues(publicValues);
        uint256[2] memory inputs = abi.decode(publicValues, (uint256[2]));
        // inputs[0] = uint256(programVKey);
        // inputs[1] = uint256(publicValuesDigest);
        (
            uint256[2] memory pA,
            uint256[2][2] memory pB,
            uint256[2] memory pC
        ) = abi.decode(proofBytes[4:], (uint256[2], uint256[2][2], uint256[2]));

        // console.logUint(pA[0]);

        // console.logUint(pB[0][0]);
        // console.logUint(pB[0][1]);
        // console.logUint(pB[1][0]);
        // console.logUint(pB[1][1]);

        // console.logUint(pC[0]);
        // console.logUint(pC[1]);

        // console.logUint(inputs[0]);
        // console.logUint(inputs[1]);
        // this.Verify(proof, inputs);
        require(this.verifyProof(pA, pB, pC, inputs), "invalid proof");
    }
}
