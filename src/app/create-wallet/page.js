// src/app/create-wallet/page.js
'use client';

import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Header } from '@/components/layout/Header';
import { ethers } from 'ethers';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { RecoveryPhrase } from '@/components/features/wallet/RecoveryPhrase';
import { SuccessScreen } from '@/components/features/wallet/SuccessScreen';
import { keyManager } from '@/lib/services/secureKeyManagement';

/**
 * The CreateWallet component handles the creation of a new user wallet,
 * including user registration, wallet generation, and storing encrypted wallet information.
 * The process involves several steps managed by internal component state.
 *
 * @returns {JSX.Element} The wallet creation interface with multiple conditional rendering based on the current step.
 */
export default function CreateWallet() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles the process of creating a new account, generating a new wallet, encrypting,
   * and storing wallet information securely using Firebase and local encryption techniques.
   */
  const handleCreateAccount = async () => {
    setIsLoading(true);
    try {
      // Create new wallet
      const wallet = ethers.Wallet.createRandom();
      
      // Create Firebase auth user using a synthesized email
      const email = `${formData.username}@ethwallet.local`; // Create email from username
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        formData.password
      );

      // Encrypt private key with password and store securely
      const encryptedKey = await keyManager.encryptKey(wallet.privateKey, formData.password);

      // Store wallet data in Firestore
      await setDoc(doc(db, 'users', formData.username), {
        username: formData.username,
        uid: userCredential.user.uid, // Store Firebase Auth UID
        createdAt: new Date().toISOString(),
        wallet: {
          address: wallet.address,
          encryptedKey // Store encrypted private key
        }
      });

      // Save recovery phrase temporarily for user confirmation
      setRecoveryPhrase(wallet.mnemonic.phrase);

      // Initialize session
      const sessionId = keyManager.setSessionKey(wallet.address, wallet.privateKey);
      
      // Store session data for current session
      sessionStorage.setItem('username', formData.username);
      sessionStorage.setItem('walletAddress', wallet.address);
      sessionStorage.setItem('encryptedKey', encryptedKey);
      sessionStorage.setItem('sessionId', sessionId);

      setStep(2);
    } catch (err) {
      console.error('Wallet creation error:', err);
      setError(
        err.code === 'auth/email-already-in-use' 
          ? 'Username already taken' 
          : err.message || 'Failed to create wallet'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton={true}/>
      
      <Card className="max-w-3xl mx-auto bg-card/50 backdrop-blur-sm p-8">
        {step === 1 && (
          <RegisterForm
            formData={formData}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            error={error}
            isLoading={isLoading}
            onInputChange={(e) => {
              setFormData(prev => ({
                ...prev,
                [e.target.name]: e.target.value
              }));
              setError('');
            }}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
            onSubmit={handleCreateAccount}
          />
        )}
        
        {step === 2 && recoveryPhrase && (
          <RecoveryPhrase
            phrase={recoveryPhrase}
            onConfirm={() => {
              setStep(3);
              setRecoveryPhrase(''); // Clear phrase from memory
            }}
          />
        )}
        
        {step === 3 && (
          <SuccessScreen onContinue={() => router.push('/dashboard')} />
        )}
      </Card>
    </div>
  );
}
