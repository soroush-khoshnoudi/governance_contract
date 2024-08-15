# DAO Smart Contract Example with OpenZeppelin Governance

This repository contains a complete example of a Decentralized Autonomous Organization (DAO) implemented using OpenZeppelin's governance contracts. The project demonstrates how to deploy and interact with governance contracts such as `Governor`, `ERC20VotesToken`, `Timelock`, and more. It also includes a suite of tests to validate the functionality of the DAO.

## Overview

This project showcases the following features:

- **Governance Contracts**: Built using OpenZeppelin's governance contracts, including `Governor`, `VotesToken`, and `Timelock`.
- **Proposal System**: Users can create and vote on proposals. Proposals can be executed based on the outcome of the voting process.
- **Token-Based Voting**: Token holders can delegate their voting power and participate in governance decisions.
- **Time-Locked Execution**: Proposals are executed after a delay period using a timelock mechanism to ensure that governance decisions are securely implemented.

## Learning from Tests

The test suite in this project serves as both validation for the contract logic and a tutorial on how to interact with OpenZeppelin's governance contracts. By reading and running the tests, you can gain a deeper understanding of:

- **Contract Interaction**: Learn how to interact with the governance contracts such as `Governor`, `VotesToken`, and `Timelock`. The tests demonstrate how to deploy contracts, delegate voting power, create proposals, cast votes, and execute proposals.
- **Governance Workflow**: Understand the entire lifecycle of a governance proposal, from creation to execution, including the roles of token holders, proposers, and executors.
- **State Transitions**: See how proposals transition through different states such as `Pending`, `Active`, `Succeeded`, `Queued`, and `Executed`, and how the smart contracts enforce these state changes.
- **Voting Mechanisms**: Explore how voting works with options for `For`, `Against`, and `Abstain`, and how the smart contracts tally votes to determine the outcome of a proposal.
- **Timelock Execution**: Learn about the time delay mechanism enforced by the `Timelock` contract to ensure that proposals are queued before execution, providing a safety window for the community.

By studying the test cases, you will gain practical insights into how OpenZeppelin's governance contracts function and how to implement your own governance system on Ethereum. The tests act as a guide to understanding the correct usage of these contracts and best practices for decentralized governance.

Feel free to use the test suite as a reference for implementing similar functionality in your own projects, and modify it to suit your specific requirements.

## Contracts

### 1. **VotesToken.sol**

This contract represents the governance token used by the DAO. It is based on OpenZeppelin's ERC20Votes contract, which extends ERC20 with voting functionality. Holders of the token can delegate their voting power to themselves or others.

Key Features:
- ERC20 token with voting capabilities.
- Delegation of voting power.
- Snapshots of token balances at the time of voting.

### 2. **Governor.sol**

This contract implements the core governance logic of the DAO. It is based on OpenZeppelin's `Governor` contract and defines parameters such as the voting period, quorum, and proposal threshold.

Key Features:
- Creation of governance proposals.
- Voting on proposals with options for `For`, `Against`, or `Abstain`.
- Quorum and proposal thresholds.
- Proposal states including `Pending`, `Active`, `Succeeded`, `Defeated`, and `Executed`.

### 3. **Timelock.sol**

The `Timelock` contract acts as a time delay mechanism for executing proposals that have passed. This ensures that decisions are not executed immediately, giving the community time to react if necessary.

Key Features:
- Enforces a minimum delay before executing a proposal.
- Manages roles for proposers and executors.
- Queues, cancels, and executes proposals.

### 4. **Apollo.sol**

An example contract that contains a function, `takeOff()`, which is the subject of a governance proposal. This demonstrates how a governance decision can trigger an action in an external contract.

## Prerequisites

Before clone and run project be sure you have following tools installed:

- [Node.js](https://nodejs.org/en/download/) (v16 or higher)
- [Hardhat](https://hardhat.org/getting-started/)
- [OpenZeppelin Contracts](https://www.openzeppelin.com/contracts/)
- [Chai](https://www.chaijs.com/) for assertions
- [viem](https://viem.sh/) for smart contract interaction

## Installation

Clone the repository and install the necessary dependencies:

```bash
git clone https://github.com/soroush-khoshnoudi/governance_contract.git
cd dao-governance-example
npm install
```

## test

Run test 

```bash
npx hardhat test
```

## Built With

This project utilizes the following tools and frameworks:

- [Node.js](https://nodejs.org/en/download/) (v16 or higher)
- [Hardhat](https://hardhat.org/getting-started/)
- [OpenZeppelin Contracts](https://www.openzeppelin.com/contracts/)
- [Chai](https://www.chaijs.com/) for assertions
- [viem](https://viem.sh/) for smart contract interaction

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute the code as long as the conditions of the MIT License are met. For more details, refer to the [LICENSE](LICENSE) file.

## Contributions

Contributions to this project are welcome! Whether it's bug reports, feature requests, or pull requests, your participation is appreciated. To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a clear description of the changes you've made.

We appreciate any and all contributions that help improve this project.

## Contact

If you have any questions, feedback, or need support, feel free to reach out:

- **Email**: [soroushkhoshnoudi@gmail.com](mailto:soroushkhoshnoudi@gmail.com)
- **GitHub Issues**: Open an issue in this repository for any problems or suggestions.
