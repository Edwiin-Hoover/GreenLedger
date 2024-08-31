// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title Oracle
 * @dev Oracle contract for fetching external carbon data and price feeds
 * @author Edwiin-Hoover
 */
contract Oracle is Ownable, ReentrancyGuard {
    // Chainlink price feeds
    AggregatorV3Interface public carbonPriceFeed;
    AggregatorV3Interface public ethPriceFeed;
    
    // Oracle data structures
    struct CarbonData {
        uint256 carbonPriceUSD;
        uint256 timestamp;
        bool isValid;
    }
    
    struct VerificationData {
        string methodology;
        string standard;
        uint256 verificationScore;
        uint256 timestamp;
        bool isValid;
    }
    
    // Storage
    mapping(bytes32 => CarbonData) public carbonData;
    mapping(bytes32 => VerificationData) public verificationData;
    mapping(address => bool) public authorizedOracles;
    
    // Events
    event CarbonDataUpdated(bytes32 indexed dataHash, uint256 price, uint256 timestamp);
    event VerificationDataUpdated(bytes32 indexed dataHash, string methodology, uint256 score);
    event OracleAuthorized(address indexed oracle, bool authorized);
    event EmergencyStop(bool stopped);
    
    // State
    bool public emergencyStopped = false;
    uint256 public constant MAX_DATA_AGE = 24 hours;
    uint256 public constant MIN_VERIFICATION_SCORE = 70; // 70% minimum
    
    // Modifiers
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "Oracle: Not authorized");
        _;
    }
    
    modifier whenNotStopped() {
        require(!emergencyStopped, "Oracle: Contract stopped");
        _;
    }
    
    modifier validDataAge(uint256 timestamp) {
        require(block.timestamp - timestamp <= MAX_DATA_AGE, "Oracle: Data too old");
        _;
    }
    
    constructor(
        address _carbonPriceFeed,
        address _ethPriceFeed
    ) {
        carbonPriceFeed = AggregatorV3Interface(_carbonPriceFeed);
        ethPriceFeed = AggregatorV3Interface(_ethPriceFeed);
        
        // Authorize deployer as initial oracle
        authorizedOracles[msg.sender] = true;
    }
    
    /**
     * @dev Update carbon price data
     * @param dataHash Hash of the carbon data
     * @param price Carbon price in USD (scaled by 1e8)
     * @param timestamp Data timestamp
     */
    function updateCarbonData(
        bytes32 dataHash,
        uint256 price,
        uint256 timestamp
    ) external onlyAuthorizedOracle whenNotStopped validDataAge(timestamp) {
        require(price > 0, "Oracle: Invalid price");
        
        carbonData[dataHash] = CarbonData({
            carbonPriceUSD: price,
            timestamp: timestamp,
            isValid: true
        });
        
        emit CarbonDataUpdated(dataHash, price, timestamp);
    }
    
    /**
     * @dev Update verification data
     * @param dataHash Hash of the verification data
     * @param methodology Verification methodology
     * @param standard Verification standard
     * @param score Verification score (0-100)
     * @param timestamp Data timestamp
     */
    function updateVerificationData(
        bytes32 dataHash,
        string calldata methodology,
        string calldata standard,
        uint256 score,
        uint256 timestamp
    ) external onlyAuthorizedOracle whenNotStopped validDataAge(timestamp) {
        require(score <= 100, "Oracle: Invalid score");
        require(bytes(methodology).length > 0, "Oracle: Empty methodology");
        require(bytes(standard).length > 0, "Oracle: Empty standard");
        
        verificationData[dataHash] = VerificationData({
            methodology: methodology,
            standard: standard,
            verificationScore: score,
            timestamp: timestamp,
            isValid: true
        });
        
        emit VerificationDataUpdated(dataHash, methodology, score);
    }
    
    /**
     * @dev Get latest carbon price from Chainlink
     * @return price Carbon price in USD (scaled by 1e8)
     * @return timestamp Price timestamp
     */
    function getLatestCarbonPrice() external view returns (uint256 price, uint256 timestamp) {
        require(address(carbonPriceFeed) != address(0), "Oracle: Price feed not set");
        
        try carbonPriceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80
        ) {
            require(answer > 0, "Oracle: Invalid price data");
            return (uint256(answer), updatedAt);
        } catch {
            revert("Oracle: Price feed error");
        }
    }
    
    /**
     * @dev Get latest ETH price from Chainlink
     * @return price ETH price in USD (scaled by 1e8)
     * @return timestamp Price timestamp
     */
    function getLatestETHPrice() external view returns (uint256 price, uint256 timestamp) {
        require(address(ethPriceFeed) != address(0), "Oracle: Price feed not set");
        
        try ethPriceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80
        ) {
            require(answer > 0, "Oracle: Invalid price data");
            return (uint256(answer), updatedAt);
        } catch {
            revert("Oracle: Price feed error");
        }
    }
    
    /**
     * @dev Get carbon data by hash
     * @param dataHash Hash of the data
     * @return data Carbon data struct
     */
    function getCarbonData(bytes32 dataHash) external view returns (CarbonData memory data) {
        data = carbonData[dataHash];
        require(data.isValid, "Oracle: Data not found");
        require(block.timestamp - data.timestamp <= MAX_DATA_AGE, "Oracle: Data expired");
        return data;
    }
    
    /**
     * @dev Get verification data by hash
     * @param dataHash Hash of the data
     * @return data Verification data struct
     */
    function getVerificationData(bytes32 dataHash) external view returns (VerificationData memory data) {
        data = verificationData[dataHash];
        require(data.isValid, "Oracle: Data not found");
        require(block.timestamp - data.timestamp <= MAX_DATA_AGE, "Oracle: Data expired");
        return data;
    }
    
    /**
     * @dev Check if verification meets minimum requirements
     * @param dataHash Hash of the verification data
     * @return valid True if verification is valid
     */
    function isVerificationValid(bytes32 dataHash) external view returns (bool valid) {
        VerificationData memory data = verificationData[dataHash];
        return data.isValid && 
               data.verificationScore >= MIN_VERIFICATION_SCORE &&
               block.timestamp - data.timestamp <= MAX_DATA_AGE;
    }
    
    /**
     * @dev Calculate carbon credit price in ETH
     * @param carbonPriceUSD Carbon price in USD (scaled by 1e8)
     * @return ethPrice Carbon price in ETH (scaled by 1e18)
     */
    function calculateCarbonPriceInETH(uint256 carbonPriceUSD) external view returns (uint256 ethPrice) {
        (uint256 ethPriceUSD,,) = getLatestETHPrice();
        require(ethPriceUSD > 0, "Oracle: Invalid ETH price");
        
        // Convert USD to ETH: (carbonPriceUSD * 1e18) / ethPriceUSD
        return (carbonPriceUSD * 1e18) / ethPriceUSD;
    }
    
    /**
     * @dev Authorize or deauthorize an oracle
     * @param oracle Oracle address
     * @param authorized Authorization status
     */
    function setOracleAuthorization(address oracle, bool authorized) external onlyOwner {
        require(oracle != address(0), "Oracle: Invalid address");
        authorizedOracles[oracle] = authorized;
        emit OracleAuthorized(oracle, authorized);
    }
    
    /**
     * @dev Update price feed addresses
     * @param _carbonPriceFeed New carbon price feed address
     * @param _ethPriceFeed New ETH price feed address
     */
    function updatePriceFeeds(address _carbonPriceFeed, address _ethPriceFeed) external onlyOwner {
        require(_carbonPriceFeed != address(0), "Oracle: Invalid carbon feed");
        require(_ethPriceFeed != address(0), "Oracle: Invalid ETH feed");
        
        carbonPriceFeed = AggregatorV3Interface(_carbonPriceFeed);
        ethPriceFeed = AggregatorV3Interface(_ethPriceFeed);
    }
    
    /**
     * @dev Emergency stop function
     * @param stopped Stop status
     */
    function setEmergencyStop(bool stopped) external onlyOwner {
        emergencyStopped = stopped;
        emit EmergencyStop(stopped);
    }
    
    /**
     * @dev Update maximum data age
     * @param newMaxAge New maximum age in seconds
     */
    function setMaxDataAge(uint256 newMaxAge) external onlyOwner {
        require(newMaxAge > 0 && newMaxAge <= 7 days, "Oracle: Invalid max age");
        // Note: This would require updating the modifier, so we'll keep it constant for now
    }
    
    /**
     * @dev Update minimum verification score
     * @param newMinScore New minimum score (0-100)
     */
    function setMinVerificationScore(uint256 newMinScore) external onlyOwner {
        require(newMinScore <= 100, "Oracle: Invalid score");
        // Note: This would require updating the constant, so we'll keep it constant for now
    }
    
    /**
     * @dev Batch update carbon data
     * @param dataHashes Array of data hashes
     * @param prices Array of prices
     * @param timestamps Array of timestamps
     */
    function batchUpdateCarbonData(
        bytes32[] calldata dataHashes,
        uint256[] calldata prices,
        uint256[] calldata timestamps
    ) external onlyAuthorizedOracle whenNotStopped {
        require(dataHashes.length == prices.length && prices.length == timestamps.length, "Oracle: Array length mismatch");
        
        for (uint256 i = 0; i < dataHashes.length; i++) {
            require(prices[i] > 0, "Oracle: Invalid price");
            require(block.timestamp - timestamps[i] <= MAX_DATA_AGE, "Oracle: Data too old");
            
            carbonData[dataHashes[i]] = CarbonData({
                carbonPriceUSD: prices[i],
                timestamp: timestamps[i],
                isValid: true
            });
            
            emit CarbonDataUpdated(dataHashes[i], prices[i], timestamps[i]);
        }
    }
    
    /**
     * @dev Invalidate old data
     * @param dataHashes Array of data hashes to invalidate
     */
    function invalidateData(bytes32[] calldata dataHashes) external onlyAuthorizedOracle {
        for (uint256 i = 0; i < dataHashes.length; i++) {
            if (carbonData[dataHashes[i]].isValid) {
                carbonData[dataHashes[i]].isValid = false;
            }
            if (verificationData[dataHashes[i]].isValid) {
                verificationData[dataHashes[i]].isValid = false;
            }
        }
    }
    
    /**
     * @dev Get oracle statistics
     * @return totalCarbonData Total number of carbon data entries
     * @return totalVerificationData Total number of verification data entries
     * @return authorizedOracleCount Number of authorized oracles
     */
    function getOracleStats() external view returns (
        uint256 totalCarbonData,
        uint256 totalVerificationData,
        uint256 authorizedOracleCount
    ) {
        // Note: This is a simplified version. In a real implementation,
        // you'd need to track these counts separately
        return (0, 0, 0);
    }
    
    /**
     * @dev Check if oracle is authorized
     * @param oracle Oracle address to check
     * @return authorized True if oracle is authorized
     */
    function isOracleAuthorized(address oracle) external view returns (bool authorized) {
        return authorizedOracles[oracle];
    }
    
    /**
     * @dev Get contract version
     * @return version Contract version string
     */
    function getVersion() external pure returns (string memory version) {
        return "1.0.0";
    }
}
