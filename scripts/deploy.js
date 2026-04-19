const hre = require("hardhat");

async function main() {
  const FoodExpiryTracker = await hre.ethers.getContractFactory("ProductExpiry");
  const contract = await FoodExpiryTracker.deploy();

  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

