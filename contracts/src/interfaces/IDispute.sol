// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDispute
 * @dev Interface for dispute resolution in AfriHealth Ledger
 */
interface IDispute {
    /// @notice Emitted when a dispute is created
    event DisputeCreated(
        bytes32 indexed disputeId,
        bytes32 indexed invoiceId,
        address indexed complainant,
        string reason,
        uint256 createdAt
    );

    /// @notice Emitted when evidence is submitted
    event EvidenceSubmitted(
        bytes32 indexed disputeId,
        address indexed submitter,
        string evidenceType,
        bytes32 evidenceHash,
        uint256 submittedAt
    );

    /// @notice Emitted when an arbitrator is assigned
    event ArbitratorAssigned(
        bytes32 indexed disputeId,
        address indexed arbitrator,
        address indexed assignedBy
    );

    /// @notice Emitted when a dispute is resolved
    event DisputeResolved(
        bytes32 indexed disputeId,
        address indexed resolvedBy,
        string resolution,
        uint256 resolutionAmount,
        uint256 resolvedAt
    );

    /// @notice Emitted when dispute period ends
    event DisputePeriodEnded(
        bytes32 indexed disputeId,
        uint256 endedAt
    );

    /// @notice Create a new dispute for an invoice
    /// @param invoiceId Invoice identifier being disputed
    /// @param reason Reason for the dispute
    /// @param evidenceHashes Initial evidence hashes
    /// @return disputeId Unique identifier for the dispute
    function createDispute(
        bytes32 invoiceId,
        string calldata reason,
        bytes32[] calldata evidenceHashes
    ) external returns (bytes32 disputeId);

    /// @notice Submit evidence for a dispute
    /// @param disputeId Dispute identifier
    /// @param evidenceType Type of evidence (e.g., "medical_record", "receipt")
    /// @param evidenceHash Hash of the evidence document
    /// @param description Description of the evidence
    function submitEvidence(
        bytes32 disputeId,
        string calldata evidenceType,
        bytes32 evidenceHash,
        string calldata description
    ) external;

    /// @notice Assign an arbitrator to a dispute (admin only)
    /// @param disputeId Dispute identifier
    /// @param arbitrator Arbitrator address
    function assignArbitrator(bytes32 disputeId, address arbitrator) external;

    /// @notice Resolve a dispute
    /// @param disputeId Dispute identifier
    /// @param resolution Resolution description
    /// @param resolutionAmount Final amount agreed upon (if applicable)
    function resolveDispute(
        bytes32 disputeId,
        string calldata resolution,
        uint256 resolutionAmount
    ) external;

    /// @notice Get dispute details
    /// @param disputeId Dispute identifier
    /// @return invoiceId Associated invoice identifier
    /// @return complainant Address that created the dispute
    /// @return reason Reason for the dispute
    /// @return status Current dispute status
    /// @return arbitrator Assigned arbitrator (if any)
    /// @return createdAt When dispute was created
    /// @return resolvedAt When dispute was resolved (if applicable)
    /// @return resolutionAmount Final resolution amount
    function getDispute(bytes32 disputeId) external view returns (
        bytes32 invoiceId,
        address complainant,
        string memory reason,
        string memory status,
        address arbitrator,
        uint256 createdAt,
        uint256 resolvedAt,
        uint256 resolutionAmount
    );

    /// @notice Get evidence for a dispute
    /// @param disputeId Dispute identifier
    /// @return submitters Array of evidence submitters
    /// @return evidenceTypes Array of evidence types
    /// @return evidenceHashes Array of evidence hashes
    /// @return descriptions Array of evidence descriptions
    /// @return submittedAts Array of submission timestamps
    function getDisputeEvidence(bytes32 disputeId) external view returns (
        address[] memory submitters,
        string[] memory evidenceTypes,
        bytes32[] memory evidenceHashes,
        string[] memory descriptions,
        uint256[] memory submittedAts
    );

    /// @notice Check if dispute period has ended
    /// @param disputeId Dispute identifier
    /// @return True if dispute period has ended
    function isDisputePeriodEnded(bytes32 disputeId) external view returns (bool);

    /// @notice Get disputes for an invoice
    /// @param invoiceId Invoice identifier
    /// @return disputeIds Array of dispute identifiers
    function getInvoiceDisputes(bytes32 invoiceId) external view returns (bytes32[] memory disputeIds);

    /// @notice Get active disputes for an account
    /// @param account Account address
    /// @return disputeIds Array of active dispute identifiers
    function getActiveDisputes(address account) external view returns (bytes32[] memory disputeIds);
}
