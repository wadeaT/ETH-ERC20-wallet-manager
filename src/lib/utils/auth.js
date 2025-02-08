// src/lib/utils/auth.js
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { keyManager } from '@/lib/services/secureKeyManagement';

export async function handleLogout() {
  try {
    // Clear Firebase auth state
    await signOut(auth);

    // Clear all session keys from keyManager
    keyManager.clearAllSessions();

    // Clear all session storage
    sessionStorage.clear();
    
    // Clear any local storage items related to wallet
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('username');
    localStorage.removeItem('encryptedKey');

    // Force clear any other potential wallet data
    window.sessionStorage.clear();
    
    // Return success
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}