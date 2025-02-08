// src/app/restore-wallet/page.js
'use client';

import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { RestoreWalletForm } from '@/components/features/wallet/RestoreWalletForm';
import { CredentialsForm } from '@/components/features/wallet/CredentialsForm';
import { SecurityNotice } from '@/components/common/SecurityNotice';
import { keyManager } from '@/lib/services/secureKeyManagement';

export default function RestoreWallet() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [wallet, setWallet] = useState(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);

  const handleRestore = async (phrase) => {
    setIsLoading(true);
    setError('');

    try {
      const words = phrase.trim().split(' ');
      if (words.length !== 12) {
        throw new Error('Please enter exactly 12 words');
      }
      
      const restoredWallet = ethers.Wallet.fromPhrase(words.join(' ').toLowerCase());
      setWallet(restoredWallet);

      // Check if this wallet already exists in our system
      const q = query(
        collection(db, 'users'),
        where('wallet.address', '==', restoredWallet.address)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setCredentials(prev => ({
          ...prev,
          username: userData.username
        }));
        setIsExistingUser(true);
      }

      setStep(2);
    } catch (err) {
      console.error('Restore error:', err);
      setError(err.message || 'Failed to restore wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey
      };

      if (isExistingUser) {
        // Update existing wallet
        const userDoc = doc(db, 'users', credentials.username);
        await setDoc(userDoc, {
          wallet: walletData,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } else {
        // Create new user
        const userRef = doc(db, 'users', credentials.username);
        const existingUser = await getDoc(userRef);
        
        if (existingUser.exists()) {
          throw new Error('Username already taken');
        }

        await setDoc(userRef, {
          username: credentials.username,
          password: credentials.password,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          wallet: walletData
        });
      }

      // Create encrypted key
      const encryptedKey = await keyManager.encryptKey(wallet.privateKey, credentials.password);

      // Store in session storage
      sessionStorage.setItem('username', credentials.username);
      sessionStorage.setItem('walletAddress', wallet.address);
      sessionStorage.setItem('encryptedKey', encryptedKey);

      // Create session
      const sessionId = keyManager.setSessionKey(wallet.address, wallet.privateKey);
      sessionStorage.setItem('sessionId', sessionId);

      router.push('/dashboard');
    } catch (err) {
      console.error('Credentials error:', err);
      setError(err.message || 'Failed to save credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Header showBackButton={true}/>

      <main className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-blue-400 mb-8 text-center">
          {step === 1 ? 'Restore Your Wallet' : 'Set Up Your Account'}
        </h2>

        <Card className="bg-card/50 backdrop-blur-sm p-8">
          {step === 1 && (
            <>
              <SecurityNotice type="info" title="Existing Wallet Users" className="mb-6">
                If you previously created a wallet, you can restore access using your 12-word recovery phrase.
              </SecurityNotice>
              <RestoreWalletForm 
                onRestore={handleRestore}
                isLoading={isLoading}
                error={error}
              />
            </>
          )}

          {step === 2 && (
            <CredentialsForm
              credentials={credentials}
              onChange={setCredentials}
              onSubmit={handleCredentialsSubmit}
              isLoading={isLoading}
              error={error}
              walletAddress={wallet.address}
              isExistingUser={isExistingUser}
            />
          )}
        </Card>
      </main>
    </div>
  );
}