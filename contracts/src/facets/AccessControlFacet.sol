// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAccessControl.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";

/**
 * @title AccessControlFacet
 * @dev Facet for role-based access control
 */
contract AccessControlFacet is IAccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    bytes32 public constant INSURER_ROLE = keccak256("INSURER_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    /// @notice Storage structure for access control data
    struct AccessControlStorage {
        mapping(bytes32 => mapping(address => bool)) roleMembers;
        mapping(address => bytes32[]) userRoles;
        mapping(address => mapping(address => EmergencyAccess)) emergencyAccess;
        mapping(bytes32 => uint256) roleMemberCount;
    }

    /// @notice Emergency access structure
    struct EmergencyAccess {
        string reason;
        uint256 grantedAt;
        uint256 expiresAt;
        address grantedBy;
        bool isActive;
    }

    /// @notice Storage position for access control data
    bytes32 constant ACCESS_CONTROL_STORAGE_POSITION =
        keccak256("diamond.accesscontrol.storage");

    /**
     * @dev Get access control storage
     */
    function getAccessControlStorage() internal pure returns (AccessControlStorage storage acs) {
        bytes32 position = ACCESS_CONTROL_STORAGE_POSITION;
        assembly {
            acs.slot := position
        }
    }

    /// @inheritdoc IAccessControl
    function initializeAccessControl(address admin) external nonReentrant {
        _grantRole(ADMIN_ROLE, admin);
    }

    /// @inheritdoc IAccessControl
    function grantRole(bytes32 role, address account) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "AccessControl: must have admin role");
        _grantRole(role, account);
    }

    /// @inheritdoc IAccessControl
    function revokeRole(bytes32 role, address account) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "AccessControl: must have admin role");
        _revokeRole(role, account);
    }

    /// @inheritdoc IAccessControl
    function grantRoles(bytes32[] calldata roles, address account) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "AccessControl: must have admin role");
        for (uint256 i = 0; i < roles.length; i++) {
            _grantRole(roles[i], account);
        }
    }

    /// @inheritdoc IAccessControl
    function hasRole(bytes32 role, address account) public view returns (bool) {
        AccessControlStorage storage acs = getAccessControlStorage();
        return acs.roleMembers[role][account];
    }

    /// @inheritdoc IAccessControl
    function getUserRoles(address account) external view returns (bytes32[] memory) {
        AccessControlStorage storage acs = getAccessControlStorage();
        return acs.userRoles[account];
    }

    /// @inheritdoc IAccessControl
    function getUserRoleCount(address account) external view returns (uint256) {
        AccessControlStorage storage acs = getAccessControlStorage();
        return acs.userRoles[account].length;
    }

    /// @inheritdoc IAccessControl
    function grantEmergencyAccess(
        address patient,
        address provider,
        string calldata reason,
        uint256 duration
    ) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "AccessControl: must have admin role");
        AccessControlStorage storage acs = getAccessControlStorage();

        acs.emergencyAccess[patient][provider] = EmergencyAccess({
            reason: reason,
            grantedAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            grantedBy: msg.sender,
            isActive: true
        });

        emit EmergencyAccessGranted(patient, provider, reason, block.timestamp + duration, msg.sender);
    }

    /// @inheritdoc IAccessControl
    function hasEmergencyAccess(address patient, address provider) external view returns (bool hasAccess, uint256 expiresAt) {
        AccessControlStorage storage acs = getAccessControlStorage();
        EmergencyAccess memory access = acs.emergencyAccess[patient][provider];

        if (!access.isActive || block.timestamp >= access.expiresAt) {
            return (false, 0);
        }

        return (true, access.expiresAt);
    }

    /// @inheritdoc IAccessControl
    function revokeEmergencyAccess(address patient, address provider) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "AccessControl: must have admin role");
        AccessControlStorage storage acs = getAccessControlStorage();
        acs.emergencyAccess[patient][provider].isActive = false;

        emit EmergencyAccessRevoked(patient, provider, msg.sender);
    }

    /// @inheritdoc IAccessControl
    function getEmergencyAccessDetails(
        address patient,
        address provider
    ) external view returns (string memory reason, uint256 grantedAt, uint256 expiresAt, address grantedBy) {
        AccessControlStorage storage acs = getAccessControlStorage();
        EmergencyAccess memory access = acs.emergencyAccess[patient][provider];

        return (access.reason, access.grantedAt, access.expiresAt, access.grantedBy);
    }

    /// @inheritdoc IAccessControl
    function invokeEmergencyAccess(address patient, string calldata reason) external override(IAccessControl) nonReentrant {
        AccessControlStorage storage acs = getAccessControlStorage();
        EmergencyAccess storage access = acs.emergencyAccess[patient][msg.sender];

        require(access.isActive, "AccessControl: no emergency access");
        require(block.timestamp < access.expiresAt, "AccessControl: emergency access expired");

        emit EmergencyAccessInvoked(patient, msg.sender, reason, msg.sender);
    }

    /**
     * @dev Internal function to grant role
     */
    function _grantRole(bytes32 role, address account) internal {
        AccessControlStorage storage acs = getAccessControlStorage();

        if (!acs.roleMembers[role][account]) {
            acs.roleMembers[role][account] = true;
            acs.userRoles[account].push(role);
            acs.roleMemberCount[role]++;

            emit RoleGranted(role, account, msg.sender);
        }
    }

    /**
     * @dev Internal function to revoke role
     */
    function _revokeRole(bytes32 role, address account) internal {
        AccessControlStorage storage acs = getAccessControlStorage();

        if (acs.roleMembers[role][account]) {
            acs.roleMembers[role][account] = false;

            // Remove from user roles array
            bytes32[] storage roles = acs.userRoles[account];
            for (uint256 i = 0; i < roles.length; i++) {
                if (roles[i] == role) {
                    roles[i] = roles[roles.length - 1];
                    roles.pop();
                    break;
                }
            }

            acs.roleMemberCount[role]--;

            emit RoleRevoked(role, account, msg.sender);
        }
    }

    /**
     * @dev Initialize access control system
     */
    function initializeAccessControlSystem() external {
        require(hasRole(ADMIN_ROLE, msg.sender), "AccessControl: must have admin role");
        // Initialize with default roles and permissions
        // Set up role hierarchy and permissions
    }
}
