// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IGovernance
 * @dev Interface for governance and parameter management in AfriHealth Ledger
 */
interface IGovernance {
    /// @notice Emitted when a proposal is created
    event ProposalCreated(
        bytes32 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 votingPeriod,
        uint256 createdAt
    );

    /// @notice Emitted when a vote is cast
    event VoteCast(
        bytes32 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight,
        string reason,
        uint256 votedAt
    );

    /// @notice Emitted when a proposal is executed
    event ProposalExecuted(bytes32 indexed proposalId, address indexed executor);

    /// @notice Emitted when a proposal is cancelled
    event ProposalCancelled(bytes32 indexed proposalId, address indexed canceller);

    /// @notice Emitted when governance parameters are updated
    event GovernanceParametersUpdated(
        uint256 newVotingDelay,
        uint256 newVotingPeriod,
        uint256 newProposalThreshold,
        uint256 newQuorumThreshold,
        address indexed updatedBy
    );

    /// @notice Emitted when emergency pause is activated
    event EmergencyPaused(address indexed pausedBy, string reason);

    /// @notice Emitted when emergency pause is deactivated
    event EmergencyUnpaused(address indexed unpausedBy);

    /// @notice Emitted when a parameter is updated
    event ParameterUpdated(
        string indexed parameter,
        uint256 oldValue,
        uint256 newValue,
        address indexed updatedBy
    );

    /// @notice Create a new governance proposal
    /// @param targets Target contract addresses for calls
    /// @param values ETH values for calls
    /// @param calldatas Function call data
    /// @param description Proposal description
    /// @return proposalId Unique identifier for the proposal
    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external returns (bytes32 proposalId);

    /// @notice Cast a vote on a proposal
    /// @param proposalId Proposal identifier
    /// @param support Vote in support (true) or against (false)
    /// @param reason Reason for the vote
    function castVote(
        bytes32 proposalId,
        bool support,
        string calldata reason
    ) external;

    /// @notice Execute a successful proposal
    /// @param proposalId Proposal identifier
    function execute(bytes32 proposalId) external;

    /// @notice Cancel a proposal
    /// @param proposalId Proposal identifier
    function cancel(bytes32 proposalId) external;

    /// @notice Get proposal state
    /// @param proposalId Proposal identifier
    /// @return state Current state of the proposal
    function state(bytes32 proposalId) external view returns (uint8 state);

    /// @notice Get proposal details
    /// @param proposalId Proposal identifier
    /// @return proposer Address that created the proposal
    /// @return targets Target contract addresses
    /// @return values ETH values for calls
    /// @return calldatas Function call data
    /// @return description Proposal description
    /// @return startTime Voting start time
    /// @return endTime Voting end time
    /// @return forVotes Votes in favor
    /// @return againstVotes Votes against
    /// @return executed Whether proposal was executed
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
    );

    /// @notice Get voting power for an account at a specific time
    /// @param account Account to get voting power for
    /// @param timepoint Time to get voting power at
    /// @return votingPower Voting power of the account
    function getVotes(address account, uint256 timepoint) external view returns (uint256 votingPower);

    /// @notice Get current voting power for an account
    /// @param account Account to get voting power for
    /// @return votingPower Current voting power of the account
    function getCurrentVotes(address account) external view returns (uint256 votingPower);

    /// @notice Update governance parameters (admin only)
    /// @param newVotingDelay New voting delay in blocks/seconds
    /// @param newVotingPeriod New voting period in blocks/seconds
    /// @param newProposalThreshold New proposal threshold
    /// @param newQuorumThreshold New quorum threshold (percentage)
    function updateGovernanceParameters(
        uint256 newVotingDelay,
        uint256 newVotingPeriod,
        uint256 newProposalThreshold,
        uint256 newQuorumThreshold
    ) external;

    /// @notice Emergency pause (guardian only)
    /// @param reason Reason for pausing
    function emergencyPause(string calldata reason) external;

    /// @notice Emergency unpause (guardian only)
    function emergencyUnpause() external;

    /// @notice Check if system is paused
    /// @return True if system is paused
    function isPaused() external view returns (bool);

    /// @notice Update a system parameter (governance approved)
    /// @param parameter Name of parameter to update
    /// @param newValue New parameter value
    function updateParameter(string calldata parameter, uint256 newValue) external;

    /// @notice Get current governance parameters
    /// @return votingDelay Current voting delay
    /// @return votingPeriod Current voting period
    /// @return proposalThreshold Current proposal threshold
    /// @return quorumThreshold Current quorum threshold
    function getGovernanceParameters() external view returns (
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorumThreshold
    );
}
