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
		bytes calldata publicValues,
		bytes calldata proofBytes
	) external view;
}
