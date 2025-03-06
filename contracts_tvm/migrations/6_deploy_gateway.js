var Verifier_Gateway = artifacts.require("./SP1/SP1VerifierGateway.sol");

module.exports = function (deployer, accounts) {
  const deployerAddress = deployer.options.options.network_config.from;
  // deploy gateway
  deployer
    .deploy(Verifier_Gateway, deployerAddress)
    .then(() => {
      console.log(
        `VerifierGateway contract deployed at ${Verifier_Gateway.address}`
      );
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
    });
};
