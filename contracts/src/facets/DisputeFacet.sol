// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IDispute.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "../utils/IdGenerator.sol";

/**
 * @title DisputeFacet
 * @dev Facet for dispute resolution management
 */
contract DisputeFacet is IDispute, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// Storage structure for dispute data
    struct DisputeStorage {
        mapping(bytes32 => DisputeInfo) disputes;
        mapping(bytes32 => DisputeEvidence[]) disputeEvidence;
        mapping(address => bytes32[]) accountDisputes;
        mapping(bytes32 => uint256) disputeDeadlines;
        mapping(bytes32 => bytes32[]) invoiceDisputes;
        bytes32[] activeDisputes;
    }

    /// Dispute information structure
    struct DisputeInfo {
        bytes32 disputeId;
        bytes32 invoiceId;
        address complainant;
        string reason;
        string status;
        address arbitrator;
        uint256 createdAt;
        uint256 resolvedAt;
        uint256 resolutionAmount;
        string resolution;
    }

    /// Dispute evidence structure
    struct DisputeEvidence {
        bytes32 evidenceHash;
        string evidenceType;
        address submittedBy;
        uint256 submittedAt;
    }

    /// Storage position for dispute data
    bytes32 constant DISPUTE_STORAGE_POSITION =
        keccak256("diamond.dispute.storage");

    /**
     * @dev Get dispute storage
     */
    function getDisputeStorage()
        internal
        pure
        returns (DisputeStorage storage ds)
    {
        bytes32 position = DISPUTE_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    /// @inheritdoc IDispute
    function createDispute(
        bytes32 invoiceId,
        string calldata reason,
        bytes32[] calldata evidenceHashes
    ) external nonReentrant whenNotPaused returns (bytes32 disputeId) {
        DisputeStorage storage ds = getDisputeStorage();

        disputeId = IdGenerator.generateDisputeId(
            invoiceId,
            msg.sender,
            keccak256(abi.encodePacked(reason))
        );

        ds.disputes[disputeId] = DisputeInfo({
            disputeId: disputeId,
            invoiceId: invoiceId,
            complainant: msg.sender,
            reason: reason,
            status: "active",
            arbitrator: address(0),
            createdAt: block.timestamp,
            resolvedAt: 0,
            resolutionAmount: 0,
            resolution: ""
        });

        // Add to mappings
        ds.accountDisputes[msg.sender].push(disputeId);
        ds.activeDisputes.push(disputeId);
        ds.invoiceDisputes[invoiceId].push(disputeId);

        // Set deadline (14 days for dispute resolution)
        ds.disputeDeadlines[disputeId] = block.timestamp + 14 days;

        // Add initial evidence
        for (uint256 i = 0; i < evidenceHashes.length; i++) {
            ds.disputeEvidence[disputeId].push(
                DisputeEvidence({
                    evidenceHash: evidenceHashes[i],
                    evidenceType: "initial_evidence",
                    submittedBy: msg.sender,
                    submittedAt: block.timestamp
                })
            );
        }

        emit DisputeCreated(
            disputeId,
            invoiceId,
            msg.sender,
            reason,
            block.timestamp
        );
    }

    /// @inheritdoc IDispute
    function submitEvidence(
        bytes32 disputeId,
        string calldata evidenceType,
        bytes32 evidenceHash,
        string calldata description
    ) external nonReentrant {
        DisputeStorage storage ds = getDisputeStorage();
        require(
            bytes(ds.disputes[disputeId].status).length > 0,
            "Dispute: dispute not found"
        );
        require(
            keccak256(abi.encodePacked(ds.disputes[disputeId].status)) ==
                keccak256(abi.encodePacked("active")),
            "Dispute: dispute not active"
        );

        ds.disputeEvidence[disputeId].push(
            DisputeEvidence({
                evidenceHash: evidenceHash,
                evidenceType: evidenceType,
                submittedBy: msg.sender,
                submittedAt: block.timestamp
            })
        );

        emit EvidenceSubmitted(
            disputeId,
            msg.sender,
            evidenceType,
            evidenceHash,
            block.timestamp
        );
    }

    /// @inheritdoc IDispute
    function assignArbitrator(
        bytes32 disputeId,
        address arbitrator
    ) external onlyAdmin nonReentrant {
        DisputeStorage storage ds = getDisputeStorage();
        DisputeInfo storage dispute = ds.disputes[disputeId];

        require(bytes(dispute.status).length > 0, "Dispute: dispute not found");
        require(
            keccak256(abi.encodePacked(dispute.status)) ==
                keccak256(abi.encodePacked("active")),
            "Dispute: dispute not active"
        );
        require(
            hasRole(ARBITRATOR_ROLE, arbitrator),
            "Dispute: not an arbitrator"
        );

        dispute.arbitrator = arbitrator;

        emit ArbitratorAssigned(disputeId, arbitrator, msg.sender);
    }

    /// @inheritdoc IDispute
    function resolveDispute(
        bytes32 disputeId,
        string calldata resolution,
        uint256 resolutionAmount
    ) external onlyArbitrator nonReentrant {
        DisputeStorage storage ds = getDisputeStorage();
        DisputeInfo storage dispute = ds.disputes[disputeId];

        require(bytes(dispute.status).length > 0, "Dispute: dispute not found");
        require(
            keccak256(abi.encodePacked(dispute.status)) ==
                keccak256(abi.encodePacked("active")),
            "Dispute: dispute not active"
        );
        require(
            dispute.arbitrator == msg.sender,
            "Dispute: not assigned arbitrator"
        );

        dispute.status = "resolved";
        dispute.resolution = resolution;
        dispute.resolutionAmount = resolutionAmount;
        dispute.resolvedAt = block.timestamp;

        // Remove from active disputes
        _removeFromActiveDisputes(ds, disputeId);

        emit DisputeResolved(
            disputeId,
            msg.sender,
            resolution,
            resolutionAmount,
            block.timestamp
        );
    }

    /// @inheritdoc IDispute
    function getDispute(
        bytes32 disputeId
    )
        external
        view
        returns (
            bytes32 invoiceId,
            address complainant,
            string memory reason,
            string memory status,
            address arbitrator,
            uint256 createdAt,
            uint256 resolvedAt,
            uint256 resolutionAmount
        )
    {
        DisputeStorage storage ds = getDisputeStorage();
        DisputeInfo memory dispute = ds.disputes[disputeId];

        return (
            dispute.invoiceId,
            dispute.complainant,
            dispute.reason,
            dispute.status,
            dispute.arbitrator,
            dispute.createdAt,
            dispute.resolvedAt,
            dispute.resolutionAmount
        );
    }

    /// @inheritdoc IDispute
    function getDisputeEvidence(
        bytes32 disputeId
    )
        external
        view
        returns (
            address[] memory submitters,
            string[] memory evidenceTypes,
            bytes32[] memory evidenceHashes,
            string[] memory descriptions,
            uint256[] memory submittedAts
        )
    {
        DisputeStorage storage ds = getDisputeStorage();
        DisputeEvidence[] memory evidence = ds.disputeEvidence[disputeId];

        uint256 length = evidence.length;
        submitters = new address[](length);
        evidenceTypes = new string[](length);
        evidenceHashes = new bytes32[](length);
        descriptions = new string[](length);
        submittedAts = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            submitters[i] = evidence[i].submittedBy;
            evidenceTypes[i] = evidence[i].evidenceType;
            evidenceHashes[i] = evidence[i].evidenceHash;
            descriptions[i] = ""; // Would need to store descriptions
            submittedAts[i] = evidence[i].submittedAt;
        }
    }

    /// @inheritdoc IDispute
    function isDisputePeriodEnded(
        bytes32 disputeId
    ) external view returns (bool) {
        DisputeStorage storage ds = getDisputeStorage();
        return block.timestamp > ds.disputeDeadlines[disputeId];
    }

    /// @inheritdoc IDispute
    function getInvoiceDisputes(
        bytes32 invoiceId
    ) external view returns (bytes32[] memory disputeIds) {
        DisputeStorage storage ds = getDisputeStorage();
        return ds.invoiceDisputes[invoiceId];
    }

    /// @inheritdoc IDispute
    function getActiveDisputes(
        address account
    ) external view returns (bytes32[] memory disputeIds) {
        DisputeStorage storage ds = getDisputeStorage();
        bytes32[] memory accountDisputeIds = ds.accountDisputes[account];

        uint256 count = 0;
        bytes32[] memory active = new bytes32[](accountDisputeIds.length);

        for (uint256 i = 0; i < accountDisputeIds.length; i++) {
            if (
                keccak256(
                    abi.encodePacked(ds.disputes[accountDisputeIds[i]].status)
                ) == keccak256(abi.encodePacked("active"))
            ) {
                active[count] = accountDisputeIds[i];
                count++;
            }
        }

        // Create result array with correct size
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = active[i];
        }

        return result;
    }

    /**
     * @dev Remove dispute from active disputes array
     */
    function _removeFromActiveDisputes(
        DisputeStorage storage ds,
        bytes32 disputeId
    ) internal {
        for (uint256 i = 0; i < ds.activeDisputes.length; i++) {
            if (ds.activeDisputes[i] == disputeId) {
                ds.activeDisputes[i] = ds.activeDisputes[
                    ds.activeDisputes.length - 1
                ];
                ds.activeDisputes.pop();
                break;
            }
        }
    }

    /**
     * @dev Initialize dispute system
     */
    function initializeDispute() external onlyAdmin {
        // Initialize dispute system parameters
        // Set default dispute resolution period, etc.
    }
}
