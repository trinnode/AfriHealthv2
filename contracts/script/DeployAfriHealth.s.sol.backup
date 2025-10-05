// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Diamond.sol";
import "../src/facets/DiamondCutFacet.sol";
import "../src/facets/DiamondLoupeFacet.sol";
import "../src/facets/AccessControlFacet.sol";
import "../src/facets/ConsentFacet.sol";
import "../src/facets/BillingFacet.sol";
import "../src/facets/TokenFacet.sol";
import "../src/facets/InsurancePoolFacet.sol";
import "../src/facets/AIPolicyFacet.sol";

/**
 * @title DeployAfriHealth
 * @dev Deployment script for AfriHealth Ledger Diamond contract
 * @notice Deploys all facets and initializes the diamond
 */
contract DeployAfriHealth is Script {
    // Diamond and facets
    Diamond public diamond;
    DiamondCutFacet public diamondCutFacet;
    DiamondLoupeFacet public diamondLoupeFacet;
    AccessControlFacet public accessControlFacet;
    ConsentFacet public consentFacet;
    BillingFacet public billingFacet;
    TokenFacet public tokenFacet;
    InsurancePoolFacet public insurancePoolFacet;
    AIPolicyFacet public aiPolicyFacet;

    // Function selectors for each facet
    bytes4[] public diamondCutSelectors;
    bytes4[] public diamondLoupeSelectors;
    bytes4[] public accessControlSelectors;
    bytes4[] public consentSelectors;
    bytes4[] public billingSelectors;
    bytes4[] public tokenSelectors;
    bytes4[] public insurancePoolSelectors;
    bytes4[] public aiPolicySelectors;

    function run() external {
        // Get deployment private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying AfriHealth Ledger with deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy core diamond
        diamond = new Diamond(deployer, address(0));
        console.log("Diamond deployed at:", address(diamond));

        // Deploy facets
        diamondCutFacet = new DiamondCutFacet();
        diamondLoupeFacet = new DiamondLoupeFacet();
        accessControlFacet = new AccessControlFacet();
        consentFacet = new ConsentFacet();
        billingFacet = new BillingFacet();
        tokenFacet = new TokenFacet();
        insurancePoolFacet = new InsurancePoolFacet();
        aiPolicyFacet = new AIPolicyFacet();

        console.log("Facets deployed:");
        console.log("- DiamondCutFacet:", address(diamondCutFacet));
        console.log("- DiamondLoupeFacet:", address(diamondLoupeFacet));
        console.log("- AccessControlFacet:", address(accessControlFacet));
        console.log("- ConsentFacet:", address(consentFacet));
        console.log("- BillingFacet:", address(billingFacet));
        console.log("- TokenFacet:", address(tokenFacet));
        console.log("- InsurancePoolFacet:", address(insurancePoolFacet));
        console.log("- AIPolicyFacet:", address(aiPolicyFacet));

        // Set up function selectors for each facet
        setUpSelectors();

        // Create diamond cut to add all facets
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](8);

        // DiamondCutFacet
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: address(diamondCutFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: diamondCutSelectors
        });

        // DiamondLoupeFacet
        cut[1] = IDiamondCut.FacetCut({
            facetAddress: address(diamondLoupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: diamondLoupeSelectors
        });

        // AccessControlFacet
        cut[2] = IDiamondCut.FacetCut({
            facetAddress: address(accessControlFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: accessControlSelectors
        });

        // ConsentFacet
        cut[3] = IDiamondCut.FacetCut({
            facetAddress: address(consentFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: consentSelectors
        });

        // BillingFacet
        cut[4] = IDiamondCut.FacetCut({
            facetAddress: address(billingFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: billingSelectors
        });

        // TokenFacet
        cut[5] = IDiamondCut.FacetCut({
            facetAddress: address(tokenFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: tokenSelectors
        });

        // InsurancePoolFacet
        cut[6] = IDiamondCut.FacetCut({
            facetAddress: address(insurancePoolFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: insurancePoolSelectors
        });

        // AIPolicyFacet
        cut[7] = IDiamondCut.FacetCut({
            facetAddress: address(aiPolicyFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: aiPolicySelectors
        });

        // Execute diamond cut
        IDiamondCut(address(diamond)).diamondCut(cut, address(0), "");

        // Initialize access control with deployer as admin
        AccessControlFacet(address(diamond)).initializeAccessControl(deployer);

        // Initialize AI policy settings
        AIPolicyFacet(address(diamond)).initializePolicySettings(5, 1000, 70);

        // Initialize billing currencies
        BillingFacet(address(diamond)).addSupportedCurrency("USD");
        BillingFacet(address(diamond)).addSupportedCurrency("HBAR");
        BillingFacet(address(diamond)).addSupportedCurrency("AHL");

        vm.stopBroadcast();

        console.log("AfriHealth Ledger deployment completed!");
        console.log("Diamond address:", address(diamond));
        console.log("Deployer address:", deployer);
    }

    function setUpSelectors() internal {
        // DiamondCutFacet selectors
        diamondCutSelectors = new bytes4[](1);
        diamondCutSelectors[0] = DiamondCutFacet.diamondCut.selector;

        // DiamondLoupeFacet selectors
        diamondLoupeSelectors = new bytes4[](5);
        diamondLoupeSelectors[0] = DiamondLoupeFacet.facets.selector;
        diamondLoupeSelectors[1] = DiamondLoupeFacet.facetAddresses.selector;
        diamondLoupeSelectors[2] = DiamondLoupeFacet.facetAddress.selector;
        diamondLoupeSelectors[3] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        diamondLoupeSelectors[4] = DiamondLoupeFacet.supportsInterface.selector;

        // AccessControlFacet selectors
        accessControlSelectors = new bytes4[](10);
        accessControlSelectors[0] = AccessControlFacet.grantRole.selector;
        accessControlSelectors[1] = AccessControlFacet.revokeRole.selector;
        accessControlSelectors[2] = AccessControlFacet.grantRoles.selector;
        accessControlSelectors[3] = AccessControlFacet.hasRole.selector;
        accessControlSelectors[4] = AccessControlFacet.getUserRoles.selector;
        accessControlSelectors[5] = AccessControlFacet.getUserRoleCount.selector;
        accessControlSelectors[6] = AccessControlFacet.grantEmergencyAccess.selector;
        accessControlSelectors[7] = AccessControlFacet.hasEmergencyAccess.selector;
        accessControlSelectors[8] = AccessControlFacet.revokeEmergencyAccess.selector;
        accessControlSelectors[9] = AccessControlFacet.getEmergencyAccessDetails.selector;

        // ConsentFacet selectors
        consentSelectors = new bytes4[](8);
        consentSelectors[0] = ConsentFacet.requestConsent.selector;
        consentSelectors[1] = ConsentFacet.grantConsent.selector;
        consentSelectors[2] = ConsentFacet.revokeConsent.selector;
        consentSelectors[3] = ConsentFacet.hasActiveConsent.selector;
        consentSelectors[4] = ConsentFacet.getPatientConsents.selector;
        consentSelectors[5] = ConsentFacet.getConsentRequest.selector;
        consentSelectors[6] = ConsentFacet.invokeEmergencyAccess.selector;
        consentSelectors[7] = ConsentFacet.cleanupExpiredConsents.selector;

        // BillingFacet selectors
        billingSelectors = new bytes4[](12);
        billingSelectors[0] = BillingFacet.createInvoice.selector;
        billingSelectors[1] = BillingFacet.approveInvoice.selector;
        billingSelectors[2] = BillingFacet.rejectInvoice.selector;
        billingSelectors[3] = BillingFacet.processPayment.selector;
        billingSelectors[4] = BillingFacet.disputeInvoice.selector;
        billingSelectors[5] = BillingFacet.getInvoice.selector;
        billingSelectors[6] = BillingFacet.getPatientInvoices.selector;
        billingSelectors[7] = BillingFacet.getProviderInvoices.selector;
        billingSelectors[8] = BillingFacet.getPayment.selector;
        billingSelectors[9] = BillingFacet.addSupportedCurrency.selector;
        billingSelectors[10] = BillingFacet.getSupportedCurrencies.selector;
        billingSelectors[11] = BillingFacet.isCurrencySupported.selector;

        // TokenFacet selectors
        tokenSelectors = new bytes4[](15);
        tokenSelectors[0] = TokenFacet.initializeTokens.selector;
        tokenSelectors[1] = TokenFacet.mintPlatformCredit.selector;
        tokenSelectors[2] = TokenFacet.burnPlatformCredit.selector;
        tokenSelectors[3] = TokenFacet.mintInsurancePoolToken.selector;
        tokenSelectors[4] = TokenFacet.burnInsurancePoolToken.selector;
        tokenSelectors[5] = TokenFacet.associateToken.selector;
        tokenSelectors[6] = TokenFacet.dissociateToken.selector;
        tokenSelectors[7] = TokenFacet.isTokenAssociated.selector;
        tokenSelectors[8] = TokenFacet.getAssociatedTokens.selector;
        tokenSelectors[9] = TokenFacet.setKYCApproval.selector;
        tokenSelectors[10] = TokenFacet.isKYCApproved.selector;
        tokenSelectors[11] = TokenFacet.getPlatformCreditBalance.selector;
        tokenSelectors[12] = TokenFacet.getInsurancePoolBalance.selector;
        tokenSelectors[13] = TokenFacet.setMintAllowance.selector;
        tokenSelectors[14] = TokenFacet.getTokenAddresses.selector;

        // InsurancePoolFacet selectors
        insurancePoolSelectors = new bytes4[](12);
        insurancePoolSelectors[0] = InsurancePoolFacet.initializePool.selector;
        insurancePoolSelectors[1] = InsurancePoolFacet.joinPool.selector;
        insurancePoolSelectors[2] = InsurancePoolFacet.leavePool.selector;
        insurancePoolSelectors[3] = InsurancePoolFacet.payPremium.selector;
        insurancePoolSelectors[4] = InsurancePoolFacet.submitClaim.selector;
        insurancePoolSelectors[5] = InsurancePoolFacet.approveClaim.selector;
        insurancePoolSelectors[6] = InsurancePoolFacet.denyClaim.selector;
        insurancePoolSelectors[7] = InsurancePoolFacet.payClaim.selector;
        insurancePoolSelectors[8] = InsurancePoolFacet.getPoolStats.selector;
        insurancePoolSelectors[9] = InsurancePoolFacet.getMemberInfo.selector;
        insurancePoolSelectors[10] = InsurancePoolFacet.getClaim.selector;
        insurancePoolSelectors[11] = InsurancePoolFacet.updatePoolParameters.selector;

        // AIPolicyFacet selectors
        aiPolicySelectors = new bytes4[](10);
        aiPolicySelectors[0] = AIPolicyFacet.createPolicy.selector;
        aiPolicySelectors[1] = AIPolicyFacet.updatePolicy.selector;
        aiPolicySelectors[2] = AIPolicyFacet.deletePolicy.selector;
        aiPolicySelectors[3] = AIPolicyFacet.setActivePolicy.selector;
        aiPolicySelectors[4] = AIPolicyFacet.evaluateInvoice.selector;
        aiPolicySelectors[5] = AIPolicyFacet.getPolicy.selector;
        aiPolicySelectors[6] = AIPolicyFacet.getActivePolicyId.selector;
        aiPolicySelectors[7] = AIPolicyFacet.getPatientPolicyIds.selector;
        aiPolicySelectors[8] = AIPolicyFacet.getEvaluationHistory.selector;
        aiPolicySelectors[9] = AIPolicyFacet.initializePolicySettings.selector;
    }
}

// Interface for diamond cut
interface IDiamondCut {
    enum FacetCutAction { Add, Replace, Remove }

    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external;
}
