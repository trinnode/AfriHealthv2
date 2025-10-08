// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Diamond.sol";
import "../src/facets/DiamondCutFacet.sol";
import "../src/facets/DiamondLoupeFacet.sol";
import "../src/facets/AccessControlFacet.sol";
import "../src/facets/ConsentFacet.sol";
import "../src/facets/TokenFacet.sol";
import "../src/facets/BillingFacet.sol";
import "../src/facets/ClaimsFacet.sol";
import "../src/facets/InsurancePoolFacet.sol";
import "../src/facets/IdentityFacet.sol";
import "../src/facets/RecordsRegistryFacet.sol";
import "../src/interfaces/IDiamond.sol";

/**
 * @title DeployHederaTestnet
 * Deployment script for AfriHealth Diamond to Hedera Testnet
 * @dev This script deploys the Diamond proxy and all facets with proper initialization
 *
 * Usage:
 *   forge script script/DeployHederaTestnet.s.sol:DeployHederaTestnet \
 *     --rpc-url $HEDERA_TESTNET_RPC \
 *     --private-key $DEPLOYER_PRIVATE_KEY \
 *     --broadcast \
 *     --verify \
 *     --etherscan-api-key $HEDERA_API_KEY
 *
 * Environment Variables Required:
 *   - HEDERA_TESTNET_RPC: Hedera JSON-RPC Relay URL (e.g., https://testnet.hashio.io/api)
 *   - DEPLOYER_PRIVATE_KEY: EVM private key for deployment
 *   - HEDERA_API_KEY: HashScan API key for verification
 */
contract DeployHederaTestnet is Script {
    // Deployment configuration
    struct DeploymentConfig {
        address owner;
        address admin;
        uint256 platformFeePercent;
        uint256 minPoolContribution;
        uint256 maxClaimAmount;
    }

    // Deployed addresses
    struct DeployedContracts {
        address diamond;
        address diamondCutFacet;
        address diamondLoupeFacet;
        address accessControlFacet;
        address consentFacet;
        address tokenFacet;
        address billingFacet;
        address claimsFacet;
        address insurancePoolFacet;
        address identityFacet;
        address recordsRegistryFacet;
    }

    DeployedContracts public deployed;

    function run() external {
        // Get deployer private key from environment variable
        // For local testing with Anvil, you can use the default Anvil key
        // For Hedera testnet/mainnet, set DEPLOYER_PRIVATE_KEY in .env
        uint256 deployerPrivateKey = vm.envOr(
            "DEPLOYER_PRIVATE_KEY",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("AfriHealth Ledger - Hedera Testnet Deploy");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Balance:", deployer.balance);
        console.log("");

        // Configuration
        DeploymentConfig memory config = DeploymentConfig({
            owner: deployer,
            admin: deployer,
            platformFeePercent: 250, // 2.5%
            minPoolContribution: 10 * 10 ** 8, // 10 HBAR
            maxClaimAmount: 10000 * 10 ** 8 // 10,000 HBAR
        });

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Diamond and facets
        deployContracts(config);

        // Initialize Diamond with facets
        initializeDiamond(config);

        vm.stopBroadcast();

        // Print deployment summary
        printDeploymentSummary();

        // Save deployment addresses
        saveDeploymentAddresses();
    }

    /**
     * Deploy all contracts
     */
    function deployContracts(DeploymentConfig memory config) internal {
        console.log("Step 1: Deploying facets...");
        console.log("");

        // Deploy DiamondCutFacet (required for Diamond initialization)
        deployed.diamondCutFacet = address(new DiamondCutFacet());
        console.log("  DiamondCutFacet:", deployed.diamondCutFacet);

        // Deploy Diamond proxy
        deployed.diamond = address(
            new Diamond(config.owner, deployed.diamondCutFacet)
        );
        console.log("  Diamond:", deployed.diamond);

        // Deploy other facets
        deployed.diamondLoupeFacet = address(new DiamondLoupeFacet());
        console.log("  DiamondLoupeFacet:", deployed.diamondLoupeFacet);

        deployed.accessControlFacet = address(new AccessControlFacet());
        console.log("  AccessControlFacet:", deployed.accessControlFacet);

        deployed.consentFacet = address(new ConsentFacet());
        console.log("  ConsentFacet:", deployed.consentFacet);

        deployed.tokenFacet = address(new TokenFacet());
        console.log("  TokenFacet:", deployed.tokenFacet);

        deployed.billingFacet = address(new BillingFacet());
        console.log("  BillingFacet:", deployed.billingFacet);

        deployed.claimsFacet = address(new ClaimsFacet());
        console.log("  ClaimsFacet:", deployed.claimsFacet);

        deployed.insurancePoolFacet = address(new InsurancePoolFacet());
        console.log("  InsurancePoolFacet:", deployed.insurancePoolFacet);

        deployed.identityFacet = address(new IdentityFacet());
        console.log("  IdentityFacet:", deployed.identityFacet);

        deployed.recordsRegistryFacet = address(new RecordsRegistryFacet());
        console.log("  RecordsRegistryFacet:", deployed.recordsRegistryFacet);

        console.log("");
        console.log("All contracts deployed successfully!");
        console.log("");
    }

    /**
     * Initialize Diamond with facet cuts
     */
    function initializeDiamond(DeploymentConfig memory config) internal {
        console.log("Step 2: Adding facets to Diamond...");
        console.log("");

        // Create facet cuts array (9 facets - DiamondCutFacet already registered in constructor)
        IDiamond.FacetCut[] memory cuts = new IDiamond.FacetCut[](9);

        // DiamondLoupeFacet
        bytes4[] memory loupeFunctionSelectors = new bytes4[](4);
        loupeFunctionSelectors[0] = DiamondLoupeFacet.facets.selector;
        loupeFunctionSelectors[1] = DiamondLoupeFacet
            .facetFunctionSelectors
            .selector;
        loupeFunctionSelectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        loupeFunctionSelectors[3] = DiamondLoupeFacet.facetAddress.selector;

        cuts[0] = IDiamond.FacetCut({
            facetAddress: deployed.diamondLoupeFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: loupeFunctionSelectors
        });

        // AccessControlFacet
        bytes4[] memory accessControlSelectors = new bytes4[](4);
        accessControlSelectors[0] = AccessControlFacet.grantRole.selector;
        accessControlSelectors[1] = AccessControlFacet.revokeRole.selector;
        accessControlSelectors[2] = AccessControlFacet.hasRole.selector;
        accessControlSelectors[3] = AccessControlFacet.getUserRoles.selector;

        cuts[1] = IDiamond.FacetCut({
            facetAddress: deployed.accessControlFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: accessControlSelectors
        });

        // ConsentFacet
        bytes4[] memory consentSelectors = new bytes4[](4);
        consentSelectors[0] = ConsentFacet.grantConsent.selector;
        consentSelectors[1] = ConsentFacet.revokeConsent.selector;
        consentSelectors[2] = ConsentFacet.getPatientConsents.selector;
        consentSelectors[3] = ConsentFacet.getConsentRequest.selector;

        cuts[2] = IDiamond.FacetCut({
            facetAddress: deployed.consentFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: consentSelectors
        });

        // TokenFacet
        bytes4[] memory tokenSelectors = new bytes4[](3);
        tokenSelectors[0] = TokenFacet.initializeTokens.selector;
        tokenSelectors[1] = TokenFacet.mintPlatformCredit.selector;
        tokenSelectors[2] = TokenFacet.associateToken.selector;

        cuts[3] = IDiamond.FacetCut({
            facetAddress: deployed.tokenFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: tokenSelectors
        });

        // BillingFacet
        bytes4[] memory billingSelectors = new bytes4[](3);
        billingSelectors[0] = BillingFacet.createInvoice.selector;
        billingSelectors[1] = BillingFacet.processPayment.selector;
        billingSelectors[2] = BillingFacet.getInvoice.selector;

        cuts[4] = IDiamond.FacetCut({
            facetAddress: deployed.billingFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: billingSelectors
        });

        // ClaimsFacet
        bytes4[] memory claimsSelectors = new bytes4[](3);
        claimsSelectors[0] = ClaimsFacet.submitClaim.selector;
        claimsSelectors[1] = ClaimsFacet.approveClaim.selector;
        claimsSelectors[2] = ClaimsFacet.getClaim.selector;

        cuts[5] = IDiamond.FacetCut({
            facetAddress: deployed.claimsFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: claimsSelectors
        });

        // InsurancePoolFacet
        bytes4[] memory poolSelectors = new bytes4[](3);
        poolSelectors[0] = InsurancePoolFacet.joinPool.selector;
        poolSelectors[1] = InsurancePoolFacet.payPremium.selector;
        poolSelectors[2] = InsurancePoolFacet.getPoolStats.selector;

        cuts[6] = IDiamond.FacetCut({
            facetAddress: deployed.insurancePoolFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: poolSelectors
        });

        // IdentityFacet
        bytes4[] memory identitySelectors = new bytes4[](2);
        identitySelectors[0] = IdentityFacet.registerIdentity.selector;
        identitySelectors[1] = IdentityFacet.getIdentity.selector;

        cuts[7] = IDiamond.FacetCut({
            facetAddress: deployed.identityFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: identitySelectors
        });

        // RecordsRegistryFacet
        bytes4[] memory recordsSelectors = new bytes4[](2);
        recordsSelectors[0] = RecordsRegistryFacet.registerRecord.selector;
        recordsSelectors[1] = RecordsRegistryFacet.getRecord.selector;

        cuts[8] = IDiamond.FacetCut({
            facetAddress: deployed.recordsRegistryFacet,
            action: IDiamond.FacetCutAction.Add,
            functionSelectors: recordsSelectors
        });

        // Execute diamond cut - now diamondCut selector is registered in Diamond constructor
        IDiamond(deployed.diamond).diamondCut(cuts, address(0), "");

        console.log("All facets added successfully!");
        console.log("");
    }

    /**
     * Print deployment summary
     */
    function printDeploymentSummary() internal view {
        console.log("===========================================");
        console.log("Deployment Summary");
        console.log("===========================================");
        console.log("");
        console.log("Diamond (Proxy):", deployed.diamond);
        console.log("");
        console.log("Facets:");
        console.log("  DiamondCutFacet:", deployed.diamondCutFacet);
        console.log("  DiamondLoupeFacet:", deployed.diamondLoupeFacet);
        console.log("  AccessControlFacet:", deployed.accessControlFacet);
        console.log("  ConsentFacet:", deployed.consentFacet);
        console.log("  TokenFacet:", deployed.tokenFacet);
        console.log("  BillingFacet:", deployed.billingFacet);
        console.log("  ClaimsFacet:", deployed.claimsFacet);
        console.log("  InsurancePoolFacet:", deployed.insurancePoolFacet);
        console.log("  IdentityFacet:", deployed.identityFacet);
        console.log("  RecordsRegistryFacet:", deployed.recordsRegistryFacet);
        console.log("");
        console.log("===========================================");
        console.log("Next Steps:");
        console.log("===========================================");
        console.log("1. Verify on HashScan:");
        console.log(
            "   https://hashscan.io/testnet/contract/",
            deployed.diamond
        );
        console.log("");
        console.log("2. Update backend/.env:");
        console.log("   DIAMOND_CONTRACT_ID=", deployed.diamond);
        console.log("");
        console.log("3. Create HCS topics and update .env");
        console.log("4. Create HTS tokens and update .env");
        console.log("===========================================");
    }

    /**
     * Save deployment addresses to file
     */
    function saveDeploymentAddresses() internal {
        string memory deploymentJson = string(
            abi.encodePacked(
                "{\n",
                '  "network": "hedera-testnet",\n',
                '  "chainId": ',
                vm.toString(block.chainid),
                ",\n",
                '  "timestamp": ',
                vm.toString(block.timestamp),
                ",\n",
                '  "contracts": {\n',
                '    "Diamond": "',
                vm.toString(deployed.diamond),
                '",\n',
                '    "DiamondCutFacet": "',
                vm.toString(deployed.diamondCutFacet),
                '",\n',
                '    "DiamondLoupeFacet": "',
                vm.toString(deployed.diamondLoupeFacet),
                '",\n',
                '    "AccessControlFacet": "',
                vm.toString(deployed.accessControlFacet),
                '",\n',
                '    "ConsentFacet": "',
                vm.toString(deployed.consentFacet),
                '",\n',
                '    "TokenFacet": "',
                vm.toString(deployed.tokenFacet),
                '",\n',
                '    "BillingFacet": "',
                vm.toString(deployed.billingFacet),
                '",\n',
                '    "ClaimsFacet": "',
                vm.toString(deployed.claimsFacet),
                '",\n',
                '    "InsurancePoolFacet": "',
                vm.toString(deployed.insurancePoolFacet),
                '",\n',
                '    "IdentityFacet": "',
                vm.toString(deployed.identityFacet),
                '",\n',
                '    "RecordsRegistryFacet": "',
                vm.toString(deployed.recordsRegistryFacet),
                '"\n',
                "  }\n",
                "}\n"
            )
        );

        vm.writeFile("./deployments/hedera-testnet.json", deploymentJson);
        console.log("");
        console.log(
            "Deployment addresses saved to: ./deployments/hedera-testnet.json"
        );
    }
}
