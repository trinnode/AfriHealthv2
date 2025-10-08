// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInsurancePool
 * @dev Interface for insurance pool management in AfriHealth Ledger
 */
interface IInsurancePool {
    /// Emitted when pool is initialized
    event PoolInitialized(
        uint256 reserveRatio,
        uint256 solvencyThreshold,
        address indexed initializedBy
    );

    /// Emitted when member joins pool
    event MemberJoined(
        address indexed member,
        uint256 premiumAmount,
        uint256 coverageAmount,
        address indexed joinedBy
    );

    /// Emitted when member leaves pool
    event MemberLeft(
        address indexed member,
        uint256 refundAmount,
        address indexed leftBy
    );

    /// Emitted when premium is paid
    event PremiumPaid(
        address indexed member,
        uint256 amount,
        uint256 coveragePeriod,
        address indexed paidBy
    );

    /// Emitted when claim is submitted
    event ClaimSubmitted(
        bytes32 indexed claimId,
        address indexed member,
        uint256 amount,
        string diagnosis,
        address indexed submittedBy
    );

    /// Emitted when claim is approved
    event ClaimApproved(
        bytes32 indexed claimId,
        uint256 approvedAmount,
        address indexed approvedBy
    );

    /// Emitted when claim is denied
    event ClaimDenied(
        bytes32 indexed claimId,
        string reason,
        address indexed deniedBy
    );

    /// Emitted when claim is paid
    event ClaimPaid(
        bytes32 indexed claimId,
        address indexed member,
        uint256 amount,
        address indexed paidBy
    );

    /// Emitted when pool parameters are updated
    event PoolParametersUpdated(
        uint256 newReserveRatio,
        uint256 newSolvencyThreshold,
        address indexed updatedBy
    );

    /// Initialize the insurance pool
    /// @param reserveRatio Initial reserve ratio (percentage)
    /// @param solvencyThreshold Solvency threshold amount
    function initializePool(
        uint256 reserveRatio,
        uint256 solvencyThreshold
    ) external;

    /// Join the insurance pool
    /// @param premiumAmount Premium amount to pay
    /// @param coverageAmount Coverage amount requested
    function joinPool(uint256 premiumAmount, uint256 coverageAmount) external;

    /// Leave the insurance pool
    function leavePool() external;

    /// Pay premium for coverage period
    /// @param coveragePeriod Period to pay for (in days)
    function payPremium(uint256 coveragePeriod) external;

    /// Submit an insurance claim
    /// @param diagnosis Diagnosis code or description
    /// @param treatment Treatment description
    /// @param amount Claim amount
    /// @param evidenceHashes IPFS hashes of supporting evidence
    /// @return claimId Unique identifier for the claim
    function submitClaim(
        string calldata diagnosis,
        string calldata treatment,
        uint256 amount,
        bytes32[] calldata evidenceHashes
    ) external returns (bytes32 claimId);

    /// Approve a claim (insurer/admin only)
    /// @param claimId Claim identifier
    /// @param approvedAmount Amount to approve
    function approveClaim(bytes32 claimId, uint256 approvedAmount) external;

    /// Deny a claim (insurer/admin only)
    /// @param claimId Claim identifier
    /// @param reason Reason for denial
    function denyClaim(bytes32 claimId, string calldata reason) external;

    /// Pay an approved claim
    /// @param claimId Claim identifier
    function payClaim(bytes32 claimId) external;

    /// Get pool statistics
    /// @return totalMembers Total number of pool members
    /// @return totalReserves Total reserves in the pool
    /// @return activeClaims Number of active claims
    /// @return reserveRatio Current reserve ratio
    /// @return solvencyThreshold Current solvency threshold
    function getPoolStats()
        external
        view
        returns (
            uint256 totalMembers,
            uint256 totalReserves,
            uint256 activeClaims,
            uint256 reserveRatio,
            uint256 solvencyThreshold
        );

    /// Get member information
    /// @param member Member address
    /// @return joinedAt When member joined
    /// @return coverageAmount Current coverage amount
    /// @return premiumPaid Total premium paid
    /// @return lastPaymentDate Last premium payment date
    /// @return isActive Whether member is currently active
    function getMemberInfo(
        address member
    )
        external
        view
        returns (
            uint256 joinedAt,
            uint256 coverageAmount,
            uint256 premiumPaid,
            uint256 lastPaymentDate,
            bool isActive
        );

    /// Get claim details
    /// @param claimId Claim identifier
    /// @return member Member who submitted claim
    /// @return amount Claim amount
    /// @return diagnosis Diagnosis description
    /// @return treatment Treatment description
    /// @return status Current claim status
    /// @return submittedAt When claim was submitted
    /// @return approvedAmount Approved amount (if applicable)
    /// @return paidAt When claim was paid (if applicable)
    function getClaim(
        bytes32 claimId
    )
        external
        view
        returns (
            address member,
            uint256 amount,
            string memory diagnosis,
            string memory treatment,
            string memory status,
            uint256 submittedAt,
            uint256 approvedAmount,
            uint256 paidAt
        );

    /// Update pool parameters (admin only)
    /// @param newReserveRatio New reserve ratio
    /// @param newSolvencyThreshold New solvency threshold
    function updatePoolParameters(
        uint256 newReserveRatio,
        uint256 newSolvencyThreshold
    ) external;
}
