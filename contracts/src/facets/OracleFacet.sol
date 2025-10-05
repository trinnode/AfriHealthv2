// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IOracle.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";

/**
 * @title OracleFacet
 * @dev Facet for oracle integration and data feeds
 */
contract OracleFacet is IOracle, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Storage structure for oracle data
    struct OracleStorage {
        mapping(bytes32 => OracleRequest) requests;
        mapping(string => OracleData) dataFeeds;
        mapping(string => string) dataSources;
        mapping(bytes32 => bool) fulfilledRequests;
        uint256 requestTimeout;
        uint256 maxRetries;
        uint256 requestCounter;
    }

    /// @notice Oracle request structure
    struct OracleRequest {
        bytes32 requestId;
        string dataType;
        string parameters;
        address requester;
        uint256 timestamp;
        uint256 retryCount;
        bool fulfilled;
    }

    /// @notice Oracle data structure
    struct OracleData {
        bytes data;
        uint256 timestamp;
        uint256 lastUpdated;
    }

    /// @notice Storage position for oracle data
    bytes32 constant ORACLE_STORAGE_POSITION =
        keccak256("diamond.oracle.storage");

    /**
     * @dev Get oracle storage
     */
    function getOracleStorage() internal pure returns (OracleStorage storage os) {
        bytes32 position = ORACLE_STORAGE_POSITION;
        assembly {
            os.slot := position
        }
    }

    /// @inheritdoc IOracle
    function requestData(
        string calldata dataType,
        string calldata parameters
    ) external nonReentrant whenNotPaused returns (bytes32 requestId) {
        OracleStorage storage os = getOracleStorage();

        requestId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            os.requestCounter++
        ));

        os.requests[requestId] = OracleRequest({
            requestId: requestId,
            dataType: dataType,
            parameters: parameters,
            requester: msg.sender,
            timestamp: block.timestamp,
            retryCount: 0,
            fulfilled: false
        });

        emit OracleDataRequested(requestId, dataType, parameters, msg.sender);
    }

    /// @inheritdoc IOracle
    function fulfillData(bytes32 requestId, bytes calldata data) external onlyAdmin nonReentrant {
        OracleStorage storage os = getOracleStorage();
        OracleRequest storage request = os.requests[requestId];

        require(!request.fulfilled, "Oracle: request already fulfilled");
        require(block.timestamp <= request.timestamp + os.requestTimeout, "Oracle: request timeout");

        request.fulfilled = true;
        os.fulfilledRequests[requestId] = true;

        // Update data feed
        os.dataFeeds[request.dataType] = OracleData({
            data: data,
            timestamp: block.timestamp,
            lastUpdated: block.timestamp
        });

        emit OracleDataReceived(requestId, request.dataType, data, block.timestamp);
        emit OracleResponseProcessed(requestId, true, "success", block.timestamp);
    }

    /// @inheritdoc IOracle
    function getOracleData(
        string calldata dataType,
        string calldata parameters
    ) external view returns (bytes memory data, uint256 timestamp) {
        OracleStorage storage os = getOracleStorage();
        OracleData memory oracleData = os.dataFeeds[dataType];

        // Check if data is stale (older than 1 hour)
        if (block.timestamp > oracleData.lastUpdated + 3600) {
            return ("", 0);
        }

        return (oracleData.data, oracleData.timestamp);
    }

    /// @inheritdoc IOracle
    function getFXRate(
        string calldata fromCurrency,
        string calldata toCurrency
    ) external view returns (uint256 rate, uint256 timestamp) {
        OracleStorage storage os = getOracleStorage();
        string memory key = string(abi.encodePacked("fx:", fromCurrency, ":", toCurrency));

        OracleData memory oracleData = os.dataFeeds[key];
        if (oracleData.data.length == 0) {
            return (0, 0);
        }

        // Assuming the data is encoded as uint256 rate
        rate = abi.decode(oracleData.data, (uint256));
        timestamp = oracleData.timestamp;
    }

    /// @inheritdoc IOracle
    function checkMedicalCode(
        string calldata code,
        string calldata codeType
    ) external view returns (bool isValid, bool isCovered, uint256 coveragePercentage) {
        OracleStorage storage os = getOracleStorage();
        string memory key = string(abi.encodePacked("medical:", codeType, ":", code));

        OracleData memory oracleData = os.dataFeeds[key];
        if (oracleData.data.length == 0) {
            return (false, false, 0);
        }

        // Assuming data is encoded as (bool isValid, bool isCovered, uint256 coveragePercentage)
        (isValid, isCovered, coveragePercentage) = abi.decode(oracleData.data, (bool, bool, uint256));
    }

    /// @inheritdoc IOracle
    function updateOracleSource(string calldata dataType, string calldata newSource) external onlyAdmin nonReentrant {
        OracleStorage storage os = getOracleStorage();
        os.dataSources[dataType] = newSource;

        emit OracleSourceUpdated(dataType, newSource, msg.sender);
    }

    /// @inheritdoc IOracle
    function getOracleSource(string calldata dataType) external view returns (string memory source) {
        OracleStorage storage os = getOracleStorage();
        return os.dataSources[dataType];
    }

    /// @inheritdoc IOracle
    function processOracleResponse(
        bytes32 requestId,
        string calldata dataType,
        bytes calldata data
    ) external onlyAdmin nonReentrant returns (bool success, string memory result) {
        OracleStorage storage os = getOracleStorage();

        if (os.fulfilledRequests[requestId]) {
            return (false, "Request already processed");
        }

        // Update data feed
        os.dataFeeds[dataType] = OracleData({
            data: data,
            timestamp: block.timestamp,
            lastUpdated: block.timestamp
        });

        os.fulfilledRequests[requestId] = true;

        return (true, "Data processed successfully");
    }

    /// @inheritdoc IOracle
    function getPendingRequests() external view returns (
        bytes32[] memory requestIds,
        string[] memory dataTypes,
        string[] memory parameters,
        uint256[] memory requestedAts
    ) {
        OracleStorage storage os = getOracleStorage();

        // This would need to be implemented with a proper pending requests tracking
        // For now, return empty arrays
        return (new bytes32[](0), new string[](0), new string[](0), new uint256[](0));
    }

    /// @inheritdoc IOracle
    function retryRequest(bytes32 requestId) external nonReentrant {
        OracleStorage storage os = getOracleStorage();
        OracleRequest storage request = os.requests[requestId];

        require(msg.sender == request.requester, "Oracle: not requester");
        require(!request.fulfilled, "Oracle: already fulfilled");
        require(request.retryCount < os.maxRetries, "Oracle: max retries exceeded");
        require(block.timestamp > request.timestamp + os.requestTimeout, "Oracle: still in timeout");

        request.retryCount++;
        request.timestamp = block.timestamp;
        request.fulfilled = false;

        emit OracleDataRequested(requestId, request.dataType, request.parameters, msg.sender);
    }

    /// @inheritdoc IOracle
    function setOracleConfig(uint256 newTimeout, uint256 newMaxRetries) external onlyAdmin nonReentrant {
        OracleStorage storage os = getOracleStorage();
        os.requestTimeout = newTimeout;
        os.maxRetries = newMaxRetries;
    }

    /// @inheritdoc IOracle
    function getOracleConfig() external view returns (uint256 timeout, uint256 maxRetries) {
        OracleStorage storage os = getOracleStorage();
        return (os.requestTimeout, os.maxRetries);
    }

    /**
     * @dev Initialize oracle with default configuration
     */
    function initializeOracle() external onlyAdmin {
        OracleStorage storage os = getOracleStorage();
        os.requestTimeout = 3600; // 1 hour
        os.maxRetries = 3;
        os.requestCounter = 0;
    }
}
