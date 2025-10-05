// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StringUtils
 * @dev Utility functions for string operations
 */
library StringUtils {
    /**
     * @dev Compare two strings for equality
     * @param a First string
     * @param b Second string
     * @return True if strings are equal
     */
    function equals(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /**
     * @dev Check if string is empty
     * @param str String to check
     * @return True if string is empty
     */
    function isEmpty(string memory str) internal pure returns (bool) {
        return bytes(str).length == 0;
    }

    /**
     * @dev Convert string to bytes32
     * @param str String to convert
     * @return Bytes32 representation
     */
    function toBytes32(string memory str) internal pure returns (bytes32) {
        require(bytes(str).length <= 32, "String too long for bytes32");
        bytes32 result;
        assembly {
            result := mload(add(str, 32))
        }
        return result;
    }

    /**
     * @dev Convert bytes32 to string
     * @param data Bytes32 to convert
     * @return String representation
     */
    function fromBytes32(bytes32 data) internal pure returns (string memory) {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            bytesArray[i] = data[i];
        }
        return string(bytesArray);
    }

    /**
     * @dev Get length of string
     * @param str String to get length of
     * @return Length of string
     */
    function length(string memory str) internal pure returns (uint256) {
        return bytes(str).length;
    }

    /**
     * @dev Concatenate two strings
     * @param a First string
     * @param b Second string
     * @return Concatenated string
     */
    function concat(string memory a, string memory b) internal pure returns (string memory) {
        return string(abi.encodePacked(a, b));
    }

    /**
     * @dev Check if string contains substring
     * @param str String to search in
     * @param substr Substring to search for
     * @return True if substring is found
     */
    function contains(string memory str, string memory substr) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory substrBytes = bytes(substr);

        if (substrBytes.length > strBytes.length) {
            return false;
        }

        for (uint256 i = 0; i <= strBytes.length - substrBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < substrBytes.length; j++) {
                if (strBytes[i + j] != substrBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Convert uint256 to string
     * @param value Value to convert
     * @return String representation
     */
    function fromUint256(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);

        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    /**
     * @dev Convert address to string
     * @param account Address to convert
     * @return String representation
     */
    function fromAddress(address account) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(account)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }

        return string(str);
    }

    /**
     * @dev Generate a simple hash from string (for IDs)
     * @param str String to hash
     * @return Hash as bytes32
     */
    function simpleHash(string memory str) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(str));
    }

    /**
     * @dev Check if string starts with prefix
     * @param str String to check
     * @param prefix Prefix to look for
     * @return True if string starts with prefix
     */
    function startsWith(string memory str, string memory prefix) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);

        if (prefixBytes.length > strBytes.length) {
            return false;
        }

        for (uint256 i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }

        return true;
    }
}
