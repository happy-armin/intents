const hre = require("hardhat")
async function main() {
	const [deployer] = await hre.ethers.getSigners()

	console.log("Deploying verifierFactory with signer:", deployer.address)

	const verifierFactory1 = await hre.ethers.getContractFactory("contracts/SP1/verifier1/SP1Verifier.sol:SP1Verifier")
	const verifier1 = await verifierFactory1.deploy()
	const verifier1Address = await verifier1.getAddress()
	console.log("verifier1 deployed at:", verifier1Address)

	const verifierFactory2 = await hre.ethers.getContractFactory("contracts/SP1/verifier2/SP1Verifier.sol:SP1Verifier")
	const verifier2 = await verifierFactory2.deploy()
	const verifier2Address = await verifier2.getAddress()
	console.log("verifier2 deployed at:", verifier2Address)

	const verifierGatewayFactory = await hre.ethers.getContractFactory("SP1VerifierGateway")
	const verifierGateway = await verifierGatewayFactory.deploy(deployer.address)
	console.log("verifierGateway deployed at:", await verifierGateway.getAddress())

	await verifierGateway.addRoute(verifier1Address)
	console.log("verifierGateway addRoute verifier1: ", verifier1Address)

	await verifierGateway.addRoute(verifier2Address)
	console.log("verifierGateway addRoute verifier1: ", verifier2Address)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
