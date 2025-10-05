// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DiamondStorage
 * @dev Library for diamond storage pattern implementation
 */
library DiamondStorage {
    // Storage slot for diamond storage
    bytes32 constant DIAMOND_STORAGE_POSITION =
        keccak256("diamond.standard.diamond.storage");

    // Structure for diamond storage
    struct DiamondStorageStruct {
        // Function selector => facet address mapping
        mapping(bytes4 => address) selectorToFacet;
        // Facet address => selector count mapping
        mapping(address => uint256) facetSelectorCount;
        // Array of selectors for each facet
        mapping(address => bytes4[]) facetSelectors;
        // Contract owner
        address contractOwner;
        // Diamond cut facet address
        address diamondCutFacet;
        // System pause state
        bool paused;
        // Emergency pause state
        bool emergencyPaused;
    }

    /**
     * @dev Get diamond storage
     * @return ds Diamond storage reference
     */
    function diamondStorage() internal pure returns (DiamondStorageStruct storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    /**
     * @dev Set facet for function selector
     * @param selector Function selector
     * @param facet Facet address
     */
    function setFacetAddress(bytes4 selector, address facet) internal {
        DiamondStorageStruct storage ds = diamondStorage();
        ds.selectorToFacet[selector] = facet;
    }

    /**
     * @dev Get facet for function selector
     * @param selector Function selector
     * @return facet Facet address
     */
    function getFacetAddress(bytes4 selector) internal view returns (address facet) {
        DiamondStorageStruct storage ds = diamondStorage();
        facet = ds.selectorToFacet[selector];
    }
    

    /**
     * @dev Add function selector to facet
     * @param facet Facet address
     * @param selector Function selector
     */
    function addSelectorToFacet(address facet, bytes4 selector) internal {
        DiamondStorageStruct storage ds = diamondStorage();
        ds.facetSelectors[facet].push(selector);
        ds.facetSelectorCount[facet]++;
    }

    /**
     * @dev Remove function selector from facet
     * @param facet Facet address
     * @param selector Function selector
     */
    function removeSelectorFromFacet(address facet, bytes4 selector) internal {
        DiamondStorageStruct storage ds = diamondStorage();

        // Find and remove selector from array
        bytes4[] storage selectors = ds.facetSelectors[facet];
        for (uint256 i = 0; i < selectors.length; i++) {
            if (selectors[i] == selector) {
                selectors[i] = selectors[selectors.length - 1];
                selectors.pop();
                break;
            }
        }

        ds.facetSelectorCount[facet]--;
    }

    /**
     * @dev Get all selectors for a facet
     * @param facet Facet address
     * @return selectors Array of function selectors
     */
    function getFacetSelectors(address facet) internal view returns (bytes4[] memory selectors) {
        DiamondStorageStruct storage ds = diamondStorage();
        selectors = ds.facetSelectors[facet];
    }

    /**
     * @dev Get selector count for a facet
     * @param facet Facet address
     * @return count Number of selectors
     */
    function getFacetSelectorCount(address facet) internal view returns (uint256 count) {
        DiamondStorageStruct storage ds = diamondStorage();
        count = ds.facetSelectorCount[facet];
    }

    /**
     * @dev Set contract owner
     * @param owner Owner address
     */
    function setContractOwner(address owner) internal {
        DiamondStorageStruct storage ds = diamondStorage();
        ds.contractOwner = owner;
    }

    /**
     * @dev Get contract owner
     * @return owner Owner address
     */
    function getContractOwner() internal view returns (address owner) {
        DiamondStorageStruct storage ds = diamondStorage();
        owner = ds.contractOwner;
    }

    /**
     * @dev Set diamond cut facet
     * @param facet Diamond cut facet address
     */
    function setDiamondCutFacet(address facet) internal {
        DiamondStorageStruct storage ds = diamondStorage();
        ds.diamondCutFacet = facet;
    }

    /**
     * @dev Get diamond cut facet
     * @return facet Diamond cut facet address
     */
    function getDiamondCutFacet() internal view returns (address facet) {
        DiamondStorageStruct storage ds = diamondStorage();
        facet = ds.diamondCutFacet;
    }

    /**
     * @dev Set pause state
     * @param paused Pause state
     */
    function setPaused(bool paused) internal {
        DiamondStorageStruct storage ds = diamondStorage();
        ds.paused = paused;
    }

    /**
     * @dev Get pause state
     * @return paused Pause state
     */
    function getPaused() internal view returns (bool paused) {
        DiamondStorageStruct storage ds = diamondStorage();
        paused = ds.paused;
    }

    /**
     * @dev Set emergency pause state
     * @param emergencyPaused Emergency pause state
     */
    function setEmergencyPaused(bool emergencyPaused) internal {
        DiamondStorageStruct storage ds = diamondStorage();
        ds.emergencyPaused = emergencyPaused;
    }

    /**
     * @dev Get emergency pause state
     * @return emergencyPaused Emergency pause state
     */
    function getEmergencyPaused() internal view returns (bool emergencyPaused) {
        DiamondStorageStruct storage ds = diamondStorage();
        emergencyPaused = ds.emergencyPaused;
    }

    /**
     * @dev Check if system is paused (either regular or emergency pause)
     * @return True if system is paused
     */
    function isPaused() internal view returns (bool) {
        DiamondStorageStruct storage ds = diamondStorage();
        return ds.paused || ds.emergencyPaused;
    }
}
