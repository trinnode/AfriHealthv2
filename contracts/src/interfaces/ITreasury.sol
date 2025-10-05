// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITreasury
 * @dev Interface for treasury and fee management in AfriHealth Ledger
 */
interface ITreasury {
    /// @notice Emitted when fees are collected
    event FeesCollected(
        address indexed token,
        uint256 amount,
        string feeType,
        address indexed collectedBy
    );

    /// @notice Emitted when funds are distributed
    event FundsDistributed(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        string distributionType,
        address indexed distributedBy
    );

    /// @notice Emitted when treasury parameters are updated
    event TreasuryParametersUpdated(
        uint256 newPlatformFee,
        uint256 newInsuranceFee,
        address indexed updatedBy
    );

    /// @notice Emitted when treasury balance changes
    event TreasuryBalanceChanged(
        address indexed token,
        uint256 oldBalance,
        uint256 newBalance,
        string reason
    );

    /// @notice Collect platform fees from a transaction
    /// @param amount Amount to collect as fees
    /// @param feeType Type of fee (e.g., "platform", "insurance")
    function collectFees(uint256 amount, string calldata feeType) external;

    /// @notice Distribute funds to a recipient
    /// @param recipient Address to receive funds
    /// @param amount Amount to distribute
    /// @param distributionType Type of distribution (e.g., "provider_payment", "claim_payout")
    function distributeFunds(
        address recipient,
        uint256 amount,
        string calldata distributionType
    ) external;

    /// @notice Get treasury balance for a token
    /// @param token Token address (address(0) for HBAR)
    /// @return balance Current treasury balance
    function getTreasuryBalance(address token) external view returns (uint256 balance);

    /// @notice Get all treasury balances
    /// @return tokens Array of token addresses
    /// @return balances Array of corresponding balances
    function getAllTreasuryBalances() external view returns (
        address[] memory tokens,
        uint256[] memory balances
    );

    /// @notice Update treasury parameters (admin only)
    /// @param newPlatformFee New platform fee percentage (basis points)
    /// @param newInsuranceFee New insurance fee percentage (basis points)
    function updateTreasuryParameters(
        uint256 newPlatformFee,
        uint256 newInsuranceFee
    ) external;

    /// @notice Get current treasury parameters
    /// @return platformFee Current platform fee percentage
    /// @return insuranceFee Current insurance fee percentage
    function getTreasuryParameters() external view returns (
        uint256 platformFee,
        uint256 insuranceFee
    );

    /// @notice Calculate fee amount for a transaction
    /// @param amount Transaction amount
    /// @param feeType Type of fee to calculate
    /// @return feeAmount Calculated fee amount
    function calculateFee(uint256 amount, string calldata feeType) external view returns (uint256 feeAmount);

    /// @notice Withdraw funds from treasury (emergency/admin only)
    /// @param token Token to withdraw (address(0) for HBAR)
    /// @param amount Amount to withdraw
    /// @param recipient Address to withdraw to
    /// @param reason Reason for withdrawal
    function withdrawFunds(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason
    ) external;

    /// @notice Set fee exemption for an address (admin only)
    /// @param account Address to exempt
    /// @param exempted Whether address is exempted from fees
    function setFeeExemption(address account, bool exempted) external;

    /// @notice Check if address is exempted from fees
    /// @param account Address to check
    /// @return True if address is exempted from fees
    function isFeeExempted(address account) external view returns (bool);

    /// @notice Get fee distribution statistics
    /// @param timePeriod Time period to get stats for (in days)
    /// @return totalFees Total fees collected
    /// @return totalDistributions Total funds distributed
    /// @return netBalance Net treasury balance change
    function getFeeDistributionStats(uint256 timePeriod) external view returns (
        uint256 totalFees,
        uint256 totalDistributions,
        int256 netBalance
    );

    /// @notice Set minimum treasury balance threshold
    /// @param token Token address
    /// @param threshold Minimum balance threshold
    function setTreasuryThreshold(address token, uint256 threshold) external;

    /// @notice Get treasury threshold for a token
    /// @param token Token address
    /// @return threshold Current threshold
    function getTreasuryThreshold(address token) external view returns (uint256 threshold);

    /// @notice Check if treasury balance is below threshold
    /// @param token Token to check
    /// @return True if balance is below threshold
    function isBelowThreshold(address token) external view returns (bool);
}
