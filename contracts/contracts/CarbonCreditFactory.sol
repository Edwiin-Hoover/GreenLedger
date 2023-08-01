// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./CarbonCredit.sol";

/**
 * @title CarbonCreditFactory
 * @dev Factory contract for creating and managing carbon credit certificates
 * @notice This contract manages the creation of carbon credit NFT contracts and tracks issuers
 */
contract CarbonCreditFactory is Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _projectCounter;

    // Issuer information structure
    struct Issuer {
        address issuerAddress;
        string name;
        string description;
        string website;
        bool isVerified;
        bool isActive;
        uint256 registrationDate;
        uint256 totalCreditsIssued;
        uint256 totalProjects;
        string[] certifications; // Array of certification hashes
    }

    // Project information structure
    struct Project {
        uint256 projectId;
        address issuer;
        string name;
        string description;
        string projectType;
        string location;
        string methodology;
        uint256 estimatedReduction;
        uint256 actualReduction;
        bool isVerified;
        bool isActive;
        uint256 creationDate;
        uint256 verificationDate;
        string[] documents; // Array of IPFS document hashes
        address[] verifiers;
    }

    // Mapping from issuer address to issuer information
    mapping(address => Issuer) public issuers;

    // Mapping from project ID to project information
    mapping(uint256 => Project) public projects;

    // Mapping from issuer address to their projects
    mapping(address => uint256[]) public issuerProjects;

    // Array of all registered issuers
    address[] public registeredIssuers;

    // Array of all projects
    uint256[] public allProjects;

    // Mapping from issuer address to their carbon credit contracts
    mapping(address => address[]) public issuerContracts;

    // Events
    event IssuerRegistered(
        address indexed issuerAddress,
        string name,
        string description,
        string website
    );

    event IssuerVerified(
        address indexed issuerAddress,
        bool verified
    );

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed issuer,
        string name,
        string projectType,
        uint256 estimatedReduction
    );

    event ProjectVerified(
        uint256 indexed projectId,
        address indexed verifier,
        bool verified
    );

    event CarbonCreditContractCreated(
        address indexed contractAddress,
        address indexed issuer,
        string name
    );

    event CreditsIssued(
        address indexed contractAddress,
        address indexed issuer,
        address indexed recipient,
        uint256 amount,
        uint256 projectId
    );

    // Modifiers
    modifier onlyVerifiedIssuer() {
        require(issuers[msg.sender].isVerified, "Only verified issuers can perform this action");
        require(issuers[msg.sender].isActive, "Issuer is not active");
        _;
    }

    modifier onlyValidProject(uint256 projectId) {
        require(projects[projectId].projectId != 0, "Project does not exist");
        _;
    }

    modifier onlyProjectIssuer(uint256 projectId) {
        require(projects[projectId].issuer == msg.sender, "Only project issuer can perform this action");
        _;
    }

    /**
     * @dev Register a new issuer
     * @param name Name of the issuer organization
     * @param description Description of the issuer
     * @param website Website URL of the issuer
     * @param certifications Array of certification IPFS hashes
     */
    function registerIssuer(
        string memory name,
        string memory description,
        string memory website,
        string[] memory certifications
    ) external whenNotPaused nonReentrant {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(!issuers[msg.sender].isActive, "Issuer already registered");

        Issuer memory newIssuer = Issuer({
            issuerAddress: msg.sender,
            name: name,
            description: description,
            website: website,
            isVerified: false,
            isActive: true,
            registrationDate: block.timestamp,
            totalCreditsIssued: 0,
            totalProjects: 0,
            certifications: certifications
        });

        issuers[msg.sender] = newIssuer;
        registeredIssuers.push(msg.sender);

        emit IssuerRegistered(msg.sender, name, description, website);
    }

    /**
     * @dev Verify an issuer (only owner)
     * @param issuerAddress Address of the issuer to verify
     * @param verified Whether to verify or unverify the issuer
     */
    function verifyIssuer(address issuerAddress, bool verified) external onlyOwner {
        require(issuers[issuerAddress].isActive, "Issuer is not registered");

        issuers[issuerAddress].isVerified = verified;

        emit IssuerVerified(issuerAddress, verified);
    }

    /**
     * @dev Create a new carbon reduction project
     * @param name Name of the project
     * @param description Description of the project
     * @param projectType Type of carbon reduction project
     * @param location Geographic location of the project
     * @param methodology Methodology used for the project
     * @param estimatedReduction Estimated CO2 reduction in tons
     * @param documents Array of IPFS document hashes
     */
    function createProject(
        string memory name,
        string memory description,
        string memory projectType,
        string memory location,
        string memory methodology,
        uint256 estimatedReduction,
        string[] memory documents
    ) external onlyVerifiedIssuer whenNotPaused nonReentrant returns (uint256) {
        require(bytes(name).length > 0, "Project name cannot be empty");
        require(bytes(description).length > 0, "Project description cannot be empty");
        require(bytes(projectType).length > 0, "Project type cannot be empty");
        require(bytes(location).length > 0, "Location cannot be empty");
        require(bytes(methodology).length > 0, "Methodology cannot be empty");
        require(estimatedReduction > 0, "Estimated reduction must be greater than zero");

        _projectCounter.increment();
        uint256 projectId = _projectCounter.current();

        Project memory newProject = Project({
            projectId: projectId,
            issuer: msg.sender,
            name: name,
            description: description,
            projectType: projectType,
            location: location,
            methodology: methodology,
            estimatedReduction: estimatedReduction,
            actualReduction: 0,
            isVerified: false,
            isActive: true,
            creationDate: block.timestamp,
            verificationDate: 0,
            documents: documents,
            verifiers: new address[](0)
        });

        projects[projectId] = newProject;
        issuerProjects[msg.sender].push(projectId);
        allProjects.push(projectId);

        // Update issuer stats
        issuers[msg.sender].totalProjects = issuers[msg.sender].totalProjects.add(1);

        emit ProjectCreated(projectId, msg.sender, name, projectType, estimatedReduction);

        return projectId;
    }

    /**
     * @dev Verify a project
     * @param projectId ID of the project to verify
     * @param verified Whether to verify or unverify the project
     * @param actualReduction Actual CO2 reduction achieved
     */
    function verifyProject(
        uint256 projectId,
        bool verified,
        uint256 actualReduction
    ) external onlyOwner onlyValidProject(projectId) {
        projects[projectId].isVerified = verified;
        
        if (verified) {
            projects[projectId].verificationDate = block.timestamp;
            projects[projectId].actualReduction = actualReduction;
            projects[projectId].verifiers.push(msg.sender);
        }

        emit ProjectVerified(projectId, msg.sender, verified);
    }

    /**
     * @dev Create a new carbon credit contract for an issuer
     * @param name Name of the carbon credit contract
     * @param symbol Symbol of the carbon credit contract
     */
    function createCarbonCreditContract(
        string memory name,
        string memory symbol
    ) external onlyVerifiedIssuer whenNotPaused nonReentrant returns (address) {
        require(bytes(name).length > 0, "Contract name cannot be empty");
        require(bytes(symbol).length > 0, "Contract symbol cannot be empty");

        CarbonCredit newContract = new CarbonCredit();
        newContract.transferOwnership(msg.sender);

        issuerContracts[msg.sender].push(address(newContract));

        emit CarbonCreditContractCreated(address(newContract), msg.sender, name);

        return address(newContract);
    }

    /**
     * @dev Issue carbon credits for a verified project
     * @param contractAddress Address of the carbon credit contract
     * @param projectId ID of the verified project
     * @param recipient Address to receive the credits
     * @param amount Amount of CO2 equivalent in tons
     * @param expiryDate Timestamp when credits expire (0 if no expiry)
     * @param metadataHash IPFS hash of additional metadata
     * @param tokenURI URI for the token metadata
     */
    function issueCreditsForProject(
        address contractAddress,
        uint256 projectId,
        address recipient,
        uint256 amount,
        uint256 expiryDate,
        string memory metadataHash,
        string memory tokenURI
    ) external onlyVerifiedIssuer onlyValidProject(projectId) onlyProjectIssuer(projectId) whenNotPaused nonReentrant {
        require(projects[projectId].isVerified, "Project must be verified");
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= projects[projectId].actualReduction, "Amount cannot exceed actual reduction");
        require(recipient != address(0), "Cannot issue to zero address");

        // Verify the contract belongs to the issuer
        bool contractBelongsToIssuer = false;
        address[] memory contracts = issuerContracts[msg.sender];
        for (uint256 i = 0; i < contracts.length; i++) {
            if (contracts[i] == contractAddress) {
                contractBelongsToIssuer = true;
                break;
            }
        }
        require(contractBelongsToIssuer, "Contract does not belong to issuer");

        // Issue the credit through the contract
        CarbonCredit carbonCreditContract = CarbonCredit(contractAddress);
        uint256 tokenId = carbonCreditContract.issueCredit(
            recipient,
            amount,
            projects[projectId].projectType,
            projects[projectId].location,
            projects[projectId].methodology,
            "GreenLedger Verification Body", // This would be dynamic in production
            expiryDate,
            metadataHash,
            tokenURI
        );

        // Update issuer stats
        issuers[msg.sender].totalCreditsIssued = issuers[msg.sender].totalCreditsIssued.add(amount);

        emit CreditsIssued(contractAddress, msg.sender, recipient, amount, projectId);
    }

    /**
     * @dev Get issuer information
     * @param issuerAddress Address of the issuer
     * @return Issuer struct containing all issuer information
     */
    function getIssuer(address issuerAddress) external view returns (Issuer memory) {
        require(issuers[issuerAddress].isActive, "Issuer is not registered");
        return issuers[issuerAddress];
    }

    /**
     * @dev Get project information
     * @param projectId ID of the project
     * @return Project struct containing all project information
     */
    function getProject(uint256 projectId) external view onlyValidProject(projectId) returns (Project memory) {
        return projects[projectId];
    }

    /**
     * @dev Get all projects by an issuer
     * @param issuerAddress Address of the issuer
     * @return Array of project IDs
     */
    function getProjectsByIssuer(address issuerAddress) external view returns (uint256[] memory) {
        return issuerProjects[issuerAddress];
    }

    /**
     * @dev Get all projects
     * @return Array of all project IDs
     */
    function getAllProjects() external view returns (uint256[] memory) {
        return allProjects;
    }

    /**
     * @dev Get all registered issuers
     * @return Array of all issuer addresses
     */
    function getAllIssuers() external view returns (address[] memory) {
        return registeredIssuers;
    }

    /**
     * @dev Get contracts created by an issuer
     * @param issuerAddress Address of the issuer
     * @return Array of contract addresses
     */
    function getContractsByIssuer(address issuerAddress) external view returns (address[] memory) {
        return issuerContracts[issuerAddress];
    }

    /**
     * @dev Get total number of projects
     * @return Total number of projects created
     */
    function getTotalProjects() external view returns (uint256) {
        return _projectCounter.current();
    }

    /**
     * @dev Get total number of registered issuers
     * @return Total number of registered issuers
     */
    function getTotalIssuers() external view returns (uint256) {
        return registeredIssuers.length;
    }

    /**
     * @dev Update issuer information
     * @param name New name
     * @param description New description
     * @param website New website
     */
    function updateIssuerInfo(
        string memory name,
        string memory description,
        string memory website
    ) external onlyVerifiedIssuer {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");

        issuers[msg.sender].name = name;
        issuers[msg.sender].description = description;
        issuers[msg.sender].website = website;
    }

    /**
     * @dev Deactivate issuer (only owner)
     * @param issuerAddress Address of the issuer to deactivate
     */
    function deactivateIssuer(address issuerAddress) external onlyOwner {
        require(issuers[issuerAddress].isActive, "Issuer is not active");

        issuers[issuerAddress].isActive = false;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
