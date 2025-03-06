
const { ethers } = require("ethers");

async function getStorageValueArrayAtIndex(contractAddress, baseSlot, index, provider) {
  // For a simple single variable, just use baseSlot + index (which is 0).
  // If you were reading from an actual array, you would need a different
  // calculation (e.g., keccak256(baseSlot) + index), but here it's trivial.
  const outputRootSlot = baseSlot + index; 

  // Fetch the raw storage data (32 bytes in hex)
  const output = await provider.getStorageAt(contractAddress, outputRootSlot);

  // Convert to a decimal string so it's more readable
  const decimalValue = ethers.BigNumber.from(output).toString();
  console.log(`Slot [${outputRootSlot}]: rawHex=${output}, decimal=${decimalValue}`);

  return decimalValue;
}

(async () => {
  try {
    const contractAddress = "0x9f94afe9174538554b81545499B602d5cacca6D4";
    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc-jam-ccw030wxbz.t.conduit.xyz/Pwe4skpfPaM8HSTPwHDhXzoJoKqdpjfRQ"
    );

    // Since 'count' is the first (and only) variable, it's at slot 0
    const value = await getStorageValueArrayAtIndex(contractAddress, 0, 0, provider);
    console.log(`Count value (decimal):`, value);
  } catch (error) {
    console.error("Error reading storage:", error);
  }
})();