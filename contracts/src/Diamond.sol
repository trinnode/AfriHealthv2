// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Diamond
 * @dev EIP-2535 Diamond proxy contract for AfriHealth Ledger
 * @notice Main entry point for all facet functions, handles delegation and storage
 */
contract Diamond {
    // Events for diamond cuts and upgrades
    event DiamondCut(
        address indexed _diamondCutFacet,
        address[] _facetAddresses,
        bytes4[][] _functionSelectors,
        address _init,
        bytes _calldata
    );
    
    // Storage for diamond facets and selectors
    struct DiamondStorage {
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
    }
    
    // Diamond storage slot (EIP-1967)
    bytes32 constant DIAMOND_STORAGE_POSITION = 
        keccak256("diamond.standard.diamond.storage");
    
    /**
     * @dev Get diamond storage slot
     */
    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
    
    /**
     * @dev Constructor sets initial owner and diamond cut facet
     */
    constructor(address _contractOwner, address _diamondCutFacet) payable {
        DiamondStorage storage ds = diamondStorage();
        ds.contractOwner = _contractOwner;
        ds.diamondCutFacet = _diamondCutFacet;
    }
    
    /**
     * @dev Fallback function that delegates calls to appropriate facets
     */
    fallback() external payable {
        DiamondStorage storage ds = diamondStorage();
        
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
        DiamondStorage storage ds = diamondStorage();
        require(msg.sender == ds.contractOwner, "Diamond: Only owner can transfer ownership");
        ds.contractOwner = _newOwner;
    }
    
    /**
     * @dev Get current owner
     * Current owner address
     */
    function owner() external view returns (address) {
        DiamondStorage storage ds = diamondStorage();
        return ds.contractOwner;
    }
    
    /**
     * @dev Get diamond cut facet address
     * Diamond cut facet address
     */
    function getDiamondCutFacet() external view returns (address) {
        DiamondStorage storage ds = diamondStorage();
        return ds.diamondCutFacet;
    }
}
