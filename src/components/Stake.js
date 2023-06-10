import React, { useState, useEffect } from 'react';
import { ethers, utils } from 'ethers';
import Staking from '../contracts/Staking.json';
import RewardToken from '../contracts/RewardToken.json';

const Stake = () => {
  const [stakingContract, setStakingContract] = useState(null);
  const [rewardTokenContract, setRewardTokenContract] = useState(null);
  const [account, setAccount] = useState('');
  const [stakedAmount, setStakedAmount] = useState('');
  const [rewardBalance, setRewardBalance] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    connect();
  }, []);

  const connect = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const stakingContractAddress = '0x9D8f7dF6c746BD5b0ba3e916F7604503c03DC174';
        const rewardTokenContractAddress = '0xc0C76c75545836db4461CbA428190cB630Aa57A7';

        const stakingContract = new ethers.Contract(
          stakingContractAddress,
          Staking.abi,
          signer
        );
        const rewardTokenContract = new ethers.Contract(
          rewardTokenContractAddress,
          RewardToken.abi,
          signer
        );

        setStakingContract(stakingContract);
        setRewardTokenContract(rewardTokenContract);

        const stakedAmount = await stakingContract.getStaked(address);
        setStakedAmount(stakedAmount.toString() || '');
      } else {
        setError('Metamask is not installed or not detected.');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const disconnect = () => {
    setStakingContract(null);
    setRewardTokenContract(null);
    setAccount('');
    setStakedAmount('');
    setSelectedAmount(0);
    setError(null);
  };

  const stakeTokens = async () => {
    try {
      if (selectedAmount <= 0) {
        setError('Please enter a valid token amount.');
        return;
      }

      const tokenAmount = utils.parseUnits(selectedAmount.toString());

      // Approve staking contract to spend tokens
      await rewardTokenContract.approve(stakingContract.address, tokenAmount, { gasLimit: 500000 });

      // Stake tokens
      await stakingContract.stake(tokenAmount, { gasLimit: 500000 });

      // Fetch updated staked amount
      const updatedStakedAmount = await stakingContract.getStaked(account);
      setStakedAmount(updatedStakedAmount.toString() || '');

      // Fetch updated reward balance
      const updatedRewardBalance = await stakingContract.earned(account);
      setRewardBalance(updatedRewardBalance.toString());
    } catch (error) {
      setError(error.message);
    }
  };


  const withdrawTokens = async () => {
    try {
      if (selectedAmount <= 0) {
        setError('Please enter a valid token amount.');
        return;
      }

      const tokenAmount = utils.parseUnits(selectedAmount.toString());

      // Withdraw tokens
      await stakingContract.withdraw(tokenAmount, { gasLimit: 500000 });

      // Update the staked amount
      const updatedStakedAmount = await stakingContract.getStaked(account);
      setStakedAmount(updatedStakedAmount.toString() || '');
    } catch (error) {
      setError(error.message);
    }
  };

  const claimRewards = async () => {
    try {
      // Claim rewards
      await stakingContract.claimReward({ gasLimit: 500000 });

      // Update the reward balance
      const rewardBalance = await stakingContract.earned(account);
      setRewardBalance(rewardBalance.toString());
    } catch (error) {
      setError(error.message);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cyan-800">
      <div className="container mx-auto p-4 bg-blue-100 shadow-md rounded-md ">
        <h1 className="text-4xl font-bold text-center mb-4">Staking Dapp</h1>
        {account ? (
          <div>
            <p className="text-center">Connected Account: {account}</p>
            {stakedAmount !== '' && (
              <p className="text-center">
                Staked Amount: {utils.formatUnits(stakedAmount, 'ether')} tokens
              </p>
            )}
            <p className="text-center">Reward Balance: {rewardBalance} tokens</p>
            <div className="mt-4 flex justify-center">
              <label htmlFor="amount" className="mr-2">
                Enter Token Amount:
              </label>
              <input
                type="number"
                id="amount"
                value={selectedAmount}
                onChange={(e) => setSelectedAmount(e.target.value)}
                className="border border-gray-300 rounded p-2"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={stakeTokens}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Stake Tokens
              </button>
              <button
                onClick={withdrawTokens}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ml-2"
              >
                Withdraw Tokens
              </button>
              <button
                onClick={claimRewards}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ml-2"
              >
                Claim Rewards
              </button>
              <button
                onClick={disconnect}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded ml-2"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
          >
            Connect with Metamask
          </button>
        )}
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default Stake;
