var IntentFactory = artifacts.require("./IntentFactory.sol");

module.exports = function (deployer) {
  // deploy intent factory
  deployer
    .deploy(IntentFactory)
    .then(() => {
      console.log(
        `IntentFactory contract deployed at ${IntentFactory.address}`
      );
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
    });
};
