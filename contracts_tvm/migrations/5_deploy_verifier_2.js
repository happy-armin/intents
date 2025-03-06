var Verifier_Factory_2 = artifacts.require("./SP1/verifier2/SP1Verifier2.sol");

module.exports = function (deployer) {
  // deploy verifier2
  deployer
    .deploy(Verifier_Factory_2)
    .then(() => {
      console.log(
        `VerifierFactory2 contract deployed at ${Verifier_Factory_2.address}`
      );
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
    });
};
