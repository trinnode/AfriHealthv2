// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAccessControl
 * @dev Interface for role-based access control in AfriHealth Ledger
 */
interface IAccessControl {
    /// @notice Emitted when a role is granted
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /// @notice Emitted when a role is revoked
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /// @notice Emitted when emergency access is granted
    event EmergencyAccessGranted(
        address indexed patient,
        address indexed provider,
        string reason,
        uint256 expiresAt,
        address indexed grantedBy
    );

    /// @notice Emitted when emergency access is revoked
    event EmergencyAccessRevoked(
        address indexed patient,
        address indexed provider,
        address indexed revokedBy
    );

    /// @notice Emitted when emergency access is invoked
    event EmergencyAccessInvoked(
        address indexed patient,
        address indexed provider,
        string reason,
        address indexed invokedBy
    );

    /// @notice Initialize access control with admin role
    /// @param admin The address to grant admin role to
    function initializeAccessControl(address admin) external;

    /// @notice Grant a role to an account
    /// @param role The role to grant
    /// @param account The account to grant role to
    function grantRole(bytes32 role, address account) external;

    /// @notice Revoke a role from an account
    /// @param role The role to revoke
    /// @param account The account to revoke role from
    function revokeRole(bytes32 role, address account) external;

    /// @notice Grant multiple roles to an account
    /// @param roles Array of roles to grant
    /// @param account The account to grant roles to
    function grantRoles(bytes32[] calldata roles, address account) external;

    /// @notice Check if an account has a role
    /// @param role The role to check
    /// @param account The account to check
    /// @return True if account has the role, false otherwise
    function hasRole(bytes32 role, address account) external view returns (bool);

    /// @notice Get all roles for a user
    /// @param account The account to get roles for
    /// @return Array of roles the account has
    function getUserRoles(address account) external view returns (bytes32[] memory);

    /// @notice Get the number of roles for a user
    /// @param account The account to get role count for
    /// @return Number of roles the account has
    function getUserRoleCount(address account) external view returns (uint256);

    /// @notice Grant emergency access to a patient's data
    /// @param patient The patient's address
    /// @param provider The provider's address
    /// @param reason The reason for emergency access
    /// @param duration Duration in seconds for emergency access
    function grantEmergencyAccess(
        address patient,
        address provider,
        string calldata reason,
        uint256 duration
    ) external;

    /// @notice Check if provider has emergency access to patient's data
    /// @param patient The patient's address
    /// @param provider The provider's address
    /// @return hasAccess True if provider has emergency access
    /// @return expiresAt Timestamp when access expires
    function hasEmergencyAccess(address patient, address provider) external view returns (bool hasAccess, uint256 expiresAt);

    /// @notice Revoke emergency access
    /// @param patient The patient's address
    /// @param provider The provider's address
    function revokeEmergencyAccess(address patient, address provider) external;

    /// @notice Get emergency access details
    /// @param patient The patient's address
    /// @param provider The provider's address
    /// @return reason The reason for emergency access
    /// @return grantedAt Timestamp when access was granted
    /// @return expiresAt Timestamp when access expires
    /// @return grantedBy Address that granted the access
    function getEmergencyAccessDetails(
        address patient,
        address provider
    ) external view returns (string memory reason, uint256 grantedAt, uint256 expiresAt, address grantedBy);

    /// @notice Invoke emergency access (provider calls this)
    /// @param patient The patient's address
    /// @param reason The reason for invoking emergency access
    function invokeEmergencyAccess(address patient, string calldata reason) external;
}
