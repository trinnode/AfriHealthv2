// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IRecordsRegistry.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "../utils/IdGenerator.sol";

/**
 * @title RecordsRegistryFacet
 * @dev Facet for medical records registry management
 */
contract RecordsRegistryFacet is IRecordsRegistry, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Storage structure for records data
    struct RecordsStorage {
        mapping(bytes32 => RecordInfo) records;
        mapping(address => bytes32[]) patientRecords;
        mapping(address => mapping(string => bytes32[])) patientRecordsByScope;
        mapping(bytes32 => AccessEvent[]) recordAccessHistory;
        mapping(bytes32 => uint256) recordAccessCount;
    }

    /// @notice Record information structure
    struct RecordInfo {
        address patient;
        address provider;
        string recordType;
        bytes32 recordHash;
        string recordUri;
        string[] scopes;
        uint256 retentionPeriod;
        uint256 registeredAt;
        uint256 expiresAt;
        bool isActive;
    }

    /// @notice Access event structure
    struct AccessEvent {
        address accessor;
        string purpose;
        uint256 timestamp;
    }

    /// @notice Storage position for records data
    bytes32 constant RECORDS_STORAGE_POSITION =
        keccak256("diamond.records.storage");

    /**
     * @dev Get records storage
     */
    function getRecordsStorage() internal pure returns (RecordsStorage storage rs) {
        bytes32 position = RECORDS_STORAGE_POSITION;
        assembly {
            rs.slot := position
        }
    }

    /// @inheritdoc IRecordsRegistry
    function registerRecord(
        address patient,
        string calldata recordType,
        bytes32 recordHash,
        string calldata recordUri,
        string[] calldata scopes,
        uint256 retentionPeriod
    ) external onlyProvider nonReentrant whenNotPaused returns (bytes32 recordId) {
        RecordsStorage storage rs = getRecordsStorage();

        recordId = IdGenerator.generateRecordId(
            patient,
            msg.sender,
            recordType,
            recordHash
        );

        uint256 expiresAt = block.timestamp + (retentionPeriod * 1 days);

        rs.records[recordId] = RecordInfo({
            patient: patient,
            provider: msg.sender,
            recordType: recordType,
            recordHash: recordHash,
            recordUri: recordUri,
            scopes: scopes,
            retentionPeriod: retentionPeriod,
            registeredAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true
        });

        // Add to patient records
        rs.patientRecords[patient].push(recordId);

        // Add to scope mappings
        for (uint256 i = 0; i < scopes.length; i++) {
            rs.patientRecordsByScope[patient][scopes[i]].push(recordId);
        }

        emit RecordRegistered(
            recordId,
            patient,
            msg.sender,
            recordType,
            recordHash,
            scopes,
            block.timestamp
        );
    }

    /// @inheritdoc IRecordsRegistry
    function logRecordAccess(bytes32 recordId, string calldata purpose) external nonReentrant {
        RecordsStorage storage rs = getRecordsStorage();
        require(rs.records[recordId].isActive, "RecordsRegistry: record not active");

        AccessEvent memory accessEvent = AccessEvent({
            accessor: msg.sender,
            purpose: purpose,
            timestamp: block.timestamp
        });

        rs.recordAccessHistory[recordId].push(accessEvent);
        rs.recordAccessCount[recordId]++;

        emit RecordAccessed(recordId, msg.sender, purpose, block.timestamp);
    }

    /// @inheritdoc IRecordsRegistry
    function setRetentionPolicy(bytes32 recordId, uint256 retentionPeriod) external onlyAdmin nonReentrant {
        RecordsStorage storage rs = getRecordsStorage();
        require(rs.records[recordId].isActive, "RecordsRegistry: record not active");

        rs.records[recordId].retentionPeriod = retentionPeriod;
        rs.records[recordId].expiresAt = block.timestamp + (retentionPeriod * 1 days);

        emit RetentionPolicySet(recordId, retentionPeriod, msg.sender);
    }

    /// @inheritdoc IRecordsRegistry
    function getRecord(bytes32 recordId) external view returns (
        address patient,
        address provider,
        string memory recordType,
        bytes32 recordHash,
        string memory recordUri,
        string[] memory scopes,
        uint256 retentionPeriod,
        uint256 registeredAt,
        uint256 expiresAt
    ) {
        RecordsStorage storage rs = getRecordsStorage();
        RecordInfo memory record = rs.records[recordId];

        return (
            record.patient,
            record.provider,
            record.recordType,
            record.recordHash,
            record.recordUri,
            record.scopes,
            record.retentionPeriod,
            record.registeredAt,
            record.expiresAt
        );
    }

    /// @inheritdoc IRecordsRegistry
    function getPatientRecords(
        address patient,
        string calldata recordType,
        uint256 limit
    ) external view returns (bytes32[] memory recordIds) {
        RecordsStorage storage rs = getRecordsStorage();
        bytes32[] memory allRecords = rs.patientRecords[patient];

        if (bytes(recordType).length == 0) {
            return _applyLimit(allRecords, limit);
        }

        // Filter by record type
        uint256 count = 0;
        bytes32[] memory filtered = new bytes32[](allRecords.length);

        for (uint256 i = 0; i < allRecords.length; i++) {
            if (_stringEquals(rs.records[allRecords[i]].recordType, recordType)) {
                filtered[count] = allRecords[i];
                count++;
            }
        }

        // Create result array with correct size
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = filtered[i];
        }

        return _applyLimit(result, limit);
    }

    /// @inheritdoc IRecordsRegistry
    function getRecordsByScope(address patient, string calldata scope) external view returns (bytes32[] memory recordIds) {
        RecordsStorage storage rs = getRecordsStorage();
        return rs.patientRecordsByScope[patient][scope];
    }

    /// @inheritdoc IRecordsRegistry
    function getRecordAccessHistory(
        bytes32 recordId,
        uint256 limit
    ) external view returns (
        address[] memory accessors,
        string[] memory purposes,
        uint256[] memory timestamps
    ) {
        RecordsStorage storage rs = getRecordsStorage();
        AccessEvent[] memory events = rs.recordAccessHistory[recordId];

        uint256 length = events.length;
        if (limit > 0 && limit < length) {
            length = limit;
        }

        accessors = new address[](length);
        purposes = new string[](length);
        timestamps = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            accessors[i] = events[i].accessor;
            purposes[i] = events[i].purpose;
            timestamps[i] = events[i].timestamp;
        }
    }

    /// @inheritdoc IRecordsRegistry
    function isRecordAccessible(
        bytes32 recordId,
        address account,
        string calldata scope
    ) external view returns (bool isAccessible, uint256 expiresAt) {
        RecordsStorage storage rs = getRecordsStorage();
        RecordInfo memory record = rs.records[recordId];

        if (!record.isActive || block.timestamp > record.expiresAt) {
            return (false, 0);
        }

        // Check if account has access to the scope
        // This would need to be integrated with the consent system
        bool hasScopeAccess = false;
        for (uint256 i = 0; i < record.scopes.length; i++) {
            if (_stringEquals(record.scopes[i], scope)) {
                hasScopeAccess = true;
                break;
            }
        }

        return (hasScopeAccess, record.expiresAt);
    }

    /// @inheritdoc IRecordsRegistry
    function isRecordExpired(bytes32 recordId) external view returns (bool) {
        RecordsStorage storage rs = getRecordsStorage();
        return block.timestamp > rs.records[recordId].expiresAt;
    }

    /// @inheritdoc IRecordsRegistry
    function getExpiringRecords(uint256 withinDays, uint256 limit) external view returns (bytes32[] memory recordIds) {
        RecordsStorage storage rs = getRecordsStorage();

        uint256 futureTimestamp = block.timestamp + (withinDays * 1 days);
        bytes32[] memory allRecords = rs.patientRecords[msg.sender];

        uint256 count = 0;
        bytes32[] memory expiring = new bytes32[](allRecords.length);

        for (uint256 i = 0; i < allRecords.length; i++) {
            if (rs.records[allRecords[i]].expiresAt <= futureTimestamp) {
                expiring[count] = allRecords[i];
                count++;
            }
        }

        // Create result array with correct size
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = expiring[i];
        }

        return _applyLimit(result, limit);
    }

    /// @inheritdoc IRecordsRegistry
    function cleanupExpiredRecords() external onlyAdmin nonReentrant returns (uint256 cleanedCount) {
        // Implementation would iterate through all records and mark expired ones as inactive
        // For now, return 0
        return 0;
    }

    /// @inheritdoc IRecordsRegistry
    function updateRecordUri(bytes32 recordId, string calldata newUri) external nonReentrant {
        RecordsStorage storage rs = getRecordsStorage();
        require(rs.records[recordId].provider == msg.sender, "RecordsRegistry: not record provider");
        require(rs.records[recordId].isActive, "RecordsRegistry: record not active");

        rs.records[recordId].recordUri = newUri;
    }

    /**
     * @dev Apply limit to array
     */
    function _applyLimit(bytes32[] memory array, uint256 limit) internal pure returns (bytes32[] memory) {
        if (limit == 0 || limit >= array.length) {
            return array;
        }

        bytes32[] memory result = new bytes32[](limit);
        for (uint256 i = 0; i < limit; i++) {
            result[i] = array[i];
        }
        return result;
    }

    /**
     * @dev Compare strings for equality
     */
    function _stringEquals(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}
