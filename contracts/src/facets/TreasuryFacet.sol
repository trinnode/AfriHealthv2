// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ITreasury.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";

/**
 * @title TreasuryFacet
 * @dev Facet for treasury and fee management
 */
contract TreasuryFacet is ITreasury, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// Storage structure for treasury data
    struct TreasuryStorage {
        mapping(address => uint256) balances;
        mapping(address => uint256) thresholds;
        mapping(address => bool) feeExemptions;
        mapping(string => uint256) feeRates;
        mapping(address => mapping(string => uint256)) lastFeeCollection;
        uint256 platformFee;
        uint256 insuranceFee;
    }

    /// Storage position for treasury data
    bytes32 constant TREASURY_STORAGE_POSITION =
        keccak256("diamond.treasury.storage");

    /**
     * @dev Get treasury storage
     */
    function getTreasuryStorage()
        internal
        pure
        returns (TreasuryStorage storage ts)
    {
        bytes32 position = TREASURY_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }

    /// @inheritdoc ITreasury
    function collectFees(
        uint256 amount,
        string calldata feeType
    ) external nonReentrant whenNotPaused {
        TreasuryStorage storage ts = getTreasuryStorage();

        address token = address(0); // HBAR for now
        uint256 feeAmount = (amount * ts.feeRates[feeType]) / 10000; // Basis points

        if (feeAmount > 0) {
            ts.balances[token] += feeAmount;
            ts.lastFeeCollection[msg.sender][feeType] = block.timestamp;

            emit FeesCollected(token, feeAmount, feeType, msg.sender);
            emit TreasuryBalanceChanged(
                token,
                ts.balances[token] - feeAmount,
                ts.balances[token],
                "fee_collection"
            );
        }
    }

    /// @inheritdoc ITreasury
    function distributeFunds(
        address recipient,
        uint256 amount,
        string calldata distributionType
    ) external onlyAdmin nonReentrant whenNotPaused {
        TreasuryStorage storage ts = getTreasuryStorage();
        address token = address(0); // HBAR for now

        require(ts.balances[token] >= amount, "Treasury: insufficient balance");

        ts.balances[token] -= amount;

        emit FundsDistributed(
            token,
            recipient,
            amount,
            distributionType,
            msg.sender
        );
        emit TreasuryBalanceChanged(
            token,
            ts.balances[token] + amount,
            ts.balances[token],
            "distribution"
        );
    }

    /// @inheritdoc ITreasury
    function getTreasuryBalance(
        address token
    ) external view returns (uint256 balance) {
        TreasuryStorage storage ts = getTreasuryStorage();
        return ts.balances[token];
    }

    /// @inheritdoc ITreasury
    function getAllTreasuryBalances()
        external
        view
        returns (address[] memory tokens, uint256[] memory balances)
    {
        TreasuryStorage storage ts = getTreasuryStorage();

        // For now, return HBAR balance only
        tokens = new address[](1);
        balances = new uint256[](1);
        tokens[0] = address(0);
        balances[0] = ts.balances[address(0)];
    }

    /// @inheritdoc ITreasury
    function updateTreasuryParameters(
        uint256 newPlatformFee,
        uint256 newInsuranceFee
    ) external onlyAdmin nonReentrant {
        TreasuryStorage storage ts = getTreasuryStorage();

        uint256 oldPlatformFee = ts.platformFee;
        uint256 oldInsuranceFee = ts.insuranceFee;

        ts.platformFee = newPlatformFee;
        ts.insuranceFee = newInsuranceFee;

        // Update fee rates
        ts.feeRates["platform"] = newPlatformFee;
        ts.feeRates["insurance"] = newInsuranceFee;

        emit TreasuryParametersUpdated(
            newPlatformFee,
            newInsuranceFee,
            msg.sender
        );
    }

    /// @inheritdoc ITreasury
    function getTreasuryParameters()
        external
        view
        returns (uint256 platformFee, uint256 insuranceFee)
    {
        TreasuryStorage storage ts = getTreasuryStorage();
        return (ts.platformFee, ts.insuranceFee);
    }

    /// @inheritdoc ITreasury
    function calculateFee(
        uint256 amount,
        string calldata feeType
    ) external view returns (uint256 feeAmount) {
        TreasuryStorage storage ts = getTreasuryStorage();
        return (amount * ts.feeRates[feeType]) / 10000; // Basis points
    }

    /// @inheritdoc ITreasury
    function withdrawFunds(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason
    ) external onlyAdmin nonReentrant {
        TreasuryStorage storage ts = getTreasuryStorage();
        require(ts.balances[token] >= amount, "Treasury: insufficient balance");

        uint256 oldBalance = ts.balances[token];
        ts.balances[token] -= amount;

        emit FundsDistributed(token, recipient, amount, reason, msg.sender);
        emit TreasuryBalanceChanged(
            token,
            oldBalance,
            ts.balances[token],
            "withdrawal"
        );
    }

    /// @inheritdoc ITreasury
    function setFeeExemption(
        address account,
        bool exempted
    ) external onlyAdmin nonReentrant {
        TreasuryStorage storage ts = getTreasuryStorage();
        ts.feeExemptions[account] = exempted;
    }

    /// @inheritdoc ITreasury
    function isFeeExempted(address account) external view returns (bool) {
        TreasuryStorage storage ts = getTreasuryStorage();
        return ts.feeExemptions[account];
    }

    /// @inheritdoc ITreasury
    function getFeeDistributionStats(
        uint256 timePeriod
    )
        external
        view
        returns (
            uint256 totalFees,
            uint256 totalDistributions,
            int256 netBalance
        )
    {
        // Implementation would calculate stats for the time period
        return (0, 0, 0);
    }

    /// @inheritdoc ITreasury
    function setTreasuryThreshold(
        address token,
        uint256 threshold
    ) external onlyAdmin nonReentrant {
        TreasuryStorage storage ts = getTreasuryStorage();
        ts.thresholds[token] = threshold;
    }

    /// @inheritdoc ITreasury
    function getTreasuryThreshold(
        address token
    ) external view returns (uint256 threshold) {
        TreasuryStorage storage ts = getTreasuryStorage();
        return ts.thresholds[token];
    }

    /// @inheritdoc ITreasury
    function isBelowThreshold(address token) external view returns (bool) {
        TreasuryStorage storage ts = getTreasuryStorage();
        return ts.balances[token] < ts.thresholds[token];
    }

    /**
     * @dev Initialize treasury with default parameters
     */
    function initializeTreasury() external onlyAdmin {
        TreasuryStorage storage ts = getTreasuryStorage();

        ts.platformFee = 100; // 1% in basis points
        ts.insuranceFee = 50; // 0.5% in basis points

        ts.feeRates["platform"] = 100;
        ts.feeRates["insurance"] = 50;
    }
}
