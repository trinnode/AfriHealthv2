// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IToken.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "hedera-smart-contracts/system-contracts/hedera-token-service/IHederaTokenService.sol";
import "hedera-smart-contracts/system-contracts/HederaResponseCodes.sol";

/**
 * @title TokenFacet
 * @dev Facet for HTS token management using Hedera Token Service
 * This contract uses composition to interact with HTS instead of inheritance
 * to avoid override conflicts with non-virtual functions
 */
contract TokenFacet is IToken, AccessControl, ReentrancyGuard, Pausable {
    /// Hedera Token Service precompile address
    address constant HTS_PRECOMPILE = address(0x167);
    /// Storage structure for token data
    struct TokenStorage {
        address platformCreditToken;
        address insurancePoolToken;
        mapping(address => mapping(address => uint256)) balances;
        mapping(address => address[]) associatedTokens;
        mapping(address => mapping(address => bool)) tokenAssociations;
        mapping(address => bool) kycApprovals;
        mapping(address => uint256) mintAllowances;
    }

    /// Storage position for token data
    bytes32 constant TOKEN_STORAGE_POSITION =
        keccak256("diamond.token.storage");

    /**
     * @dev Get token storage
     */
    function getTokenStorage() internal pure returns (TokenStorage storage ts) {
        bytes32 position = TOKEN_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }

    /// @inheritdoc IToken
    function initializeTokens(
        address platformCreditToken,
        address insurancePoolToken
    ) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();

        ts.platformCreditToken = platformCreditToken;
        ts.insurancePoolToken = insurancePoolToken;

        emit TokensInitialized(
            platformCreditToken,
            insurancePoolToken,
            msg.sender
        );
    }

    /// @inheritdoc IToken
    function mintPlatformCredit(
        address to,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();
        require(
            ts.mintAllowances[msg.sender] >= amount ||
                hasRole(ADMIN_ROLE, msg.sender),
            "Token: insufficient mint allowance"
        );

        ts.balances[ts.platformCreditToken][to] += amount;
        ts.mintAllowances[msg.sender] -= amount;

        emit PlatformCreditMinted(to, amount, msg.sender);
    }

    /// @inheritdoc IToken
    function burnPlatformCredit(
        address from,
        uint256 amount
    ) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();
        require(
            ts.balances[ts.platformCreditToken][from] >= amount,
            "Token: insufficient balance"
        );

        ts.balances[ts.platformCreditToken][from] -= amount;

        emit PlatformCreditBurned(from, amount, msg.sender);
    }

    /// @inheritdoc IToken
    function mintInsurancePoolToken(
        address to,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();
        require(
            ts.mintAllowances[msg.sender] >= amount ||
                hasRole(ADMIN_ROLE, msg.sender),
            "Token: insufficient mint allowance"
        );

        ts.balances[ts.insurancePoolToken][to] += amount;
        ts.mintAllowances[msg.sender] -= amount;

        emit InsurancePoolTokenMinted(to, amount, msg.sender);
    }

    /// @inheritdoc IToken
    function burnInsurancePoolToken(
        address from,
        uint256 amount
    ) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();
        require(
            ts.balances[ts.insurancePoolToken][from] >= amount,
            "Token: insufficient balance"
        );

        ts.balances[ts.insurancePoolToken][from] -= amount;

        emit InsurancePoolTokenBurned(from, amount, msg.sender);
    }

    /// @inheritdoc IToken
    function associateToken(
        address account,
        address token
    ) external nonReentrant whenNotPaused {
        TokenStorage storage ts = getTokenStorage();

        if (!ts.tokenAssociations[account][token]) {
            // Call HTS precompile to associate token
            (bool success, bytes memory result) = HTS_PRECOMPILE.call(
                abi.encodeWithSignature(
                    "associateToken(address,address)",
                    account,
                    token
                )
            );

            if (success) {
                int256 responseCode = abi.decode(result, (int256));
                require(
                    responseCode == HederaResponseCodes.SUCCESS,
                    "HTS: token association failed"
                );
            }

            ts.tokenAssociations[account][token] = true;
            ts.associatedTokens[account].push(token);

            emit TokenAssociated(account, token, msg.sender);
        }
    }

    /// @inheritdoc IToken
    function dissociateToken(
        address account,
        address token
    ) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();

        if (ts.tokenAssociations[account][token]) {
            // Call HTS precompile to dissociate token
            (bool success, bytes memory result) = HTS_PRECOMPILE.call(
                abi.encodeWithSignature(
                    "dissociateToken(address,address)",
                    account,
                    token
                )
            );

            if (success) {
                int256 responseCode = abi.decode(result, (int256));
                require(
                    responseCode == HederaResponseCodes.SUCCESS,
                    "HTS: token dissociation failed"
                );
            }

            ts.tokenAssociations[account][token] = false;

            // Remove from associated tokens array
            address[] storage tokens = ts.associatedTokens[account];
            for (uint256 i = 0; i < tokens.length; i++) {
                if (tokens[i] == token) {
                    tokens[i] = tokens[tokens.length - 1];
                    tokens.pop();
                    break;
                }
            }

            emit TokenDissociated(account, token, msg.sender);
        }
    }

    /// @inheritdoc IToken
    function isTokenAssociated(
        address account,
        address token
    ) external view returns (bool) {
        TokenStorage storage ts = getTokenStorage();
        return ts.tokenAssociations[account][token];
    }

    /// @inheritdoc IToken
    function getAssociatedTokens(
        address account
    ) external view returns (address[] memory) {
        TokenStorage storage ts = getTokenStorage();
        return ts.associatedTokens[account];
    }

    /// @inheritdoc IToken
    function setKYCApproval(
        address account,
        bool approved
    ) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();
        ts.kycApprovals[account] = approved;

        emit KYCApprovalSet(account, approved, msg.sender);
    }

    /// @inheritdoc IToken
    function isKYCApproved(address account) external view returns (bool) {
        TokenStorage storage ts = getTokenStorage();
        return ts.kycApprovals[account];
    }

    /// @inheritdoc IToken
    function getPlatformCreditBalance(
        address account
    ) external view returns (uint256) {
        TokenStorage storage ts = getTokenStorage();
        return ts.balances[ts.platformCreditToken][account];
    }

    /// @inheritdoc IToken
    function getInsurancePoolBalance(
        address account
    ) external view returns (uint256) {
        TokenStorage storage ts = getTokenStorage();
        return ts.balances[ts.insurancePoolToken][account];
    }

    /// @inheritdoc IToken
    function setMintAllowance(
        address spender,
        uint256 allowance
    ) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();
        ts.mintAllowances[spender] = allowance;

        emit MintAllowanceSet(spender, allowance, msg.sender);
    }

    /// @inheritdoc IToken
    function getTokenAddresses()
        external
        view
        returns (address platformCredit, address insurancePool)
    {
        TokenStorage storage ts = getTokenStorage();
        return (ts.platformCreditToken, ts.insurancePoolToken);
    }

    /**
     * @dev Initialize token system
     */
    function initializeTokenSystem() external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Token: must have admin role");
        TokenStorage storage ts = getTokenStorage();

        // These would be actual HTS token addresses in production
        ts.platformCreditToken = address(0x123);
        ts.insurancePoolToken = address(0x456);
    }
}
