// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IConsent
 * @dev Interface for patient consent management in AfriHealth Ledger
 */
interface IConsent {
    /// Emitted when consent is requested
    event ConsentRequested(
        address indexed patient,
        address indexed provider,
        bytes32 indexed consentId,
        string[] scopes,
        uint256 expiresAt,
        string purpose
    );

    /// Emitted when consent is granted
    event ConsentGranted(
        bytes32 indexed consentId,
        address indexed grantedBy,
        uint256 grantedAt
    );

    /// Emitted when consent is revoked
    event ConsentRevoked(
        bytes32 indexed consentId,
        address indexed revokedBy,
        uint256 revokedAt
    );

    /// Emitted when emergency access is invoked
    event EmergencyAccessInvoked(
        address indexed patient,
        address indexed provider,
        string reason,
        uint256 invokedAt
    );

    /// Emitted when expired consents are cleaned up
    event ConsentCleanup(bytes32[] consentIds, uint256 cleanedAt);

    /// Request consent from a patient
    /// @param patient The patient's address
    /// @param scopes Array of data scopes being requested
    /// @param duration Duration in seconds for the consent
    /// @param purpose Description of why consent is needed
    /// @return consentId Unique identifier for this consent request
    function requestConsent(
        address patient,
        string[] calldata scopes,
        uint256 duration,
        string calldata purpose
    ) external returns (bytes32 consentId);

    /// Grant consent for a specific request
    /// @param consentId The consent request identifier
    function grantConsent(bytes32 consentId) external;

    /// Revoke consent
    /// @param consentId The consent identifier to revoke
    function revokeConsent(bytes32 consentId) external;

    /// Check if consent is active for a patient-provider-scope combination
    /// @param patient The patient's address
    /// @param provider The provider's address
    /// @param scope The data scope to check
    /// @return isActive True if consent is active and not expired
    /// @return expiresAt Timestamp when consent expires
    function hasActiveConsent(
        address patient,
        address provider,
        string calldata scope
    ) external view returns (bool isActive, uint256 expiresAt);

    /// Get all consents for a patient
    /// @param patient The patient's address
    /// @return consentIds Array of consent identifiers
    function getPatientConsents(
        address patient
    ) external view returns (bytes32[] memory consentIds);

    /// Get details of a specific consent request
    /// @param consentId The consent identifier
    /// @return patient The patient's address
    /// @return provider The provider's address
    /// @return scopes Array of data scopes
    /// @return expiresAt Timestamp when consent expires
    /// @return purpose Description of consent purpose
    /// @return isGranted Whether consent has been granted
    /// @return grantedAt Timestamp when consent was granted
    function getConsentRequest(
        bytes32 consentId
    )
        external
        view
        returns (
            address patient,
            address provider,
            string[] memory scopes,
            uint256 expiresAt,
            string memory purpose,
            bool isGranted,
            uint256 grantedAt
        );

    /// Invoke emergency access (provider calls this)
    /// @param patient The patient's address
    /// @param reason The reason for emergency access
    function invokeEmergencyAccess(
        address patient,
        string calldata reason
    ) external;

    /// Clean up expired consents
    /// @return cleanedCount Number of consents cleaned up
    function cleanupExpiredConsents() external returns (uint256 cleanedCount);
}
