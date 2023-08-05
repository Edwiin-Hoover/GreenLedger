const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonCredit", function () {
  let carbonCredit;
  let owner;
  let issuer;
  let recipient;
  let addrs;

  beforeEach(async function () {
    [owner, issuer, recipient, ...addrs] = await ethers.getSigners();

    const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
    carbonCredit = await CarbonCredit.deploy();
    await carbonCredit.deployed();

    // Transfer ownership to issuer for testing
    await carbonCredit.transferOwnership(issuer.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await carbonCredit.name()).to.equal("Carbon Credit Certificate");
      expect(await carbonCredit.symbol()).to.equal("CCC");
    });

    it("Should set the correct owner", async function () {
      expect(await carbonCredit.owner()).to.equal(issuer.address);
    });
  });

  describe("Issuing Carbon Credits", function () {
    it("Should issue a carbon credit successfully", async function () {
      const amount = ethers.utils.parseEther("100"); // 100 tons CO2
      const projectType = "Renewable Energy";
      const location = "California, USA";
      const methodology = "VCS Methodology VM0001";
      const verificationBody = "Verra";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now
      const metadataHash = "QmTestHash123";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

      const tx = await carbonCredit.connect(issuer).issueCredit(
        recipient.address,
        amount,
        projectType,
        location,
        methodology,
        verificationBody,
        expiryDate,
        metadataHash,
        tokenURI
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "CarbonCreditIssued");

      expect(event).to.not.be.undefined;
      expect(event.args.tokenId).to.equal(1);
      expect(event.args.issuer).to.equal(issuer.address);
      expect(event.args.owner).to.equal(recipient.address);
      expect(event.args.amount).to.equal(amount);

      // Check token ownership
      expect(await carbonCredit.ownerOf(1)).to.equal(recipient.address);
      expect(await carbonCredit.tokenURI(1)).to.equal(tokenURI);

      // Check carbon credit data
      const creditData = await carbonCredit.getCarbonCreditData(1);
      expect(creditData.amount).to.equal(amount);
      expect(creditData.projectType).to.equal(projectType);
      expect(creditData.location).to.equal(location);
      expect(creditData.methodology).to.equal(methodology);
      expect(creditData.verificationBody).to.equal(verificationBody);
      expect(creditData.issuer).to.equal(issuer.address);
      expect(creditData.verified).to.be.false;
      expect(creditData.transferable).to.be.true;
    });

    it("Should fail to issue credit with invalid parameters", async function () {
      const amount = ethers.utils.parseEther("100");
      const projectType = "Renewable Energy";
      const location = "California, USA";
      const methodology = "VCS Methodology VM0001";
      const verificationBody = "Verra";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataHash = "QmTestHash123";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

      // Test zero address
      await expect(
        carbonCredit.connect(issuer).issueCredit(
          ethers.constants.AddressZero,
          amount,
          projectType,
          location,
          methodology,
          verificationBody,
          expiryDate,
          metadataHash,
          tokenURI
        )
      ).to.be.revertedWith("Cannot issue to zero address");

      // Test zero amount
      await expect(
        carbonCredit.connect(issuer).issueCredit(
          recipient.address,
          0,
          projectType,
          location,
          methodology,
          verificationBody,
          expiryDate,
          metadataHash,
          tokenURI
        )
      ).to.be.revertedWith("Amount must be greater than zero");

      // Test empty project type
      await expect(
        carbonCredit.connect(issuer).issueCredit(
          recipient.address,
          amount,
          "",
          location,
          methodology,
          verificationBody,
          expiryDate,
          metadataHash,
          tokenURI
        )
      ).to.be.revertedWith("Project type cannot be empty");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      // Issue a credit first
      const amount = ethers.utils.parseEther("100");
      const projectType = "Renewable Energy";
      const location = "California, USA";
      const methodology = "VCS Methodology VM0001";
      const verificationBody = "Verra";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataHash = "QmTestHash123";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

      await carbonCredit.connect(issuer).issueCredit(
        recipient.address,
        amount,
        projectType,
        location,
        methodology,
        verificationBody,
        expiryDate,
        metadataHash,
        tokenURI
      );
    });

    it("Should verify a carbon credit", async function () {
      const tx = await carbonCredit.connect(issuer).verifyCredit(1, true);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "CarbonCreditVerified");

      expect(event).to.not.be.undefined;
      expect(event.args.tokenId).to.equal(1);
      expect(event.args.verified).to.be.true;
      expect(event.args.verifier).to.equal(issuer.address);

      const creditData = await carbonCredit.getCarbonCreditData(1);
      expect(creditData.verified).to.be.true;
    });

    it("Should fail to verify credit from non-issuer", async function () {
      await expect(
        carbonCredit.connect(addrs[0]).verifyCredit(1, true)
      ).to.be.revertedWith("Only issuer can perform this action");
    });
  });

  describe("Transferring Credits", function () {
    beforeEach(async function () {
      // Issue and verify a credit
      const amount = ethers.utils.parseEther("100");
      const projectType = "Renewable Energy";
      const location = "California, USA";
      const methodology = "VCS Methodology VM0001";
      const verificationBody = "Verra";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataHash = "QmTestHash123";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

      await carbonCredit.connect(issuer).issueCredit(
        recipient.address,
        amount,
        projectType,
        location,
        methodology,
        verificationBody,
        expiryDate,
        metadataHash,
        tokenURI
      );

      await carbonCredit.connect(issuer).verifyCredit(1, true);
    });

    it("Should transfer verified credit successfully", async function () {
      await carbonCredit.connect(recipient).transferFrom(recipient.address, addrs[0].address, 1);

      expect(await carbonCredit.ownerOf(1)).to.equal(addrs[0].address);
    });

    it("Should fail to transfer unverified credit", async function () {
      // Issue another unverified credit
      const amount = ethers.utils.parseEther("50");
      const projectType = "Energy Efficiency";
      const location = "Texas, USA";
      const methodology = "VCS Methodology VM0002";
      const verificationBody = "Gold Standard";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataHash = "QmTestHash456";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash456";

      await carbonCredit.connect(issuer).issueCredit(
        recipient.address,
        amount,
        projectType,
        location,
        methodology,
        verificationBody,
        expiryDate,
        metadataHash,
        tokenURI
      );

      await expect(
        carbonCredit.connect(recipient).transferFrom(recipient.address, addrs[0].address, 2)
      ).to.be.revertedWith("Credit must be verified");
    });
  });

  describe("Burning Credits", function () {
    beforeEach(async function () {
      // Issue a credit
      const amount = ethers.utils.parseEther("100");
      const projectType = "Renewable Energy";
      const location = "California, USA";
      const methodology = "VCS Methodology VM0001";
      const verificationBody = "Verra";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataHash = "QmTestHash123";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

      await carbonCredit.connect(issuer).issueCredit(
        recipient.address,
        amount,
        projectType,
        location,
        methodology,
        verificationBody,
        expiryDate,
        metadataHash,
        tokenURI
      );
    });

    it("Should burn credit successfully", async function () {
      const tx = await carbonCredit.connect(recipient).burnCredit(1);
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "CarbonCreditBurned");

      expect(event).to.not.be.undefined;
      expect(event.args.tokenId).to.equal(1);
      expect(event.args.owner).to.equal(recipient.address);
      expect(event.args.amount).to.equal(ethers.utils.parseEther("100"));

      await expect(carbonCredit.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("Should fail to burn credit from non-owner", async function () {
      await expect(
        carbonCredit.connect(addrs[0]).burnCredit(1)
      ).to.be.revertedWith("Only owner can burn");
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async function () {
      // Issue multiple credits
      const amount = ethers.utils.parseEther("100");
      const projectType = "Renewable Energy";
      const location = "California, USA";
      const methodology = "VCS Methodology VM0001";
      const verificationBody = "Verra";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataHash = "QmTestHash123";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

      // Issue 3 credits to recipient
      for (let i = 0; i < 3; i++) {
        await carbonCredit.connect(issuer).issueCredit(
          recipient.address,
          amount,
          projectType,
          location,
          methodology,
          verificationBody,
          expiryDate,
          metadataHash,
          tokenURI
        );
      }
    });

    it("Should return correct credits by owner", async function () {
      const credits = await carbonCredit.getCreditsByOwner(recipient.address);
      expect(credits.length).to.equal(3);
      expect(credits[0]).to.equal(1);
      expect(credits[1]).to.equal(2);
      expect(credits[2]).to.equal(3);
    });

    it("Should return correct credits by issuer", async function () {
      const credits = await carbonCredit.getCreditsByIssuer(issuer.address);
      expect(credits.length).to.equal(3);
      expect(credits[0]).to.equal(1);
      expect(credits[1]).to.equal(2);
      expect(credits[2]).to.equal(3);
    });

    it("Should return correct total credits amount", async function () {
      const totalAmount = await carbonCredit.getTotalCreditsAmount(recipient.address);
      expect(totalAmount).to.equal(ethers.utils.parseEther("300"));
    });

    it("Should check expiry correctly", async function () {
      const isExpired = await carbonCredit.isExpired(1);
      expect(isExpired).to.be.false;
    });
  });

  describe("Pausable Functionality", function () {
    it("Should pause and unpause contract", async function () {
      await carbonCredit.connect(issuer).pause();
      expect(await carbonCredit.paused()).to.be.true;

      await carbonCredit.connect(issuer).unpause();
      expect(await carbonCredit.paused()).to.be.false;
    });

    it("Should fail to issue credit when paused", async function () {
      await carbonCredit.connect(issuer).pause();

      const amount = ethers.utils.parseEther("100");
      const projectType = "Renewable Energy";
      const location = "California, USA";
      const methodology = "VCS Methodology VM0001";
      const verificationBody = "Verra";
      const expiryDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const metadataHash = "QmTestHash123";
      const tokenURI = "https://ipfs.io/ipfs/QmTestHash123";

      await expect(
        carbonCredit.connect(issuer).issueCredit(
          recipient.address,
          amount,
          projectType,
          location,
          methodology,
          verificationBody,
          expiryDate,
          metadataHash,
          tokenURI
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
