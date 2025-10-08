// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IDiamond.sol";
import "../libraries/DiamondStorage.sol";
import "../utils/ReentrancyGuard.sol";
import "../utils/Pausable.sol";

/**
 * @title DiamondCutFacet
 * @dev Facet for diamond cutting and upgrades
 */
contract DiamondCutFacet is IDiamond, ReentrancyGuard, Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @inheritdoc IDiamond
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external nonReentrant {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        require(msg.sender == ds.contractOwner, "DiamondCut: only owner");

        for (uint256 i = 0; i < _diamondCut.length; i++) {
            FacetCut memory cut = _diamondCut[i];
            address facet = cut.facetAddress;

            if (cut.action == FacetCutAction.Add) {
                _addFacet(ds, facet, cut.functionSelectors);
            } else if (cut.action == FacetCutAction.Replace) {
                _replaceFacet(ds, facet, cut.functionSelectors);
            } else if (cut.action == FacetCutAction.Remove) {
                _removeFacet(ds, facet, cut.functionSelectors);
            }
        }

        emit DiamondCut(_diamondCut, _init, _calldata);

        // Initialize if needed
        if (_init != address(0)) {
            (bool success, ) = _init.delegatecall(_calldata);
            require(success, "DiamondCut: initialization failed");
        }
    }

    /// @inheritdoc IDiamond
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

    /// @inheritdoc IDiamond
    function facetAddresses()
        external
        view
        returns (address[] memory facetAddresses_)
    {
        return DiamondStorage.getAllFacetAddresses();
    }

    /// @inheritdoc IDiamond
    function facetAddress(
        bytes4 _functionSelector
    ) external view returns (address facetAddress_) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.selectorToFacet[_functionSelector];
    }

    /// @inheritdoc IDiamond
    function facetFunctionSelectors(
        address _facet
    ) external view returns (bytes4[] memory facetFunctionSelectors_) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.facetSelectors[_facet];
    }

    /// @inheritdoc IDiamond
    function supportsInterface(
        bytes4 _interfaceId
    ) external pure returns (bool) {
        return
            _interfaceId == type(IDiamond).interfaceId ||
            _interfaceId == 0x01ffc9a7; // ERC165 interface ID
    }

    /**
     * @dev Add facet to diamond
     */
    function _addFacet(
        DiamondStorage.DiamondStorageStruct storage ds,
        address facet,
        bytes4[] memory selectors
    ) internal {
        require(
            facet != address(0),
            "DiamondCut: facet cannot be zero address"
        );

        for (uint256 i = 0; i < selectors.length; i++) {
            bytes4 selector = selectors[i];
            require(
                ds.selectorToFacet[selector] == address(0),
                "DiamondCut: selector already exists"
            );

            ds.selectorToFacet[selector] = facet;
            ds.facetSelectors[facet].push(selector);
            ds.facetSelectorCount[facet]++;
        }
    }

    /**
     * @dev Replace facet in diamond
     */
    function _replaceFacet(
        DiamondStorage.DiamondStorageStruct storage ds,
        address facet,
        bytes4[] memory selectors
    ) internal {
        require(
            facet != address(0),
            "DiamondCut: facet cannot be zero address"
        );

        for (uint256 i = 0; i < selectors.length; i++) {
            bytes4 selector = selectors[i];
            address oldFacet = ds.selectorToFacet[selector];
            require(
                oldFacet != address(0),
                "DiamondCut: selector does not exist"
            );

            ds.selectorToFacet[selector] = facet;

            // Remove selector from old facet
            bytes4[] storage oldSelectors = ds.facetSelectors[oldFacet];
            for (uint256 j = 0; j < oldSelectors.length; j++) {
                if (oldSelectors[j] == selector) {
                    oldSelectors[j] = oldSelectors[oldSelectors.length - 1];
                    oldSelectors.pop();
                    break;
                }
            }
            ds.facetSelectorCount[oldFacet]--;

            // Add selector to new facet
            ds.facetSelectors[facet].push(selector);
            ds.facetSelectorCount[facet]++;
        }
    }

    /**
     * @dev Remove facet from diamond
     */
    function _removeFacet(
        DiamondStorage.DiamondStorageStruct storage ds,
        address facet,
        bytes4[] memory selectors
    ) internal {
        for (uint256 i = 0; i < selectors.length; i++) {
            bytes4 selector = selectors[i];
            address oldFacet = ds.selectorToFacet[selector];
            require(
                oldFacet == facet,
                "DiamondCut: selector not owned by facet"
            );

            ds.selectorToFacet[selector] = address(0);

            // Remove selector from facet
            bytes4[] storage facetSelectors = ds.facetSelectors[facet];
            for (uint256 j = 0; j < facetSelectors.length; j++) {
                if (facetSelectors[j] == selector) {
                    facetSelectors[j] = facetSelectors[
                        facetSelectors.length - 1
                    ];
                    facetSelectors.pop();
                    break;
                }
            }
            ds.facetSelectorCount[facet]--;
        }
    }
}
