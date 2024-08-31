// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./CarbonCredit.sol";

/**
 * @title CarbonCreditMarketplace
 * @dev Marketplace for trading carbon credits with auction and fixed price mechanisms
 * @author Edwiin-Hoover
 */
contract CarbonCreditMarketplace is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    
    // Marketplace structures
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 quantity;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 startingPrice;
        uint256 currentBid;
        address currentBidder;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isEnded;
    }
    
    struct Offer {
        address offerer;
        address nftContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
        uint256 expiresAt;
        bool isActive;
    }
    
    // Storage
    Counters.Counter private _listingIdCounter;
    Counters.Counter private _auctionIdCounter;
    Counters.Counter private _offerIdCounter;
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Offer) public offers;
    
    // Fee configuration
    uint256 public platformFeePercent = 250; // 2.5%
    uint256 public constant MAX_FEE_PERCENT = 1000; // 10%
    
    address public feeRecipient;
    address public treasury;
    
    // Supported payment tokens
    mapping(address => bool) public supportedTokens;
    address public nativeToken; // ETH/BNB/MATIC
    
    // Events
    event ListingCreated(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId, uint256 price, uint256 quantity);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);
    event ListingCancelled(uint256 indexed listingId);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 price, uint256 quantity);
    
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address nftContract, uint256 tokenId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 bidAmount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 winningBid);
    event AuctionCancelled(uint256 indexed auctionId);
    
    event OfferCreated(uint256 indexed offerId, address indexed offerer, address nftContract, uint256 tokenId, uint256 price, uint256 quantity);
    event OfferAccepted(uint256 indexed offerId, address indexed seller);
    event OfferCancelled(uint256 indexed offerId);
    
    event PlatformFeeUpdated(uint256 newFeePercent);
    event FeeRecipientUpdated(address newRecipient);
    event SupportedTokenUpdated(address token, bool supported);
    
    // Modifiers
    modifier onlyListingOwner(uint256 listingId) {
        require(listings[listingId].seller == msg.sender, "Marketplace: Not listing owner");
        _;
    }
    
    modifier onlyAuctionOwner(uint256 auctionId) {
        require(auctions[auctionId].seller == msg.sender, "Marketplace: Not auction owner");
        _;
    }
    
    modifier onlyOfferOwner(uint256 offerId) {
        require(offers[offerId].offerer == msg.sender, "Marketplace: Not offer owner");
        _;
    }
    
    modifier validListing(uint256 listingId) {
        require(listings[listingId].isActive, "Marketplace: Listing not active");
        require(block.timestamp < listings[listingId].expiresAt, "Marketplace: Listing expired");
        _;
    }
    
    modifier validAuction(uint256 auctionId) {
        require(auctions[auctionId].isActive, "Marketplace: Auction not active");
        require(block.timestamp < auctions[auctionId].endTime, "Marketplace: Auction ended");
        _;
    }
    
    modifier validOffer(uint256 offerId) {
        require(offers[offerId].isActive, "Marketplace: Offer not active");
        require(block.timestamp < offers[offerId].expiresAt, "Marketplace: Offer expired");
        _;
    }
    
    constructor(
        address _feeRecipient,
        address _treasury,
        address _nativeToken
    ) {
        require(_feeRecipient != address(0), "Marketplace: Invalid fee recipient");
        require(_treasury != address(0), "Marketplace: Invalid treasury");
        
        feeRecipient = _feeRecipient;
        treasury = _treasury;
        nativeToken = _nativeToken;
        
        // Support native token by default
        supportedTokens[_nativeToken] = true;
    }
    
    /**
     * @dev Create a fixed price listing
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Price per credit
     * @param quantity Quantity to sell
     * @param expiresAt Expiration timestamp
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 quantity,
        uint256 expiresAt
    ) external whenNotPaused nonReentrant {
        require(price > 0, "Marketplace: Invalid price");
        require(quantity > 0, "Marketplace: Invalid quantity");
        require(expiresAt > block.timestamp, "Marketplace: Invalid expiration");
        require(expiresAt <= block.timestamp + 365 days, "Marketplace: Expiration too far");
        
        // Verify NFT ownership and approval
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Marketplace: Not NFT owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Marketplace: NFT not approved");
        
        // Check if it's a carbon credit NFT
        CarbonCredit carbonCredit = CarbonCredit(nftContract);
        require(carbonCredit.ownerOf(tokenId) == msg.sender, "Marketplace: Not carbon credit owner");
        
        uint256 listingId = _listingIdCounter.current();
        _listingIdCounter.increment();
        
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            quantity: quantity,
            isActive: true,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, price, quantity);
    }
    
    /**
     * @dev Buy from a listing
     * @param listingId Listing ID to buy from
     * @param quantity Quantity to buy
     * @param paymentToken Payment token address (address(0) for native)
     */
    function buyFromListing(
        uint256 listingId,
        uint256 quantity,
        address paymentToken
    ) external payable whenNotPaused nonReentrant validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(quantity <= listing.quantity, "Marketplace: Insufficient quantity");
        require(supportedTokens[paymentToken], "Marketplace: Unsupported payment token");
        
        uint256 totalPrice = listing.price * quantity;
        uint256 platformFee = (totalPrice * platformFeePercent) / 10000;
        uint256 sellerAmount = totalPrice - platformFee;
        
        // Handle payment
        if (paymentToken == nativeToken) {
            require(msg.value >= totalPrice, "Marketplace: Insufficient payment");
            
            // Transfer to seller
            payable(listing.seller).transfer(sellerAmount);
            
            // Transfer platform fee
            if (platformFee > 0) {
                payable(feeRecipient).transfer(platformFee);
            }
            
            // Refund excess
            if (msg.value > totalPrice) {
                payable(msg.sender).transfer(msg.value - totalPrice);
            }
        } else {
            IERC20 token = IERC20(paymentToken);
            require(token.transferFrom(msg.sender, address(this), totalPrice), "Marketplace: Payment failed");
            
            // Transfer to seller
            require(token.transfer(listing.seller, sellerAmount), "Marketplace: Seller transfer failed");
            
            // Transfer platform fee
            if (platformFee > 0) {
                require(token.transfer(feeRecipient, platformFee), "Marketplace: Fee transfer failed");
            }
        }
        
        // Transfer NFT
        CarbonCredit carbonCredit = CarbonCredit(listing.nftContract);
        carbonCredit.transferFrom(listing.seller, msg.sender, listing.tokenId);
        
        // Update listing
        listing.quantity -= quantity;
        if (listing.quantity == 0) {
            listing.isActive = false;
        }
        
        emit ListingSold(listingId, msg.sender, totalPrice, quantity);
    }
    
    /**
     * @dev Create an auction
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to auction
     * @param quantity Quantity to auction
     * @param startingPrice Starting bid price
     * @param duration Auction duration in seconds
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 startingPrice,
        uint256 duration
    ) external whenNotPaused nonReentrant {
        require(startingPrice > 0, "Marketplace: Invalid starting price");
        require(quantity > 0, "Marketplace: Invalid quantity");
        require(duration >= 1 hours && duration <= 30 days, "Marketplace: Invalid duration");
        
        // Verify NFT ownership and approval
        CarbonCredit carbonCredit = CarbonCredit(nftContract);
        require(carbonCredit.ownerOf(tokenId) == msg.sender, "Marketplace: Not NFT owner");
        require(carbonCredit.isApprovedForAll(msg.sender, address(this)) || carbonCredit.getApproved(tokenId) == address(this), "Marketplace: NFT not approved");
        
        uint256 auctionId = _auctionIdCounter.current();
        _auctionIdCounter.increment();
        
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            quantity: quantity,
            startingPrice: startingPrice,
            currentBid: 0,
            currentBidder: address(0),
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true,
            isEnded: false
        });
        
        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, startingPrice, block.timestamp + duration);
    }
    
    /**
     * @dev Place a bid on an auction
     * @param auctionId Auction ID to bid on
     * @param paymentToken Payment token address
     */
    function placeBid(
        uint256 auctionId,
        address paymentToken
    ) external payable whenNotPaused nonReentrant validAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(supportedTokens[paymentToken], "Marketplace: Unsupported payment token");
        
        uint256 bidAmount = paymentToken == nativeToken ? msg.value : 0;
        require(bidAmount > auction.currentBid, "Marketplace: Bid too low");
        require(bidAmount >= auction.startingPrice, "Marketplace: Bid below starting price");
        
        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            if (paymentToken == nativeToken) {
                payable(auction.currentBidder).transfer(auction.currentBid);
            } else {
                IERC20 token = IERC20(paymentToken);
                token.transfer(auction.currentBidder, auction.currentBid);
            }
        }
        
        // Update auction with new bid
        auction.currentBid = bidAmount;
        auction.currentBidder = msg.sender;
        
        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }
    
    /**
     * @dev End an auction
     * @param auctionId Auction ID to end
     */
    function endAuction(uint256 auctionId) external whenNotPaused nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.isActive, "Marketplace: Auction not active");
        require(block.timestamp >= auction.endTime || msg.sender == auction.seller, "Marketplace: Not authorized to end");
        
        auction.isActive = false;
        auction.isEnded = true;
        
        if (auction.currentBidder != address(0)) {
            // Transfer NFT to winner
            CarbonCredit carbonCredit = CarbonCredit(auction.nftContract);
            carbonCredit.transferFrom(auction.seller, auction.currentBidder, auction.tokenId);
            
            // Calculate fees
            uint256 platformFee = (auction.currentBid * platformFeePercent) / 10000;
            uint256 sellerAmount = auction.currentBid - platformFee;
            
            // Transfer payment to seller
            payable(auction.seller).transfer(sellerAmount);
            
            // Transfer platform fee
            if (platformFee > 0) {
                payable(feeRecipient).transfer(platformFee);
            }
            
            emit AuctionEnded(auctionId, auction.currentBidder, auction.currentBid);
        } else {
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }
    
    /**
     * @dev Create an offer for an NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to offer on
     * @param quantity Quantity to offer for
     * @param price Price per credit
     * @param expiresAt Expiration timestamp
     * @param paymentToken Payment token address
     */
    function createOffer(
        address nftContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        uint256 expiresAt,
        address paymentToken
    ) external payable whenNotPaused nonReentrant {
        require(price > 0, "Marketplace: Invalid price");
        require(quantity > 0, "Marketplace: Invalid quantity");
        require(expiresAt > block.timestamp, "Marketplace: Invalid expiration");
        require(supportedTokens[paymentToken], "Marketplace: Unsupported payment token");
        
        uint256 totalAmount = price * quantity;
        
        if (paymentToken == nativeToken) {
            require(msg.value >= totalAmount, "Marketplace: Insufficient payment");
        } else {
            IERC20 token = IERC20(paymentToken);
            require(token.transferFrom(msg.sender, address(this), totalAmount), "Marketplace: Payment escrow failed");
        }
        
        uint256 offerId = _offerIdCounter.current();
        _offerIdCounter.increment();
        
        offers[offerId] = Offer({
            offerer: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            quantity: quantity,
            price: price,
            expiresAt: expiresAt,
            isActive: true
        });
        
        emit OfferCreated(offerId, msg.sender, nftContract, tokenId, price, quantity);
    }
    
    /**
     * @dev Accept an offer
     * @param offerId Offer ID to accept
     */
    function acceptOffer(uint256 offerId) external whenNotPaused nonReentrant validOffer(offerId) {
        Offer storage offer = offers[offerId];
        
        // Verify NFT ownership
        CarbonCredit carbonCredit = CarbonCredit(offer.nftContract);
        require(carbonCredit.ownerOf(offer.tokenId) == msg.sender, "Marketplace: Not NFT owner");
        
        uint256 totalAmount = offer.price * offer.quantity;
        uint256 platformFee = (totalAmount * platformFeePercent) / 10000;
        uint256 sellerAmount = totalAmount - platformFee;
        
        // Transfer NFT
        carbonCredit.transferFrom(msg.sender, offer.offerer, offer.tokenId);
        
        // Transfer payment
        payable(msg.sender).transfer(sellerAmount);
        if (platformFee > 0) {
            payable(feeRecipient).transfer(platformFee);
        }
        
        offer.isActive = false;
        
        emit OfferAccepted(offerId, msg.sender);
    }
    
    /**
     * @dev Cancel a listing
     * @param listingId Listing ID to cancel
     */
    function cancelListing(uint256 listingId) external onlyListingOwner(listingId) {
        listings[listingId].isActive = false;
        emit ListingCancelled(listingId);
    }
    
    /**
     * @dev Cancel an auction
     * @param auctionId Auction ID to cancel
     */
    function cancelAuction(uint256 auctionId) external onlyAuctionOwner(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(auction.isActive, "Marketplace: Auction not active");
        require(auction.currentBidder == address(0), "Marketplace: Cannot cancel auction with bids");
        
        auction.isActive = false;
        emit AuctionCancelled(auctionId);
    }
    
    /**
     * @dev Cancel an offer
     * @param offerId Offer ID to cancel
     */
    function cancelOffer(uint256 offerId) external onlyOfferOwner(offerId) {
        Offer storage offer = offers[offerId];
        require(offer.isActive, "Marketplace: Offer not active");
        
        offer.isActive = false;
        
        // Refund payment
        uint256 totalAmount = offer.price * offer.quantity;
        payable(offer.offerer).transfer(totalAmount);
        
        emit OfferCancelled(offerId);
    }
    
    /**
     * @dev Update listing price
     * @param listingId Listing ID to update
     * @param newPrice New price
     */
    function updateListingPrice(uint256 listingId, uint256 newPrice) external onlyListingOwner(listingId) {
        require(newPrice > 0, "Marketplace: Invalid price");
        listings[listingId].price = newPrice;
        emit ListingUpdated(listingId, newPrice);
    }
    
    // Admin functions
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= MAX_FEE_PERCENT, "Marketplace: Fee too high");
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(newFeePercent);
    }
    
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Marketplace: Invalid recipient");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }
    
    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit SupportedTokenUpdated(token, supported);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View functions
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }
    
    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }
    
    function getActiveListingsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _listingIdCounter.current(); i++) {
            if (listings[i].isActive) count++;
        }
        return count;
    }
    
    function getActiveAuctionsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _auctionIdCounter.current(); i++) {
            if (auctions[i].isActive) count++;
        }
        return count;
    }
    
    function getActiveOffersCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _offerIdCounter.current(); i++) {
            if (offers[i].isActive) count++;
        }
        return count;
    }
}
