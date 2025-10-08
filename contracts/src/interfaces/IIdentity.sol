// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIdentity
 * @dev Interface for identity and verification management in AfriHealth Ledger
 */
interface IIdentity {
    /// Emitted when identity is registered
    event IdentityRegistered(
        address indexed account,
        string identityType,
        bytes32 identityHash,
        address indexed registeredBy
    );

    /// Emitted when provider is verified
    event ProviderVerified(
        address indexed provider,
        string licenseNumber,
        string specialty,
        address indexed verifiedBy
    );

    /// Emitted when provider verification is revoked
    event ProviderVerificationRevoked(
        address indexed provider,
        string reason,
        address indexed revokedBy
    );

    /// Emitted when KYC status is updated
    event KYCStatusUpdated(
        address indexed account,
        bool status,
        address indexed updatedBy
    );

    /// Emitted when DID is linked
    event DIDLinked(
        address indexed account,
        string did,
        address indexed linkedBy
    );

    /// Register identity information
    /// @param identityType Type of identity (e.g., "patient", "provider", "insurer")
    /// @param identityData Hash of identity data
    /// @param metadata Additional metadata
    function registerIdentity(
        string calldata identityType,
        bytes32 identityData,
        string calldata metadata
    ) external;

    /// Verify a healthcare provider
    /// @param provider Provider address to verify
    /// @param licenseNumber Medical license number
    /// @param specialty Medical specialty
    /// @param verificationData Hash of verification documents
    function verifyProvider(
        address provider,
        string calldata licenseNumber,
        string calldata specialty,
        bytes32 verificationData
    ) external;

    /// Revoke provider verification
    /// @param provider Provider address
    /// @param reason Reason for revocation
    function revokeProviderVerification(
        address provider,
        string calldata reason
    ) external;

    /// Update KYC status for an account
    /// @param account Account to update
    /// @param status New KYC status
    function updateKYCStatus(address account, bool status) external;

    /// Link a DID to an account
    /// @param did Decentralized identifier
    function linkDID(string calldata did) external;

    /// Get identity information
    /// @param account Account to get identity for
    /// @return identityType Type of identity
    /// @return identityHash Hash of identity data
    /// @return metadata Additional metadata
    /// @return registeredAt When identity was registered
    function getIdentity(
        address account
    )
        external
        view
        returns (
            string memory identityType,
            bytes32 identityHash,
            string memory metadata,
            uint256 registeredAt
        );

    /// Get provider information
    /// @param provider Provider address
    /// @return licenseNumber Medical license number
    /// @return specialty Medical specialty
    /// @return verificationData Hash of verification documents
    /// @return isVerified Whether provider is verified
    /// @return verifiedAt When provider was verified
    function getProviderInfo(
        address provider
    )
        external
        view
        returns (
            string memory licenseNumber,
            string memory specialty,
            bytes32 verificationData,
            bool isVerified,
            uint256 verifiedAt
        );

    /// Check if provider is verified
    /// @param provider Provider address
    /// @return True if provider is verified
    function isProviderVerified(address provider) external view returns (bool);

    /// Get KYC status for an account
    /// @param account Account to check
    /// @return True if account has passed KYC
    function getKYCStatus(address account) external view returns (bool);

    /// Get DID for an account
    /// @param account Account to get DID for
    /// @return did Decentralized identifier
    function getDID(address account) external view returns (string memory did);

    /// Get accounts by identity type
    /// @param identityType Type of identity to search for
    /// @param limit Maximum number of accounts to return
    /// @return accounts Array of account addresses
    function getAccountsByType(
        string calldata identityType,
        uint256 limit
    ) external view returns (address[] memory accounts);

    /// Get verified providers by specialty
    /// @param specialty Medical specialty to search for
    /// @return providers Array of verified provider addresses
    function getProvidersBySpecialty(
        string calldata specialty
    ) external view returns (address[] memory providers);

    /// Update identity information
    /// @param identityType New identity type
    /// @param identityData New identity data hash
    /// @param metadata New metadata
    function updateIdentity(
        string calldata identityType,
        bytes32 identityData,
        string calldata metadata
    ) external;
}
