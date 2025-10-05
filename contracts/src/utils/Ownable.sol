// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DiamondStorage.sol";

/**
 * @title Ownable
 * @dev Utility for ownership management
 */
contract Ownable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Emitted when ownership is transferred
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @notice Returns the address of the current owner
    function owner() public view returns (address) {
        return DiamondStorage.diamondStorage().contractOwner;
    }

    /// @notice Throws if called by any account other than the owner
    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    /// @notice Leaves the contract without owner. It will not be possible to call
    /// `onlyOwner` functions anymore. Can only be called by the current owner.
    /// NOTE: Renouncing ownership will leave the contract without an owner,
    /// thereby removing any functionality that is only available to the owner.
    function renounceOwnership() public onlyOwner {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        ds.contractOwner = address(0);
        emit OwnershipTransferred(owner(), address(0));
    }

    /// @notice Transfers ownership of the contract to a new account (`newOwner`).
    /// Can only be called by the current owner.
    function transferOwnership(address newOwner) public onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        emit OwnershipTransferred(owner(), newOwner);
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        ds.contractOwner = newOwner;
    }
}
