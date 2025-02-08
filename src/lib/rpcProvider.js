// src/lib/rpcProvider.js
import { ethers } from 'ethers';

const FALLBACK_PROVIDERS = [
  'https://ethereum.publicnode.com',
  'https://rpc.ankr.com/eth',
  'https://eth.drpc.org',
  'https://1rpc.io/eth'
];

class RpcProvider {
  constructor() {
    this._providers = FALLBACK_PROVIDERS.map(url => 
      new ethers.JsonRpcProvider(url, {
        chainId: 1,
        name: 'mainnet'
      }, {
        batchMaxCount: 1, // Disable batching
        polling: true,
        pollingInterval: 4000,
        staticNetwork: true,
        timeout: 15000 // Increase timeout
      })
    );
    
    this._currentIndex = 0;
    this._failedAttempts = new Map();
  }

  async _rotateProvider() {
    const previousIndex = this._currentIndex;
    const maxAttempts = 3;

    do {
      this._currentIndex = (this._currentIndex + 1) % this._providers.length;
      const attempts = this._failedAttempts.get(this._currentIndex) || 0;
      
      if (attempts < maxAttempts) {
        break;
      }
    } while (this._currentIndex !== previousIndex);

    if (this._currentIndex === previousIndex) {
      this._failedAttempts.clear();
    }

    console.log(`Switched to RPC provider: ${FALLBACK_PROVIDERS[this._currentIndex]}`);
    return this._providers[this._currentIndex];
  }

  async _executeWithFallback(operation) {
    let lastError;
    
    for (let attempt = 0; attempt < this._providers.length * 2; attempt++) {
      try {
        const result = await operation(this._providers[this._currentIndex]);
        this._failedAttempts.delete(this._currentIndex);
        return result;
      } catch (error) {
        console.error(`Provider error (${FALLBACK_PROVIDERS[this._currentIndex]}):`, error);
        lastError = error;

        const attempts = this._failedAttempts.get(this._currentIndex) || 0;
        this._failedAttempts.set(this._currentIndex, attempts + 1);

        // Add delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        await this._rotateProvider();
      }
    }

    throw lastError || new Error('All RPC providers failed');
  }

  get provider() {
    return this._providers[this._currentIndex];
  }

  async getGasPrice() {
    try {
      const feeData = await this._executeWithFallback(provider => provider.getFeeData());
      return feeData.gasPrice || ethers.parseUnits('50', 'gwei');
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return ethers.parseUnits('50', 'gwei');
    }
  }

  async estimateGas(tx) {
    try {
      const gasLimit = await this._executeWithFallback(provider => provider.estimateGas(tx));
      return (gasLimit * BigInt(130)) / BigInt(100);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return BigInt(50000);
    }
  }
}

export default new RpcProvider();