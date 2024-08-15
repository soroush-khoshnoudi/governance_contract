// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title Apollo
 * @dev A simple contract that simulates a rocket launch by toggling the `apolloTakenOff` state.
 */
contract Apollo {
    /// @notice Indicates whether the Apollo rocket has taken off.
    bool public apolloTakenOff = false;

    /**
     * @notice Simulates the Apollo rocket taking off.
     * @dev Sets the `apolloTakenOff` state to `true`.
     */
    function takeOff() external {
        apolloTakenOff = true;
    }
}
