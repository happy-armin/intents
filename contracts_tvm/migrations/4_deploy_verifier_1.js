var Verifier_Factory_1 = artifacts.require("./SP1/verifier1/SP1Verifier1.sol");

module.exports = function (deployer) {
  // deploy verifier1
  deployer
    .deploy(Verifier_Factory_1)
    .then(() => {
      console.log(
        `VerifierFactory1 contract deployed at ${Verifier_Factory_1.address}`
      );
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
    });
};
