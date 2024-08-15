// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title VotesToken
 * @dev ERC20 Token with voting and permit (EIP-2612) functionalities.
 * This contract integrates voting mechanisms through ERC20Votes, 
 * and permit functionality through ERC20Permit, allowing gasless approvals.
 */
contract VotesToken is ERC20, ERC20Permit, ERC20Votes {
    /**
     * @dev Constructor that initializes the ERC20 token with a name and symbol,
     * and mints an initial supply to the contract deployer.
     */
    constructor() ERC20("VotesToken", "VT") ERC20Permit("VotesToken") {
        _mint(msg.sender, 10 * 10 ** decimals());
    }

    /**
     * @notice Returns the current block timestamp as a uint48.
     * @dev Overrides the clock() function to use the current block's timestamp.
     * @return uint48 The current block timestamp.
     */
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /**
     * @notice Returns the clock mode as a string.
     * @dev Indicates that the contract is using timestamp mode.
     * @return string The clock mode.
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    /**
     * @dev Internal function to update balances and handle voting power.
     * Overrides the _update function required by Solidity for the ERC20Votes functionality.
     * @param from The address from which tokens are transferred.
     * @param to The address to which tokens are transferred.
     * @param value The amount of tokens being transferred.
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    /**
     * @notice Returns the current nonce for an address.
     * @dev Overrides the nonces function from ERC20Permit and Nonces.
     * @param owner The address for which to retrieve the nonce.
     * @return uint256 The current nonce for the given address.
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
