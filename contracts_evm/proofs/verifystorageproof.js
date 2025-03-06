// verifystorageproof.js -- shows how to verify an storage proof posted to ETH Mainnet using sample

// You run it (with an infura API key)
// SP1 Proof verified!
/*
This was generated without GPU, CPU only locally:
# cargo run --release  -- --prove
vk: "0x004eb6a15619fdfd870ceb7ee0307f2316fe698e52887b9560f0a84f2cebab75"
Generating proof...
Setting environment variables took 34.15µs
Reading R1CS took 18.412919535s
Reading proving key took 1.498664147s
Reading witness file took 491.658µs
Deserializing JSON data took 11.298914ms
Generating witness took 272.177136ms
03:23:18 DBG constraint system solver done nbConstraints=8173052 took=2473.064559
03:23:27 DBG prover done acceleration=none backend=groth16 curve=bn254 nbConstraints=8173052 took=8867.833376
Generating proof took 11.34132242s
03:23:27 DBG verifier done backend=groth16 curve=bn254 took=0.947232
Successfully generated proof! Proving time: 392.9242386s
public values: 0x2000000000000000ecdc9dde35836e1f0334fe763dfef9c07931f98fa67cb6213be543f0ee7470031400000000000000a1a3a3ab81168ecfc0f7f39489754b877b6ffe852000000000000000000000000000000000000000000000000000000000000000000000000000000e20000000000000000000000000000000000000000000000000000000000000000000000000000001
proof: 0x11b6a09d21265a0ed431b3fa79fef4bdfa8588d22b22633808802398291a4872bb2acd4928efd11a46b9a65fac1c78b304e293e574bca5522dd7a1d49e8be736222668950b09c6b2acdd3f0a9419106e55a3a543648dfc2ba86d8f46edaf393b13e211710fe1e0b190307dc6e1220ae6dcdaba276d4d3f046e43519ba70447dd402a592a1e24b19a8b19866964ff166a357f801f6cbe5e1754b9ed0bdbf3e79fd1760a38101b77321dac27a57ff00cbcb1a35584c9c6102371686063430757a699995efc2556f9582d64086995bed255cad949429f6a81267b86d18615334aeda53d37220c294e7a2f33c423344aaacf0d9172fa519e215109c0a0fd3dc2279ece238062
[sp1] groth16 circuit artifacts already seem to exist at /root/.sp1/circuits/groth16/v4.0.0-rc.3. if you want to re-download them, delete the directory
03:23:27 DBG verifier done backend=groth16 cpu
Successfully verified proof!
*/
const ethers = require("ethers"); // v5
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/YOURINFURAKEY");

(async () => {
    try {
	const contractAddress = "0x397A5f7f3dBd538f23DE225B51f532c34448dA9B"; // Gateway -- but  0x4660483e004e416D41bfd77D6425e98543beB6Ba is not the gateway, its the verifier, so we have a mismatch
	const abi = [{
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "programVKey",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "publicValues",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "proofBytes",
        "type": "bytes"
      }
    ],
    "name": "verifyProof",
    "outputs": [],
    "stateMutability": "view",
    "type": "function"
	}];

	// 1. aggregationVkey - The verification key of the aggregation SP1 program
	const programVKey = "0x004eb6a15619fdfd870ceb7ee0307f2316fe698e52887b9560f0a84f2cebab75"; 

	// 2. https://github.com/succinctlabs/op-succinct show how publicValues are computed
	const publicValues = "0x2000000000000000ecdc9dde35836e1f0334fe763dfef9c07931f98fa67cb6213be543f0ee7470031400000000000000a1a3a3ab81168ecfc0f7f39489754b877b6ffe852000000000000000000000000000000000000000000000000000000000000000000000000000000e20000000000000000000000000000000000000000000000000000000000000000000000000000001";

	// 3. proofBytes from https://etherscan.io/tx/0x20cb55cb5c643654cc87bfdcfbb12c73642c6c8199573c25d573b123280038f1 call data (Groth16 proofs are 260 bytes)
	const proofBytes = "0x11b6a09d21265a0ed431b3fa79fef4bdfa8588d22b22633808802398291a4872bb2acd4928efd11a46b9a65fac1c78b304e293e574bca5522dd7a1d49e8be736222668950b09c6b2acdd3f0a9419106e55a3a543648dfc2ba86d8f46edaf393b13e211710fe1e0b190307dc6e1220ae6dcdaba276d4d3f046e43519ba70447dd402a592a1e24b19a8b19866964ff166a357f801f6cbe5e1754b9ed0bdbf3e79fd1760a38101b77321dac27a57ff00cbcb1a35584c9c6102371686063430757a699995efc2556f9582d64086995bed255cad949429f6a81267b86d18615334aeda53d37220c294e7a2f33c423344aaacf0d9172fa519e215109c0a0fd3dc2279ece238062";

	const contract = new ethers.Contract(contractAddress, abi, provider);
        const result = await contract.verifyProof(programVKey, publicValues, proofBytes);
	console.log("SP1 Proof verified!");
    } catch (error) {
        console.error("Error", error);
    }
})();
