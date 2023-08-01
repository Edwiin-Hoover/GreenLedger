// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title CarbonCredit
 * @dev ERC721 NFT contract for carbon credit certificates
 * @notice This contract represents carbon credit certificates as NFTs with additional metadata
 */
contract CarbonCredit is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _tokenIdCounter;

    // Carbon credit metadata structure
    struct CarbonCreditData {
        uint256 amount;           // Amount of CO2 equivalent in tons
        uint256 issueDate;        // Timestamp when credit was issued
        uint256 expiryDate;       // Timestamp when credit expires (0 if no expiry)
        string projectType;       // Type of carbon reduction project
        string location;          // Geographic location of the project
        string methodology;       // Methodology used for verification
        string verificationBody;  // Body that verified the project
        address issuer;          // Address that issued the credit
        bool verified;            // Whether the credit is verified
        bool transferable;        // Whether the credit can be transferred
        string metadataHash;    // IPFS hash of additional metadata
    }

    // Mapping from token ID to carbon credit data
    mapping(uint256 => CarbonCreditData) public carbonCredits;

    // Mapping from issuer to their issued credits
    mapping(address => uint256[]) public issuerCredits;

    // Mapping from owner to their held credits
    mapping(address => uint256[]) public ownerCredits;

    // Events
    event CarbonCreditIssued(
        uint256 indexed tokenId,
        address indexed issuer,
        address indexed owner,
        uint256 amount,
        string projectType,
        string metadataHash
    );

    event CarbonCreditVerified(
        uint256 indexed tokenId,
        bool verified,
        address indexed verifier
    );

    event CarbonCreditTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event CarbonCreditBurned(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 amount
    );

    event MetadataUpdated(
        uint256 indexed tokenId,
        string newMetadataHash
    );

    // Modifiers
    modifier onlyIssuer(uint256 tokenId) {
        require(carbonCredits[tokenId].issuer == msg.sender, "Only issuer can perform this action");
        _;
    }

    modifier onlyVerified(uint256 tokenId) {
        require(carbonCredits[tokenId].verified, "Credit must be verified");
        _;
    }

    modifier notExpired(uint256 tokenId) {
        require(
            carbonCredits[tokenId].expiryDate == 0 || 
            block.timestamp <= carbonCredits[tokenId].expiryDate,
            "Credit has expired"
        );
        _;
    }

    constructor() ERC721("Carbon Credit Certificate", "CCC") {}

    /**
     * @dev Issue a new carbon credit certificate
     * @param to Address to receive the credit
     * @param amount Amount of CO2 equivalent in tons
     * @param projectType Type of carbon reduction project
     * @param location Geographic location of the project
     * @param methodology Methodology used for verification
     * @param verificationBody Body that verified the project
     * @param expiryDate Timestamp when credit expires (0 if no expiry)
     * @param metadataHash IPFS hash of additional metadata
     * @param tokenURI URI for the token metadata
     */
    function issueCredit(
        address to,
        uint256 amount,
        string memory projectType,
        string memory location,
        string memory methodology,
        string memory verificationBody,
        uint256 expiryDate,
        string memory metadataHash,
        string memory tokenURI
    ) external onlyOwner whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot issue to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(bytes(projectType).length > 0, "Project type cannot be empty");
        require(bytes(location).length > 0, "Location cannot be empty");
        require(bytes(methodology).length > 0, "Methodology cannot be empty");
        require(bytes(verificationBody).length > 0, "Verification body cannot be empty");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Create carbon credit data
        CarbonCreditData memory creditData = CarbonCreditData({
            amount: amount,
            issueDate: block.timestamp,
            expiryDate: expiryDate,
            projectType: projectType,
            location: location,
            methodology: methodology,
            verificationBody: verificationBody,
            issuer: msg.sender,
            verified: false,
            transferable: true,
            metadataHash: metadataHash
        });

        carbonCredits[tokenId] = creditData;

        // Update mappings
        issuerCredits[msg.sender].push(tokenId);
        ownerCredits[to].push(tokenId);

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit CarbonCreditIssued(tokenId, msg.sender, to, amount, projectType, metadataHash);

        return tokenId;
    }

    /**
     * @dev Verify a carbon credit
     * @param tokenId Token ID of the credit to verify
     * @param verified Whether the credit is verified
     */
    function verifyCredit(uint256 tokenId, bool verified) external onlyIssuer(tokenId) {
        require(_exists(tokenId), "Token does not exist");
        
        carbonCredits[tokenId].verified = verified;
        
        emit CarbonCreditVerified(tokenId, verified, msg.sender);
    }

    /**
     * @dev Transfer carbon credit (overrides ERC721 transfer)
     * @param from Address transferring the credit
     * @param to Address receiving the credit
     * @param tokenId Token ID of the credit
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) onlyVerified(tokenId) notExpired(tokenId) {
        require(carbonCredits[tokenId].transferable, "Credit is not transferable");
        
        super._transfer(from, to, tokenId);
        
        // Update owner credits mapping
        _removeFromArray(ownerCredits[from], tokenId);
        ownerCredits[to].push(tokenId);
        
        emit CarbonCreditTransferred(tokenId, from, to, carbonCredits[tokenId].amount);
    }

    /**
     * @dev Burn a carbon credit
     * @param tokenId Token ID of the credit to burn
     */
    function burnCredit(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can burn");
        
        uint256 amount = carbonCredits[tokenId].amount;
        
        // Remove from mappings
        _removeFromArray(ownerCredits[msg.sender], tokenId);
        _removeFromArray(issuerCredits[carbonCredits[tokenId].issuer], tokenId);
        
        // Burn the token
        _burn(tokenId);
        
        emit CarbonCreditBurned(tokenId, msg.sender, amount);
    }

    /**
     * @dev Update metadata hash for a credit
     * @param tokenId Token ID of the credit
     * @param newMetadataHash New IPFS hash
     */
    function updateMetadata(uint256 tokenId, string memory newMetadataHash) external onlyIssuer(tokenId) {
        require(_exists(tokenId), "Token does not exist");
        require(bytes(newMetadataHash).length > 0, "Metadata hash cannot be empty");
        
        carbonCredits[tokenId].metadataHash = newMetadataHash;
        
        emit MetadataUpdated(tokenId, newMetadataHash);
    }

    /**
     * @dev Set transferability of a credit
     * @param tokenId Token ID of the credit
     * @param transferable Whether the credit can be transferred
     */
    function setTransferability(uint256 tokenId, bool transferable) external onlyIssuer(tokenId) {
        require(_exists(tokenId), "Token does not exist");
        
        carbonCredits[tokenId].transferable = transferable;
    }

    /**
     * @dev Get carbon credit data
     * @param tokenId Token ID of the credit
     * @return CarbonCreditData struct containing all credit information
     */
    function getCarbonCreditData(uint256 tokenId) external view returns (CarbonCreditData memory) {
        require(_exists(tokenId), "Token does not exist");
        return carbonCredits[tokenId];
    }

    /**
     * @dev Get credits issued by an address
     * @param issuer Address of the issuer
     * @return Array of token IDs issued by the address
     */
    function getCreditsByIssuer(address issuer) external view returns (uint256[] memory) {
        return issuerCredits[issuer];
    }

    /**
     * @dev Get credits owned by an address
     * @param owner Address of the owner
     * @return Array of token IDs owned by the address
     */
    function getCreditsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerCredits[owner];
    }

    /**
     * @dev Get total amount of credits owned by an address
     * @param owner Address of the owner
     * @return Total amount of CO2 equivalent in tons
     */
    function getTotalCreditsAmount(address owner) external view returns (uint256) {
        uint256[] memory credits = ownerCredits[owner];
        uint256 total = 0;
        
        for (uint256 i = 0; i < credits.length; i++) {
            if (_exists(credits[i]) && !_isExpired(credits[i])) {
                total = total.add(carbonCredits[credits[i]].amount);
            }
        }
        
        return total;
    }

    /**
     * @dev Check if a credit is expired
     * @param tokenId Token ID of the credit
     * @return True if the credit is expired
     */
    function isExpired(uint256 tokenId) external view returns (bool) {
        return _isExpired(tokenId);
    }

    /**
     * @dev Internal function to check if a credit is expired
     * @param tokenId Token ID of the credit
     * @return True if the credit is expired
     */
    function _isExpired(uint256 tokenId) internal view returns (bool) {
        return carbonCredits[tokenId].expiryDate > 0 && block.timestamp > carbonCredits[tokenId].expiryDate;
    }

    /**
     * @dev Remove an element from an array
     * @param array Array to remove element from
     * @param element Element to remove
     */
    function _removeFromArray(uint256[] storage array, uint256 element) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == element) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
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

    // Override required functions for multiple inheritance
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
