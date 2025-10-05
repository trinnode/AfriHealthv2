// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOracle
 * @dev Interface for oracle integration in AfriHealth Ledger
 */
interface IOracle {
    /// @notice Emitted when oracle data is requested
    event OracleDataRequested(
        bytes32 indexed requestId,
        string dataType,
        string parameters,
        address indexed requestedBy
    );

    /// @notice Emitted when oracle data is received
    event OracleDataReceived(
        bytes32 indexed requestId,
        string dataType,
        bytes data,
        uint256 receivedAt
    );

    /// @notice Emitted when oracle response is processed
    event OracleResponseProcessed(
        bytes32 indexed requestId,
        bool success,
        string result,
        uint256 processedAt
    );

    /// @notice Emitted when oracle source is updated
    event OracleSourceUpdated(
        string dataType,
        string newSource,
        address indexed updatedBy
    );

    /// @notice Request data from oracle
    /// @param dataType Type of data requested (e.g., "fx_rate", "medical_code")
    /// @param parameters Parameters for the request
    /// @return requestId Unique identifier for the request
    function requestData(
        string calldata dataType,
        string calldata parameters
    ) external returns (bytes32 requestId);

    /// @notice Fulfill oracle data request (oracle only)
    /// @param requestId Request identifier
    /// @param data Oracle response data
    function fulfillData(bytes32 requestId, bytes calldata data) external;

    /// @notice Get oracle data
    /// @param dataType Type of data to get
    /// @param parameters Parameters for the request
    /// @return data Latest oracle data
    /// @return timestamp When data was last updated
    function getOracleData(
        string calldata dataType,
        string calldata parameters
    ) external view returns (bytes memory data, uint256 timestamp);

    /// @notice Get FX rate between currencies
    /// @param fromCurrency Source currency code
    /// @param toCurrency Target currency code
    /// @return rate Exchange rate (18 decimal places)
    /// @return timestamp When rate was last updated
    function getFXRate(
        string calldata fromCurrency,
        string calldata toCurrency
    ) external view returns (uint256 rate, uint256 timestamp);

    /// @notice Check if medical code is valid/covered
    /// @param code Medical code to check
    /// @param codeType Type of code (e.g., "CPT", "ICD10")
    /// @return isValid Whether code is valid
    /// @return isCovered Whether code is covered
    /// @return coveragePercentage Coverage percentage (0-100)
    function checkMedicalCode(
        string calldata code,
        string calldata codeType
    ) external view returns (bool isValid, bool isCovered, uint256 coveragePercentage);

    /// @notice Update oracle source for a data type (admin only)
    /// @param dataType Type of data
    /// @param newSource New oracle source URL/endpoint
    function updateOracleSource(string calldata dataType, string calldata newSource) external;

    /// @notice Get oracle source for a data type
    /// @param dataType Type of data
    /// @return source Oracle source URL/endpoint
    function getOracleSource(string calldata dataType) external view returns (string memory source);

    /// @notice Process oracle response and update stored data
    /// @param requestId Request identifier
    /// @param dataType Type of data
    /// @param data Oracle response data
    /// @return success Whether processing was successful
    /// @return result Processing result
    function processOracleResponse(
        bytes32 requestId,
        string calldata dataType,
        bytes calldata data
    ) external returns (bool success, string memory result);

    /// @notice Get pending oracle requests
    /// @return requestIds Array of pending request identifiers
    /// @return dataTypes Array of data types requested
    /// @return parameters Array of request parameters
    /// @return requestedAts Array of request timestamps
    function getPendingRequests() external view returns (
        bytes32[] memory requestIds,
        string[] memory dataTypes,
        string[] memory parameters,
        uint256[] memory requestedAts
    );

    /// @notice Retry failed oracle request
    /// @param requestId Request identifier to retry
    function retryRequest(bytes32 requestId) external;

    /// @notice Set oracle configuration (admin only)
    /// @param newTimeout New timeout for oracle requests
    /// @param newMaxRetries Maximum retry attempts
    function setOracleConfig(uint256 newTimeout, uint256 newMaxRetries) external;

    /// @notice Get current oracle configuration
    /// @return timeout Current timeout for requests
    /// @return maxRetries Maximum retry attempts
    function getOracleConfig() external view returns (uint256 timeout, uint256 maxRetries);
}
