// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DiamondStorage.sol";

/**
 * @title Pausable
 * @dev Utility to pause/unpause contract functionality
 */
contract Pausable {
    using DiamondStorage for DiamondStorage.DiamondStorageStruct;

    /// @notice Emitted when the pause is triggered
    event Paused(address account);

    /// @notice Emitted when the pause is lifted
    event Unpaused(address account);

    /// @notice Modifier to make a function callable only when the contract is not paused
    modifier whenNotPaused() {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        require(!ds.paused && !ds.emergencyPaused, "Pausable: paused");
        _;
    }

    /// @notice Modifier to make a function callable only when the contract is paused
    modifier whenPaused() {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        require(ds.paused || ds.emergencyPaused, "Pausable: not paused");
        _;
    }

    /// @notice Modifier to make a function callable only when the contract is not emergency paused
    modifier whenNotEmergencyPaused() {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        require(!ds.emergencyPaused, "Pausable: emergency paused");
        _;
    }

    /// @notice Returns true if the contract is paused, and false otherwise
    function paused() public view returns (bool) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        return ds.paused || ds.emergencyPaused;
    }

    /// @notice Returns true if the contract is emergency paused, and false otherwise
    function emergencyPaused() public view returns (bool) {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        return ds.emergencyPaused;
    }

    /// @notice Triggers stopped state
    /// @param reason Reason for pausing
    function _pause(string memory reason) internal whenNotPaused {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        ds.paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Returns to normal state
    function _unpause() internal whenPaused {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        ds.paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Triggers emergency stopped state
    /// @param reason Reason for emergency pausing
    function _emergencyPause(string memory reason) internal whenNotEmergencyPaused {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        ds.emergencyPaused = true;
        emit Paused(msg.sender);
    }

    /// @notice Returns to normal state from emergency pause
    function _unpauseEmergency() internal {
        DiamondStorage.DiamondStorageStruct storage ds = DiamondStorage.diamondStorage();
        require(ds.emergencyPaused, "Pausable: not emergency paused");
        ds.emergencyPaused = false;
        emit Unpaused(msg.sender);
    }
}
