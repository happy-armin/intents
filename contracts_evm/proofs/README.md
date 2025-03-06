# Proof Generation 

To generate a storage proof, we figure out the storage slot (14 in DualIntent.sol) of the ephemeral contract holding the destinationFulfilled=1 value.  This is just the first piece as a proof of inclusion of L2 onto L1 and finality of L1 is also required.

This was generated without GPU, CPU only locally:
```
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
```
