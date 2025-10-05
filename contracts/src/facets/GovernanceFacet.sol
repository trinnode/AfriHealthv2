// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IGovernance.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";

/**
 * @title GovernanceFacet
 * @dev Facet for governance and parameter management
 */
contract GovernanceFacet is IGovernance, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Storage structure for governance data
    struct GovernanceStorage {
        mapping(bytes32 => Proposal) proposals;
        mapping(address => uint256) votingPower;
        mapping(bytes32 => mapping(address => bool)) hasVoted;
        mapping(bytes32 => uint256) proposalVotes;
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorumThreshold;
        uint256 proposalCount;
    }

    /// @notice Proposal structure
    struct Proposal {
        bytes32 proposalId;
        address proposer;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
    }

    /// @notice Storage position for governance data
    bytes32 constant GOVERNANCE_STORAGE_POSITION =
        keccak256("diamond.governance.storage");

    /**
     * @dev Get governance storage
     */
    function getGovernanceStorage() internal pure returns (GovernanceStorage storage gs) {
        bytes32 position = GOVERNANCE_STORAGE_POSITION;
        assembly {
            gs.slot := position
        }
    }

    /// @inheritdoc IGovernance
    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external nonReentrant whenNotPaused returns (bytes32 proposalId) {
        GovernanceStorage storage gs = getGovernanceStorage();

        require(gs.votingPower[msg.sender] >= gs.proposalThreshold, "Governance: insufficient voting power");

        proposalId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            gs.proposalCount++
        ));

        uint256 startTime = block.timestamp + gs.votingDelay;
        uint256 endTime = startTime + gs.votingPeriod;

        gs.proposals[proposalId] = Proposal({
            proposalId: proposalId,
            proposer: msg.sender,
            targets: targets,
            values: values,
            calldatas: calldatas,
            description: description,
            startTime: startTime,
            endTime: endTime,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalId, msg.sender, description, gs.votingPeriod, block.timestamp);
    }

    /// @inheritdoc IGovernance
    function castVote(
        bytes32 proposalId,
        bool support,
        string calldata reason
    ) external nonReentrant {
        GovernanceStorage storage gs = getGovernanceStorage();
        Proposal storage proposal = gs.proposals[proposalId];

        require(block.timestamp >= proposal.startTime, "Governance: voting not started");
        require(block.timestamp <= proposal.endTime, "Governance: voting ended");
        require(!gs.hasVoted[proposalId][msg.sender], "Governance: already voted");
        require(state(proposalId) == 1, "Governance: proposal not active"); // Active state

        uint256 weight = gs.votingPower[msg.sender];
        require(weight > 0, "Governance: no voting power");

        gs.hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight, reason, block.timestamp);
    }

    /// @inheritdoc IGovernance
    function execute(bytes32 proposalId) external nonReentrant {
        GovernanceStorage storage gs = getGovernanceStorage();
        Proposal storage proposal = gs.proposals[proposalId];

        require(state(proposalId) == 4, "Governance: proposal not succeeded"); // Succeeded state
        require(!proposal.executed, "Governance: already executed");

        proposal.executed = true;

        // Execute the proposal actions
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(proposal.calldatas[i]);
            require(success, "Governance: execution failed");
        }

        emit ProposalExecuted(proposalId, msg.sender);
    }

    /// @inheritdoc IGovernance
    function cancel(bytes32 proposalId) external nonReentrant {
        GovernanceStorage storage gs = getGovernanceStorage();
        Proposal storage proposal = gs.proposals[proposalId];

        require(msg.sender == proposal.proposer || hasRole(ADMIN_ROLE, msg.sender), "Governance: not authorized");
        require(!proposal.executed, "Governance: already executed");
        require(state(proposalId) != 4, "Governance: proposal already succeeded"); // Not in succeeded state

        proposal.canceled = true;

        emit ProposalCancelled(proposalId, msg.sender);
    }

    /// @inheritdoc IGovernance
    function state(bytes32 proposalId) public view returns (uint8) {
        GovernanceStorage storage gs = getGovernanceStorage();
        Proposal storage proposal = gs.proposals[proposalId];

        if (proposal.canceled) {
            return 2; // Canceled
        }

        if (block.timestamp <= proposal.startTime) {
            return 0; // Pending
        }

        if (block.timestamp <= proposal.endTime) {
            return 1; // Active
        }

        if (proposal.executed) {
            return 7; // Executed
        }

        // Check if proposal succeeded
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        if (totalVotes >= gs.quorumThreshold && proposal.forVotes > proposal.againstVotes) {
            return 4; // Succeeded
        }

        return 3; // Defeated
    }

    /// @inheritdoc IGovernance
    function getProposal(bytes32 proposalId) external view returns (
        address proposer,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed
    ) {
        GovernanceStorage storage gs = getGovernanceStorage();
        Proposal storage proposal = gs.proposals[proposalId];

        return (
            proposal.proposer,
            proposal.targets,
            proposal.values,
            proposal.calldatas,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed
        );
    }

    /// @inheritdoc IGovernance
    function getVotes(address account, uint256 timepoint) external view returns (uint256 votingPower) {
        // This would need to be implemented with proper voting power calculation
        // For now, return 0
        return 0;
    }

    /// @inheritdoc IGovernance
    function getCurrentVotes(address account) external view returns (uint256 votingPower) {
        GovernanceStorage storage gs = getGovernanceStorage();
        return gs.votingPower[account];
    }

    /// @inheritdoc IGovernance
    function updateGovernanceParameters(
        uint256 newVotingDelay,
        uint256 newVotingPeriod,
        uint256 newProposalThreshold,
        uint256 newQuorumThreshold
    ) external onlyAdmin nonReentrant {
        GovernanceStorage storage gs = getGovernanceStorage();

        gs.votingDelay = newVotingDelay;
        gs.votingPeriod = newVotingPeriod;
        gs.proposalThreshold = newProposalThreshold;
        gs.quorumThreshold = newQuorumThreshold;

        emit GovernanceParametersUpdated(
            newVotingDelay,
            newVotingPeriod,
            newProposalThreshold,
            newQuorumThreshold,
            msg.sender
        );
    }

    /// @inheritdoc IGovernance
    function emergencyPause(string calldata reason) external onlyAdmin nonReentrant {
        DiamondStorage.diamondStorage().setEmergencyPaused(true);
        emit EmergencyPaused(msg.sender, reason);
    }

    /// @inheritdoc IGovernance
    function emergencyUnpause() external onlyAdmin nonReentrant {
        DiamondStorage.diamondStorage().setEmergencyPaused(false);
        emit EmergencyUnpaused(msg.sender);
    }

    /// @inheritdoc IGovernance
    function isPaused() external view returns (bool) {
        return DiamondStorage.diamondStorage().isPaused();
    }

    /// @inheritdoc IGovernance
    function updateParameter(string calldata parameter, uint256 newValue) external onlyAdmin nonReentrant {
        // Implementation would update specific system parameters
        emit ParameterUpdated(parameter, 0, newValue, msg.sender);
    }

    /// @inheritdoc IGovernance
    function getGovernanceParameters() external view returns (
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorumThreshold
    ) {
        GovernanceStorage storage gs = getGovernanceStorage();
        return (gs.votingDelay, gs.votingPeriod, gs.proposalThreshold, gs.quorumThreshold);
    }

    /**
     * @dev Initialize governance system
     */
    function initializeGovernance() external onlyAdmin {
        GovernanceStorage storage gs = getGovernanceStorage();

        gs.votingDelay = 1 days;
        gs.votingPeriod = 7 days;
        gs.proposalThreshold = 100; // Minimum voting power to create proposal
        gs.quorumThreshold = 1000;  // Minimum total votes for quorum
        gs.proposalCount = 0;
    }

    /**
     * @dev Set voting power for an account (admin only)
     */
    function setVotingPower(address account, uint256 power) external onlyAdmin {
        GovernanceStorage storage gs = getGovernanceStorage();
        gs.votingPower[account] = power;
    }
}
