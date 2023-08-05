const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment of GreenLedger contracts...");

  // Get the contract factories
  const CarbonCreditFactory = await ethers.getContractFactory("CarbonCreditFactory");
  const CarbonCredit = await ethers.getContractFactory("CarbonCredit");

  console.log("Deploying CarbonCreditFactory...");
  
  // Deploy CarbonCreditFactory
  const carbonCreditFactory = await CarbonCreditFactory.deploy();
  await carbonCreditFactory.deployed();

  console.log("CarbonCreditFactory deployed to:", carbonCreditFactory.address);

  // Deploy a sample CarbonCredit contract
  console.log("Deploying sample CarbonCredit contract...");
  
  const carbonCredit = await CarbonCredit.deploy();
  await carbonCredit.deployed();

  console.log("CarbonCredit deployed to:", carbonCredit.address);

  // Transfer ownership of CarbonCredit to CarbonCreditFactory for management
  console.log("Transferring CarbonCredit ownership to CarbonCreditFactory...");
  
  await carbonCredit.transferOwnership(carbonCreditFactory.address);

  console.log("Ownership transferred successfully");

  // Verify deployment
  console.log("\n=== Deployment Summary ===");
  console.log("CarbonCreditFactory:", carbonCreditFactory.address);
  console.log("Sample CarbonCredit:", carbonCredit.address);
  console.log("Network:", await ethers.provider.getNetwork());
  console.log("Deployer:", await ethers.provider.getSigner().getAddress());

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: await ethers.provider.getSigner().getAddress(),
    contracts: {
      CarbonCreditFactory: {
        address: carbonCreditFactory.address,
        transactionHash: carbonCreditFactory.deployTransaction.hash,
        blockNumber: carbonCreditFactory.deployTransaction.blockNumber,
      },
      CarbonCredit: {
        address: carbonCredit.address,
        transactionHash: carbonCredit.deployTransaction.hash,
        blockNumber: carbonCredit.deployTransaction.blockNumber,
      }
    },
    timestamp: new Date().toISOString(),
  };

  // Write deployment info to file
  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentDir, `deployment-${deploymentInfo.chainId}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // Test basic functionality
  console.log("\n=== Testing Basic Functionality ===");
  
  try {
    // Test factory deployment
    const totalIssuers = await carbonCreditFactory.getTotalIssuers();
    console.log("Total issuers:", totalIssuers.toString());

    const totalProjects = await carbonCreditFactory.getTotalProjects();
    console.log("Total projects:", totalProjects.toString());

    // Test carbon credit contract
    const name = await carbonCredit.name();
    const symbol = await carbonCredit.symbol();
    console.log("Carbon Credit Contract - Name:", name, "Symbol:", symbol);

    console.log("✅ Basic functionality test passed!");
  } catch (error) {
    console.error("❌ Basic functionality test failed:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
