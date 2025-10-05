// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AddressUtils
 * @dev Utility functions for address operations
 */
library AddressUtils {
    /**
     * @dev Check if an address is a contract
     * @param account Address to check
     * @return True if address is a contract
     */
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    /**
     * @dev Check if an address is the zero address
     * @param account Address to check
     * @return True if address is zero address
     */
    function isZeroAddress(address account) internal pure returns (bool) {
        return account == address(0);
    }

    /**
     * @dev Convert address to bytes32
     * @param account Address to convert
     * @return Address as bytes32
     */
    function toBytes32(address account) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(account)));
    }

    /**
     * @dev Convert bytes32 to address
     * @param data Bytes32 to convert
     * @return Address from bytes32
     */
    function toAddress(bytes32 data) internal pure returns (address) {
        return address(uint160(uint256(data)));
    }

    /**
     * @dev Compare two addresses for equality
     * @param a First address
     * @param b Second address
     * @return True if addresses are equal
     */
    function equals(address a, address b) internal pure returns (bool) {
        return a == b;
    }

    /**
     * @dev Check if address is in array
     * @param account Address to check
     * @param accounts Array of addresses
     * @return True if address is in array
     */
    function isInArray(address account, address[] memory accounts) internal pure returns (bool) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == account) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Remove address from array
     * @param account Address to remove
     * @param accounts Array to remove from
     * @return newArray Array with address removed
     */
    function removeFromArray(address account, address[] memory accounts) internal pure returns (address[] memory newArray) {
        uint256 length = accounts.length;
        newArray = new address[](length - 1);

        uint256 j = 0;
        for (uint256 i = 0; i < length; i++) {
            if (accounts[i] != account) {
                newArray[j] = accounts[i];
                j++;
            }
        }
    }

    /**
     * @dev Add address to array if not already present
     * @param account Address to add
     * @param accounts Array to add to
     * @return newArray Array with address added (if not present)
     */
    function addToArray(address account, address[] memory accounts) internal pure returns (address[] memory newArray) {
        if (isInArray(account, accounts)) {
            return accounts;
        }

        newArray = new address[](accounts.length + 1);
        for (uint256 i = 0; i < accounts.length; i++) {
            newArray[i] = accounts[i];
        }
        newArray[accounts.length] = account;
    }
}
