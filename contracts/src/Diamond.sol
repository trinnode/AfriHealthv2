// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./libraries/DiamondStorage.sol";

/**
 * @title Diamond
 * @dev EIP-2535 Diamond proxy contract for AfriHealth Ledger
 * Main entry point for all facet functions, handles delegation and storage
 */
contract Diamond {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    // Events for diamond cuts and upgrades
    event DiamondCut(
        address indexed _diamondCutFacet,
        address[] _facetAddresses,
        bytes4[][] _functionSelectors,
        address _init,
        bytes _calldata
    );

    /**
     * @dev Constructor sets initial owner and diamond cut facet
     */
    constructor(address _contractOwner, address _diamondCutFacet) payable {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        ds.contractOwner = _contractOwner;
        ds.diamondCutFacet = _diamondCutFacet;

        // Register the diamondCut function selector (0x1f931c1c)
        // This allows calling diamondCut immediately after deployment
        bytes4 diamondCutSelector = bytes4(
            keccak256("diamondCut((address,uint8,bytes4[])[],address,bytes)")
        );
        ds.selectorToFacet[diamondCutSelector] = _diamondCutFacet;
        ds.facetSelectorCount[_diamondCutFacet] = 1;
        ds.facetSelectors[_diamondCutFacet] = new bytes4[](1);
        ds.facetSelectors[_diamondCutFacet][0] = diamondCutSelector;

        // Mark facet as existing
        if (!ds.facetExists[_diamondCutFacet]) {
            ds.facetAddressList.push(_diamondCutFacet);
            ds.facetExists[_diamondCutFacet] = true;
        }

        // Mark selector as existing
        if (!ds.selectorExists[diamondCutSelector]) {
            ds.allSelectors.push(diamondCutSelector);
            ds.selectorExists[diamondCutSelector] = true;
        }
    }

    /**
     * @dev Fallback function that delegates calls to appropriate facets
     */
    fallback() external payable {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();

        // Get facet address for function selector
        address facet = ds.selectorToFacet[msg.sig];

        // Require facet to be non-zero
        require(facet != address(0), "Diamond: Function does not exist");

        // Execute external function from facet using delegatecall
        assembly {
            // Copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())

            // Execute function call using delegatecall
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)

            // Get any return value
            returndatacopy(0, 0, returndatasize())

            // Return data with implicit byte array
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @dev Receive function for plain ether transfers
     */
    receive() external payable {}

    /**
     * @dev Transfer ownership of the diamond
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        require(
            msg.sender == ds.contractOwner,
            "Diamond: Only owner can transfer ownership"
        );
        ds.contractOwner = _newOwner;
    }

    /**
     * @dev Get current owner
     * Current owner address
     */
    function owner() external view returns (address) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.contractOwner;
    }

    /**
     * @dev Get diamond cut facet address
     * Diamond cut facet address
     */
    function getDiamondCutFacet() external view returns (address) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.diamondCutFacet;
    }
}
