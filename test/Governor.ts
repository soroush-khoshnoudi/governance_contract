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
        const TimeLock = await hre.viem.deployContract("TimeLock", [
            0,
            [],
            [],
            "0x0000000000000000000000000000000000000000",
        ]);

        const Governance = await hre.viem.deployContract("CompanyGovernance", [
            VotesToken.address,
            TimeLock.address,
        ]);

        await VotesToken.write.transfer([a1.account.address, 1n]);
        await VotesToken.write.transfer([a2.account.address, 1n]);
        await VotesToken.write.transfer([a3.account.address, 1n]);
        await VotesToken.write.transfer([a4.account.address, 1n]);
        await VotesToken.write.transfer([a5.account.address, 1n]);
        await VotesToken.write.transfer([a6.account.address, 1n]);
        await VotesToken.write.transfer([a7.account.address, 1n]);
        await VotesToken.write.transfer([a8.account.address, 1n]);
        await VotesToken.write.transfer([a9.account.address, 1n]);
        await VotesToken.write.transfer([a10.account.address, 1n]);
        let accounts = [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10];

        const publicClient = await hre.viem.getPublicClient();

        return {
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
            const { Governance, blockchainTeamAddress, Token,TimeLock } =
                await loadFixture(deployGovernance);


            const transferABI = {
                constant: false,
                inputs: [
                    {
                        name: "_to",
                        type: "address",
                    },
                    {
                        name: "_value",
                        type: "uint256",
                    },
                ],
                name: "transfer",
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
                functionName: "transfer",
                abi: [transferABI],
                args: [blockchainTeamAddress.account.address, 100n],
            });

            const description = "Give 100 token to Blockshain Team";

            await Governance.write.propose([
                [Token.address],
                [0n],
                [transferCalldata],
                description,
            ]);

            const descriptionHash = keccak256(toHex(description));

            await Governance.write.queue([
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
