// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AccessControlStorage
 * @dev EIP-7201 namespaced storage for AccessControlFacet
 * Provides isolated storage for access control data
 */
library AccessControlStorage {
    // Storage slot for access control data
    bytes32 constant ACCESS_CONTROL_STORAGE_POSITION =
        keccak256("afrihealth.access.control.storage");

    struct Layout {
        mapping(bytes32 => mapping(address => bool)) roles;
        mapping(address => mapping(bytes32 => bool)) userRoles;
        mapping(address => uint256) roleCount;
        mapping(address => bytes32[]) userRoleList;
        // Emergency access tracking
        mapping(address => mapping(address => uint256)) emergencyAccessExpiry;
        mapping(address => mapping(address => string)) emergencyAccessReasons;
    }

    /**
     * @dev Get access control storage layout
     * layout Storage layout for access control
     */
    function accessControlLayout()
        internal
        pure
        returns (Layout storage layout)
    {
        bytes32 position = ACCESS_CONTROL_STORAGE_POSITION;
        assembly {
            layout.slot := position
        }
    }
}
