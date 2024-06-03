import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { encodeFunctionData, keccak256, toHex } from "viem";

describe("DAO", function () {
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

    describe("Deploy", () => {
        it("should deploy DAO", async function () {
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
    describe("Test", () => {
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

        it("should test DAO", async function () {
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

            // proposalCreatedEvent[0] = {
            //   proposalId: 65111842886499006094291420430648087626988677476062755531843499691882875319926n,
            //   proposer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            //   targets: [Array],
            //   values: [Array],
            //   signatures: [Array],
            //   calldatas: [Array],
            //   voteStart: 1717495068n,
            //   voteEnd: 1718099868n,
            //   description: 'Send Apollo to the moon?'
            // }
            expect(proposalId).to.be.equal(proposalCreatedEvent.proposalId);

            let state = await DAO.read.state([proposalId]);
            console.log("\tCurrent state of proposal = Pending",state);

            console.log(
                `\tquorum : ${
                    (await DAO.read.quorum([(await time.latest()) - 1])) /
                    BigInt(10 ** tokenDecimals)
                }`
            );

            time.increaseTo(proposalCreatedEvent.voteStart + 3600n);

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

            state = await DAO.read.state([proposalId]);
            console.log("\tCurrent state of proposal = Active",state);

            await expect(
                DAO.write.queue([
                    [Apollo.address],
                    [0n],
                    [apolloTakeOffCalldata],
                    descriptionHash,
                ])
            ).to.be.Throw;

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

            time.increaseTo(
                (await DAO.read.proposalDeadline([proposalId])) + 1n
            );

            await DAO.write.queue([
                [Apollo.address],
                [0n],
                [apolloTakeOffCalldata],
                descriptionHash,
            ]);

            state = await DAO.read.state([proposalId]);
            console.log("\tCurrent state of proposal = Queued",state);

            time.increase(10);

            expect(await Apollo.read.apolloTakenOff()).to.be.equal(false);

            await DAO.write.execute([
                [Apollo.address],
                [0n],
                [apolloTakeOffCalldata],
                descriptionHash,
            ]);

            state = await DAO.read.state([proposalId]);
            console.log("\tCurrent state of proposal = Executed",state);

            expect(await Apollo.read.apolloTakenOff()).to.be.equal(true);
        });
    });
});

const getApolloInformation = (): [`0x${string}`, string, `0x${string}`] => {
    const apolloTakeOffCalldata = encodeFunctionData({
        functionName: "takeOff",
        abi: [
            {
                inputs: [],
                name: "takeOff",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
            },
        ],
    });
    const description = "Send Apollo to the moon?";
    const descriptionHash = keccak256(toHex(description));
    return [apolloTakeOffCalldata, description, descriptionHash];
};

// describe("Deployment", function () {
//     it("Should set the right unlockTime", async function () {
//         const { lock, unlockTime } = await loadFixture(
//             deployOneYearLockFixture
//         );

//         expect(await lock.read.unlockTime()).to.equal(unlockTime);
//     });

//     it("Should set the right owner", async function () {
//         const { lock, owner } = await loadFixture(deployOneYearLockFixture);

//         expect(await lock.read.owner()).to.equal(
//             getAddress(owner.account.address)
//         );
//     });

//     it("Should receive and store the funds to lock", async function () {
//         const { lock, lockedAmount, publicClient } = await loadFixture(
//             deployOneYearLockFixture
//         );

//         expect(
//             await publicClient.getBalance({
//                 address: lock.address,
//             })
//         ).to.equal(lockedAmount);
//     });

//     it("Should fail if the unlockTime is not in the future", async function () {
//         // We don't use the fixture here because we want a different deployment
//         const latestTime = BigInt(await time.latest());
//         await expect(
//             hre.viem.deployContract("Lock", [latestTime], {
//                 value: 1n,
//             })
//         ).to.be.rejectedWith("Unlock time should be in the future");
//     });
// });

// describe("Withdrawals", function () {
//     describe("Validations", function () {
//         it("Should revert with the right error if called too soon", async function () {
//             const { lock } = await loadFixture(deployOneYearLockFixture);

//             await expect(lock.write.withdraw()).to.be.rejectedWith(
//                 "You can't withdraw yet"
//             );
//         });

//         it("Should revert with the right error if called from another account", async function () {
//             const { lock, unlockTime, otherAccount } = await loadFixture(
//                 deployOneYearLockFixture
//             );

//             // We can increase the time in Hardhat Network
//             await time.increaseTo(unlockTime);

//             // We retrieve the contract with a different account to send a transaction
//             const lockAsOtherAccount = await hre.viem.getContractAt(
//                 "Lock",
//                 lock.address,
//                 { client: { wallet: otherAccount } }
//             );
//             await expect(
//                 lockAsOtherAccount.write.withdraw()
//             ).to.be.rejectedWith("You aren't the owner");
//         });

//         it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
//             const { lock, unlockTime } = await loadFixture(
//                 deployOneYearLockFixture
//             );

//             // Transactions are sent using the first signer by default
//             await time.increaseTo(unlockTime);

//             await expect(lock.write.withdraw()).to.be.fulfilled;
//         });
//     });

//     describe("Events", function () {
//         it("Should emit an event on withdrawals", async function () {
//             const { lock, unlockTime, lockedAmount, publicClient } =
//                 await loadFixture(deployOneYearLockFixture);

//             await time.increaseTo(unlockTime);

//             const hash = await lock.write.withdraw();
//             await publicClient.waitForTransactionReceipt({ hash });

//             // get the withdrawal events in the latest block
//             const withdrawalEvents = await lock.getEvents.Withdrawal();
//             expect(withdrawalEvents).to.have.lengthOf(1);
//             expect(withdrawalEvents[0].args.amount).to.equal(lockedAmount);
//         });
//     });
// });
