// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DiamondStorage.sol";

/**
 * @title Pausable
 * @dev Utility to pause/unpause contract functionality
 */
contract Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// Emitted when the pause is triggered
    event Paused(address account);

    /// Emitted when the pause is lifted
    event Unpaused(address account);

    /// Modifier to make a function callable only when the contract is not paused
    modifier whenNotPaused() {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        require(!ds.paused && !ds.emergencyPaused, "Pausable: paused");
        _;
    }

    /// Modifier to make a function callable only when the contract is paused
    modifier whenPaused() {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        require(ds.paused || ds.emergencyPaused, "Pausable: not paused");
        _;
    }

    /// Modifier to make a function callable only when the contract is not emergency paused
    modifier whenNotEmergencyPaused() {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        require(!ds.emergencyPaused, "Pausable: emergency paused");
        _;
    }

    /// Returns true if the contract is paused, and false otherwise
    function paused() public view returns (bool) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.paused || ds.emergencyPaused;
    }

    /// Returns true if the contract is emergency paused, and false otherwise
    function emergencyPaused() public view returns (bool) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        return ds.emergencyPaused;
    }

    /// Triggers stopped state
    /// @param reason Reason for pausing
    function _pause(string memory reason) internal whenNotPaused {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        ds.paused = true;
        emit Paused(msg.sender);
    }

    /// Returns to normal state
    function _unpause() internal whenPaused {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        ds.paused = false;
        emit Unpaused(msg.sender);
    }

    /// Triggers emergency stopped state
    /// @param reason Reason for emergency pausing
    function _emergencyPause(
        string memory reason
    ) internal whenNotEmergencyPaused {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        ds.emergencyPaused = true;
        emit Paused(msg.sender);
    }

    /// Returns to normal state from emergency pause
    function _unpauseEmergency() internal {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage
            .diamondStorage();
        require(ds.emergencyPaused, "Pausable: not emergency paused");
        ds.emergencyPaused = false;
        emit Unpaused(msg.sender);
    }
}
