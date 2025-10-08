// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/AccessControlStorage.sol";

/**
 * @title AccessControl
 * @dev Utility for role-based access control
 */
contract AccessControl {
    using AccessControlStorage for AccessControlStorage.Layout;

    /// Emitted when a role is granted
    event RoleGranted(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /// Emitted when a role is revoked
    event RoleRevoked(
        bytes32 indexed role,
        address indexed account,
        address indexed sender
    );

    /// Emitted when emergency access is granted
    event EmergencyAccessGranted(
        address indexed patient,
        address indexed provider,
        string reason,
        uint256 expiresAt,
        address indexed grantedBy
    );

    /// Emitted when emergency access is revoked
    event EmergencyAccessRevoked(
        address indexed patient,
        address indexed provider,
        address indexed revokedBy
    );

    /// Emitted when emergency access is invoked
    event EmergencyAccessInvoked(
        address indexed patient,
        address indexed provider,
        string reason,
        address indexed invokedBy
    );

    // Role definitions
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    bytes32 public constant INSURER_ROLE = keccak256("INSURER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    /// Modifier for functions restricted to admin role
    modifier onlyAdmin() {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "AccessControl: must have admin role"
        );
        _;
    }

    /// Modifier for functions restricted to patient role
    modifier onlyPatient() {
        require(
            hasRole(PATIENT_ROLE, msg.sender),
            "AccessControl: must have patient role"
        );
        _;
    }

    /// Modifier for functions restricted to provider role
    modifier onlyProvider() {
        require(
            hasRole(PROVIDER_ROLE, msg.sender),
            "AccessControl: must have provider role"
        );
        _;
    }

    /// Modifier for functions restricted to insurer role
    modifier onlyInsurer() {
        require(
            hasRole(INSURER_ROLE, msg.sender),
            "AccessControl: must have insurer role"
        );
        _;
    }

    /// Modifier for functions restricted to arbitrator role
    modifier onlyArbitrator() {
        require(
            hasRole(ARBITRATOR_ROLE, msg.sender),
            "AccessControl: must have arbitrator role"
        );
        _;
    }

    /// Initialize access control with admin role
    /// @param admin The address to grant admin role to
    function initializeAccessControl(address admin) external {
        _grantRole(ADMIN_ROLE, admin);
    }

    /// Grant a role to an account
    /// @param role The role to grant
    /// @param account The account to grant role to
    function grantRole(bytes32 role, address account) external onlyAdmin {
        _grantRole(role, account);
    }

    /// Revoke a role from an account
    /// @param role The role to revoke
    /// @param account The account to revoke role from
    function revokeRole(bytes32 role, address account) external onlyAdmin {
        _revokeRole(role, account);
    }

    /// Grant multiple roles to an account
    /// @param roles Array of roles to grant
    /// @param account The account to grant roles to
    function grantRoles(
        bytes32[] calldata roles,
        address account
    ) external onlyAdmin {
        for (uint256 i = 0; i < roles.length; i++) {
            _grantRole(roles[i], account);
        }
    }

    /// Check if an account has a role
    /// @param role The role to check
    /// @param account The account to check
    /// @return True if account has the role, false otherwise
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _hasRole(role, account);
    }

    /// Get all roles for a user
    /// @param account The account to get roles for
    /// @return Array of roles the account has
    function getUserRoles(
        address account
    ) external view returns (bytes32[] memory) {
        AccessControlStorage.Layout storage layout = AccessControlStorage
            .accessControlLayout();
        return layout.userRoleList[account];
    }

    /// Get the number of roles for a user
    /// @param account The account to get role count for
    /// @return Number of roles the account has
    function getUserRoleCount(address account) external view returns (uint256) {
        AccessControlStorage.Layout storage layout = AccessControlStorage
            .accessControlLayout();
        return layout.roleCount[account];
    }

    /// Grant emergency access to a patient's data
    /// @param patient The patient's address
    /// @param provider The provider's address
    /// @param reason The reason for emergency access
    /// @param duration Duration in seconds for emergency access
    function grantEmergencyAccess(
        address patient,
        address provider,
        string calldata reason,
        uint256 duration
    ) external onlyAdmin {
        // Implementation would go here
        emit EmergencyAccessGranted(
            patient,
            provider,
            reason,
            block.timestamp + duration,
            msg.sender
        );
    }

    /// Check if provider has emergency access to patient's data
    /// @param patient The patient's address
    /// @param provider The provider's address
    /// @return hasAccess True if provider has emergency access
    /// @return expiresAt Timestamp when access expires
    function hasEmergencyAccess(
        address patient,
        address provider
    ) external view returns (bool hasAccess, uint256 expiresAt) {
        // Implementation would check emergency access storage
        return (false, 0);
    }

    /// Revoke emergency access
    /// @param patient The patient's address
    /// @param provider The provider's address
    function revokeEmergencyAccess(
        address patient,
        address provider
    ) external onlyAdmin {
        emit EmergencyAccessRevoked(patient, provider, msg.sender);
    }

    /// Get emergency access details
    /// @param patient The patient's address
    /// @param provider The provider's address
    /// @return reason The reason for emergency access
    /// @return grantedAt Timestamp when access was granted
    /// @return expiresAt Timestamp when access expires
    /// @return grantedBy Address that granted the access
    function getEmergencyAccessDetails(
        address patient,
        address provider
    )
        external
        view
        returns (
            string memory reason,
            uint256 grantedAt,
            uint256 expiresAt,
            address grantedBy
        )
    {
        // Implementation would return emergency access details
        return ("", 0, 0, address(0));
    }

    /// Invoke emergency access (provider calls this)
    /// @param patient The patient's address
    /// @param reason The reason for invoking emergency access
    function invokeEmergencyAccess(
        address patient,
        string calldata reason
    ) external virtual onlyProvider {
        emit EmergencyAccessInvoked(patient, msg.sender, reason, msg.sender);
    }

    /// Internal function to grant role
    /// @param role Role to grant
    /// @param account Account to grant role to
    function _grantRole(bytes32 role, address account) internal {
        AccessControlStorage.Layout storage layout = AccessControlStorage
            .accessControlLayout();

        if (!layout.roles[role][account]) {
            layout.roles[role][account] = true;
            layout.userRoles[account][role] = true;
            layout.userRoleList[account].push(role);
            layout.roleCount[account]++;
            emit RoleGranted(role, account, msg.sender);
        }
    }

    /// Internal function to revoke role
    /// @param role Role to revoke
    /// @param account Account to revoke role from
    function _revokeRole(bytes32 role, address account) internal {
        AccessControlStorage.Layout storage layout = AccessControlStorage
            .accessControlLayout();

        if (layout.roles[role][account]) {
            layout.roles[role][account] = false;
            layout.userRoles[account][role] = false;

            // Remove from role list
            bytes32[] storage roleList = layout.userRoleList[account];
            for (uint256 i = 0; i < roleList.length; i++) {
                if (roleList[i] == role) {
                    roleList[i] = roleList[roleList.length - 1];
                    roleList.pop();
                    break;
                }
            }

            layout.roleCount[account]--;
            emit RoleRevoked(role, account, msg.sender);
        }
    }

    /// Internal function to check role
    /// @param role Role to check
    /// @param account Account to check
    /// @return True if account has role
    function _hasRole(
        bytes32 role,
        address account
    ) internal view returns (bool) {
        AccessControlStorage.Layout storage layout = AccessControlStorage
            .accessControlLayout();
        return layout.roles[role][account];
    }
}
