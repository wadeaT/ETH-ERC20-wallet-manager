// src/components/auth/LoginForm.js
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/common/FormField';
import { SecurityNotice } from '@/components/common/SecurityNotice';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { keyManager } from '@/lib/services/secureKeyManagement';
import { handleLogout } from '@/lib/utils/auth';

/**
 * LoginForm component provides an interface for user login.
 * It handles user input for username and password, validates input, and manages the login process.
 */
export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim()) {
      setError('Please enter your username');
      return;
    }

    setIsLoading(true);

    try {
      // Clear existing sessions
      await handleLogout();

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', formData.username));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      
      // Sign in with Firebase Auth
      const email = `${formData.username}@ethwallet.local`;
      await signInWithEmailAndPassword(auth, email, formData.password);

      // Extract wallet data
      if (!userData.wallet?.address || !userData.wallet?.encryptedKey) {
        throw new Error('Wallet data not found');
      }

      try {
        // Decrypt private key
        const privateKey = await keyManager.decryptKey(
          userData.wallet.encryptedKey,
          formData.password
        );

        // Create session
        const sessionId = keyManager.setSessionKey(
          userData.wallet.address, 
          privateKey
        );

        // Store session data
        sessionStorage.setItem('username', formData.username);
        sessionStorage.setItem('walletAddress', userData.wallet.address);
        sessionStorage.setItem('encryptedKey', userData.wallet.encryptedKey);
        sessionStorage.setItem('sessionId', sessionId);

        // Update last login
        await updateDoc(doc(db, 'users', formData.username), {
          lastLogin: new Date().toISOString()
        });

        router.push('/dashboard');
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Invalid password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.code === 'auth/invalid-login-credentials' 
          ? 'Invalid username or password'
          : err.message || 'Failed to connect wallet'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <SecurityNotice type="error">{error}</SecurityNotice>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="Username"
          type="text"
          value={formData.username}
          onChange={(e) => {
            setFormData(prev => ({...prev, username: e.target.value}));
            setError('');
          }}
          placeholder="Enter your username"
          required
        />

        <FormField
          type="password"
          label="Password"
          value={formData.password}
          onChange={(e) => {
            setFormData(prev => ({...prev, password: e.target.value}));
            setError('');
          }}
          placeholder="Enter your password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading || !formData.username || !formData.password}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : (
            'Connect Wallet'
          )}
        </Button>

        <div className="flex justify-between text-sm">
          <Link href="/restore-wallet" className="text-primary hover:text-primary/80">
            Restore Using Phrase
          </Link>
          <Link href="/create-wallet" className="text-primary hover:text-primary/80">
            Create New Wallet
          </Link>
        </div>
      </form>
    </div>
  );
}