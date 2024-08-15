// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title DAO
 * @dev A decentralized autonomous organization (DAO) contract that manages governance through proposals and voting.
 * Inherits from multiple OpenZeppelin governance extensions to implement voting, quorum requirements, and timelock control.
 */
contract DAO is 
    Governor, 
    GovernorSettings, 
    GovernorCountingSimple, 
    GovernorVotes, 
    GovernorVotesQuorumFraction, 
    GovernorTimelockControl 
{
    /**
     * @dev Constructor that initializes the DAO contract with the specified governance token and timelock controller.
     * @param _token The governance token (IVotes) used for voting.
     * @param _timelock The timelock controller contract that enforces delays on proposal execution.
     */
    constructor(IVotes _token, TimelockController _timelock)
        Governor("DAO")
        GovernorSettings(1 days, 1 weeks, 0)  // Voting delay of 1 day, voting period of 1 week, and proposal threshold of 0
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(40)  // 40% quorum fraction required for proposals to pass
        GovernorTimelockControl(_timelock)
    {}

    /**
     * @notice Returns the voting delay before a proposal can be voted on.
     * @dev Overrides the votingDelay function from Governor and GovernorSettings.
     * @return uint256 The delay in blocks.
     */
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    /**
     * @notice Returns the voting period during which a proposal can be voted on.
     * @dev Overrides the votingPeriod function from Governor and GovernorSettings.
     * @return uint256 The voting period in blocks.
     */
    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    /**
     * @notice Returns the quorum required for a proposal to pass at a given block number.
     * @dev Overrides the quorum function from Governor and GovernorVotesQuorumFraction.
     * @param blockNumber The block number at which to calculate the quorum.
     * @return uint256 The quorum required for the given block number.
     */
    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    /**
     * @notice Returns the state of a proposal.
     * @dev Overrides the state function from Governor and GovernorTimelockControl.
     * @param proposalId The ID of the proposal to check.
     * @return ProposalState The current state of the proposal.
     */
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /**
     * @notice Determines if a proposal needs to be queued before execution.
     * @dev Overrides the proposalNeedsQueuing function from Governor and GovernorTimelockControl.
     * @param proposalId The ID of the proposal to check.
     * @return bool True if the proposal needs to be queued, false otherwise.
     */
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    /**
     * @notice Returns the proposal threshold, i.e., the minimum number of votes required to create a proposal.
     * @dev Overrides the proposalThreshold function from Governor and GovernorSettings.
     * @return uint256 The proposal threshold.
     */
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /**
     * @dev Internal function to queue operations after a proposal has been passed.
     * Overrides the _queueOperations function from Governor and GovernorTimelockControl.
     * @param proposalId The ID of the proposal being queued.
     * @param targets The addresses targeted by the proposal's operations.
     * @param values The ETH values sent along with the operations.
     * @param calldatas The calldata for each operation.
     * @param descriptionHash The hash of the proposal description.
     * @return uint48 The timestamp at which the operations are queued.
     */
    function _queueOperations(
        uint256 proposalId, 
        address[] memory targets, 
        uint256[] memory values, 
        bytes[] memory calldatas, 
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint48)
    {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal function to execute operations after the timelock period has passed.
     * Overrides the _executeOperations function from Governor and GovernorTimelockControl.
     * @param proposalId The ID of the proposal being executed.
     * @param targets The addresses targeted by the proposal's operations.
     * @param values The ETH values sent along with the operations.
     * @param calldatas The calldata for each operation.
     * @param descriptionHash The hash of the proposal description.
     */
    function _executeOperations(
        uint256 proposalId, 
        address[] memory targets, 
        uint256[] memory values, 
        bytes[] memory calldatas, 
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal function to cancel a proposal.
     * Overrides the _cancel function from Governor and GovernorTimelockControl.
     * @param targets The addresses targeted by the proposal's operations.
     * @param values The ETH values sent along with the operations.
     * @param calldatas The calldata for each operation.
     * @param descriptionHash The hash of the proposal description.
     * @return uint256 The ID of the canceled proposal.
     */
    function _cancel(
        address[] memory targets, 
        uint256[] memory values, 
        bytes[] memory calldatas, 
        bytes32 descriptionHash
    )
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @notice Returns the executor address that executes the proposal's operations after the timelock period.
     * @dev Overrides the _executor function from Governor and GovernorTimelockControl.
     * @return address The executor address (usually the timelock contract).
     */
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
