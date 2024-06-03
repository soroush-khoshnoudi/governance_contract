// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Apollo {
    bool public apolloTakenOff = false;

    function takeOff() external {
        apolloTakenOff = true;
    }
}
