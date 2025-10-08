// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDiamond
 * @dev Interface for EIP-2535 Diamond standard
 */
interface IDiamond {
    enum FacetCutAction {
        Add,
        Replace,
        Remove
    }

    struct FacetCut {
        address facetAddress;
        FacetCutAction action;
        bytes4[] functionSelectors;
    }

    /// Emitted when diamond cut is performed
    event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);

    /// Add/replace/remove any number of functions and optionally execute a function with delegatecall
    /// @param _diamondCut Contains the facet addresses and function selectors
    /// @param _init The address of the contract or facet to execute _calldata
    /// @param _calldata A function call, including function selector and arguments to execute with delegatecall on _init
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external;

    /// Get all facets and their selectors
    /// @return facets_ Array of facets with their selectors
    function facets() external view returns (Facet[] memory facets_);

    /// Get all facet addresses used by a diamond
    /// @return facetAddresses_ Array of facet addresses
    function facetAddresses()
        external
        view
        returns (address[] memory facetAddresses_);

    /// Get the facet address for a function selector
    /// @param _functionSelector The function selector to look up
    /// @return facetAddress_ The facet address associated with the function selector
    function facetAddress(
        bytes4 _functionSelector
    ) external view returns (address facetAddress_);

    /// Get all function selectors for a facet address
    /// @param _facet The facet address to look up
    /// @return facetFunctionSelectors_ Array of function selectors for the facet
    function facetFunctionSelectors(
        address _facet
    ) external view returns (bytes4[] memory facetFunctionSelectors_);

    /// Check if a contract supports an interface
    /// @param _interfaceId The interface identifier, as specified in ERC-165
    /// @return True if the contract supports the interface, false otherwise
    function supportsInterface(
        bytes4 _interfaceId
    ) external view returns (bool);

    struct Facet {
        address facetAddress;
        bytes4[] functionSelectors;
    }
}
