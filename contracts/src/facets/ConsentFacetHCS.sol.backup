// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IConsent.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "../utils/IdGenerator.sol";

/**
 * @title ConsentFacetHCS
 * @dev Facet for patient consent management with HCS event emission
 * @notice All consent lifecycle events are emitted for HCS topic logging
 */
contract ConsentFacetHCS is IConsent, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Storage structure for consent data
    struct ConsentStorage {
        mapping(bytes32 => ConsentRequest) consentRequests;
        mapping(address => bytes32[]) patientConsents;
        mapping(address => bytes32[]) providerConsents;
        mapping(address => mapping(address => mapping(string => bytes32))) activeConsents;
        bytes32[] expiredConsents;
        bytes32 hcsTopicId; // HCS Topic for consent events
    }

    /// @notice Consent request structure
    struct ConsentRequest {
        bytes32 consentId;
        address patient;
        address provider;
        string[] scopes;
        uint256 expiresAt;
        string purpose;
        bool isGranted;
        bool isRevoked;
        uint256 grantedAt;
        uint256 revokedAt;
        uint256 createdAt;
    }

    /// @notice Storage position for consent data
    bytes32 constant CONSENT_STORAGE_POSITION =
        keccak256("diamond.consent.storage");

    /// @notice HCS message event for off-chain topic submission
    event HCSConsentMessage(
        bytes32 indexed topicId,
        string eventType,
        bytes32 indexed consentId,
        address indexed patient,
        address provider,
        uint256 timestamp,
        bytes payload
    );

    /**
     * @dev Get consent storage
     */
    function getConsentStorage()
        internal
        pure
        returns (ConsentStorage storage cs)
    {
        bytes32 position = CONSENT_STORAGE_POSITION;
        assembly {
            cs.slot := position
        }
    }

    /**
     * @notice Set HCS Topic ID for consent events
     * @param topicId The HCS topic ID as bytes32
     */
    function setConsentHCSTopicId(bytes32 topicId) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "ConsentFacet: must have admin role"
        );
        ConsentStorage storage cs = getConsentStorage();
        cs.hcsTopicId = topicId;
    }

    /// @inheritdoc IConsent
    function requestConsent(
        address patient,
        string[] calldata scopes,
        uint256 duration,
        string calldata purpose
    )
        external
        onlyProvider
        nonReentrant
        whenNotPaused
        returns (bytes32 consentId)
    {
        ConsentStorage storage cs = getConsentStorage();

        consentId = IdGenerator.generateConsentId(patient, msg.sender, purpose);

        cs.consentRequests[consentId] = ConsentRequest({
            consentId: consentId,
            patient: patient,
            provider: msg.sender,
            scopes: scopes,
            expiresAt: block.timestamp + duration,
            purpose: purpose,
            isGranted: false,
            isRevoked: false,
            grantedAt: 0,
            revokedAt: 0,
            createdAt: block.timestamp
        });

        // Add to patient and provider consent lists
        cs.patientConsents[patient].push(consentId);
        cs.providerConsents[msg.sender].push(consentId);

        // Emit standard event
        emit ConsentRequested(
            patient,
            msg.sender,
            consentId,
            scopes,
            block.timestamp + duration,
            purpose
        );

        // Emit HCS message event for off-chain submission
        bytes memory hcsPayload = abi.encode(
            consentId,
            patient,
            msg.sender,
            scopes,
            block.timestamp + duration,
            purpose
        );

        emit HCSConsentMessage(
            cs.hcsTopicId,
            "CONSENT_REQUESTED",
            consentId,
            patient,
            msg.sender,
            block.timestamp,
            hcsPayload
        );
    }

    /// @inheritdoc IConsent
    function grantConsent(
        bytes32 consentId
    ) external nonReentrant whenNotPaused {
        ConsentStorage storage cs = getConsentStorage();
        ConsentRequest storage request = cs.consentRequests[consentId];

        require(request.patient == msg.sender, "Consent: not consent owner");
        require(!request.isGranted, "Consent: already granted");
        require(!request.isRevoked, "Consent: consent revoked");
        require(
            block.timestamp < request.expiresAt,
            "Consent: request expired"
        );

        request.isGranted = true;
        request.grantedAt = block.timestamp;

        // Set active consents for each scope
        for (uint256 i = 0; i < request.scopes.length; i++) {
            cs.activeConsents[request.patient][request.provider][
                request.scopes[i]
            ] = consentId;
        }

        emit ConsentGranted(consentId, msg.sender, block.timestamp);

        // Emit HCS message
        bytes memory hcsPayload = abi.encode(
            consentId,
            msg.sender,
            request.provider,
            request.scopes,
            block.timestamp
        );

        emit HCSConsentMessage(
            cs.hcsTopicId,
            "CONSENT_GRANTED",
            consentId,
            msg.sender,
            request.provider,
            block.timestamp,
            hcsPayload
        );
    }

    /// @inheritdoc IConsent
    function revokeConsent(bytes32 consentId) external nonReentrant {
        ConsentStorage storage cs = getConsentStorage();
        ConsentRequest storage request = cs.consentRequests[consentId];

        require(request.patient == msg.sender, "Consent: not consent owner");
        require(request.isGranted, "Consent: not granted");
        require(!request.isRevoked, "Consent: already revoked");

        request.isRevoked = true;
        request.revokedAt = block.timestamp;

        // Clear active consents
        for (uint256 i = 0; i < request.scopes.length; i++) {
            delete cs.activeConsents[request.patient][request.provider][
                request.scopes[i]
            ];
        }

        emit ConsentRevoked(consentId, msg.sender, block.timestamp);

        // Emit HCS message
        bytes memory hcsPayload = abi.encode(
            consentId,
            msg.sender,
            request.provider,
            block.timestamp
        );

        emit HCSConsentMessage(
            cs.hcsTopicId,
            "CONSENT_REVOKED",
            consentId,
            msg.sender,
            request.provider,
            block.timestamp,
            hcsPayload
        );
    }

    /// @inheritdoc IConsent
    function checkConsent(
        address patient,
        address provider,
        string calldata scope
    ) external view returns (bool) {
        ConsentStorage storage cs = getConsentStorage();
        bytes32 consentId = cs.activeConsents[patient][provider][scope];

        if (consentId == bytes32(0)) {
            return false;
        }

        ConsentRequest storage request = cs.consentRequests[consentId];

        return
            request.isGranted &&
            !request.isRevoked &&
            block.timestamp < request.expiresAt;
    }

    /// @inheritdoc IConsent
    function getConsentDetails(
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
        )
    {
        ConsentRequest storage request = getConsentStorage().consentRequests[
            consentId
        ];
        return (
            request.patient,
            request.provider,
            request.scopes,
            request.expiresAt,
            request.purpose,
            request.isGranted,
            request.grantedAt
        );
    }

    /**
     * @notice Get all consent IDs for a patient
     */
    function getPatientConsents(
        address patient
    ) external view returns (bytes32[] memory) {
        return getConsentStorage().patientConsents[patient];
    }

    /**
     * @notice Get all consent IDs requested by a provider
     */
    function getProviderConsents(
        address provider
    ) external view returns (bytes32[] memory) {
        return getConsentStorage().providerConsents[provider];
    }

    /**
     * @notice Get active consent ID for specific patient, provider, and scope
     */
    function getActiveConsentId(
        address patient,
        address provider,
        string calldata scope
    ) external view returns (bytes32) {
        return getConsentStorage().activeConsents[patient][provider][scope];
    }

    /**
     * @notice Check if consent is expired
     */
    function isConsentExpired(bytes32 consentId) external view returns (bool) {
        ConsentRequest storage request = getConsentStorage().consentRequests[
            consentId
        ];
        return block.timestamp >= request.expiresAt;
    }

    /**
     * @notice Check if consent is revoked
     */
    function isConsentRevoked(bytes32 consentId) external view returns (bool) {
        return getConsentStorage().consentRequests[consentId].isRevoked;
    }

    /// @inheritdoc IConsent
    function requestEmergencyAccess(
        address patient,
        string calldata reason
    ) external onlyProvider nonReentrant whenNotPaused {
        // Grant temporary emergency access with justification
        // This should be logged and reviewed

        emit EmergencyAccessInvoked(
            patient,
            msg.sender,
            reason,
            block.timestamp
        );

        // Emit HCS message for audit trail
        ConsentStorage storage cs = getConsentStorage();
        bytes memory hcsPayload = abi.encode(
            patient,
            msg.sender,
            reason,
            block.timestamp
        );

        emit HCSConsentMessage(
            cs.hcsTopicId,
            "EMERGENCY_ACCESS",
            bytes32(0),
            patient,
            msg.sender,
            block.timestamp,
            hcsPayload
        );
    }

    /**
     * @notice Batch cleanup of expired consents
     * @param limit Maximum number of consents to clean
     */
    function cleanupExpiredConsents(uint256 limit) external nonReentrant {
        ConsentStorage storage cs = getConsentStorage();
        address[] memory patients = new address[](limit); // Simplified - would need proper iteration

        // Implementation would iterate through consents and clean up expired ones
        // For gas efficiency, this should be done in batches

        bytes32[] memory cleanedIds = new bytes32[](0); // Placeholder
        emit ConsentCleanup(cleanedIds, block.timestamp);
    }

    /**
     * @notice Get HCS Topic ID
     */
    function getConsentHCSTopicId() external view returns (bytes32) {
        return getConsentStorage().hcsTopicId;
    }
}
