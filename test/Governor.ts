import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei } from "viem";

describe("Governor", function () {
    async function deployGovernor() {
        const [owner, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10] =
            await hre.viem.getWalletClients();

        const VotesToken = await hre.viem.deployContract("VotesToken", []);
        const TimeLock = await hre.viem.deployContract("TimeLock", [
            100,
            [],
            [],
            owner.account.address,
        ]);

        const Governor = await hre.viem.deployContract("MyGovernor", [
            VotesToken.address,
            TimeLock.address,
        ]);

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
            Governor,
            publicClient,
        };
    }

    describe("deploy", () => {
        it("should deploy Governor", async function () {
            const { Governor, VotesToken, TimeLock } = await loadFixture(
                deployGovernor
            );
            expect(await Governor.read.version()).to.equal("1");
            expect(await Governor.read.votingDelay()).to.equal(86400n);
            expect(await Governor.read.votingPeriod()).to.equal(604800n);
            expect((await Governor.read.token()).toLowerCase()).to.equal(VotesToken.address);
            expect((await Governor.read.timelock()).toLowerCase()).to.equal(TimeLock.address);
            expect(await Governor.read.quorumNumerator()).to.equal(4n);
            expect(await Governor.read.quorumDenominator()).to.equal(100n);
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
