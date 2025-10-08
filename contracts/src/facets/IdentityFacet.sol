// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IIdentity.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";

/**
 * @title IdentityFacet
 * @dev Facet for identity and verification management
 */
contract IdentityFacet is IIdentity, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// Storage structure for identity data
    struct IdentityStorage {
        mapping(address => IdentityInfo) identities;
        mapping(address => ProviderInfo) providers;
        mapping(address => bool) kycStatuses;
        mapping(address => string) dids;
        mapping(string => address[]) accountsByType;
        mapping(string => address[]) providersBySpecialty;
    }

    /// Identity information structure
    struct IdentityInfo {
        string identityType;
        bytes32 identityHash;
        string metadata;
        uint256 registeredAt;
    }

    /// Provider information structure
    struct ProviderInfo {
        string licenseNumber;
        string specialty;
        bytes32 verificationData;
        bool isVerified;
        uint256 verifiedAt;
    }

    /// Storage position for identity data
    bytes32 constant IDENTITY_STORAGE_POSITION =
        keccak256("diamond.identity.storage");

    /**
     * @dev Get identity storage
     */
    function getIdentityStorage()
        internal
        pure
        returns (IdentityStorage storage ids)
    {
        bytes32 position = IDENTITY_STORAGE_POSITION;
        assembly {
            ids.slot := position
        }
    }

    /// @inheritdoc IIdentity
    function registerIdentity(
        string calldata identityType,
        bytes32 identityData,
        string calldata metadata
    ) external nonReentrant whenNotPaused {
        IdentityStorage storage ids = getIdentityStorage();

        ids.identities[msg.sender] = IdentityInfo({
            identityType: identityType,
            identityHash: identityData,
            metadata: metadata,
            registeredAt: block.timestamp
        });

        // Add to accounts by type mapping
        ids.accountsByType[identityType].push(msg.sender);

        emit IdentityRegistered(
            msg.sender,
            identityType,
            identityData,
            msg.sender
        );
    }

    /// @inheritdoc IIdentity
    function verifyProvider(
        address provider,
        string calldata licenseNumber,
        string calldata specialty,
        bytes32 verificationData
    ) external onlyAdmin nonReentrant whenNotPaused {
        IdentityStorage storage ids = getIdentityStorage();

        ids.providers[provider] = ProviderInfo({
            licenseNumber: licenseNumber,
            specialty: specialty,
            verificationData: verificationData,
            isVerified: true,
            verifiedAt: block.timestamp
        });

        // Grant provider role
        _grantRole(PROVIDER_ROLE, provider);

        // Add to providers by specialty
        ids.providersBySpecialty[specialty].push(provider);

        emit ProviderVerified(provider, licenseNumber, specialty, msg.sender);
    }

    /// @inheritdoc IIdentity
    function revokeProviderVerification(
        address provider,
        string calldata reason
    ) external onlyAdmin nonReentrant {
        IdentityStorage storage ids = getIdentityStorage();

        if (ids.providers[provider].isVerified) {
            ids.providers[provider].isVerified = false;
            _revokeRole(PROVIDER_ROLE, provider);
            emit ProviderVerificationRevoked(provider, reason, msg.sender);
        }
    }

    /// @inheritdoc IIdentity
    function updateKYCStatus(
        address account,
        bool status
    ) external onlyAdmin nonReentrant {
        IdentityStorage storage ids = getIdentityStorage();
        ids.kycStatuses[account] = status;
        emit KYCStatusUpdated(account, status, msg.sender);
    }

    /// @inheritdoc IIdentity
    function linkDID(string calldata did) external nonReentrant whenNotPaused {
        IdentityStorage storage ids = getIdentityStorage();
        ids.dids[msg.sender] = did;
        emit DIDLinked(msg.sender, did, msg.sender);
    }

    /// @inheritdoc IIdentity
    function getIdentity(
        address account
    )
        external
        view
        returns (
            string memory identityType,
            bytes32 identityHash,
            string memory metadata,
            uint256 registeredAt
        )
    {
        IdentityStorage storage ids = getIdentityStorage();
        IdentityInfo memory identity = ids.identities[account];
        return (
            identity.identityType,
            identity.identityHash,
            identity.metadata,
            identity.registeredAt
        );
    }

    /// @inheritdoc IIdentity
    function getProviderInfo(
        address provider
    )
        external
        view
        returns (
            string memory licenseNumber,
            string memory specialty,
            bytes32 verificationData,
            bool isVerified,
            uint256 verifiedAt
        )
    {
        IdentityStorage storage ids = getIdentityStorage();
        ProviderInfo memory providerInfo = ids.providers[provider];
        return (
            providerInfo.licenseNumber,
            providerInfo.specialty,
            providerInfo.verificationData,
            providerInfo.isVerified,
            providerInfo.verifiedAt
        );
    }

    /// @inheritdoc IIdentity
    function isProviderVerified(address provider) external view returns (bool) {
        IdentityStorage storage ids = getIdentityStorage();
        return ids.providers[provider].isVerified;
    }

    /// @inheritdoc IIdentity
    function getKYCStatus(address account) external view returns (bool) {
        IdentityStorage storage ids = getIdentityStorage();
        return ids.kycStatuses[account];
    }

    /// @inheritdoc IIdentity
    function getDID(address account) external view returns (string memory did) {
        IdentityStorage storage ids = getIdentityStorage();
        return ids.dids[account];
    }

    /// @inheritdoc IIdentity
    function getAccountsByType(
        string calldata identityType,
        uint256 limit
    ) external view returns (address[] memory accounts) {
        IdentityStorage storage ids = getIdentityStorage();
        address[] memory allAccounts = ids.accountsByType[identityType];
        if (limit == 0 || limit >= allAccounts.length) {
            return allAccounts;
        }
        accounts = new address[](limit);
        for (uint256 i = 0; i < limit; i++) {
            accounts[i] = allAccounts[i];
        }
    }

    /// @inheritdoc IIdentity
    function getProvidersBySpecialty(
        string calldata specialty
    ) external view returns (address[] memory providers) {
        IdentityStorage storage ids = getIdentityStorage();
        return ids.providersBySpecialty[specialty];
    }

    /// @inheritdoc IIdentity
    function updateIdentity(
        string calldata identityType,
        bytes32 identityData,
        string calldata metadata
    ) external nonReentrant whenNotPaused {
        IdentityStorage storage ids = getIdentityStorage();

        // Remove from old type mapping if type changed
        if (bytes(ids.identities[msg.sender].identityType).length > 0) {
            _removeFromTypeMapping(
                msg.sender,
                ids.identities[msg.sender].identityType
            );
        }

        // Update identity
        ids.identities[msg.sender] = IdentityInfo({
            identityType: identityType,
            identityHash: identityData,
            metadata: metadata,
            registeredAt: block.timestamp
        });

        // Add to new type mapping
        ids.accountsByType[identityType].push(msg.sender);

        emit IdentityRegistered(
            msg.sender,
            identityType,
            identityData,
            msg.sender
        );
    }

    /**
     * @dev Remove address from type mapping
     * @param account Account to remove
     * @param identityType Type to remove from
     */
    function _removeFromTypeMapping(
        address account,
        string memory identityType
    ) internal {
        IdentityStorage storage ids = getIdentityStorage();
        address[] storage accounts = ids.accountsByType[identityType];

        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == account) {
                accounts[i] = accounts[accounts.length - 1];
                accounts.pop();
                break;
            }
        }
    }
}
