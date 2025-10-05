// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAudit
 * @dev Interface for audit trail management in AfriHealth Ledger
 */
interface IAudit {
    /// @notice Emitted when an audit event is logged
    event AuditEventLogged(
        bytes32 indexed eventId,
        string eventType,
        address indexed account,
        bytes32 indexed referenceId,
        string details,
        uint256 timestamp
    );

    /// @notice Emitted when HCS topic is registered
    event HCSTopicRegistered(
        string topicName,
        bytes32 topicId,
        address indexed registeredBy
    );

    /// @notice Emitted when audit configuration is updated
    event AuditConfigUpdated(
        uint256 newRetentionPeriod,
        string[] newRequiredEvents,
        address indexed updatedBy
    );

    /// @notice Log an audit event
    /// @param eventType Type of event (e.g., "consent_granted", "payment_processed")
    /// @param account Account involved in the event
    /// @param referenceId Related identifier (e.g., invoice ID, consent ID)
    /// @param details Additional event details
    function logEvent(
        string calldata eventType,
        address account,
        bytes32 referenceId,
        string calldata details
    ) external returns (bytes32 eventId);

    /// @notice Get audit events for an account
    /// @param account Account to get events for
    /// @param eventType Filter by event type (empty string for all)
    /// @param limit Maximum number of events to return
    /// @return eventIds Array of event identifiers
    /// @return eventTypes Array of event types
    /// @return referenceIds Array of reference identifiers
    /// @return details Array of event details
    /// @return timestamps Array of event timestamps
    function getAccountEvents(
        address account,
        string calldata eventType,
        uint256 limit
    ) external view returns (
        bytes32[] memory eventIds,
        string[] memory eventTypes,
        bytes32[] memory referenceIds,
        string[] memory details,
        uint256[] memory timestamps
    );

    /// @notice Get audit events for a reference ID
    /// @param referenceId Reference identifier to get events for
    /// @return eventIds Array of event identifiers
    /// @return eventTypes Array of event types
    /// @return accounts Array of accounts involved
    /// @return details Array of event details
    /// @return timestamps Array of event timestamps
    function getReferenceEvents(bytes32 referenceId) external view returns (
        bytes32[] memory eventIds,
        string[] memory eventTypes,
        address[] memory accounts,
        string[] memory details,
        uint256[] memory timestamps
    );

    /// @notice Get audit trail for a time period
    /// @param startTime Start timestamp
    /// @param endTime End timestamp
    /// @param eventType Filter by event type (empty string for all)
    /// @param limit Maximum number of events to return
    /// @return eventIds Array of event identifiers
    /// @return eventTypes Array of event types
    /// @return accounts Array of accounts involved
    /// @return referenceIds Array of reference identifiers
    /// @return timestamps Array of event timestamps
    function getEventsInRange(
        uint256 startTime,
        uint256 endTime,
        string calldata eventType,
        uint256 limit
    ) external view returns (
        bytes32[] memory eventIds,
        string[] memory eventTypes,
        address[] memory accounts,
        bytes32[] memory referenceIds,
        uint256[] memory timestamps
    );

    /// @notice Register an HCS topic for audit events
    /// @param topicName Name of the topic
    /// @param topicId HCS topic identifier
    function registerHCSTopic(string calldata topicName, bytes32 topicId) external;

    /// @notice Get HCS topic ID by name
    /// @param topicName Name of the topic
    /// @return topicId HCS topic identifier
    function getHCSTopic(string calldata topicName) external view returns (bytes32 topicId);

    /// @notice Get all registered HCS topics
    /// @return topicNames Array of topic names
    /// @return topicIds Array of HCS topic identifiers
    function getAllHCSTopics() external view returns (
        string[] memory topicNames,
        bytes32[] memory topicIds
    );

    /// @notice Update audit configuration (admin only)
    /// @param newRetentionPeriod New retention period in days
    /// @param newRequiredEvents Array of event types that must be logged
    function updateAuditConfig(
        uint256 newRetentionPeriod,
        string[] calldata newRequiredEvents
    ) external;

    /// @notice Get current audit configuration
    /// @return retentionPeriod Current retention period in days
    /// @return requiredEvents Array of required event types
    function getAuditConfig() external view returns (
        uint256 retentionPeriod,
        string[] memory requiredEvents
    );

    /// @notice Check if event type is required for audit
    /// @param eventType Event type to check
    /// @return True if event type is required
    function isEventTypeRequired(string calldata eventType) external view returns (bool);

    /// @notice Clean up old audit events (admin only)
    /// @param beforeTimestamp Remove events before this timestamp
    /// @return cleanedCount Number of events cleaned up
    function cleanupOldEvents(uint256 beforeTimestamp) external returns (uint256 cleanedCount);
}
