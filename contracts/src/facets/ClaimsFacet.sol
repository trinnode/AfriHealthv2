// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IClaims.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "../utils/IdGenerator.sol";

/**
 * @title ClaimsFacet
 * @dev Facet for insurance claims management
 */
contract ClaimsFacet is IClaims, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Storage structure for claims data
    struct ClaimsStorage {
        mapping(bytes32 => ClaimInfo) claims;
        mapping(address => bytes32[]) patientClaims;
        mapping(address => bytes32[]) providerClaims;
        mapping(bytes32 => ClaimEvidence[]) claimEvidence;
        mapping(bytes32 => uint256) claimDeadlines;
        bytes32[] pendingReviewClaims;
    }

    /// @notice Claim information structure
    struct ClaimInfo {
        address patient;
        address provider;
        string diagnosis;
        string treatment;
        uint256 amount;
        uint256 approvedAmount;
        string status;
        uint256 submittedAt;
        uint256 approvedAt;
        uint256 paidAt;
        string[] itemCodes;
    }

    /// @notice Claim evidence structure
    struct ClaimEvidence {
        bytes32 evidenceHash;
        string evidenceType;
        address submittedBy;
        uint256 submittedAt;
    }

    /// @notice Storage position for claims data
    bytes32 constant CLAIMS_STORAGE_POSITION =
        keccak256("diamond.claims.storage");

    /**
     * @dev Get claims storage
     */
    function getClaimsStorage() internal pure returns (ClaimsStorage storage cs) {
        bytes32 position = CLAIMS_STORAGE_POSITION;
        assembly {
            cs.slot := position
        }
    }

    /// @inheritdoc IClaims
    function submitClaim(
        address patient,
        string calldata diagnosis,
        string calldata treatment,
        uint256 amount,
        bytes32[] calldata evidenceHashes,
        string[] calldata itemCodes
    ) external nonReentrant whenNotPaused returns (bytes32 claimId) {
        require(hasRole(PROVIDER_ROLE, msg.sender), "Claims: must have provider role");
        ClaimsStorage storage cs = getClaimsStorage();

        claimId = IdGenerator.generateClaimId(patient, msg.sender, keccak256(abi.encodePacked(diagnosis)));

        cs.claims[claimId] = ClaimInfo({
            patient: patient,
            provider: msg.sender,
            diagnosis: diagnosis,
            treatment: treatment,
            amount: amount,
            approvedAmount: 0,
            status: "submitted",
            submittedAt: block.timestamp,
            approvedAt: 0,
            paidAt: 0,
            itemCodes: itemCodes
        });

        // Add to mappings
        cs.patientClaims[patient].push(claimId);
        cs.providerClaims[msg.sender].push(claimId);
        cs.pendingReviewClaims.push(claimId);

        // Set deadline (30 days for review)
        cs.claimDeadlines[claimId] = block.timestamp + 30 days;

        // Add evidence
        for (uint256 i = 0; i < evidenceHashes.length; i++) {
            cs.claimEvidence[claimId].push(ClaimEvidence({
                evidenceHash: evidenceHashes[i],
                evidenceType: "medical_record",
                submittedBy: msg.sender,
                submittedAt: block.timestamp
            }));
        }

        emit ClaimSubmitted(claimId, patient, msg.sender, amount, diagnosis, treatment, block.timestamp);
    }

    /// @inheritdoc IClaims
    function approveClaim(
        bytes32 claimId,
        uint256 approvedAmount,
        string calldata notes
    ) external nonReentrant whenNotPaused {
        require(hasRole(INSURER_ROLE, msg.sender), "Claims: must have insurer role");
        ClaimsStorage storage cs = getClaimsStorage();
        ClaimInfo storage claim = cs.claims[claimId];

        require(bytes(claim.status).length > 0, "Claims: claim not found");
        require(keccak256(abi.encodePacked(claim.status)) == keccak256(abi.encodePacked("submitted")),
                "Claims: claim not in submitted status");

        claim.approvedAmount = approvedAmount;
        claim.status = "approved";
        claim.approvedAt = block.timestamp;

        // Remove from pending review
        _removeFromPendingReview(cs, claimId);

        emit ClaimApproved(claimId, approvedAmount, msg.sender, block.timestamp);
    }

    /// @inheritdoc IClaims
    function denyClaim(bytes32 claimId, string calldata reason) external nonReentrant {
        require(hasRole(INSURER_ROLE, msg.sender), "Claims: must have insurer role");
        ClaimsStorage storage cs = getClaimsStorage();
        ClaimInfo storage claim = cs.claims[claimId];

        require(bytes(claim.status).length > 0, "Claims: claim not found");
        require(keccak256(abi.encodePacked(claim.status)) == keccak256(abi.encodePacked("submitted")),
                "Claims: claim not in submitted status");

        claim.status = "denied";
        claim.approvedAt = block.timestamp;

        // Remove from pending review
        _removeFromPendingReview(cs, claimId);

        emit ClaimDenied(claimId, reason, msg.sender, block.timestamp);
    }

    /// @inheritdoc IClaims
    function payClaim(bytes32 claimId) external nonReentrant whenNotPaused {
        require(hasRole(ADMIN_ROLE, msg.sender), "Claims: must have admin role");
        ClaimsStorage storage cs = getClaimsStorage();
        ClaimInfo storage claim = cs.claims[claimId];

        require(keccak256(abi.encodePacked(claim.status)) == keccak256(abi.encodePacked("approved")),
                "Claims: claim not approved");
        require(claim.approvedAmount > 0, "Claims: no approved amount");
        require(claim.paidAt == 0, "Claims: already paid");

        claim.status = "paid";
        claim.paidAt = block.timestamp;

        // Here you would integrate with treasury to make the payment
        // TreasuryFacet(address(this)).distributeFunds(claim.provider, claim.approvedAmount, "claim_payout");

        emit ClaimPaid(claimId, claim.approvedAmount, claim.provider, block.timestamp);
    }

    /// @inheritdoc IClaims
    function submitClaimEvidence(
        bytes32 claimId,
        bytes32 evidenceHash,
        string calldata evidenceType
    ) external nonReentrant {
        ClaimsStorage storage cs = getClaimsStorage();
        require(bytes(cs.claims[claimId].status).length > 0, "Claims: claim not found");

        cs.claimEvidence[claimId].push(ClaimEvidence({
            evidenceHash: evidenceHash,
            evidenceType: evidenceType,
            submittedBy: msg.sender,
            submittedAt: block.timestamp
        }));

        emit ClaimEvidenceSubmitted(claimId, evidenceHash, evidenceType, msg.sender);
    }

    /// @inheritdoc IClaims
    function escalateToDispute(
        bytes32 claimId,
        string calldata reason
    ) external nonReentrant returns (bytes32 disputeId) {
        ClaimsStorage storage cs = getClaimsStorage();
        ClaimInfo storage claim = cs.claims[claimId];

        require(claim.patient == msg.sender || claim.provider == msg.sender, "Claims: not authorized");
        require(keccak256(abi.encodePacked(claim.status)) != keccak256(abi.encodePacked("disputed")),
                "Claims: already disputed");

        // Create dispute (this would integrate with DisputeFacet)
        disputeId = IdGenerator.generateDisputeId(claimId, msg.sender, keccak256(abi.encodePacked(reason)));

        claim.status = "disputed";

        emit ClaimDisputed(claimId, disputeId, msg.sender);
    }

    /// @inheritdoc IClaims
    function getClaim(bytes32 claimId) external view returns (
        address patient,
        address provider,
        string memory diagnosis,
        string memory treatment,
        uint256 amount,
        uint256 approvedAmount,
        string memory status,
        uint256 submittedAt,
        uint256 approvedAt,
        uint256 paidAt
    ) {
        ClaimsStorage storage cs = getClaimsStorage();
        ClaimInfo memory claim = cs.claims[claimId];

        return (
            claim.patient,
            claim.provider,
            claim.diagnosis,
            claim.treatment,
            claim.amount,
            claim.approvedAmount,
            claim.status,
            claim.submittedAt,
            claim.approvedAt,
            claim.paidAt
        );
    }

    /// @inheritdoc IClaims
    function getPatientClaims(
        address patient,
        string calldata status
    ) external view returns (bytes32[] memory claimIds) {
        ClaimsStorage storage cs = getClaimsStorage();
        bytes32[] memory allClaims = cs.patientClaims[patient];

        if (bytes(status).length == 0) {
            return allClaims;
        }

        // Filter by status
        uint256 count = 0;
        bytes32[] memory filtered = new bytes32[](allClaims.length);

        for (uint256 i = 0; i < allClaims.length; i++) {
            if (_stringEquals(cs.claims[allClaims[i]].status, status)) {
                filtered[count] = allClaims[i];
                count++;
            }
        }

        // Create result array with correct size
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = filtered[i];
        }

        return result;
    }

    /// @inheritdoc IClaims
    function getClaimsForReview(uint256 limit) external view returns (bytes32[] memory claimIds) {
        require(hasRole(INSURER_ROLE, msg.sender), "Claims: must have insurer role");
        ClaimsStorage storage cs = getClaimsStorage();
        uint256 length = cs.pendingReviewClaims.length;

        if (limit > 0 && limit < length) {
            length = limit;
        }

        claimIds = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            claimIds[i] = cs.pendingReviewClaims[i];
        }
    }

    /// @inheritdoc IClaims
    function getClaimEvidence(bytes32 claimId) external view returns (
        bytes32[] memory evidenceHashes,
        string[] memory evidenceTypes,
        address[] memory submittedBys,
        uint256[] memory submittedAts
    ) {
        ClaimsStorage storage cs = getClaimsStorage();
        ClaimEvidence[] memory evidence = cs.claimEvidence[claimId];

        uint256 length = evidence.length;
        evidenceHashes = new bytes32[](length);
        evidenceTypes = new string[](length);
        submittedBys = new address[](length);
        submittedAts = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            evidenceHashes[i] = evidence[i].evidenceHash;
            evidenceTypes[i] = evidence[i].evidenceType;
            submittedBys[i] = evidence[i].submittedBy;
            submittedAts[i] = evidence[i].submittedAt;
        }
    }

    /// @inheritdoc IClaims
    function getClaimStats(address patient) external view returns (
        uint256 totalClaims,
        uint256 approvedClaims,
        uint256 totalApprovedAmount,
        uint256 averageApprovalTime
    ) {
        ClaimsStorage storage cs = getClaimsStorage();
        bytes32[] memory claims = cs.patientClaims[patient];

        totalClaims = claims.length;
        uint256 approvedCount = 0;
        uint256 totalAmount = 0;
        uint256 totalTime = 0;

        for (uint256 i = 0; i < claims.length; i++) {
            ClaimInfo memory claim = cs.claims[claims[i]];
            if (keccak256(abi.encodePacked(claim.status)) == keccak256(abi.encodePacked("paid"))) {
                approvedCount++;
                totalAmount += claim.approvedAmount;
                if (claim.approvedAt > claim.submittedAt) {
                    totalTime += claim.approvedAt - claim.submittedAt;
                }
            }
        }

        approvedClaims = approvedCount;
        totalApprovedAmount = totalAmount;
        averageApprovalTime = approvedCount > 0 ? totalTime / approvedCount : 0;
    }

    /// @inheritdoc IClaims
    function canSubmitClaim(
        address patient,
        uint256 amount
    ) external view returns (bool canSubmit, string memory reason) {
        // Check if patient has active insurance coverage
        // This would integrate with InsurancePoolFacet
        return (true, "");
    }

    /// @inheritdoc IClaims
    function getClaimDeadline(bytes32 claimId) external view returns (uint256 deadline) {
        ClaimsStorage storage cs = getClaimsStorage();
        return cs.claimDeadlines[claimId];
    }

    /// @inheritdoc IClaims
    function isClaimOverdue(bytes32 claimId) external view returns (bool) {
        ClaimsStorage storage cs = getClaimsStorage();
        return block.timestamp > cs.claimDeadlines[claimId];
    }

    /// @inheritdoc IClaims
    function getOverdueClaims(uint256 limit) external view returns (bytes32[] memory claimIds) {
        require(hasRole(ADMIN_ROLE, msg.sender), "Claims: must have admin role");
        ClaimsStorage storage cs = getClaimsStorage();

        uint256 count = 0;
        bytes32[] memory overdue = new bytes32[](cs.pendingReviewClaims.length);

        for (uint256 i = 0; i < cs.pendingReviewClaims.length; i++) {
            bytes32 claimId = cs.pendingReviewClaims[i];
            if (block.timestamp > cs.claimDeadlines[claimId]) {
                overdue[count] = claimId;
                count++;
            }
        }

        // Create result array with correct size
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = overdue[i];
        }

        // Apply limit
        if (limit > 0 && limit < result.length) {
            bytes32[] memory limited = new bytes32[](limit);
            for (uint256 i = 0; i < limit; i++) {
                limited[i] = result[i];
            }
            return limited;
        }

        return result;
    }

    /**
     * @dev Remove claim from pending review array
     */
    function _removeFromPendingReview(ClaimsStorage storage cs, bytes32 claimId) internal {
        for (uint256 i = 0; i < cs.pendingReviewClaims.length; i++) {
            if (cs.pendingReviewClaims[i] == claimId) {
                cs.pendingReviewClaims[i] = cs.pendingReviewClaims[cs.pendingReviewClaims.length - 1];
                cs.pendingReviewClaims.pop();
                break;
            }
        }
    }

    /**
     * @dev Compare strings for equality
     */
    function _stringEquals(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}
