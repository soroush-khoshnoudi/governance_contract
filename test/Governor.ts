import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { encodeFunctionData, keccak256, toHex } from "viem";

describe("CompanyGovernance", function () {
    async function deployGovernance() {
        const [
            owner,
            a1,
            a2,
            a3,
            a4,
            a5,
            a6,
            a7,
            a8,
            a9,
            a10,
            blockchainTeamAddress,
        ] = await hre.viem.getWalletClients();

        const Token = await hre.viem.deployContract("Token", []);
        const VotesToken = await hre.viem.deployContract("VotesToken", []);
        const tokenDecimals = await VotesToken.read.decimals();
        const TimeLock = await hre.viem.deployContract("GovernorTimeLock", [
            1,
            [owner.account.address],
            [owner.account.address],
            owner.account.address,
        ]);

        const Governance = await hre.viem.deployContract("CompanyGovernance", [
            VotesToken.address,
            TimeLock.address,
        ]);

        await Token.write.approve([TimeLock.address,100n])

        const PROPOSER_ROLE = await TimeLock.read.PROPOSER_ROLE();
        const EXECUTOR_ROLE = await TimeLock.read.EXECUTOR_ROLE();

        await TimeLock.write.grantRole([PROPOSER_ROLE, Governance.address]);
        await TimeLock.write.grantRole([EXECUTOR_ROLE, Governance.address]);

        const allAccounts = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10];
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
        }

        const againstAccount = [a8, a9, a10];
        const forAccounts = [a1, a2, a3, a4, a5];
        const abstainAccount = [a6, a7];

        const publicClient = await hre.viem.getPublicClient();

        return {
            owner,
            againstAccount,
            forAccounts,
            abstainAccount,
            VotesToken,
            TimeLock,
            Governance,
            publicClient,
            blockchainTeamAddress,
            Token,
        };
    }

    describe("deploy", () => {
        it("should deploy Governance", async function () {
            const { Governance, VotesToken, TimeLock } = await loadFixture(
                deployGovernance
            );
            expect(await Governance.read.version()).to.equal("1");
            expect(await Governance.read.votingDelay()).to.equal(86400n);
            expect(await Governance.read.votingPeriod()).to.equal(604800n);
            expect((await Governance.read.token()).toLowerCase()).to.equal(
                VotesToken.address
            );
            expect((await Governance.read.timelock()).toLowerCase()).to.equal(
                TimeLock.address
            );
            expect(await Governance.read.quorumNumerator()).to.equal(4n);
            expect(await Governance.read.quorumDenominator()).to.equal(100n);
        });
    });
    describe("test", () => {
        it("should test Governance", async function () {
            const {
                Governance,
                blockchainTeamAddress,
                Token,
                TimeLock,
                VotesToken,
                abstainAccount,
                againstAccount,
                forAccounts,
                owner
            } = await loadFixture(deployGovernance);
            const transferABI = {
                constant: false,
                inputs: [
                    {
                        name: "_from",
                        type: "address",
                    },
                    {
                        name: "_to",
                        type: "address",
                    },
                    {
                        name: "_value",
                        type: "uint256",
                    },
                ],
                name: "transferFrom",
                outputs: [
                    {
                        name: "",
                        type: "bool",
                    },
                ],
                payable: false,
                stateMutability: "nonpayable",
                type: "function",
            };

            const transferCalldata = encodeFunctionData({
                functionName: "transferFrom",
                abi: [transferABI],
                args: [owner.account.address,blockchainTeamAddress.account.address, 100n],
            });

            const description = "Give 100 token to Blockshain Team";
            await Governance.write.propose([
                [Token.address],
                [0n],
                [transferCalldata],
                description,
            ]);
            const descriptionHash = keccak256(toHex(description));
            const proposalId = await Governance.read.hashProposal([
                [Token.address],
                [0n],
                [transferCalldata],
                descriptionHash,
            ]);
            time.increase(24 * 60 * 60 + 1);

            for (const account of forAccounts) {
                const GovernanceAccount = await hre.viem.getContractAt(
                    "CompanyGovernance",
                    Governance.address,
                    { client: { wallet: account } }
                );
                await GovernanceAccount.write.castVote([proposalId, 1]);
            }

            for (const account of againstAccount) {
                const GovernanceAccount = await hre.viem.getContractAt(
                    "CompanyGovernance",
                    Governance.address,
                    { client: { wallet: account } }
                );
                await GovernanceAccount.write.castVote([proposalId, 0]);
            }

            for (const account of abstainAccount) {
                const GovernanceAccount = await hre.viem.getContractAt(
                    "CompanyGovernance",
                    Governance.address,
                    { client: { wallet: account } }
                );
                await GovernanceAccount.write.castVote([proposalId, 2]);
            }

            time.increaseTo(
                (await Governance.read.proposalDeadline([proposalId])) + 1n
            );
            // console.log(await Governance.read.state([proposalId]))

            await Governance.write.queue([
                [Token.address],
                [0n],
                [transferCalldata],
                descriptionHash,
            ]);

            time.increase(10);

            console.log(await Token.read.allowance([owner.account.address,Governance.address])) 
            await Governance.write.execute([
                [Token.address],
                [0n],
                [transferCalldata],
                descriptionHash,
            ]);
        });
    });
});

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
