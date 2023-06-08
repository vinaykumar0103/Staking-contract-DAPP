const {ethers} =require("hardhat");

async function main() {
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.deployed();

  console.log("RewardToken contract deployed to:", rewardToken.address);

  const Staking = await ethers.getContractFactory('staking');
  const staking = await Staking.deploy(rewardToken.address, rewardToken.address);
  await staking.deployed();

  console.log("Staking contract deployed to:", staking.address);

}
  main().catch((error) => {
    console.error(error);
    process.exitcode =1;
  })
