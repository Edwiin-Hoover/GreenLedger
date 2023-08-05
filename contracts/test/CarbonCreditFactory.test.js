const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonCreditFactory", function () {
  let carbonCreditFactory;
  let carbonCredit;
  let owner;
  let issuer;
  let verifier;
  let recipient;
  let addrs;

  beforeEach(async function () {
    [owner, issuer, verifier, recipient, ...addrs] = await ethers.getSigners();

    const CarbonCreditFactory = await ethers.getContractFactory("CarbonCreditFactory");
    carbonCreditFactory = await CarbonCreditFactory.deploy();
    await carbonCreditFactory.deployed();

    const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
    carbonCredit = await CarbonCredit.deploy();
    await carbonCredit.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await carbonCreditFactory.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero issuers and projects", async function () {
      expect(await carbonCreditFactory.getTotalIssuers()).to.equal(0);
      expect(await carbonCreditFactory.getTotalProjects()).to.equal(0);
    });
  });

  describe("Issuer Registration", function () {
    it("Should register an issuer successfully", async function () {
      const name = "Green Energy Corp";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1", "QmCert2"];

      const tx = await carbonCreditFactory.connect(issuer).registerIssuer(
        name,
        description,
        website,
        certifications
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "IssuerRegistered");

      expect(event).to.not.be.undefined;
      expect(event.args.issuerAddress).to.equal(issuer.address);
      expect(event.args.name).to.equal(name);

      const issuerData = await carbonCreditFactory.getIssuer(issuer.address);
      expect(issuerData.name).to.equal(name);
      expect(issuerData.description).to.equal(description);
      expect(issuerData.website).to.equal(website);
      expect(issuerData.isActive).to.be.true;
      expect(issuerData.isVerified).to.be.false;
      expect(issuerData.totalCreditsIssued).to.equal(0);
      expect(issuerData.totalProjects).to.equal(0);
    });

    it("Should fail to register issuer with invalid parameters", async function () {
      const name = "";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1"];

      await expect(
        carbonCreditFactory.connect(issuer).registerIssuer(
          name,
          description,
          website,
          certifications
        )
      ).to.be.revertedWith("Name cannot be empty");

      await expect(
        carbonCreditFactory.connect(issuer).registerIssuer(
          "Green Energy Corp",
          "",
          website,
          certifications
        )
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should fail to register issuer twice", async function () {
      const name = "Green Energy Corp";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1"];

      await carbonCreditFactory.connect(issuer).registerIssuer(
        name,
        description,
        website,
        certifications
      );

      await expect(
        carbonCreditFactory.connect(issuer).registerIssuer(
          name,
          description,
          website,
          certifications
        )
      ).to.be.revertedWith("Issuer already registered");
    });
  });

  describe("Issuer Verification", function () {
    beforeEach(async function () {
      const name = "Green Energy Corp";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1"];

      await carbonCreditFactory.connect(issuer).registerIssuer(
        name,
        description,
        website,
        certifications
      );
    });

    it("Should verify an issuer", async function () {
      const tx = await carbonCreditFactory.connect(owner).verifyIssuer(issuer.address, true);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "IssuerVerified");

      expect(event).to.not.be.undefined;
      expect(event.args.issuerAddress).to.equal(issuer.address);
      expect(event.args.verified).to.be.true;

      const issuerData = await carbonCreditFactory.getIssuer(issuer.address);
      expect(issuerData.isVerified).to.be.true;
    });

    it("Should fail to verify issuer from non-owner", async function () {
      await expect(
        carbonCreditFactory.connect(addrs[0]).verifyIssuer(issuer.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Project Creation", function () {
    beforeEach(async function () {
      const name = "Green Energy Corp";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1"];

      await carbonCreditFactory.connect(issuer).registerIssuer(
        name,
        description,
        website,
        certifications
      );

      await carbonCreditFactory.connect(owner).verifyIssuer(issuer.address, true);
    });

    it("Should create a project successfully", async function () {
      const projectName = "Solar Farm Project";
      const projectDescription = "Large-scale solar energy generation";
      const projectType = "Renewable Energy";
      const location = "California, USA";
      const methodology = "VCS Methodology VM0001";
      const estimatedReduction = ethers.utils.parseEther("1000"); // 1000 tons CO2
      const documents = ["QmDoc1", "QmDoc2"];

      const tx = await carbonCreditFactory.connect(issuer).createProject(
        projectName,
        projectDescription,
        projectType,
        location,
        methodology,
        estimatedReduction,
        documents
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ProjectCreated");

      expect(event).to.not.be.undefined;
      expect(event.args.projectId).to.equal(1);
      expect(event.args.issuer).to.equal(issuer.address);
      expect(event.args.name).to.equal(projectName);
      expect(event.args.projectType).to.equal(projectType);
      expect(event.args.estimatedReduction).to.equal(estimatedReduction);

      const project = await carbonCreditFactory.getProject(1);
      expect(project.name).to.equal(projectName);
      expect(project.description).to.equal(projectDescription);
      expect(project.projectType).to.equal(projectType);
      expect(project.location).to.equal(location);
      expect(project.methodology).to.equal(methodology);
      expect(project.estimatedReduction).to.equal(estimatedReduction);
      expect(project.issuer).to.equal(issuer.address);
      expect(project.isVerified).to.be.false;
      expect(project.isActive).to.be.true;
    });

    it("Should fail to create project from unverified issuer", async function () {
      const unverifiedIssuer = addrs[0];
      
      // Register but don't verify
      await carbonCreditFactory.connect(unverifiedIssuer).registerIssuer(
        "Unverified Corp",
        "Unverified company",
        "https://unverified.com",
        ["QmCert1"]
      );

      await expect(
        carbonCreditFactory.connect(unverifiedIssuer).createProject(
          "Test Project",
          "Test Description",
          "Renewable Energy",
          "Test Location",
          "Test Methodology",
          ethers.utils.parseEther("100"),
          ["QmDoc1"]
        )
      ).to.be.revertedWith("Only verified issuers can perform this action");
    });

    it("Should fail to create project with invalid parameters", async function () {
      await expect(
        carbonCreditFactory.connect(issuer).createProject(
          "",
          "Test Description",
          "Renewable Energy",
          "Test Location",
          "Test Methodology",
          ethers.utils.parseEther("100"),
          ["QmDoc1"]
        )
      ).to.be.revertedWith("Project name cannot be empty");

      await expect(
        carbonCreditFactory.connect(issuer).createProject(
          "Test Project",
          "Test Description",
          "Renewable Energy",
          "Test Location",
          "Test Methodology",
          0,
          ["QmDoc1"]
        )
      ).to.be.revertedWith("Estimated reduction must be greater than zero");
    });
  });

  describe("Project Verification", function () {
    let projectId;

    beforeEach(async function () {
      const name = "Green Energy Corp";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1"];

      await carbonCreditFactory.connect(issuer).registerIssuer(
        name,
        description,
        website,
        certifications
      );

      await carbonCreditFactory.connect(owner).verifyIssuer(issuer.address, true);

      const tx = await carbonCreditFactory.connect(issuer).createProject(
        "Solar Farm Project",
        "Large-scale solar energy generation",
        "Renewable Energy",
        "California, USA",
        "VCS Methodology VM0001",
        ethers.utils.parseEther("1000"),
        ["QmDoc1", "QmDoc2"]
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ProjectCreated");
      projectId = event.args.projectId;
    });

    it("Should verify a project", async function () {
      const actualReduction = ethers.utils.parseEther("950"); // 950 tons CO2

      const tx = await carbonCreditFactory.connect(owner).verifyProject(
        projectId,
        true,
        actualReduction
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ProjectVerified");

      expect(event).to.not.be.undefined;
      expect(event.args.projectId).to.equal(projectId);
      expect(event.args.verifier).to.equal(owner.address);
      expect(event.args.verified).to.be.true;

      const project = await carbonCreditFactory.getProject(projectId);
      expect(project.isVerified).to.be.true;
      expect(project.actualReduction).to.equal(actualReduction);
      expect(project.verificationDate).to.be.greaterThan(0);
    });

    it("Should fail to verify project from non-owner", async function () {
      await expect(
        carbonCreditFactory.connect(addrs[0]).verifyProject(
          projectId,
          true,
          ethers.utils.parseEther("950")
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Carbon Credit Contract Creation", function () {
    beforeEach(async function () {
      const name = "Green Energy Corp";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1"];

      await carbonCreditFactory.connect(issuer).registerIssuer(
        name,
        description,
        website,
        certifications
      );

      await carbonCreditFactory.connect(owner).verifyIssuer(issuer.address, true);
    });

    it("Should create carbon credit contract", async function () {
      const contractName = "Green Energy Credits";
      const contractSymbol = "GEC";

      const tx = await carbonCreditFactory.connect(issuer).createCarbonCreditContract(
        contractName,
        contractSymbol
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "CarbonCreditContractCreated");

      expect(event).to.not.be.undefined;
      expect(event.args.issuer).to.equal(issuer.address);

      const contracts = await carbonCreditFactory.getContractsByIssuer(issuer.address);
      expect(contracts.length).to.equal(1);
      expect(contracts[0]).to.equal(event.args.contractAddress);
    });

    it("Should fail to create contract from unverified issuer", async function () {
      const unverifiedIssuer = addrs[0];
      
      await carbonCreditFactory.connect(unverifiedIssuer).registerIssuer(
        "Unverified Corp",
        "Unverified company",
        "https://unverified.com",
        ["QmCert1"]
      );

      await expect(
        carbonCreditFactory.connect(unverifiedIssuer).createCarbonCreditContract(
          "Test Credits",
          "TC"
        )
      ).to.be.revertedWith("Only verified issuers can perform this action");
    });
  });

  describe("Credit Issuance", function () {
    let contractAddress;
    let projectId;

    beforeEach(async function () {
      const name = "Green Energy Corp";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1"];

      await carbonCreditFactory.connect(issuer).registerIssuer(
        name,
        description,
        website,
        certifications
      );

      await carbonCreditFactory.connect(owner).verifyIssuer(issuer.address, true);

      // Create project
      const tx1 = await carbonCreditFactory.connect(issuer).createProject(
        "Solar Farm Project",
        "Large-scale solar energy generation",
        "Renewable Energy",
        "California, USA",
        "VCS Methodology VM0001",
        ethers.utils.parseEther("1000"),
        ["QmDoc1", "QmDoc2"]
      );

      const receipt1 = await tx1.wait();
      const event1 = receipt1.events.find(e => e.event === "ProjectCreated");
      projectId = event1.args.projectId;

      // Verify project
      await carbonCreditFactory.connect(owner).verifyProject(
        projectId,
        true,
        ethers.utils.parseEther("950")
      );

      // Create carbon credit contract
      const tx2 = await carbonCreditFactory.connect(issuer).createCarbonCreditContract(
        "Green Energy Credits",
        "GEC"
      );

      const receipt2 = await tx2.wait();
      const event2 = receipt2.events.find(e => e.event === "CarbonCreditContractCreated");
      contractAddress = event2.args.contractAddress;
    });

    it("Should issue credits for verified project", async function () {
      const amount = ethers.utils.parseEther("100");
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataHash = "QmTestHash123";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

      const tx = await carbonCreditFactory.connect(issuer).issueCreditsForProject(
        contractAddress,
        projectId,
        recipient.address,
        amount,
        expiryDate,
        metadataHash,
        tokenURI
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "CreditsIssued");

      expect(event).to.not.be.undefined;
      expect(event.args.contractAddress).to.equal(contractAddress);
      expect(event.args.issuer).to.equal(issuer.address);
      expect(event.args.recipient).to.equal(recipient.address);
      expect(event.args.amount).to.equal(amount);
      expect(event.args.projectId).to.equal(projectId);

      // Check issuer stats
      const issuerData = await carbonCreditFactory.getIssuer(issuer.address);
      expect(issuerData.totalCreditsIssued).to.equal(amount);
    });

    it("Should fail to issue credits for unverified project", async function () {
      // Create another unverified project
      const tx = await carbonCreditFactory.connect(issuer).createProject(
        "Wind Farm Project",
        "Wind energy generation",
        "Renewable Energy",
        "Texas, USA",
        "VCS Methodology VM0002",
        ethers.utils.parseEther("500"),
        ["QmDoc3"]
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ProjectCreated");
      const unverifiedProjectId = event.args.projectId;

      await expect(
        carbonCreditFactory.connect(issuer).issueCreditsForProject(
          contractAddress,
          unverifiedProjectId,
          recipient.address,
          ethers.utils.parseEther("100"),
          Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          "QmTestHash456",
          "https://ipfs.io/ipfs/QmTestHash456"
        )
      ).to.be.revertedWith("Project must be verified");
    });

    it("Should fail to issue credits exceeding actual reduction", async function () {
      const amount = ethers.utils.parseEther("1000"); // Exceeds actual reduction of 950

      await expect(
        carbonCreditFactory.connect(issuer).issueCreditsForProject(
          contractAddress,
          projectId,
          recipient.address,
          amount,
          Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          "QmTestHash123",
          "https://ipfs.io/ipfs/QmTestHash123"
        )
      ).to.be.revertedWith("Amount cannot exceed actual reduction");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      const name = "Green Energy Corp";
      const description = "Leading renewable energy company";
      const website = "https://greenenergy.com";
      const certifications = ["QmCert1"];

      await carbonCreditFactory.connect(issuer).registerIssuer(
        name,
        description,
        website,
        certifications
      );

      await carbonCreditFactory.connect(owner).verifyIssuer(issuer.address, true);

      // Create multiple projects
      for (let i = 0; i < 3; i++) {
        await carbonCreditFactory.connect(issuer).createProject(
          `Project ${i + 1}`,
          `Description ${i + 1}`,
          "Renewable Energy",
          "California, USA",
          "VCS Methodology VM0001",
          ethers.utils.parseEther("100"),
          ["QmDoc1"]
        );
      }
    });

    it("Should return correct projects by issuer", async function () {
      const projects = await carbonCreditFactory.getProjectsByIssuer(issuer.address);
      expect(projects.length).to.equal(3);
      expect(projects[0]).to.equal(1);
      expect(projects[1]).to.equal(2);
      expect(projects[2]).to.equal(3);
    });

    it("Should return all projects", async function () {
      const allProjects = await carbonCreditFactory.getAllProjects();
      expect(allProjects.length).to.equal(3);
    });

    it("Should return all issuers", async function () {
      const allIssuers = await carbonCreditFactory.getAllIssuers();
      expect(allIssuers.length).to.equal(1);
      expect(allIssuers[0]).to.equal(issuer.address);
    });

    it("Should return correct total counts", async function () {
      expect(await carbonCreditFactory.getTotalIssuers()).to.equal(1);
      expect(await carbonCreditFactory.getTotalProjects()).to.equal(3);
    });
  });

  describe("Pausable Functionality", function () {
    it("Should pause and unpause contract", async function () {
      await carbonCreditFactory.connect(owner).pause();
      expect(await carbonCreditFactory.paused()).to.be.true;

      await carbonCreditFactory.connect(owner).unpause();
      expect(await carbonCreditFactory.paused()).to.be.false;
    });

    it("Should fail to register issuer when paused", async function () {
      await carbonCreditFactory.connect(owner).pause();

      await expect(
        carbonCreditFactory.connect(issuer).registerIssuer(
          "Test Corp",
          "Test Description",
          "https://test.com",
          ["QmCert1"]
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
