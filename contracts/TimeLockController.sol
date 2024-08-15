// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";


/**
 * @title DAOTimeLock
 * @dev A time-locked contract that governs the delay and execution of proposals
 * for decentralized governance. This contract inherits from OpenZeppelin's TimelockController.
 */
contract DAOTimeLock is TimelockController {
    /**
     * @notice Constructor for the DAOTimeLock contract.
     * @dev Initializes the TimelockController with a minimum delay, a list of proposers, executors, and an admin.
     * @param minDelay The minimum delay in seconds before executing a proposal.
     * @param proposers An array of addresses that are allowed to propose transactions.
     * @param executors An array of addresses that are allowed to execute queued transactions.
     * @param admin The address of the initial administrator who can manage roles. Admin can later be renounced to make the timelock trustless.
     */
    constructor(
        uint256 minDelay,         // Minimum delay in seconds before a proposal can be executed
        address[] memory proposers,  // List of addresses that are allowed to propose actions
        address[] memory executors,  // List of addresses that are allowed to execute actions
        address admin               // Admin address, typically a multisig or governance contract
    ) 
        TimelockController(minDelay, proposers, executors, admin) 
    {}
}
