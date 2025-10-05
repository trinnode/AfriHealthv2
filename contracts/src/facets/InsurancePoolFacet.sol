// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IInsurancePool.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "../utils/IdGenerator.sol";

/**
 * @title InsurancePoolFacet
 * @dev Facet for insurance pool management
 */
contract InsurancePoolFacet is IInsurancePool, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Storage structure for insurance pool data
    struct InsurancePoolStorage {
        PoolInfo poolInfo;
        mapping(address => MemberInfo) members;
        mapping(bytes32 => ClaimInfo) claims;
        mapping(address => bytes32[]) memberClaims;
        bytes32[] activeClaims;
    }

    /// @notice Pool information structure
    struct PoolInfo {
        uint256 reserveRatio;
        uint256 solvencyThreshold;
        uint256 totalMembers;
        uint256 totalReserves;
        uint256 activeClaims;
        bool isActive;
    }

    /// @notice Member information structure
    struct MemberInfo {
        uint256 joinedAt;
        uint256 coverageAmount;
        uint256 premiumPaid;
        uint256 lastPaymentDate;
        bool isActive;
    }

    /// @notice Claim information structure
    struct ClaimInfo {
        bytes32 claimId;
        address member;
        uint256 amount;
        string diagnosis;
        string treatment;
        string status;
        uint256 submittedAt;
        uint256 approvedAmount;
        uint256 paidAt;
    }

    /// @notice Storage position for insurance pool data
    bytes32 constant INSURANCE_POOL_STORAGE_POSITION =
        keccak256("diamond.insurancepool.storage");

    /**
     * @dev Get insurance pool storage
     */
    function getInsurancePoolStorage() internal pure returns (InsurancePoolStorage storage ips) {
        bytes32 position = INSURANCE_POOL_STORAGE_POSITION;
        assembly {
            ips.slot := position
        }
    }

    /// @inheritdoc IInsurancePool
    function initializePool(uint256 reserveRatio, uint256 solvencyThreshold) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "InsurancePool: must have admin role");
        InsurancePoolStorage storage ips = getInsurancePoolStorage();

        ips.poolInfo = PoolInfo({
            reserveRatio: reserveRatio,
            solvencyThreshold: solvencyThreshold,
            totalMembers: 0,
            totalReserves: 0,
            activeClaims: 0,
            isActive: true
        });

        emit PoolInitialized(reserveRatio, solvencyThreshold, msg.sender);
    }

    /// @inheritdoc IInsurancePool
    function joinPool(uint256 premiumAmount, uint256 coverageAmount) external nonReentrant whenNotPaused {
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        require(ips.poolInfo.isActive, "InsurancePool: pool not active");

        // Calculate required premium based on coverage
        uint256 requiredPremium = coverageAmount / 1000; // Simple calculation

        require(premiumAmount >= requiredPremium, "InsurancePool: insufficient premium");

        if (ips.members[msg.sender].isActive) {
            // Update existing member
            ips.members[msg.sender].coverageAmount += coverageAmount;
            ips.members[msg.sender].premiumPaid += premiumAmount;
        } else {
            // New member
            ips.members[msg.sender] = MemberInfo({
                joinedAt: block.timestamp,
                coverageAmount: coverageAmount,
                premiumPaid: premiumAmount,
                lastPaymentDate: block.timestamp,
                isActive: true
            });

            ips.poolInfo.totalMembers++;
        }

        ips.poolInfo.totalReserves += premiumAmount;

        emit MemberJoined(msg.sender, premiumAmount, coverageAmount, msg.sender);
    }

    /// @inheritdoc IInsurancePool
    function leavePool() external nonReentrant {
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        require(ips.members[msg.sender].isActive, "InsurancePool: not a member");

        MemberInfo memory member = ips.members[msg.sender];

        // Calculate refund (simplified)
        uint256 refundAmount = member.premiumPaid / 2; // 50% refund

        // Update pool
        ips.poolInfo.totalMembers--;
        ips.poolInfo.totalReserves -= refundAmount;

        // Deactivate member
        ips.members[msg.sender].isActive = false;

        emit MemberLeft(msg.sender, refundAmount, msg.sender);
    }

    /// @inheritdoc IInsurancePool
    function payPremium(uint256 coveragePeriod) external nonReentrant whenNotPaused {
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        require(ips.members[msg.sender].isActive, "InsurancePool: not a member");

        // Calculate premium for period
        uint256 premiumAmount = (ips.members[msg.sender].coverageAmount / 1000) * coveragePeriod;

        // Update member
        ips.members[msg.sender].premiumPaid += premiumAmount;
        ips.members[msg.sender].lastPaymentDate = block.timestamp;

        // Update pool
        ips.poolInfo.totalReserves += premiumAmount;

        emit PremiumPaid(msg.sender, premiumAmount, coveragePeriod, msg.sender);
    }

    /// @inheritdoc IInsurancePool
    function submitClaim(
        string calldata diagnosis,
        string calldata treatment,
        uint256 amount,
        bytes32[] calldata evidenceHashes
    ) external nonReentrant whenNotPaused returns (bytes32 claimId) {
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        require(ips.members[msg.sender].isActive, "InsurancePool: not a member");

        claimId = IdGenerator.generateClaimId(msg.sender, msg.sender, keccak256(abi.encodePacked(diagnosis)));

        ips.claims[claimId] = ClaimInfo({
            claimId: claimId,
            member: msg.sender,
            amount: amount,
            diagnosis: diagnosis,
            treatment: treatment,
            status: "submitted",
            submittedAt: block.timestamp,
            approvedAmount: 0,
            paidAt: 0
        });

        // Add to mappings
        ips.memberClaims[msg.sender].push(claimId);
        ips.activeClaims.push(claimId);
        ips.poolInfo.activeClaims++;

        emit ClaimSubmitted(claimId, msg.sender, amount, diagnosis, msg.sender);
    }

    /// @inheritdoc IInsurancePool
    function approveClaim(bytes32 claimId, uint256 approvedAmount) external nonReentrant whenNotPaused {
        require(hasRole(INSURER_ROLE, msg.sender), "InsurancePool: must have insurer role");
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        ClaimInfo storage claim = ips.claims[claimId];

        require(bytes(claim.status).length > 0, "InsurancePool: claim not found");
        require(keccak256(abi.encodePacked(claim.status)) == keccak256(abi.encodePacked("submitted")),
                "InsurancePool: claim not submitted");

        claim.approvedAmount = approvedAmount;
        claim.status = "approved";

        emit ClaimApproved(claimId, approvedAmount, msg.sender);
    }

    /// @inheritdoc IInsurancePool
    function denyClaim(bytes32 claimId, string calldata reason) external nonReentrant {
        require(hasRole(INSURER_ROLE, msg.sender), "InsurancePool: must have insurer role");
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        ClaimInfo storage claim = ips.claims[claimId];

        require(bytes(claim.status).length > 0, "InsurancePool: claim not found");
        require(keccak256(abi.encodePacked(claim.status)) == keccak256(abi.encodePacked("submitted")),
                "InsurancePool: claim not submitted");

        claim.status = "denied";

        // Remove from active claims
        _removeFromActiveClaims(ips, claimId);
        ips.poolInfo.activeClaims--;

        emit ClaimDenied(claimId, reason, msg.sender);
    }

    /// @inheritdoc IInsurancePool
    function payClaim(bytes32 claimId) external nonReentrant whenNotPaused {
        require(hasRole(ADMIN_ROLE, msg.sender), "InsurancePool: must have admin role");
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        ClaimInfo storage claim = ips.claims[claimId];

        require(keccak256(abi.encodePacked(claim.status)) == keccak256(abi.encodePacked("approved")),
                "InsurancePool: claim not approved");
        require(claim.approvedAmount > 0, "InsurancePool: no approved amount");
        require(claim.paidAt == 0, "InsurancePool: already paid");
        require(ips.poolInfo.totalReserves >= claim.approvedAmount, "InsurancePool: insufficient reserves");

        claim.status = "paid";
        claim.paidAt = block.timestamp;

        // Update pool
        ips.poolInfo.totalReserves -= claim.approvedAmount;

        // Remove from active claims
        _removeFromActiveClaims(ips, claimId);
        ips.poolInfo.activeClaims--;

        emit ClaimPaid(claimId, claim.member, claim.approvedAmount, msg.sender);
    }

    /// @inheritdoc IInsurancePool
    function getPoolStats() external view returns (
        uint256 totalMembers,
        uint256 totalReserves,
        uint256 activeClaims,
        uint256 reserveRatio,
        uint256 solvencyThreshold
    ) {
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        PoolInfo memory pool = ips.poolInfo;

        return (
            pool.totalMembers,
            pool.totalReserves,
            pool.activeClaims,
            pool.reserveRatio,
            pool.solvencyThreshold
        );
    }

    /// @inheritdoc IInsurancePool
    function getMemberInfo(address member) external view returns (
        uint256 joinedAt,
        uint256 coverageAmount,
        uint256 premiumPaid,
        uint256 lastPaymentDate,
        bool isActive
    ) {
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        MemberInfo memory memberInfo = ips.members[member];

        return (
            memberInfo.joinedAt,
            memberInfo.coverageAmount,
            memberInfo.premiumPaid,
            memberInfo.lastPaymentDate,
            memberInfo.isActive
        );
    }

    /// @inheritdoc IInsurancePool
    function getClaim(bytes32 claimId) external view returns (
        address member,
        uint256 amount,
        string memory diagnosis,
        string memory treatment,
        string memory status,
        uint256 submittedAt,
        uint256 approvedAmount,
        uint256 paidAt
    ) {
        InsurancePoolStorage storage ips = getInsurancePoolStorage();
        ClaimInfo memory claim = ips.claims[claimId];

        return (
            claim.member,
            claim.amount,
            claim.diagnosis,
            claim.treatment,
            claim.status,
            claim.submittedAt,
            claim.approvedAmount,
            claim.paidAt
        );
    }

    /// @inheritdoc IInsurancePool
    function updatePoolParameters(uint256 newReserveRatio, uint256 newSolvencyThreshold) external nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "InsurancePool: must have admin role");
        InsurancePoolStorage storage ips = getInsurancePoolStorage();

        ips.poolInfo.reserveRatio = newReserveRatio;
        ips.poolInfo.solvencyThreshold = newSolvencyThreshold;

        emit PoolParametersUpdated(newReserveRatio, newSolvencyThreshold, msg.sender);
    }

    /**
     * @dev Remove claim from active claims array
     */
    function _removeFromActiveClaims(InsurancePoolStorage storage ips, bytes32 claimId) internal {
        for (uint256 i = 0; i < ips.activeClaims.length; i++) {
            if (ips.activeClaims[i] == claimId) {
                ips.activeClaims[i] = ips.activeClaims[ips.activeClaims.length - 1];
                ips.activeClaims.pop();
                break;
            }
        }
    }

    /**
     * @dev Initialize insurance pool
     */
    function initializeInsurancePool() external {
        require(hasRole(ADMIN_ROLE, msg.sender), "InsurancePool: must have admin role");
        InsurancePoolStorage storage ips = getInsurancePoolStorage();

        ips.poolInfo = PoolInfo({
            reserveRatio: 150, // 150% reserve ratio
            solvencyThreshold: 10000, // $10,000 minimum
            totalMembers: 0,
            totalReserves: 0,
            activeClaims: 0,
            isActive: true
        });
    }
}
