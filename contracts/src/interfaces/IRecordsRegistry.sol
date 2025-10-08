// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRecordsRegistry
 * @dev Interface for medical records registry in AfriHealth Ledger
 */
interface IRecordsRegistry {
    /// Emitted when a record is registered
    event RecordRegistered(
        bytes32 indexed recordId,
        address indexed patient,
        address indexed provider,
        string recordType,
        bytes32 recordHash,
        string[] scopes,
        uint256 registeredAt
    );

    /// Emitted when record access is logged
    event RecordAccessed(
        bytes32 indexed recordId,
        address indexed accessedBy,
        string purpose,
        uint256 accessedAt
    );

    /// Emitted when record retention policy is set
    event RetentionPolicySet(
        bytes32 indexed recordId,
        uint256 retentionPeriod,
        address indexed setBy
    );

    /// Register a medical record
    /// @param patient Patient address
    /// @param recordType Type of record (e.g., "lab_result", "prescription", "imaging")
    /// @param recordHash Hash of the record data
    /// @param recordUri URI where record can be accessed
    /// @param scopes Data scopes this record falls under
    /// @param retentionPeriod How long to retain the record (in days)
    /// @return recordId Unique identifier for the record
    function registerRecord(
        address patient,
        string calldata recordType,
        bytes32 recordHash,
        string calldata recordUri,
        string[] calldata scopes,
        uint256 retentionPeriod
    ) external returns (bytes32 recordId);

    /// Log record access (for audit purposes)
    /// @param recordId Record identifier
    /// @param purpose Purpose of access
    function logRecordAccess(
        bytes32 recordId,
        string calldata purpose
    ) external;

    /// Set retention policy for a record
    /// @param recordId Record identifier
    /// @param retentionPeriod New retention period in days
    function setRetentionPolicy(
        bytes32 recordId,
        uint256 retentionPeriod
    ) external;

    /// Get record details
    /// @param recordId Record identifier
    /// @return patient Patient address
    /// @return provider Provider address
    /// @return recordType Type of record
    /// @return recordHash Hash of record data
    /// @return recordUri URI of the record
    /// @return scopes Data scopes
    /// @return retentionPeriod Retention period in days
    /// @return registeredAt When record was registered
    /// @return expiresAt When record expires
    function getRecord(
        bytes32 recordId
    )
        external
        view
        returns (
            address patient,
            address provider,
            string memory recordType,
            bytes32 recordHash,
            string memory recordUri,
            string[] memory scopes,
            uint256 retentionPeriod,
            uint256 registeredAt,
            uint256 expiresAt
        );

    /// Get records for a patient
    /// @param patient Patient address
    /// @param recordType Filter by record type (empty string for all)
    /// @param limit Maximum number of records to return
    /// @return recordIds Array of record identifiers
    function getPatientRecords(
        address patient,
        string calldata recordType,
        uint256 limit
    ) external view returns (bytes32[] memory recordIds);

    /// Get records by scope
    /// @param patient Patient address
    /// @param scope Data scope to filter by
    /// @return recordIds Array of record identifiers in the scope
    function getRecordsByScope(
        address patient,
        string calldata scope
    ) external view returns (bytes32[] memory recordIds);

    /// Get access history for a record
    /// @param recordId Record identifier
    /// @param limit Maximum number of access events to return
    /// @return accessors Array of accounts that accessed the record
    /// @return purposes Array of access purposes
    /// @return timestamps Array of access timestamps
    function getRecordAccessHistory(
        bytes32 recordId,
        uint256 limit
    )
        external
        view
        returns (
            address[] memory accessors,
            string[] memory purposes,
            uint256[] memory timestamps
        );

    /// Check if record is accessible by account for scope
    /// @param recordId Record identifier
    /// @param account Account requesting access
    /// @param scope Required data scope
    /// @return isAccessible True if record is accessible
    /// @return expiresAt When access expires
    function isRecordAccessible(
        bytes32 recordId,
        address account,
        string calldata scope
    ) external view returns (bool isAccessible, uint256 expiresAt);

    /// Check if record is expired
    /// @param recordId Record identifier
    /// @return True if record is expired
    function isRecordExpired(bytes32 recordId) external view returns (bool);

    /// Get records expiring soon
    /// @param withinDays Check for records expiring within this many days
    /// @param limit Maximum number of records to return
    /// @return recordIds Array of record identifiers expiring soon
    function getExpiringRecords(
        uint256 withinDays,
        uint256 limit
    ) external view returns (bytes32[] memory recordIds);

    /// Clean up expired records (admin only)
    /// @return cleanedCount Number of records cleaned up
    function cleanupExpiredRecords() external returns (uint256 cleanedCount);

    /// Update record URI
    /// @param recordId Record identifier
    /// @param newUri New URI for the record
    function updateRecordUri(bytes32 recordId, string calldata newUri) external;
}
