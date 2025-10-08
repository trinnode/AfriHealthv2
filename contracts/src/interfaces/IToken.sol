// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IToken
 * @dev Interface for token management in AfriHealth Ledger using HTS
 */
interface IToken {
    /// Emitted when tokens are initialized
    event TokensInitialized(
        address platformCreditToken,
        address insurancePoolToken,
        address indexed initializedBy
    );

    /// Emitted when platform credit is minted
    event PlatformCreditMinted(
        address indexed to,
        uint256 amount,
        address indexed mintedBy
    );

    /// Emitted when platform credit is burned
    event PlatformCreditBurned(
        address indexed from,
        uint256 amount,
        address indexed burnedBy
    );

    /// Emitted when insurance pool token is minted
    event InsurancePoolTokenMinted(
        address indexed to,
        uint256 amount,
        address indexed mintedBy
    );

    /// Emitted when insurance pool token is burned
    event InsurancePoolTokenBurned(
        address indexed from,
        uint256 amount,
        address indexed burnedBy
    );

    /// Emitted when token is associated
    event TokenAssociated(
        address indexed account,
        address indexed token,
        address indexed associatedBy
    );

    /// Emitted when token is dissociated
    event TokenDissociated(
        address indexed account,
        address indexed token,
        address indexed dissociatedBy
    );

    /// Emitted when KYC approval is set
    event KYCApprovalSet(
        address indexed account,
        bool approved,
        address indexed setBy
    );

    /// Emitted when mint allowance is set
    event MintAllowanceSet(
        address indexed spender,
        uint256 allowance,
        address indexed setBy
    );

    /// Initialize token contracts
    /// @param platformCreditToken Address of the platform credit token
    /// @param insurancePoolToken Address of the insurance pool token
    function initializeTokens(
        address platformCreditToken,
        address insurancePoolToken
    ) external;

    /// Mint platform credit tokens
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function mintPlatformCredit(address to, uint256 amount) external;

    /// Burn platform credit tokens
    /// @param from Address to burn tokens from
    /// @param amount Amount of tokens to burn
    function burnPlatformCredit(address from, uint256 amount) external;

    /// Mint insurance pool tokens
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function mintInsurancePoolToken(address to, uint256 amount) external;

    /// Burn insurance pool tokens
    /// @param from Address to burn tokens from
    /// @param amount Amount of tokens to burn
    function burnInsurancePoolToken(address from, uint256 amount) external;

    /// Associate a token with an account
    /// @param account Account to associate token with
    /// @param token Token address to associate
    function associateToken(address account, address token) external;

    /// Dissociate a token from an account
    /// @param account Account to dissociate token from
    /// @param token Token address to dissociate
    function dissociateToken(address account, address token) external;

    /// Check if token is associated with account
    /// @param account Account to check
    /// @param token Token address to check
    /// @return True if token is associated
    function isTokenAssociated(
        address account,
        address token
    ) external view returns (bool);

    /// Get all associated tokens for an account
    /// @param account Account to get tokens for
    /// @return Array of associated token addresses
    function getAssociatedTokens(
        address account
    ) external view returns (address[] memory);

    /// Set KYC approval for an account
    /// @param account Account to set KYC for
    /// @param approved KYC approval status
    function setKYCApproval(address account, bool approved) external;

    /// Check if account has KYC approval
    /// @param account Account to check
    /// @return True if account has KYC approval
    function isKYCApproved(address account) external view returns (bool);

    /// Get platform credit balance for an account
    /// @param account Account to get balance for
    /// @return Balance of platform credit tokens
    function getPlatformCreditBalance(
        address account
    ) external view returns (uint256);

    /// Get insurance pool token balance for an account
    /// @param account Account to get balance for
    /// @return Balance of insurance pool tokens
    function getInsurancePoolBalance(
        address account
    ) external view returns (uint256);

    /// Set mint allowance for a spender
    /// @param spender Address allowed to mint
    /// @param allowance Amount allowed to mint
    function setMintAllowance(address spender, uint256 allowance) external;

    /// Get token addresses
    /// @return platformCredit Address of platform credit token
    /// @return insurancePool Address of insurance pool token
    function getTokenAddresses()
        external
        view
        returns (address platformCredit, address insurancePool);
}
