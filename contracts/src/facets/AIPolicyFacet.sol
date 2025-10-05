// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAIPolicy.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/AccessControl.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";
import "../utils/IdGenerator.sol";

/**
 * @title AIPolicyFacet
 * @dev Facet for AI-powered policy management
 */
contract AIPolicyFacet is IAIPolicy, AccessControl, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Storage structure for AI policy data
    struct AIPolicyStorage {
        mapping(bytes32 => Policy) policies;
        mapping(address => bytes32) activePolicies;
        mapping(address => bytes32[]) patientPolicies;
        mapping(bytes32 => Evaluation[]) evaluationHistory;
        PolicySettings policySettings;
    }

    /// @notice Policy structure
    struct Policy {
        bytes32 policyId;
        address patient;
        string name;
        string rules;
        uint256 autoApproveLimit;
        string[] categoryFilters;
        bool isActive;
        uint256 createdAt;
    }

    /// @notice Policy evaluation structure
    struct Evaluation {
        bytes32 invoiceId;
        string result;
        string reason;
        uint256 confidence;
        uint256 timestamp;
    }

    /// @notice Policy settings structure
    struct PolicySettings {
        uint256 defaultAutoApproveLimit;
        uint256 maxAutoApproveLimit;
        uint256 minConfidenceThreshold;
    }

    /// @notice Storage position for AI policy data
    bytes32 constant AI_POLICY_STORAGE_POSITION =
        keccak256("diamond.aipolicy.storage");

    /**
     * @dev Get AI policy storage
     */
    function getAIPolicyStorage() internal pure returns (AIPolicyStorage storage aps) {
        bytes32 position = AI_POLICY_STORAGE_POSITION;
        assembly {
            aps.slot := position
        }
    }

    /// @inheritdoc IAIPolicy
    function createPolicy(
        address patient,
        string calldata name,
        string calldata rules,
        uint256 autoApproveLimit,
        string[] calldata categoryFilters
    ) external nonReentrant whenNotPaused returns (bytes32 policyId) {
        AIPolicyStorage storage aps = getAIPolicyStorage();

        require(autoApproveLimit <= aps.policySettings.maxAutoApproveLimit, "AIPolicy: limit too high");

        policyId = IdGenerator.generatePolicyId(patient, name, keccak256(abi.encodePacked(rules)));

        aps.policies[policyId] = Policy({
            policyId: policyId,
            patient: patient,
            name: name,
            rules: rules,
            autoApproveLimit: autoApproveLimit,
            categoryFilters: categoryFilters,
            isActive: false,
            createdAt: block.timestamp
        });

        aps.patientPolicies[patient].push(policyId);

        emit PolicyCreated(policyId, patient, name, autoApproveLimit, msg.sender);
    }

    /// @inheritdoc IAIPolicy
    function updatePolicy(
        bytes32 policyId,
        string calldata name,
        string calldata rules,
        uint256 autoApproveLimit,
        string[] calldata categoryFilters
    ) external nonReentrant whenNotPaused {
        AIPolicyStorage storage aps = getAIPolicyStorage();
        Policy storage policy = aps.policies[policyId];

        require(policy.patient == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "AIPolicy: not authorized");
        require(autoApproveLimit <= aps.policySettings.maxAutoApproveLimit, "AIPolicy: limit too high");

        policy.name = name;
        policy.rules = rules;
        policy.autoApproveLimit = autoApproveLimit;
        policy.categoryFilters = categoryFilters;

        emit PolicyUpdated(policyId, name, autoApproveLimit, msg.sender);
    }

    /// @inheritdoc IAIPolicy
    function deletePolicy(bytes32 policyId) external nonReentrant {
        AIPolicyStorage storage aps = getAIPolicyStorage();
        Policy storage policy = aps.policies[policyId];

        require(policy.patient == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "AIPolicy: not authorized");

        // Remove from patient policies array
        _removeFromPatientPolicies(aps, policy.patient, policyId);

        // Clear active policy if this was active
        if (aps.activePolicies[policy.patient] == policyId) {
            aps.activePolicies[policy.patient] = bytes32(0);
        }

        delete aps.policies[policyId];

        emit PolicyDeleted(policyId, msg.sender);
    }

    /// @inheritdoc IAIPolicy
    function setActivePolicy(address patient, bytes32 policyId) external nonReentrant whenNotPaused {
        AIPolicyStorage storage aps = getAIPolicyStorage();
        Policy storage policy = aps.policies[policyId];

        require(policy.patient == patient, "AIPolicy: policy not for patient");
        require(patient == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "AIPolicy: not authorized");

        aps.activePolicies[patient] = policyId;
        policy.isActive = true;

        emit ActivePolicySet(policyId, patient, msg.sender);
    }

    /// @inheritdoc IAIPolicy
    function evaluateInvoice(
        bytes32 invoiceId,
        uint256 amount,
        string calldata category,
        address provider
    ) external nonReentrant whenNotPaused returns (string memory result, string memory reason, uint256 confidence) {
        AIPolicyStorage storage aps = getAIPolicyStorage();

        bytes32 policyId = aps.activePolicies[msg.sender];
        if (policyId == bytes32(0)) {
            return ("hold", "No active policy", 0);
        }

        Policy storage policy = aps.policies[policyId];

        // Simple rule evaluation (in production, this would call an AI service)
        if (amount <= policy.autoApproveLimit) {
            // Check if category is in approved filters
            bool categoryApproved = false;
            for (uint256 i = 0; i < policy.categoryFilters.length; i++) {
                if (_stringEquals(policy.categoryFilters[i], category)) {
                    categoryApproved = true;
                    break;
                }
            }

            if (categoryApproved) {
                result = "approve";
                reason = "Amount within auto-approve limit and category approved";
                confidence = 90;
            } else {
                result = "hold";
                reason = "Category requires manual review";
                confidence = 70;
            }
        } else {
            result = "hold";
            reason = "Amount exceeds auto-approve limit";
            confidence = 95;
        }

        // Store evaluation
        aps.evaluationHistory[policyId].push(Evaluation({
            invoiceId: invoiceId,
            result: result,
            reason: reason,
            confidence: confidence,
            timestamp: block.timestamp
        }));

        emit InvoiceEvaluated(invoiceId, policyId, result, reason, block.timestamp);

        return (result, reason, confidence);
    }

    /// @inheritdoc IAIPolicy
    function getPolicy(bytes32 policyId) external view returns (
        address patient,
        string memory name,
        string memory rules,
        uint256 autoApproveLimit,
        string[] memory categoryFilters,
        bool isActive,
        uint256 createdAt
    ) {
        AIPolicyStorage storage aps = getAIPolicyStorage();
        Policy memory policy = aps.policies[policyId];

        return (
            policy.patient,
            policy.name,
            policy.rules,
            policy.autoApproveLimit,
            policy.categoryFilters,
            policy.isActive,
            policy.createdAt
        );
    }

    /// @inheritdoc IAIPolicy
    function getActivePolicyId(address patient) external view returns (bytes32 policyId) {
        AIPolicyStorage storage aps = getAIPolicyStorage();
        return aps.activePolicies[patient];
    }

    /// @inheritdoc IAIPolicy
    function getPatientPolicyIds(address patient) external view returns (bytes32[] memory policyIds) {
        AIPolicyStorage storage aps = getAIPolicyStorage();
        return aps.patientPolicies[patient];
    }

    /// @inheritdoc IAIPolicy
    function getEvaluationHistory(
        bytes32 policyId,
        uint256 limit
    ) external view returns (
        bytes32[] memory invoiceIds,
        string[] memory results,
        uint256[] memory timestamps
    ) {
        AIPolicyStorage storage aps = getAIPolicyStorage();
        Evaluation[] memory evaluations = aps.evaluationHistory[policyId];

        uint256 length = evaluations.length;
        if (limit > 0 && limit < length) {
            length = limit;
        }

        invoiceIds = new bytes32[](length);
        results = new string[](length);
        timestamps = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            invoiceIds[i] = evaluations[i].invoiceId;
            results[i] = evaluations[i].result;
            timestamps[i] = evaluations[i].timestamp;
        }
    }

    /// @inheritdoc IAIPolicy
    function initializePolicySettings(
        uint256 defaultAutoApproveLimit,
        uint256 maxAutoApproveLimit,
        uint256 minConfidenceThreshold
    ) external onlyAdmin nonReentrant {
        AIPolicyStorage storage aps = getAIPolicyStorage();

        aps.policySettings = PolicySettings({
            defaultAutoApproveLimit: defaultAutoApproveLimit,
            maxAutoApproveLimit: maxAutoApproveLimit,
            minConfidenceThreshold: minConfidenceThreshold
        });

        emit PolicySettingsInitialized(
            defaultAutoApproveLimit,
            maxAutoApproveLimit,
            minConfidenceThreshold,
            msg.sender
        );
    }

    /**
     * @dev Remove policy from patient policies array
     */
    function _removeFromPatientPolicies(
        AIPolicyStorage storage aps,
        address patient,
        bytes32 policyId
    ) internal {
        bytes32[] storage policies = aps.patientPolicies[patient];

        for (uint256 i = 0; i < policies.length; i++) {
            if (policies[i] == policyId) {
                policies[i] = policies[policies.length - 1];
                policies.pop();
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

    /**
     * @dev Initialize AI policy system
     */
    function initializeAIPolicy() external onlyAdmin {
        AIPolicyStorage storage aps = getAIPolicyStorage();

        aps.policySettings = PolicySettings({
            defaultAutoApproveLimit: 1000, // Default $1000
            maxAutoApproveLimit: 10000,    // Maximum $10,000
            minConfidenceThreshold: 70     // Minimum 70% confidence
        });
    }
}
