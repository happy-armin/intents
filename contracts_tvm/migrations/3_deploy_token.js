var MockUSDT = artifacts.require("./MockERC20.sol");
var MockWBTC = artifacts.require("./MockERC20.sol");

module.exports = function (deployer) {
  // deploy usdt
  deployer
    .deploy(MockUSDT, "Tether USD", "USDT", "10000000000000000000000")
    .then(() => {
      console.log(`USDT contract deployed at ${MockUSDT.address}`);
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
    });

  // deploy wbtc
  deployer
    .deploy(MockWBTC, "Wrapped Bitcoin", "WBTC", "10000000000000000000000")
    .then(() => {
      console.log(`WBTC contract deployed at ${MockUSDT.address}`);
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
    });
};
