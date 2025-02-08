// src/lib/services/transactionService.js
import { ethers } from 'ethers';
import rpcProvider from '@/lib/rpcProvider';
import { keyManager } from './secureKeyManagement';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address, uint256) returns (bool)'
];

export async function sendTransaction(toAddress, amount, token, password) {
  if (!ethers.isAddress(toAddress)) {
    throw new Error('Invalid recipient address');
  }

  try {
    // Get encrypted key and session ID
    const encryptedKey = sessionStorage.getItem('encryptedKey');
    const sessionId = sessionStorage.getItem('sessionId');
    const walletAddress = sessionStorage.getItem('walletAddress');

    if (!encryptedKey || !sessionId || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    // Get private key
    let privateKey;
    try {
      privateKey = keyManager.getSessionKey(walletAddress, sessionId);
    } catch (error) {
      privateKey = await keyManager.decryptKey(encryptedKey, password);
    }

    if (!privateKey) {
      throw new Error('Failed to retrieve wallet key');
    }

    // Create wallet instance
    const provider = rpcProvider.provider;
    const wallet = new ethers.Wallet(privateKey, provider);

    // Prepare transaction
    const baseNonce = await provider.getTransactionCount(wallet.address);
    console.log('Current nonce:', baseNonce);

    // Get gas price with fallback options
    const gasPrice = await rpcProvider.getGasPrice();
    console.log('Gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');

    let txRequest;
    if (!token.contractAddress) {
      // ETH transfer
      const value = ethers.parseEther(amount.toString());
      
      // Check ETH balance
      const balance = await provider.getBalance(wallet.address);
      if (balance < value) {
        throw new Error('Insufficient ETH balance');
      }

      txRequest = {
        to: toAddress,
        value: value,
        gasPrice: gasPrice,
        nonce: baseNonce
      };
    } else {
      // ERC20 transfer
      const contract = new ethers.Contract(
        token.contractAddress, 
        ERC20_ABI, 
        wallet
      );
      
      const decimals = await contract.decimals();
      const tokenAmount = ethers.parseUnits(amount.toString(), decimals);
      
      // Check token balance
      const tokenBalance = await contract.balanceOf(wallet.address);
      if (tokenBalance < tokenAmount) {
        throw new Error(`Insufficient ${token.symbol} balance`);
      }

      txRequest = await contract.transfer.populateTransaction(
        toAddress,
        tokenAmount
      );
      txRequest.gasPrice = gasPrice;
      txRequest.nonce = baseNonce;
    }

    // Estimate gas with fallback
    txRequest.gasLimit = await rpcProvider.estimateGas(txRequest);
    console.log('Estimated gas limit:', txRequest.gasLimit.toString());

    // Send transaction
    console.log('Sending transaction...', txRequest);
    const tx = await wallet.sendTransaction(txRequest);
    console.log('Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    // Clear sensitive data
    privateKey = null;

    return receipt;
  } catch (error) {
    console.error('Transaction error:', error);

    // Extract meaningful error message
    let errorMessage = 'Transaction failed';
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient ETH for gas fees';
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      errorMessage = 'Unable to estimate gas limit';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

export async function getTokenBalance(contractAddress, walletAddress) {
  try {
    const provider = rpcProvider.provider;

    if (!contractAddress) {
      return ethers.formatEther(
        await provider.getBalance(walletAddress)
      );
    }

    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals()
    ]);
    
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Balance fetch error:', error);
    return '0';
  }
}

export function formatTransactions(transactions, walletAddress) {
  return transactions.map(tx => {
    const isToken = 'tokenSymbol' in tx;
    const baseTransaction = {
      hash: tx.hash,
      type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'out' : 'in',
      from: tx.from,
      to: tx.to,
      date: new Date(parseInt(tx.timeStamp) * 1000),
      status: tx.isError === '0' ? 'completed' : 'failed',
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice
    };

    if (isToken) {
      return {
        ...baseTransaction,
        token: tx.tokenSymbol || 'Unknown Token',
        amount: ethers.formatUnits(tx.value, tx.tokenDecimal)
      };
    }

    return {
      ...baseTransaction,
      token: 'ETH',
      amount: ethers.formatEther(tx.value)
    };
  });
}