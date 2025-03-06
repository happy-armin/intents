const { ethers } = require("ethers");

// readstorageslot.js reads the storage slot of the ephemeral DualIntent.sol contract

(async () => {
  try {
      // DualChainIntent contract address
      const contractAddress = "0xA1a3A3Ab81168ECfc0F7F39489754B877B6fFe85";
      const provider = new ethers.providers.JsonRpcProvider(
	  "https://rpc-jam-ccw030wxbz.t.conduit.xyz/Pwe4skpfPaM8HSTPwHDhXzoJoKqdpjfRQ"
      );
      
      // The two booleans are packed in slot 14, read raw storage at slot 14, convert to BigNumber so we can bitmask
      const booleanSlotIndex = 14;
      const storageHex = await provider.getStorageAt(contractAddress, booleanSlotIndex);
      const storageBN = ethers.BigNumber.from(storageHex);
      
      // destinationFulfilled is stored in the least significant bit (bit 0)
      // so, 0x0000000000000000000000000000000000000000000000000000000000000001 basically
      const destinationFulfilled = storageBN.and(1).eq(1);
      
      // originCompleted is stored in bit 1
      const originCompleted = storageBN.shr(1).and(1).eq(1);
      
      console.log(`Slot [${booleanSlotIndex}] raw: ${storageHex}`);
      console.log(`destinationFulfilled = ${destinationFulfilled}`);
      console.log(`originCompleted      = ${originCompleted}`);
  } catch (error) {
      console.error("Error reading storage:", error);
  }
})();