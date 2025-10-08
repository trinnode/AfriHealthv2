// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAIPolicy
 * @dev Interface for AI-powered policy management in AfriHealth Ledger
 */
interface IAIPolicy {
    /// Emitted when a policy is created
    event PolicyCreated(
        bytes32 indexed policyId,
        address indexed patient,
        string name,
        uint256 autoApproveLimit,
        address indexed createdBy
    );

    /// Emitted when a policy is updated
    event PolicyUpdated(
        bytes32 indexed policyId,
        string name,
        uint256 autoApproveLimit,
        address indexed updatedBy
    );

    /// Emitted when a policy is deleted
    event PolicyDeleted(bytes32 indexed policyId, address indexed deletedBy);

    /// Emitted when active policy is set
    event ActivePolicySet(
        bytes32 indexed policyId,
        address indexed patient,
        address indexed setBy
    );

    /// Emitted when invoice is evaluated
    event InvoiceEvaluated(
        bytes32 indexed invoiceId,
        bytes32 indexed policyId,
        string result,
        string reason,
        uint256 evaluatedAt
    );

    /// Emitted when policy settings are initialized
    event PolicySettingsInitialized(
        uint256 defaultAutoApproveLimit,
        uint256 maxAutoApproveLimit,
        uint256 minConfidenceThreshold,
        address indexed initializedBy
    );

    /// Create a new AI policy for a patient
    /// @param patient Patient address
    /// @param name Policy name
    /// @param rules Policy rules in JSON format
    /// @param autoApproveLimit Maximum amount for auto-approval
    /// @param categoryFilters Categories to auto-approve/reject/hold
    /// @return policyId Unique identifier for the policy
    function createPolicy(
        address patient,
        string calldata name,
        string calldata rules,
        uint256 autoApproveLimit,
        string[] calldata categoryFilters
    ) external returns (bytes32 policyId);

    /// Update an existing policy
    /// @param policyId Policy identifier
    /// @param name New policy name
    /// @param rules Updated policy rules
    /// @param autoApproveLimit New auto-approve limit
    /// @param categoryFilters Updated category filters
    function updatePolicy(
        bytes32 policyId,
        string calldata name,
        string calldata rules,
        uint256 autoApproveLimit,
        string[] calldata categoryFilters
    ) external;

    /// Delete a policy
    /// @param policyId Policy identifier to delete
    function deletePolicy(bytes32 policyId) external;

    /// Set active policy for a patient
    /// @param patient Patient address
    /// @param policyId Policy identifier to set as active
    function setActivePolicy(address patient, bytes32 policyId) external;

    /// Evaluate an invoice against patient's AI policy
    /// @param invoiceId Invoice identifier
    /// @param amount Invoice amount
    /// @param category Medical category
    /// @param provider Provider address
    /// @return result Evaluation result ("approve", "reject", "hold")
    /// @return reason Reason for the decision
    /// @return confidence Confidence score (0-100)
    function evaluateInvoice(
        bytes32 invoiceId,
        uint256 amount,
        string calldata category,
        address provider
    )
        external
        returns (
            string memory result,
            string memory reason,
            uint256 confidence
        );

    /// Get policy details
    /// @param policyId Policy identifier
    /// @return patient Patient address
    /// @return name Policy name
    /// @return rules Policy rules
    /// @return autoApproveLimit Auto-approve limit
    /// @return categoryFilters Category filters
    /// @return isActive Whether policy is active
    /// @return createdAt When policy was created
    function getPolicy(
        bytes32 policyId
    )
        external
        view
        returns (
            address patient,
            string memory name,
            string memory rules,
            uint256 autoApproveLimit,
            string[] memory categoryFilters,
            bool isActive,
            uint256 createdAt
        );

    /// Get active policy ID for a patient
    /// @param patient Patient address
    /// @return policyId Active policy identifier (bytes32(0) if none)
    function getActivePolicyId(
        address patient
    ) external view returns (bytes32 policyId);

    /// Get all policy IDs for a patient
    /// @param patient Patient address
    /// @return policyIds Array of policy identifiers
    function getPatientPolicyIds(
        address patient
    ) external view returns (bytes32[] memory policyIds);

    /// Get evaluation history for a policy
    /// @param policyId Policy identifier
    /// @param limit Maximum number of evaluations to return
    /// @return invoiceIds Array of evaluated invoice IDs
    /// @return results Array of evaluation results
    /// @return timestamps Array of evaluation timestamps
    function getEvaluationHistory(
        bytes32 policyId,
        uint256 limit
    )
        external
        view
        returns (
            bytes32[] memory invoiceIds,
            string[] memory results,
            uint256[] memory timestamps
        );

    /// Initialize policy settings (admin only)
    /// @param defaultAutoApproveLimit Default auto-approve limit for new policies
    /// @param maxAutoApproveLimit Maximum allowed auto-approve limit
    /// @param minConfidenceThreshold Minimum confidence threshold for auto-approval
    function initializePolicySettings(
        uint256 defaultAutoApproveLimit,
        uint256 maxAutoApproveLimit,
        uint256 minConfidenceThreshold
    ) external;
}
