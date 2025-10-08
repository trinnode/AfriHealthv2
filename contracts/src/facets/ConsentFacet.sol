// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IConsent.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "../utils/IdGenerator.sol";

/**
 * @title ConsentFacet
 * @dev Facet for patient consent management
 */
contract ConsentFacet is IConsent, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// Storage structure for consent data
    struct ConsentStorage {
        mapping(bytes32 => ConsentRequest) consentRequests;
        mapping(address => bytes32[]) patientConsents;
        mapping(address => mapping(address => mapping(string => bytes32))) activeConsents;
        bytes32[] expiredConsents;
    }

    /// Consent request structure
    struct ConsentRequest {
        bytes32 consentId;
        address patient;
        address provider;
        string[] scopes;
        uint256 expiresAt;
        string purpose;
        bool isGranted;
        uint256 grantedAt;
    }

    /// Storage position for consent data
    bytes32 constant CONSENT_STORAGE_POSITION =
        keccak256("diamond.consent.storage");

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
            grantedAt: 0
        });

        // Add to patient consents
        cs.patientConsents[patient].push(consentId);

        emit ConsentRequested(
            patient,
            msg.sender,
            consentId,
            scopes,
            block.timestamp + duration,
            purpose
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
    }

    /// @inheritdoc IConsent
    function revokeConsent(bytes32 consentId) external nonReentrant {
        ConsentStorage storage cs = getConsentStorage();
        ConsentRequest storage request = cs.consentRequests[consentId];

        require(
            request.patient == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Consent: not authorized"
        );

        request.isGranted = false;

        // Remove from active consents
        for (uint256 i = 0; i < request.scopes.length; i++) {
            delete cs.activeConsents[request.patient][request.provider][
                request.scopes[i]
            ];
        }

        emit ConsentRevoked(consentId, msg.sender, block.timestamp);
    }

    /// @inheritdoc IConsent
    function hasActiveConsent(
        address patient,
        address provider,
        string calldata scope
    ) external view returns (bool isActive, uint256 expiresAt) {
        ConsentStorage storage cs = getConsentStorage();
        bytes32 consentId = cs.activeConsents[patient][provider][scope];

        if (consentId == bytes32(0)) {
            return (false, 0);
        }

        ConsentRequest memory request = cs.consentRequests[consentId];
        if (!request.isGranted || block.timestamp >= request.expiresAt) {
            return (false, 0);
        }

        return (true, request.expiresAt);
    }

    /// @inheritdoc IConsent
    function getPatientConsents(
        address patient
    ) external view returns (bytes32[] memory consentIds) {
        ConsentStorage storage cs = getConsentStorage();
        return cs.patientConsents[patient];
    }

    /// @inheritdoc IConsent
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
        )
    {
        ConsentStorage storage cs = getConsentStorage();
        ConsentRequest memory request = cs.consentRequests[consentId];

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

    /// @inheritdoc IConsent
    function invokeEmergencyAccess(
        address patient,
        string calldata reason
    ) external override(IConsent, AccessControl) onlyProvider nonReentrant {
        // Check if provider has emergency access (this would integrate with AccessControlFacet)
        // For now, emit the event
        emit EmergencyAccessInvoked(
            patient,
            msg.sender,
            reason,
            block.timestamp
        );
    }

    /// @inheritdoc IConsent
    function cleanupExpiredConsents()
        external
        nonReentrant
        returns (uint256 cleanedCount)
    {
        ConsentStorage storage cs = getConsentStorage();

        // This would iterate through all consents and clean up expired ones
        // For now, return 0
        return 0;
    }

    /**
     * @dev Initialize consent system
     */
    function initializeConsent() external onlyAdmin {
        // Initialize consent system parameters
        // Set default consent duration, etc.
    }
}
