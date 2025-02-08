// src/lib/services/secureKeyManagement.js
import { ethers } from 'ethers';

class SecureKeyManagement {
  constructor() {
    this.sessionKeys = new Map();
  }

  // Check if a string is a valid private key
  isValidPrivateKey(key) {
    try {
      return ethers.isHexString(key, 32);
    } catch (error) {
      return false;
    }
  }

  // Check if a string is a JSON wallet
  isJsonWallet(str) {
    try {
      if (typeof str !== 'string') return false;
      const parsed = JSON.parse(str);
      return parsed.version !== undefined && 
             (parsed.crypto !== undefined || parsed.Crypto !== undefined);
    } catch (error) {
      return false;
    }
  }

  // Encrypt private key with a password
  async encryptKey(privateKey, password) {
    try {
      // If it's already a JSON wallet, validate and return as is
      if (this.isJsonWallet(privateKey)) {
        return privateKey;
      }

      // If it's a raw private key, encrypt it
      if (this.isValidPrivateKey(privateKey)) {
        const wallet = new ethers.Wallet(privateKey);
        // Use the standard encryption without custom options
        return await wallet.encrypt(password);
      }

      throw new Error('Invalid private key format');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt wallet');
    }
  }

  // Decrypt private key using password
  async decryptKey(encryptedKey, password) {
    try {
      // If it's already a raw private key, validate and return it
      if (this.isValidPrivateKey(encryptedKey)) {
        return encryptedKey;
      }

      // If it's a JSON wallet, decrypt it
      if (this.isJsonWallet(encryptedKey)) {
        try {
          const wallet = await ethers.Wallet.fromEncryptedJson(encryptedKey, password);
          return wallet.privateKey;
        } catch (error) {
          console.error('JSON wallet decryption failed:', error);
          throw new Error('Failed to decrypt wallet - invalid password');
        }
      }

      console.error('Invalid key format:', typeof encryptedKey);
      throw new Error('Invalid wallet format');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error(error.message || 'Failed to decrypt wallet');
    }
  }

  // Store encrypted key in memory for the session
  setSessionKey(address, privateKey) {
    if (!address || !privateKey) {
      throw new Error('Invalid session data');
    }
    const sessionId = crypto.randomUUID();
    const normalizedAddress = address.toLowerCase();
    this.sessionKeys.set(normalizedAddress, {
      key: privateKey,
      sessionId,
      timestamp: Date.now()
    });
    return sessionId;
  }

  // Retrieve key from session storage
  getSessionKey(address, sessionId) {
    if (!address || !sessionId) {
      throw new Error('Invalid session parameters');
    }
    const normalizedAddress = address.toLowerCase();
    const keyData = this.sessionKeys.get(normalizedAddress);
    
    if (!keyData || keyData.sessionId !== sessionId) {
      throw new Error('Invalid session');
    }
    
    // Check if session is expired (24 hours)
    if (Date.now() - keyData.timestamp > 24 * 60 * 60 * 1000) {
      this.clearSessionKey(normalizedAddress);
      throw new Error('Session expired');
    }
    
    return keyData.key;
  }

  // Clear session key
  clearSessionKey(address) {
    if (address) {
      this.sessionKeys.delete(address.toLowerCase());
    }
  }

  // Clear all session keys
  clearAllSessions() {
    this.sessionKeys.clear();
  }
}

export const keyManager = new SecureKeyManagement();