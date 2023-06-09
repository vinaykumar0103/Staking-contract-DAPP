import React, { useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import RewardToken from "../contracts/RewardToken.json";
import Staking from "../contracts/Staking.json";

const Stake = () => {
  const [rewardTokenContract, setRewardTokenContract] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [account, setAccount] = useState("");
  const [stakedAmount, setStakedAmount] = useState(0);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [error, setError] = useState(null);
  const [tokenDecimals, setTokenDecimals] = useState(0);

  useEffect(() => {
    connect();
  }, []);

  const connect = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });

        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const rewardTokenAddress = "0xf48B2086a41B9eF1C5A188d4eE8cb92c8F542F48";
        const stakingContractAddress = "0xeE3b4d1b118875E6a514972d2a5708F3F693Bcbb";

        const rewardTokenContract = new ethers.Contract(
          rewardTokenAddress,
          RewardToken.abi,
          signer
        );
        const stakingContract = new ethers.Contract(
          stakingContractAddress,
          Staking.abi,
          signer
        );

        setRewardTokenContract(rewardTokenContract);
        setStakingContract(stakingContract);

        const stakedAmount = await stakingContract.getStaked(address);
        setStakedAmount(stakedAmount.toNumber());

        const rewardBalance = await rewardTokenContract.balanceOf(address);
        setRewardBalance(rewardBalance.toNumber());

        // Fetch the token decimals
        const tokenDecimals = await rewardTokenContract.decimals();
        setTokenDecimals(tokenDecimals.toNumber());
      } else {
        setError("Metamask is not installed or not detected.");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const disconnect = () => {
    setRewardTokenContract(null);
    setStakingContract(null);
    setAccount("");
    setStakedAmount(0);
    setRewardBalance(0);
    setSelectedAmount(0);
    setError(null);
  };

  const stakeTokens = async () => {
    try {
      const tokenAmount = utils.parseUnits(selectedAmount.toString(), tokenDecimals);

      // Approve the staking contract to spend tokens
      const approveTx = await rewardTokenContract.approve(stakingContract.address, tokenAmount);
      await approveTx.wait();

      // Stake tokens
      await stakingContract.stake(tokenAmount);
      setStakedAmount(stakedAmount + tokenAmount.toNumber());
    } catch (error) {
      setError(error.message);
    }
  };

  const unstakeTokens = async () => {
    try {
      const tokenAmount = utils.parseUnits(selectedAmount.toString(), tokenDecimals);

      // Unstake tokens
      await stakingContract.withdraw(tokenAmount);
      setStakedAmount(stakedAmount - tokenAmount.toNumber());
    } catch (error) {
      setError(error.message);
    }
  };

  const claimRewards = async () => {
    try {
      // Calculate the earned rewards based on the staked amount
      const earnedRewards = await stakingContract.calculateEarnedRewards(account);

      // Only allow claiming rewards if there are earned rewards
      if (earnedRewards.gt(0)) {
        // Claim rewards
        const claimTx = await stakingContract.claimReward();
        await claimTx.wait();

        const rewardBalance = await rewardTokenContract.balanceOf(account);
        setRewardBalance(rewardBalance.toNumber());
      } else {
        setError("No rewards available to claim.");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">Staking App</h1>
      {account ? (
        <div>
          <p>Connected Account: {account}</p>
          <p>Staked Amount: {stakedAmount} tokens</p>
          <p>Reward Balance: {rewardBalance} tokens</p>
          <div className="flex items-center mt-4">
            <input
              type="number"
              min="0"
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded mr-4"
            />
            <button
              onClick={stakeTokens}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Stake
            </button>
            <button
              onClick={unstakeTokens}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ml-4"
            >
              Unstake
            </button>
            <button
              onClick={claimRewards}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded ml-4"
            >
              Claim Rewards
            </button>
            <button
              onClick={disconnect}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded ml-4"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Connect your wallet to get started.</p>
          <button
            onClick={connect}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-4"
          >
            Connect Wallet
          </button>
        </div>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default Stake;
