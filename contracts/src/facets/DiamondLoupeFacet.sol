// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IDiamond.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";

/**
 * @title DiamondLoupeFacet
 * @dev Facet for diamond introspection (EIP-2535 Loupe functions)
 * Provides read-only functions to inspect the diamond
 */
contract DiamondLoupeFacet is ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// Facet structure
    struct Facet {
        address facetAddress;
        bytes4[] functionSelectors;
    }

    /// Get all facets and their selectors
    function facets() external view returns (Facet[] memory facets_) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();

        // Get all facet addresses
        address[] memory facetAddressesList = this.facetAddresses();

        facets_ = new Facet[](facetAddressesList.length);

        for (uint256 i = 0; i < facetAddressesList.length; i++) {
            address facet = facetAddressesList[i];
            facets_[i] = Facet({
                facetAddress: facet,
                functionSelectors: this.facetFunctionSelectors(facet)
            });
        }
    }

    function facetAddresses()
        external
        view
        returns (address[] memory facetAddresses_)
    {
        return DiamondStorage.getAllFacetAddresses();
    }

    function facetAddress(
        bytes4 _functionSelector
    ) external view returns (address facetAddress_) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.selectorToFacet[_functionSelector];
    }

    function facetFunctionSelectors(
        address _facet
    ) external view returns (bytes4[] memory facetFunctionSelectors_) {
        return DiamondStorage.getFacetSelectors(_facet);
    }

    function supportsInterface(
        bytes4 _interfaceId
    ) external pure returns (bool) {
        return
            _interfaceId == type(IDiamond).interfaceId ||
            _interfaceId == 0x01ffc9a7; // ERC165 interface ID
    }

    /**
     * @dev Get number of facets
     */
    function facetCount() external view returns (uint256 count) {
        address[] memory facetList = this.facetAddresses();
        return facetList.length;
    }

    /**
     * @dev Get function selector count for a facet
     */
    function facetFunctionSelectorCount(
        address _facet
    ) external view returns (uint256 count) {
        return DiamondStorage.getFacetSelectorCount(_facet);
    }

    /**
     * @dev Check if function selector exists
     */
    function isFunctionSelectorExists(
        bytes4 _functionSelector
    ) external view returns (bool exists) {
        return DiamondStorage.getFacetAddress(_functionSelector) != address(0);
    }

    /**
     * @dev Get all function selectors
     */
    function allFunctionSelectors()
        external
        view
        returns (bytes4[] memory selectors)
    {
        return DiamondStorage.getAllSelectors();
    }

    /**
     * @dev Get diamond owner
     */
    function owner() external view returns (address) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.contractOwner;
    }

    /**
     * @dev Get diamond cut facet
     */
    function getDiamondCutFacet() external view returns (address) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.diamondCutFacet;
    }

    /**
     * @dev Get contract owner
     */
    function contractOwner() external view returns (address) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.contractOwner;
    }
}
