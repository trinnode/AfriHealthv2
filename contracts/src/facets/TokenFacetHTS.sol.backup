// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IToken.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "hedera-smart-contracts/system-contracts/hedera-token-service/HederaTokenService.sol";
import "hedera-smart-contracts/system-contracts/hedera-token-service/IHederaTokenService.sol";
import "hedera-smart-contracts/system-contracts/HederaResponseCodes.sol";

/**
 * @title TokenFacetHTS
 * @dev Facet for Hedera Token Service (HTS) integration
 * @notice Uses HTS precompiled contracts for native token operations on Hedera
 */
contract TokenFacetHTS is
    IToken,
    AccessControl,
    ReentrancyGuard,
    Pausable,
    HederaTokenService
{
    /// @notice Storage structure for token data
    struct TokenStorage {
        address platformCreditToken;
        address insurancePoolToken;
        address reputationNFT;
        mapping(address => address[]) associatedTokens;
        mapping(address => mapping(address => bool)) tokenAssociations;
        mapping(address => bool) kycApprovals;
        bool tokensCreated;
    }

    /// @notice Storage position for token data
    bytes32 constant TOKEN_STORAGE_POSITION =
        keccak256("diamond.token.storage");

    /// @notice HCS Topic IDs for token events
    bytes32 constant TOKEN_EVENTS_TOPIC = keccak256("afrihealth.token.events");

    /**
     * @dev Get token storage
     */
    function getTokenStorage() internal pure returns (TokenStorage storage ts) {
        bytes32 position = TOKEN_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }

    /// @inheritdoc IToken
    function initializeTokens(
        address platformCreditToken,
        address insurancePoolToken
    ) external nonReentrant {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: must have admin role"
        );
        TokenStorage storage ts = getTokenStorage();

        require(!ts.tokensCreated, "TokenFacet: tokens already initialized");

        ts.platformCreditToken = platformCreditToken;
        ts.insurancePoolToken = insurancePoolToken;
        ts.tokensCreated = true;

        emit TokensInitialized(
            platformCreditToken,
            insurancePoolToken,
            msg.sender
        );
    }

    /**
     * @notice Create Platform Credit token using HTS
     * @return tokenAddress The address of the created token
     */
    function createPlatformCreditToken()
        external
        nonReentrant
        returns (address tokenAddress)
    {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: must have admin role"
        );
        TokenStorage storage ts = getTokenStorage();
        require(!ts.tokensCreated, "TokenFacet: tokens already created");

        IHederaTokenService.HederaToken memory token;
        token.name = "AfriHealth Credit";
        token.symbol = "AHC";
        token.treasury = address(this);

        IHederaTokenService.TokenKey[]
            memory keys = new IHederaTokenService.TokenKey[](2);
        keys[0] = getSingleKey(
            KeyType.ADMIN,
            KeyValueType.CONTRACT_ID,
            abi.encodePacked(address(this))
        );
        keys[1] = getSingleKey(
            KeyType.SUPPLY,
            KeyValueType.CONTRACT_ID,
            abi.encodePacked(address(this))
        );
        token.tokenKeys = keys;

        IHederaTokenService.Expiry memory expiry;
        expiry.autoRenewAccount = address(this);
        expiry.autoRenewPeriod = 8000000; // ~90 days
        token.expiry = expiry;

        (int responseCode, address createdToken) = HederaTokenService
            .createFungibleToken(
                token,
                1000000 * 100, // 1M tokens with 2 decimals
                2 // decimals
            );

        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: token creation failed"
        );

        ts.platformCreditToken = createdToken;

        emit TokenCreated(createdToken, "AfriHealth Credit", "AHC");
        return createdToken;
    }

    /**
     * @notice Create Insurance Pool token using HTS
     * @return tokenAddress The address of the created token
     */
    function createInsurancePoolToken()
        external
        nonReentrant
        returns (address tokenAddress)
    {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: must have admin role"
        );
        TokenStorage storage ts = getTokenStorage();

        IHederaTokenService.HederaToken memory token;
        token.name = "AfriHealth Insurance Token";
        token.symbol = "AHIT";
        token.treasury = address(this);

        IHederaTokenService.TokenKey[]
            memory keys = new IHederaTokenService.TokenKey[](2);
        keys[0] = getSingleKey(
            KeyType.ADMIN,
            KeyValueType.CONTRACT_ID,
            abi.encodePacked(address(this))
        );
        keys[1] = getSingleKey(
            KeyType.SUPPLY,
            KeyValueType.CONTRACT_ID,
            abi.encodePacked(address(this))
        );
        token.tokenKeys = keys;

        IHederaTokenService.Expiry memory expiry;
        expiry.autoRenewAccount = address(this);
        expiry.autoRenewPeriod = 8000000;
        token.expiry = expiry;

        (int responseCode, address createdToken) = HederaTokenService
            .createFungibleToken(
                token,
                10000000 * 100, // 10M tokens with 2 decimals
                2
            );

        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: token creation failed"
        );

        ts.insurancePoolToken = createdToken;

        emit TokenCreated(createdToken, "AfriHealth Insurance Token", "AHIT");
        return createdToken;
    }

    /// @inheritdoc IToken
    function mintPlatformCredit(
        address to,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: must have admin role"
        );
        TokenStorage storage ts = getTokenStorage();
        require(
            ts.platformCreditToken != address(0),
            "TokenFacet: token not initialized"
        );

        // Mint tokens using HTS
        (int responseCode, , ) = HederaTokenService.mintToken(
            ts.platformCreditToken,
            amount,
            new bytes[](0)
        );

        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: mint failed"
        );

        // Transfer to recipient
        int transferResponse = HederaTokenService.transferToken(
            ts.platformCreditToken,
            address(this),
            to,
            int64(int256(amount))
        );

        require(
            transferResponse == HederaResponseCodes.SUCCESS,
            "TokenFacet: transfer failed"
        );

        emit PlatformCreditMinted(to, amount, msg.sender);
    }

    /// @inheritdoc IToken
    function burnPlatformCredit(
        address from,
        uint256 amount
    ) external nonReentrant {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: must have admin role"
        );
        TokenStorage storage ts = getTokenStorage();
        require(
            ts.platformCreditToken != address(0),
            "TokenFacet: token not initialized"
        );

        // Transfer tokens to this contract first
        int transferResponse = HederaTokenService.transferToken(
            ts.platformCreditToken,
            from,
            address(this),
            int64(int256(amount))
        );

        require(
            transferResponse == HederaResponseCodes.SUCCESS,
            "TokenFacet: transfer failed"
        );

        // Burn tokens using HTS
        (int responseCode, ) = HederaTokenService.burnToken(
            ts.platformCreditToken,
            amount,
            new int64[](0)
        );

        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: burn failed"
        );

        emit PlatformCreditBurned(from, amount, msg.sender);
    }

    /// @inheritdoc IToken
    function mintInsurancePoolToken(
        address to,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: must have admin role"
        );
        TokenStorage storage ts = getTokenStorage();
        require(
            ts.insurancePoolToken != address(0),
            "TokenFacet: token not initialized"
        );

        (int responseCode, , ) = HederaTokenService.mintToken(
            ts.insurancePoolToken,
            amount,
            new bytes[](0)
        );

        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: mint failed"
        );

        int transferResponse = HederaTokenService.transferToken(
            ts.insurancePoolToken,
            address(this),
            to,
            int64(int256(amount))
        );

        require(
            transferResponse == HederaResponseCodes.SUCCESS,
            "TokenFacet: transfer failed"
        );

        emit InsurancePoolTokenMinted(to, amount, msg.sender);
    }

    /// @inheritdoc IToken
    function burnInsurancePoolToken(
        address from,
        uint256 amount
    ) external nonReentrant {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: must have admin role"
        );
        TokenStorage storage ts = getTokenStorage();
        require(
            ts.insurancePoolToken != address(0),
            "TokenFacet: token not initialized"
        );

        int transferResponse = HederaTokenService.transferToken(
            ts.insurancePoolToken,
            from,
            address(this),
            int64(int256(amount))
        );

        require(
            transferResponse == HederaResponseCodes.SUCCESS,
            "TokenFacet: transfer failed"
        );

        (int responseCode, ) = HederaTokenService.burnToken(
            ts.insurancePoolToken,
            amount,
            new int64[](0)
        );

        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: burn failed"
        );

        emit InsurancePoolTokenBurned(from, amount, msg.sender);
    }

    /**
     * @notice Associate a token with an account using HTS
     * @param account The account to associate
     * @param token The token address to associate
     */
    function associateToken(
        address account,
        address token
    ) external nonReentrant {
        require(
            msg.sender == account || hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: unauthorized"
        );
        TokenStorage storage ts = getTokenStorage();

        int responseCode = HederaTokenService.associateToken(account, token);
        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: association failed"
        );

        ts.tokenAssociations[account][token] = true;
        ts.associatedTokens[account].push(token);

        emit TokenAssociated(account, token);
    }

    /**
     * @notice Dissociate a token from an account using HTS
     * @param account The account to dissociate
     * @param token The token address to dissociate
     */
    function dissociateToken(
        address account,
        address token
    ) external nonReentrant {
        require(
            msg.sender == account || hasRole(ADMIN_ROLE, msg.sender),
            "TokenFacet: unauthorized"
        );
        TokenStorage storage ts = getTokenStorage();

        int responseCode = HederaTokenService.dissociateToken(account, token);
        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: dissociation failed"
        );

        ts.tokenAssociations[account][token] = false;

        emit TokenDissociated(account, token);
    }

    /**
     * @notice Get Platform Credit token address
     */
    function getPlatformCreditToken() external view returns (address) {
        return getTokenStorage().platformCreditToken;
    }

    /**
     * @notice Get Insurance Pool token address
     */
    function getInsurancePoolToken() external view returns (address) {
        return getTokenStorage().insurancePoolToken;
    }

    /**
     * @notice Check if account has token associated
     */
    function isTokenAssociated(
        address account,
        address token
    ) external view returns (bool) {
        return getTokenStorage().tokenAssociations[account][token];
    }

    /**
     * @notice Get all associated tokens for an account
     */
    function getAssociatedTokens(
        address account
    ) external view returns (address[] memory) {
        return getTokenStorage().associatedTokens[account];
    }

    /**
     * @notice Get token balance using HTS
     */
    function getTokenBalance(
        address token,
        address account
    ) external returns (uint256) {
        (int responseCode, int64 balance) = HederaTokenService.balanceOf(
            token,
            account
        );
        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "TokenFacet: balance query failed"
        );
        return uint256(int256(balance));
    }

    /**
     * @notice Helper function to create a single key structure
     */
    function getSingleKey(
        KeyType keyType,
        KeyValueType keyValueType,
        bytes memory key
    ) internal pure returns (IHederaTokenService.TokenKey memory) {
        IHederaTokenService.TokenKey memory tokenKey;
        tokenKey.keyType = uint256(keyType);

        IHederaTokenService.KeyValue memory keyValue;
        keyValue.inheritAccountKey = false;

        if (keyValueType == KeyValueType.CONTRACT_ID) {
            keyValue.contractId = abi.decode(key, (address));
        } else if (keyValueType == KeyValueType.ED25519) {
            keyValue.ed25519 = key;
        }

        tokenKey.key = keyValue;
        return tokenKey;
    }

    // Key type enum
    enum KeyType {
        ADMIN,
        KYC,
        FREEZE,
        WIPE,
        SUPPLY,
        FEE,
        PAUSE
    }

    enum KeyValueType {
        INHERIT_ACCOUNT_KEY,
        CONTRACT_ID,
        ED25519,
        SECP256K1,
        DELEGATABLE_CONTRACT_ID
    }

    // Additional events
    event TokenCreated(address indexed token, string name, string symbol);
    event TokenAssociated(address indexed account, address indexed token);
    event TokenDissociated(address indexed account, address indexed token);
}
