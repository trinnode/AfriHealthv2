// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IdGenerator
 * @dev Utility for generating unique identifiers
 */
library IdGenerator {
    /**
     * @dev Generate unique ID from multiple parameters
     * @param param1 First parameter
     * @param param2 Second parameter
     * @param param3 Third parameter
     * @return Unique ID
     */
    function generateId(
        address param1,
        address param2,
        uint256 param3
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            param1,
            param2,
            param3
        ));
    }

    /**
     * @dev Generate ID from string parameters
     * @param param1 First string parameter
     * @param param2 Second string parameter
     * @param param3 Third string parameter
     * @return Unique ID
     */
    function generateIdFromStrings(
        string memory param1,
        string memory param2,
        string memory param3
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            param1,
            param2,
            param3
        ));
    }

    /**
     * @dev Generate ID from mixed parameters
     * @param param1 Address parameter
     * @param param2 String parameter
     * @param param3 Uint parameter
     * @param param4 String parameter
     * @return Unique ID
     */
    function generateComplexId(
        address param1,
        string memory param2,
        uint256 param3,
        string memory param4
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            param1,
            param2,
            param3,
            param4
        ));
    }

    /**
     * @dev Generate simple sequential ID (for testing)
     * @param prefix ID prefix
     * @param counter Counter value
     * @return Sequential ID
     */
    function generateSequentialId(
        string memory prefix,
        uint256 counter
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(prefix, counter));
    }

    /**
     * @dev Generate claim ID
     * @param patient Patient address
     * @param provider Provider address
     * @param diagnosis Diagnosis hash
     * @return Claim ID
     */
    function generateClaimId(
        address patient,
        address provider,
        bytes32 diagnosis
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "CLAIM",
            block.timestamp,
            patient,
            provider,
            diagnosis
        ));
    }

    /**
     * @dev Generate invoice ID
     * @param patient Patient address
     * @param provider Provider address
     * @param amount Invoice amount
     * @return Invoice ID
     */
    function generateInvoiceId(
        address patient,
        address provider,
        uint256 amount
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "INVOICE",
            block.timestamp,
            patient,
            provider,
            amount
        ));
    }

    /**
     * @dev Generate consent ID
     * @param patient Patient address
     * @param provider Provider address
     * @param scope Consent scope
     * @return Consent ID
     */
    function generateConsentId(
        address patient,
        address provider,
        string memory scope
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "CONSENT",
            block.timestamp,
            patient,
            provider,
            scope
        ));
    }

    /**
     * @dev Generate dispute ID
     * @param invoiceId Invoice identifier
     * @param complainant Complainant address
     * @param reason Dispute reason hash
     * @return Dispute ID
     */
    function generateDisputeId(
        bytes32 invoiceId,
        address complainant,
        bytes32 reason
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "DISPUTE",
            block.timestamp,
            invoiceId,
            complainant,
            reason
        ));
    }

    /**
     * @dev Generate policy ID
     * @param patient Patient address
     * @param name Policy name
     * @param rules Policy rules hash
     * @return Policy ID
     */
    function generatePolicyId(
        address patient,
        string memory name,
        bytes32 rules
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "POLICY",
            block.timestamp,
            patient,
            name,
            rules
        ));
    }

    /**
     * @dev Generate record ID
     * @param patient Patient address
     * @param provider Provider address
     * @param recordType Type of record
     * @param recordHash Hash of record data
     * @return Record ID
     */
    function generateRecordId(
        address patient,
        address provider,
        string memory recordType,
        bytes32 recordHash
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "RECORD",
            block.timestamp,
            patient,
            provider,
            recordType,
            recordHash
        ));
    }
}
