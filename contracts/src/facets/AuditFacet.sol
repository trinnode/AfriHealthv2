// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAudit.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";

/**
 * @title AuditFacet
 * @dev Facet for audit trail management
 */
contract AuditFacet is IAudit, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// Storage structure for audit data
    struct AuditStorage {
        mapping(bytes32 => AuditEvent) events;
        mapping(address => bytes32[]) accountEvents;
        mapping(bytes32 => bytes32[]) referenceEvents;
        mapping(string => bytes32) hcsTopics;
        mapping(bytes32 => string) eventTypes;
        mapping(bytes32 => address) eventAccounts;
        mapping(bytes32 => bytes32) eventReferences;
        mapping(bytes32 => string) eventDetails;
        mapping(bytes32 => uint256) eventTimestamps;
        bytes32[] allEventIds;
        string[] hcsTopicNames;
        uint256 eventCounter;
        uint256 retentionPeriod;
        string[] requiredEventTypes;
    }

    /// Audit event structure
    struct AuditEvent {
        bytes32 eventId;
        string eventType;
        address account;
        bytes32 referenceId;
        string details;
        uint256 timestamp;
    }

    /// Storage position for audit data
    bytes32 constant AUDIT_STORAGE_POSITION =
        keccak256("diamond.audit.storage");

    /**
     * @dev Get audit storage
     */
    function getAuditStorage()
        internal
        pure
        returns (AuditStorage storage as_)
    {
        bytes32 position = AUDIT_STORAGE_POSITION;
        assembly {
            as_.slot := position
        }
    }

    /// @inheritdoc IAudit
    function logEvent(
        string calldata eventType,
        address account,
        bytes32 referenceId,
        string calldata details
    ) external nonReentrant returns (bytes32 eventId) {
        AuditStorage storage as_ = getAuditStorage();

        eventId = keccak256(
            abi.encodePacked(
                block.timestamp,
                account,
                referenceId,
                as_.eventCounter++
            )
        );

        as_.events[eventId] = AuditEvent({
            eventId: eventId,
            eventType: eventType,
            account: account,
            referenceId: referenceId,
            details: details,
            timestamp: block.timestamp
        });

        // Store event data for efficient querying
        as_.accountEvents[account].push(eventId);
        as_.referenceEvents[referenceId].push(eventId);
        as_.eventTypes[eventId] = eventType;
        as_.eventAccounts[eventId] = account;
        as_.eventReferences[eventId] = referenceId;
        as_.eventDetails[eventId] = details;
        as_.eventTimestamps[eventId] = block.timestamp;
        as_.allEventIds.push(eventId);

        emit AuditEventLogged(
            eventId,
            eventType,
            account,
            referenceId,
            details,
            block.timestamp
        );
    }

    /// @inheritdoc IAudit
    function getAccountEvents(
        address account,
        string calldata eventType,
        uint256 limit
    )
        external
        view
        returns (
            bytes32[] memory eventIds,
            string[] memory eventTypes,
            bytes32[] memory referenceIds,
            string[] memory details,
            uint256[] memory timestamps
        )
    {
        AuditStorage storage as_ = getAuditStorage();
        bytes32[] memory accountEventIds = as_.accountEvents[account];

        // Filter by event type if specified
        if (bytes(eventType).length > 0) {
            uint256 count = 0;
            bytes32[] memory filtered = new bytes32[](accountEventIds.length);

            for (uint256 i = 0; i < accountEventIds.length; i++) {
                if (
                    _stringEquals(as_.eventTypes[accountEventIds[i]], eventType)
                ) {
                    filtered[count] = accountEventIds[i];
                    count++;
                }
            }

            accountEventIds = new bytes32[](count);
            for (uint256 i = 0; i < count; i++) {
                accountEventIds[i] = filtered[i];
            }
        }

        // Apply limit
        uint256 length = accountEventIds.length;
        if (limit > 0 && limit < length) {
            length = limit;
        }

        eventIds = new bytes32[](length);
        eventTypes = new string[](length);
        referenceIds = new bytes32[](length);
        details = new string[](length);
        timestamps = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            bytes32 eventId = accountEventIds[i];
            eventIds[i] = eventId;
            eventTypes[i] = as_.eventTypes[eventId];
            referenceIds[i] = as_.eventReferences[eventId];
            details[i] = as_.eventDetails[eventId];
            timestamps[i] = as_.eventTimestamps[eventId];
        }
    }

    /// @inheritdoc IAudit
    function getReferenceEvents(
        bytes32 referenceId
    )
        external
        view
        returns (
            bytes32[] memory eventIds,
            string[] memory eventTypes,
            address[] memory accounts,
            string[] memory details,
            uint256[] memory timestamps
        )
    {
        AuditStorage storage as_ = getAuditStorage();
        bytes32[] memory referenceEventIds = as_.referenceEvents[referenceId];

        uint256 length = referenceEventIds.length;
        eventIds = new bytes32[](length);
        eventTypes = new string[](length);
        accounts = new address[](length);
        details = new string[](length);
        timestamps = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            bytes32 eventId = referenceEventIds[i];
            eventIds[i] = eventId;
            eventTypes[i] = as_.eventTypes[eventId];
            accounts[i] = as_.eventAccounts[eventId];
            details[i] = as_.eventDetails[eventId];
            timestamps[i] = as_.eventTimestamps[eventId];
        }
    }

    /// @inheritdoc IAudit
    function getEventsInRange(
        uint256 startTime,
        uint256 endTime,
        string calldata eventType,
        uint256 limit
    )
        external
        view
        returns (
            bytes32[] memory eventIds,
            string[] memory eventTypes,
            address[] memory accounts,
            bytes32[] memory referenceIds,
            uint256[] memory timestamps
        )
    {
        AuditStorage storage as_ = getAuditStorage();
        bytes32[] storage allEvents = as_.allEventIds;

        // First pass: count matching events
        uint256 matchCount = 0;
        bool filterByType = bytes(eventType).length > 0;

        for (uint256 i = 0; i < allEvents.length && matchCount < limit; i++) {
            bytes32 eventId = allEvents[i];
            uint256 timestamp = as_.eventTimestamps[eventId];

            // Check time range
            if (timestamp < startTime || timestamp > endTime) {
                continue;
            }

            // Check event type if specified
            if (
                filterByType &&
                keccak256(bytes(as_.eventTypes[eventId])) !=
                keccak256(bytes(eventType))
            ) {
                continue;
            }

            matchCount++;
        }

        // Initialize result arrays with actual match count
        uint256 resultCount = matchCount < limit ? matchCount : limit;
        eventIds = new bytes32[](resultCount);
        eventTypes = new string[](resultCount);
        accounts = new address[](resultCount);
        referenceIds = new bytes32[](resultCount);
        timestamps = new uint256[](resultCount);

        // Second pass: populate results
        uint256 resultIndex = 0;
        for (
            uint256 i = 0;
            i < allEvents.length && resultIndex < resultCount;
            i++
        ) {
            bytes32 eventId = allEvents[i];
            uint256 timestamp = as_.eventTimestamps[eventId];

            // Check time range
            if (timestamp < startTime || timestamp > endTime) {
                continue;
            }

            // Check event type if specified
            if (
                filterByType &&
                keccak256(bytes(as_.eventTypes[eventId])) !=
                keccak256(bytes(eventType))
            ) {
                continue;
            }

            // Add to results
            eventIds[resultIndex] = eventId;
            eventTypes[resultIndex] = as_.eventTypes[eventId];
            accounts[resultIndex] = as_.eventAccounts[eventId];
            referenceIds[resultIndex] = as_.eventReferences[eventId];
            timestamps[resultIndex] = timestamp;
            resultIndex++;
        }
    }

    /// @inheritdoc IAudit
    function registerHCSTopic(
        string calldata topicName,
        bytes32 topicId
    ) external onlyAdmin nonReentrant {
        AuditStorage storage as_ = getAuditStorage();

        // Only add to list if it's a new topic
        if (as_.hcsTopics[topicName] == bytes32(0)) {
            as_.hcsTopicNames.push(topicName);
        }

        as_.hcsTopics[topicName] = topicId;

        emit HCSTopicRegistered(topicName, topicId, msg.sender);
    }

    /// @inheritdoc IAudit
    function getHCSTopic(
        string calldata topicName
    ) external view returns (bytes32 topicId) {
        AuditStorage storage as_ = getAuditStorage();
        return as_.hcsTopics[topicName];
    }

    /// @inheritdoc IAudit
    function getAllHCSTopics()
        external
        view
        returns (string[] memory topicNames, bytes32[] memory topicIds)
    {
        AuditStorage storage as_ = getAuditStorage();

        uint256 count = as_.hcsTopicNames.length;
        topicNames = new string[](count);
        topicIds = new bytes32[](count);

        for (uint256 i = 0; i < count; i++) {
            string memory name = as_.hcsTopicNames[i];
            topicNames[i] = name;
            topicIds[i] = as_.hcsTopics[name];
        }
    }

    /// @inheritdoc IAudit
    function updateAuditConfig(
        uint256 newRetentionPeriod,
        string[] calldata newRequiredEvents
    ) external onlyAdmin nonReentrant {
        AuditStorage storage as_ = getAuditStorage();
        as_.retentionPeriod = newRetentionPeriod;
        as_.requiredEventTypes = newRequiredEvents;

        emit AuditConfigUpdated(
            newRetentionPeriod,
            newRequiredEvents,
            msg.sender
        );
    }

    /// @inheritdoc IAudit
    function getAuditConfig()
        external
        view
        returns (uint256 retentionPeriod, string[] memory requiredEvents)
    {
        AuditStorage storage as_ = getAuditStorage();
        return (as_.retentionPeriod, as_.requiredEventTypes);
    }

    /// @inheritdoc IAudit
    function isEventTypeRequired(
        string calldata eventType
    ) external view returns (bool) {
        AuditStorage storage as_ = getAuditStorage();

        for (uint256 i = 0; i < as_.requiredEventTypes.length; i++) {
            if (_stringEquals(as_.requiredEventTypes[i], eventType)) {
                return true;
            }
        }
        return false;
    }

    /// @inheritdoc IAudit
    function cleanupOldEvents(
        uint256 beforeTimestamp
    ) external onlyAdmin nonReentrant returns (uint256 cleanedCount) {
        // Implementation would iterate through events and remove old ones
        // For now, return 0
        return 0;
    }

    /**
     * @dev Compare strings for equality
     */
    function _stringEquals(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /**
     * @dev Initialize audit system
     */
    function initializeAudit() external onlyAdmin {
        AuditStorage storage as_ = getAuditStorage();
        as_.retentionPeriod = 2555; // 7 years in days
        as_.eventCounter = 0;

        // Set default required event types
        as_.requiredEventTypes = [
            "consent_granted",
            "consent_revoked",
            "payment_processed",
            "claim_submitted",
            "claim_approved",
            "emergency_access"
        ];
    }
}
