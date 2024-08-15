import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { encodeFunctionData, keccak256, toHex } from "viem";

/**
 * DAO contract test suite.
 */
describe("DAO", function () {
    /**
     * Deploys the DAO contracts including Apollo, VotesToken, TimeLock, and DAO.
     * Also configures roles and prepares test accounts for voting.
     * 
     * @returns {Promise<Object>} Deployed contract instances and test accounts.
     */
    async function deployDAO() {
        const [owner, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10] =
            await hre.viem.getWalletClients();

        const Apollo = await hre.viem.deployContract("Apollo", []);
        const VotesToken = await hre.viem.deployContract("VotesToken", []);
        const TimeLock = await hre.viem.deployContract("DAOTimeLock", [
            1,
            [owner.account.address],
            [owner.account.address],
            owner.account.address,
        ]);

        const DAO = await hre.viem.deployContract("DAO", [
            VotesToken.address,
            TimeLock.address,
        ]);

        const tokenDecimals = await VotesToken.read.decimals();

        const PROPOSER_ROLE = await TimeLock.read.PROPOSER_ROLE();
        const EXECUTOR_ROLE = await TimeLock.read.EXECUTOR_ROLE();

        await TimeLock.write.grantRole([PROPOSER_ROLE, DAO.address]);
        await TimeLock.write.grantRole([EXECUTOR_ROLE, DAO.address]);

        const allAccounts = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10];

        const againstAccount = [a8, a9, a10];
        const forAccounts = [a1, a2, a3, a4, a5];
        const abstainAccount = [a6, a7];

        const publicClient = await hre.viem.getPublicClient();

        return {
            allAccounts,
            owner,
            againstAccount,
            forAccounts,
            abstainAccount,
            VotesToken,
            TimeLock,
            DAO,
            publicClient,
            Apollo,
            tokenDecimals,
        };
    }

    /**
     * Test case for deploying the DAO contracts.
     */
    describe("Deploy", () => {
        it("should deploy DAO successfully!", async function () {
            const { DAO, VotesToken, TimeLock } = await loadFixture(deployDAO);
            expect(await DAO.read.version()).to.equal("1");
            expect(await DAO.read.votingDelay()).to.equal(86400n);
            expect(await DAO.read.votingPeriod()).to.equal(604800n);
            expect((await DAO.read.token()).toLowerCase()).to.equal(
                VotesToken.address
            );
            expect((await DAO.read.timelock()).toLowerCase()).to.equal(
                TimeLock.address
            );
            expect(await DAO.read.quorumNumerator()).to.equal(40n);
            expect(await DAO.read.quorumDenominator()).to.equal(100n);
        });
    });

    /**
     * Test cases related to DAO functionality.
     */
    describe("Test DAO contract", () => {
        /**
         * Test case for creating a proposal in the DAO.
         */
        it("test Create Proposal", async () => {
            const {
                owner,
                DAO,
                VotesToken,
                allAccounts,
                abstainAccount,
                againstAccount,
                forAccounts,
                Apollo,
                tokenDecimals,
            } = await loadFixture(deployDAO);

            const [apolloTakeOffCalldata, description, descriptionHash] =
                getApolloInformation();

            await DAO.write.propose([
                [Apollo.address],
                [0n],
                [apolloTakeOffCalldata],
                description,
            ]);

            const proposalCreatedEvent = (
                await DAO.getEvents.ProposalCreated()
            )[0].args;

            const proposalId = await DAO.read.hashProposal([
                [Apollo.address],
                [0n],
                [apolloTakeOffCalldata],
                descriptionHash,
            ]);

            expect(proposalId).to.be.equal(proposalCreatedEvent.proposalId);
            expect(proposalCreatedEvent.proposer.toLowerCase()).to.be.equal(
                owner.account.address
            );
            expect(proposalCreatedEvent.targets[0].toLowerCase()).to.be.equal(
                Apollo.address
            );
            expect(proposalCreatedEvent.values[0]).to.be.equal(0n);
            expect(proposalCreatedEvent.calldatas[0]).to.be.equal(
                apolloTakeOffCalldata
            );
            expect(proposalCreatedEvent.voteEnd).to.be.equal(
                proposalCreatedEvent.voteStart + BigInt(7 * 24 * 60 * 60)
            );
            expect(proposalCreatedEvent.description).to.be.equal(description);
        });

        /**
         * Test case for voting, queueing, and executing a proposal in the DAO.
         */
        it("should can voting, queueing, and executing a proposal successfully!", async function () {
            const {
                DAO,
                VotesToken,
                allAccounts,
                abstainAccount,
                againstAccount,
                forAccounts,
                Apollo,
                tokenDecimals,
            } = await loadFixture(deployDAO);

            // Distribute tokens and delegate votes
            for (const account of allAccounts) {
                await VotesToken.write.transfer([
                    account.account.address,
                    BigInt(10 ** tokenDecimals),
                ]);
                const TokenAccount = await hre.viem.getContractAt(
                    "VotesToken",
                    VotesToken.address,
                    { client: { wallet: account } }
                );
                await TokenAccount.write.delegate([account.account.address]);
                expect(
                    (
                        await TokenAccount.read.delegates([
                            account.account.address,
                        ])
                    ).toLowerCase()
                ).to.be.equal(account.account.address);
            }

            const [apolloTakeOffCalldata, description, descriptionHash] =
                getApolloInformation();

            await DAO.write.propose([
                [Apollo.address],
                [0n],
                [apolloTakeOffCalldata],
                description,
            ]);

            const proposalCreatedEvent = (
                await DAO.getEvents.ProposalCreated()
            )[0].args;

            const proposalId = await DAO.read.hashProposal([
                [Apollo.address],
                [0n],
                [apolloTakeOffCalldata],
                descriptionHash,
            ]);

            expect(proposalId).to.be.equal(proposalCreatedEvent.proposalId);

            // Log current proposal state
            let state = await DAO.read.state([proposalId]);
            console.log("\tCurrent state of proposal = Pending", state);

            console.log(
                `\tquorum : ${
                    (await DAO.read.quorum([(await time.latest()) - 1])) /
                    BigInt(10 ** tokenDecimals)
                }`
            );

            // Simulate time passing to start voting
            time.increaseTo(proposalCreatedEvent.voteStart + 3600n);

            // Cast votes from different accounts
            for (const account of forAccounts) {
                const DAOAccount = await hre.viem.getContractAt(
                    "DAO",
                    DAO.address,
                    { client: { wallet: account } }
                );
                await DAOAccount.write.castVote([proposalId, 1]);
                expect(
                    await DAO.read.hasVoted([
                        proposalId,
                        account.account.address,
                    ])
                ).to.be.equal(true);
            }

            for (const account of againstAccount) {
                const DAOAccount = await hre.viem.getContractAt(
                    "DAO",
                    DAO.address,
                    { client: { wallet: account } }
                );
                await DAOAccount.write.castVote([proposalId, 0]);
                expect(
                    await DAO.read.hasVoted([
                        proposalId,
                        account.account.address,
                    ])
                ).to.be.equal(true);
            }

            for (const account of abstainAccount) {
                const DAOAccount = await hre.viem.getContractAt(
                    "DAO",
                    DAO.address,
                    { client: { wallet: account } }
                );
                await DAOAccount.write.castVote([proposalId, 2]);
                expect(
                    await DAO.read.hasVoted([
                        proposalId,
                        account.account.address,
                    ])
                ).to.be.equal(true);
            }

            // Log updated proposal state
            state = await DAO.read.state([proposalId]);
            console.log("\tCurrent state of proposal = Active", state);

            // Attempt to queue the proposal, which should fail if votes are insufficient
            await expect(
                DAO.write.queue([
                    [Apollo.address],
                    [0n],
                    [apolloTakeOffCalldata],
                    descriptionHash,
                ])
            ).to.be.Throw;

            // Get the vote counts
            const proposalVotes = await DAO.read.proposalVotes([proposalId]);

            console.log(
                `\tagainstVotes : ${
                    proposalVotes[0] / BigInt(10 ** tokenDecimals)
                }\n\tforVotes : ${
                    proposalVotes[1] / BigInt(10 ** tokenDecimals)
                }\n\tabstainVotes : ${
                    proposalVotes[2] / BigInt(10 ** tokenDecimals)
                }`
            );

            // Simulate time passing to the end of the voting period
            time.increaseTo(
                (await DAO.read.proposalDeadline([proposalId])) + 1n
            );

            // Queue the proposal for execution
            await DAO.write.queue([
                [Apollo.address],
                [0n],
                [apolloTakeOffCalldata],
                descriptionHash,
            ]);

            // Log updated proposal state
            state = await DAO.read.state([proposalId]);
            console.log("\tCurrent state of proposal = Queued", state);

            // Simulate time passing to the execution period
            time.increase(1);

            // Execute the proposal
            await DAO.write.execute([
                [Apollo.address],
                [0n],
                [apolloTakeOffCalldata],
                descriptionHash,
            ]);

            // Log the final state of the proposal
            state = await DAO.read.state([proposalId]);
            console.log("\tCurrent state of proposal = Executed", state);
        });
    });

    /**
     * Constructs the calldata, description, and description hash for an Apollo takeoff proposal.
     * 
     * @returns {[string, string, string]} The calldata, description, and description hash.
     */
    function getApolloInformation() {
        const apolloTakeOffCalldata = encodeFunctionData({
            abi: [
                {
                    inputs: [],
                    name: "takeOff",
                    outputs: [],
                    stateMutability: "nonpayable",
                    type: "function",
                },
            ],
            functionName: "takeOff",
            args: [],
        });
        const description = "start Apollo takeoff";
        const descriptionHash = keccak256(toHex(description));

        return [apolloTakeOffCalldata, description, descriptionHash];
    }
});
