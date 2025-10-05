// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DiamondStorage.sol";

/**
 * @title AccessControl
 * @dev Utility for role-based access control
 */
contract AccessControl {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

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

    // Role definitions
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    bytes32 public constant INSURER_ROLE = keccak256("INSURER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    /// @notice Modifier for functions restricted to admin role
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "AccessControl: must have admin role");
        _;
    }

    /// @notice Modifier for functions restricted to patient role
    modifier onlyPatient() {
        require(hasRole(PATIENT_ROLE, msg.sender), "AccessControl: must have patient role");
        _;
    }

    /// @notice Modifier for functions restricted to provider role
    modifier onlyProvider() {
        require(hasRole(PROVIDER_ROLE, msg.sender), "AccessControl: must have provider role");
        _;
    }

    /// @notice Modifier for functions restricted to insurer role
    modifier onlyInsurer() {
        require(hasRole(INSURER_ROLE, msg.sender), "AccessControl: must have insurer role");
        _;
    }

    /// @notice Modifier for functions restricted to arbitrator role
    modifier onlyArbitrator() {
        require(hasRole(ARBITRATOR_ROLE, msg.sender), "AccessControl: must have arbitrator role");
        _;
    }

    /// @notice Initialize access control with admin role
    /// @param admin The address to grant admin role to
    function initializeAccessControl(address admin) external {
        _grantRole(ADMIN_ROLE, admin);
    }

    /// @notice Grant a role to an account
    /// @param role The role to grant
    /// @param account The account to grant role to
    function grantRole(bytes32 role, address account) external onlyAdmin {
        _grantRole(role, account);
    }

    /// @notice Revoke a role from an account
    /// @param role The role to revoke
    /// @param account The account to revoke role from
    function revokeRole(bytes32 role, address account) external onlyAdmin {
        _revokeRole(role, account);
    }

    /// @notice Grant multiple roles to an account
    /// @param roles Array of roles to grant
    /// @param account The account to grant roles to
    function grantRoles(bytes32[] calldata roles, address account) external onlyAdmin {
        for (uint256 i = 0; i < roles.length; i++) {
            _grantRole(roles[i], account);
        }
    }

    /// @notice Check if an account has a role
    /// @param role The role to check
    /// @param account The account to check
    /// @return True if account has the role, false otherwise
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _hasRole(role, account);
    }

    /// @notice Get all roles for a user
    /// @param account The account to get roles for
    /// @return Array of roles the account has
    function getUserRoles(address account) external view returns (bytes32[] memory) {
        // This would need to be implemented with proper storage mapping
        // For now, return empty array
        return new bytes32[](0);
    }

    /// @notice Get the number of roles for a user
    /// @param account The account to get role count for
    /// @return Number of roles the account has
    function getUserRoleCount(address account) external view returns (uint256) {
        // This would need to be implemented with proper storage mapping
        return 0;
    }

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
    ) external onlyAdmin {
        // Implementation would go here
        emit EmergencyAccessGranted(patient, provider, reason, block.timestamp + duration, msg.sender);
    }

    /// @notice Check if provider has emergency access to patient's data
    /// @param patient The patient's address
    /// @param provider The provider's address
    /// @return hasAccess True if provider has emergency access
    /// @return expiresAt Timestamp when access expires
    function hasEmergencyAccess(address patient, address provider) external view returns (bool hasAccess, uint256 expiresAt) {
        // Implementation would check emergency access storage
        return (false, 0);
    }

    /// @notice Revoke emergency access
    /// @param patient The patient's address
    /// @param provider The provider's address
    function revokeEmergencyAccess(address patient, address provider) external onlyAdmin {
        emit EmergencyAccessRevoked(patient, provider, msg.sender);
    }

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
    ) external view returns (string memory reason, uint256 grantedAt, uint256 expiresAt, address grantedBy) {
        // Implementation would return emergency access details
        return ("", 0, 0, address(0));
    }

    /// @notice Invoke emergency access (provider calls this)
    /// @param patient The patient's address
    /// @param reason The reason for invoking emergency access
    function invokeEmergencyAccess(address patient, string calldata reason) external virtual onlyProvider {
        emit EmergencyAccessInvoked(patient, msg.sender, reason, msg.sender);
    }

    /// @notice Internal function to grant role
    /// @param role Role to grant
    /// @param account Account to grant role to
    function _grantRole(bytes32 role, address account) internal {
        // Implementation would store role assignment
        emit RoleGranted(role, account, msg.sender);
    }

    /// @notice Internal function to revoke role
    /// @param role Role to revoke
    /// @param account Account to revoke role from
    function _revokeRole(bytes32 role, address account) internal {
        // Implementation would remove role assignment
        emit RoleRevoked(role, account, msg.sender);
    }

    /// @notice Internal function to check role
    /// @param role Role to check
    /// @param account Account to check
    /// @return True if account has role
    function _hasRole(bytes32 role, address account) internal view returns (bool) {
        // Implementation would check role assignment
        return false;
    }
}
