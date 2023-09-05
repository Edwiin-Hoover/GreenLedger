const { ethers } = require('ethers');

// Contract ABIs (simplified for demonstration)
const CarbonCreditFactoryABI = [
  "function registerIssuer(string memory name, string memory description, string memory website, string[] memory certifications)",
  "function verifyIssuer(address issuerAddress, bool verified)",
  "function createProject(string memory name, string memory description, string memory projectType, string memory location, string memory methodology, uint256 estimatedReduction, string[] memory documents)",
  "function verifyProject(uint256 projectId, bool verified, uint256 actualReduction)",
  "function createCarbonCreditContract(string memory name, string memory symbol)",
  "function issueCreditsForProject(address contractAddress, uint256 projectId, address recipient, uint256 amount, uint256 expiryDate, string memory metadataHash, string memory tokenURI)",
  "function getIssuer(address issuerAddress) view returns (tuple(address issuerAddress, string name, string description, string website, bool isVerified, bool isActive, uint256 registrationDate, uint256 totalCreditsIssued, uint256 totalProjects, string[] certifications))",
  "function getProject(uint256 projectId) view returns (tuple(uint256 projectId, address issuer, string name, string description, string projectType, string location, string methodology, uint256 estimatedReduction, uint256 actualReduction, bool isVerified, bool isActive, uint256 creationDate, uint256 verificationDate, string[] documents, address[] verifiers))",
  "function getTotalIssuers() view returns (uint256)",
  "function getTotalProjects() view returns (uint256)",
  "event IssuerRegistered(address indexed issuerAddress, string name, string description, string website)",
  "event ProjectCreated(uint256 indexed projectId, address indexed issuer, string name, string projectType, uint256 estimatedReduction)",
  "event ProjectVerified(uint256 indexed projectId, address indexed verifier, bool verified)",
  "event CarbonCreditContractCreated(address indexed contractAddress, address indexed issuer, string name)",
  "event CreditsIssued(address indexed contractAddress, address indexed issuer, address indexed recipient, uint256 amount, uint256 projectId)"
];

const CarbonCreditABI = [
  "function issueCredit(address to, uint256 amount, string memory projectType, string memory location, string memory methodology, string memory verificationBody, uint256 expiryDate, string memory metadataHash, string memory tokenURI) returns (uint256)",
  "function verifyCredit(uint256 tokenId, bool verified)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function burnCredit(uint256 tokenId)",
  "function getCarbonCreditData(uint256 tokenId) view returns (tuple(uint256 amount, uint256 issueDate, uint256 expiryDate, string projectType, string location, string methodology, string verificationBody, address issuer, bool verified, bool transferable, string metadataHash))",
  "function getCreditsByOwner(address owner) view returns (uint256[])",
  "function getCreditsByIssuer(address issuer) view returns (uint256[])",
  "function getTotalCreditsAmount(address owner) view returns (uint256)",
  "function isExpired(uint256 tokenId) view returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event CarbonCreditIssued(uint256 indexed tokenId, address indexed issuer, address indexed owner, uint256 amount, string projectType, string metadataHash)",
  "event CarbonCreditVerified(uint256 indexed tokenId, bool verified, address indexed verifier)",
  "event CarbonCreditTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 amount)",
  "event CarbonCreditBurned(uint256 indexed tokenId, address indexed owner, uint256 amount)"
];

class ContractManager {
  constructor() {
    this.providers = new Map();
    this.contracts = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize providers for different networks
    const networks = {
      mainnet: process.env.MAINNET_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
      arbitrum: process.env.ARBITRUM_RPC_URL,
      optimism: process.env.OPTIMISM_RPC_URL,
      localhost: 'http://localhost:8545'
    };

    Object.entries(networks).forEach(([network, rpcUrl]) => {
      if (rpcUrl) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          this.providers.set(network, provider);
          console.log(`✅ Connected to ${network} provider`);
        } catch (error) {
          console.error(`❌ Failed to connect to ${network} provider:`, error.message);
        }
      }
    });
  }

  getProvider(network = 'mainnet') {
    return this.providers.get(network);
  }

  getContract(network, contractType, address) {
    const provider = this.getProvider(network);
    if (!provider) {
      throw new Error(`Provider not found for network: ${network}`);
    }

    const key = `${network}-${contractType}-${address}`;
    
    if (this.contracts.has(key)) {
      return this.contracts.get(key);
    }

    let abi;
    switch (contractType) {
      case 'CarbonCreditFactory':
        abi = CarbonCreditFactoryABI;
        break;
      case 'CarbonCredit':
        abi = CarbonCreditABI;
        break;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }

    const contract = new ethers.Contract(address, abi, provider);
    this.contracts.set(key, contract);
    
    return contract;
  }

  async getContractWithSigner(network, contractType, address, privateKey) {
    const provider = this.getProvider(network);
    if (!provider) {
      throw new Error(`Provider not found for network: ${network}`);
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    
    let abi;
    switch (contractType) {
      case 'CarbonCreditFactory':
        abi = CarbonCreditFactoryABI;
        break;
      case 'CarbonCredit':
        abi = CarbonCreditABI;
        break;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }

    return new ethers.Contract(address, abi, wallet);
  }

  // Carbon Credit Factory methods
  async registerIssuer(network, factoryAddress, privateKey, issuerData) {
    const contract = await this.getContractWithSigner(network, 'CarbonCreditFactory', factoryAddress, privateKey);
    
    const { name, description, website, certifications } = issuerData;
    
    const tx = await contract.registerIssuer(name, description, website, certifications);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  async verifyIssuer(network, factoryAddress, privateKey, issuerAddress, verified) {
    const contract = await this.getContractWithSigner(network, 'CarbonCreditFactory', factoryAddress, privateKey);
    
    const tx = await contract.verifyIssuer(issuerAddress, verified);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  async createProject(network, factoryAddress, privateKey, projectData) {
    const contract = await this.getContractWithSigner(network, 'CarbonCreditFactory', factoryAddress, privateKey);
    
    const { name, description, projectType, location, methodology, estimatedReduction, documents } = projectData;
    
    const tx = await contract.createProject(
      name,
      description,
      projectType,
      location,
      methodology,
      ethers.utils.parseEther(estimatedReduction.toString()),
      documents
    );
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  async verifyProject(network, factoryAddress, privateKey, projectId, verified, actualReduction) {
    const contract = await this.getContractWithSigner(network, 'CarbonCreditFactory', factoryAddress, privateKey);
    
    const tx = await contract.verifyProject(
      projectId,
      verified,
      ethers.utils.parseEther(actualReduction.toString())
    );
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  async createCarbonCreditContract(network, factoryAddress, privateKey, name, symbol) {
    const contract = await this.getContractWithSigner(network, 'CarbonCreditFactory', factoryAddress, privateKey);
    
    const tx = await contract.createCarbonCreditContract(name, symbol);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  async issueCreditsForProject(network, factoryAddress, privateKey, creditData) {
    const contract = await this.getContractWithSigner(network, 'CarbonCreditFactory', factoryAddress, privateKey);
    
    const { contractAddress, projectId, recipient, amount, expiryDate, metadataHash, tokenURI } = creditData;
    
    const tx = await contract.issueCreditsForProject(
      contractAddress,
      projectId,
      recipient,
      ethers.utils.parseEther(amount.toString()),
      expiryDate,
      metadataHash,
      tokenURI
    );
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  // Carbon Credit methods
  async issueCredit(network, creditAddress, privateKey, creditData) {
    const contract = await this.getContractWithSigner(network, 'CarbonCredit', creditAddress, privateKey);
    
    const { to, amount, projectType, location, methodology, verificationBody, expiryDate, metadataHash, tokenURI } = creditData;
    
    const tx = await contract.issueCredit(
      to,
      ethers.utils.parseEther(amount.toString()),
      projectType,
      location,
      methodology,
      verificationBody,
      expiryDate,
      metadataHash,
      tokenURI
    );
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  async verifyCredit(network, creditAddress, privateKey, tokenId, verified) {
    const contract = await this.getContractWithSigner(network, 'CarbonCredit', creditAddress, privateKey);
    
    const tx = await contract.verifyCredit(tokenId, verified);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  async transferCredit(network, creditAddress, privateKey, from, to, tokenId) {
    const contract = await this.getContractWithSigner(network, 'CarbonCredit', creditAddress, privateKey);
    
    const tx = await contract.transferFrom(from, to, tokenId);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  async burnCredit(network, creditAddress, privateKey, tokenId) {
    const contract = await this.getContractWithSigner(network, 'CarbonCredit', creditAddress, privateKey);
    
    const tx = await contract.burnCredit(tokenId);
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      events: receipt.events
    };
  }

  // Read-only methods
  async getCarbonCreditData(network, creditAddress, tokenId) {
    const contract = this.getContract(network, 'CarbonCredit', creditAddress);
    
    const data = await contract.getCarbonCreditData(tokenId);
    
    return {
      amount: ethers.utils.formatEther(data.amount),
      issueDate: new Date(data.issueDate.toNumber() * 1000),
      expiryDate: data.expiryDate.toNumber() > 0 ? new Date(data.expiryDate.toNumber() * 1000) : null,
      projectType: data.projectType,
      location: data.location,
      methodology: data.methodology,
      verificationBody: data.verificationBody,
      issuer: data.issuer,
      verified: data.verified,
      transferable: data.transferable,
      metadataHash: data.metadataHash
    };
  }

  async getCreditsByOwner(network, creditAddress, owner) {
    const contract = this.getContract(network, 'CarbonCredit', creditAddress);
    
    const tokenIds = await contract.getCreditsByOwner(owner);
    
    return tokenIds.map(id => id.toNumber());
  }

  async getCreditsByIssuer(network, creditAddress, issuer) {
    const contract = this.getContract(network, 'CarbonCredit', creditAddress);
    
    const tokenIds = await contract.getCreditsByIssuer(issuer);
    
    return tokenIds.map(id => id.toNumber());
  }

  async getTotalCreditsAmount(network, creditAddress, owner) {
    const contract = this.getContract(network, 'CarbonCredit', creditAddress);
    
    const amount = await contract.getTotalCreditsAmount(owner);
    
    return ethers.utils.formatEther(amount);
  }

  async isExpired(network, creditAddress, tokenId) {
    const contract = this.getContract(network, 'CarbonCredit', creditAddress);
    
    return await contract.isExpired(tokenId);
  }

  async getIssuer(network, factoryAddress, issuerAddress) {
    const contract = this.getContract(network, 'CarbonCreditFactory', factoryAddress);
    
    const issuer = await contract.getIssuer(issuerAddress);
    
    return {
      issuerAddress: issuer.issuerAddress,
      name: issuer.name,
      description: issuer.description,
      website: issuer.website,
      isVerified: issuer.isVerified,
      isActive: issuer.isActive,
      registrationDate: new Date(issuer.registrationDate.toNumber() * 1000),
      totalCreditsIssued: ethers.utils.formatEther(issuer.totalCreditsIssued),
      totalProjects: issuer.totalProjects.toNumber(),
      certifications: issuer.certifications
    };
  }

  async getProject(network, factoryAddress, projectId) {
    const contract = this.getContract(network, 'CarbonCreditFactory', factoryAddress);
    
    const project = await contract.getProject(projectId);
    
    return {
      projectId: project.projectId.toNumber(),
      issuer: project.issuer,
      name: project.name,
      description: project.description,
      projectType: project.projectType,
      location: project.location,
      methodology: project.methodology,
      estimatedReduction: ethers.utils.formatEther(project.estimatedReduction),
      actualReduction: ethers.utils.formatEther(project.actualReduction),
      isVerified: project.isVerified,
      isActive: project.isActive,
      creationDate: new Date(project.creationDate.toNumber() * 1000),
      verificationDate: project.verificationDate.toNumber() > 0 ? new Date(project.verificationDate.toNumber() * 1000) : null,
      documents: project.documents,
      verifiers: project.verifiers
    };
  }

  async getTotalIssuers(network, factoryAddress) {
    const contract = this.getContract(network, 'CarbonCreditFactory', factoryAddress);
    
    const total = await contract.getTotalIssuers();
    
    return total.toNumber();
  }

  async getTotalProjects(network, factoryAddress) {
    const contract = this.getContract(network, 'CarbonCreditFactory', factoryAddress);
    
    const total = await contract.getTotalProjects();
    
    return total.toNumber();
  }

  // Utility methods
  async getTransactionReceipt(network, txHash) {
    const provider = this.getProvider(network);
    if (!provider) {
      throw new Error(`Provider not found for network: ${network}`);
    }

    return await provider.getTransactionReceipt(txHash);
  }

  async getBlockNumber(network) {
    const provider = this.getProvider(network);
    if (!provider) {
      throw new Error(`Provider not found for network: ${network}`);
    }

    return await provider.getBlockNumber();
  }

  async getGasPrice(network) {
    const provider = this.getProvider(network);
    if (!provider) {
      throw new Error(`Provider not found for network: ${network}`);
    }

    const gasPrice = await provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  async estimateGas(network, contractType, address, method, params) {
    const contract = this.getContract(network, contractType, address);
    
    try {
      const gasEstimate = await contract.estimateGas[method](...params);
      return gasEstimate.toString();
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }
}

// Create singleton instance
const contractManager = new ContractManager();

module.exports = {
  ContractManager,
  CarbonCreditFactory: contractManager,
  CarbonCredit: contractManager,
  CarbonCreditFactoryABI,
  CarbonCreditABI
};
