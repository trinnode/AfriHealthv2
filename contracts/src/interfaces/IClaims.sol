// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IClaims
 * @dev Interface for insurance claims management in AfriHealth Ledger
 */
interface IClaims {
    /// @notice Emitted when a claim is submitted
    event ClaimSubmitted(
        bytes32 indexed claimId,
        address indexed patient,
        address indexed provider,
        uint256 amount,
        string diagnosis,
        string treatment,
        uint256 submittedAt
    );

    /// @notice Emitted when a claim is approved
    event ClaimApproved(
        bytes32 indexed claimId,
        uint256 approvedAmount,
        address indexed approvedBy,
        uint256 approvedAt
    );

    /// @notice Emitted when a claim is denied
    event ClaimDenied(
        bytes32 indexed claimId,
        string reason,
        address indexed deniedBy,
        uint256 deniedAt
    );

    /// @notice Emitted when a claim is paid
    event ClaimPaid(
        bytes32 indexed claimId,
        uint256 amount,
        address indexed paidTo,
        uint256 paidAt
    );

    /// @notice Emitted when additional evidence is submitted
    event ClaimEvidenceSubmitted(
        bytes32 indexed claimId,
        bytes32 evidenceHash,
        string evidenceType,
        address indexed submittedBy
    );

    /// @notice Emitted when claim is escalated to dispute
    event ClaimDisputed(
        bytes32 indexed claimId,
        bytes32 indexed disputeId,
        address indexed escalatedBy
    );

    /// @notice Submit a new insurance claim
    /// @param patient Patient address
    /// @param diagnosis Diagnosis code/description
    /// @param treatment Treatment description
    /// @param amount Claim amount
    /// @param evidenceHashes Hashes of supporting evidence
    /// @param itemCodes Medical billing codes
    /// @return claimId Unique identifier for the claim
    function submitClaim(
        address patient,
        string calldata diagnosis,
        string calldata treatment,
        uint256 amount,
        bytes32[] calldata evidenceHashes,
        string[] calldata itemCodes
    ) external returns (bytes32 claimId);

    /// @notice Approve a claim (insurer/admin only)
    /// @param claimId Claim identifier
    /// @param approvedAmount Amount to approve
    /// @param notes Approval notes
    function approveClaim(
        bytes32 claimId,
        uint256 approvedAmount,
        string calldata notes
    ) external;

    /// @notice Deny a claim (insurer/admin only)
    /// @param claimId Claim identifier
    /// @param reason Reason for denial
    function denyClaim(bytes32 claimId, string calldata reason) external;

    /// @notice Pay an approved claim
    /// @param claimId Claim identifier
    function payClaim(bytes32 claimId) external;

    /// @notice Submit additional evidence for a claim
    /// @param claimId Claim identifier
    /// @param evidenceHash Hash of additional evidence
    /// @param evidenceType Type of evidence
    function submitClaimEvidence(
        bytes32 claimId,
        bytes32 evidenceHash,
        string calldata evidenceType
    ) external;

    /// @notice Escalate claim to dispute process
    /// @param claimId Claim identifier
    /// @param reason Reason for escalation
    /// @return disputeId Unique identifier for the created dispute
    function escalateToDispute(
        bytes32 claimId,
        string calldata reason
    ) external returns (bytes32 disputeId);

    /// @notice Get claim details
    /// @param claimId Claim identifier
    /// @return patient Patient address
    /// @return provider Provider address (if applicable)
    /// @return diagnosis Diagnosis description
    /// @return treatment Treatment description
    /// @return amount Original claim amount
    /// @return approvedAmount Approved amount
    /// @return status Current claim status
    /// @return submittedAt When claim was submitted
    /// @return approvedAt When claim was approved (if applicable)
    /// @return paidAt When claim was paid (if applicable)
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
    );

    /// @notice Get claims for a patient
    /// @param patient Patient address
    /// @param status Filter by status (empty string for all)
    /// @return claimIds Array of claim identifiers
    function getPatientClaims(
        address patient,
        string calldata status
    ) external view returns (bytes32[] memory claimIds);

    /// @notice Get claims requiring review (insurer/admin only)
    /// @param limit Maximum number of claims to return
    /// @return claimIds Array of claim identifiers needing review
    function getClaimsForReview(uint256 limit) external view returns (bytes32[] memory claimIds);

    /// @notice Get claim evidence
    /// @param claimId Claim identifier
    /// @return evidenceHashes Array of evidence hashes
    /// @return evidenceTypes Array of evidence types
    /// @return submittedBys Array of submitter addresses
    /// @return submittedAts Array of submission timestamps
    function getClaimEvidence(bytes32 claimId) external view returns (
        bytes32[] memory evidenceHashes,
        string[] memory evidenceTypes,
        address[] memory submittedBys,
        uint256[] memory submittedAts
    );

    /// @notice Get claim statistics for a patient
    /// @param patient Patient address
    /// @return totalClaims Total number of claims
    /// @return approvedClaims Number of approved claims
    /// @return totalApprovedAmount Total amount approved
    /// @return averageApprovalTime Average time to approval in days
    function getClaimStats(address patient) external view returns (
        uint256 totalClaims,
        uint256 approvedClaims,
        uint256 totalApprovedAmount,
        uint256 averageApprovalTime
    );

    /// @notice Check if claim can be submitted
    /// @param patient Patient address
    /// @param amount Claim amount
    /// @return canSubmit True if claim can be submitted
    /// @return reason Reason if claim cannot be submitted
    function canSubmitClaim(
        address patient,
        uint256 amount
    ) external view returns (bool canSubmit, string memory reason);

    /// @notice Get claim processing deadline
    /// @param claimId Claim identifier
    /// @return deadline Processing deadline timestamp
    function getClaimDeadline(bytes32 claimId) external view returns (uint256 deadline);

    /// @notice Check if claim processing is overdue
    /// @param claimId Claim identifier
    /// @return True if claim processing is overdue
    function isClaimOverdue(bytes32 claimId) external view returns (bool);

    /// @notice Get overdue claims (admin only)
    /// @param limit Maximum number of claims to return
    /// @return claimIds Array of overdue claim identifiers
    function getOverdueClaims(uint256 limit) external view returns (bytes32[] memory claimIds);
}
