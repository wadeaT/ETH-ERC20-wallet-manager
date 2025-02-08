// src/hooks/useWallet.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORTED_TOKENS } from '@/lib/constants/tokens';
import { getTokenBalance } from '@/lib/services/transactionService';
import { useTokenPrices } from './useTokenPrices';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useWallet() {
  const router = useRouter();
  const { prices, loading: pricesLoading } = useTokenPrices();
  const [state, setState] = useState({
    address: '',
    balances: {},
    loading: true,
    error: null
  });

  const checkSession = useCallback(async () => {
    try {
      const username = sessionStorage.getItem('username');
      const walletAddress = sessionStorage.getItem('walletAddress');
      const sessionId = sessionStorage.getItem('sessionId');

      if (!username || !walletAddress || !sessionId) {
        console.log('Missing session data:', { username, walletAddress, sessionId });
        return false;
      }

      // Verify wallet data from database
      const userDoc = await getDoc(doc(db, 'users', username));
      if (!userDoc.exists()) {
        console.log('User not found in database');
        return false;
      }

      const userData = userDoc.data();
      if (!userData.wallet?.address || 
          userData.wallet.address.toLowerCase() !== walletAddress.toLowerCase()) {
        console.log('Wallet data mismatch:', {
          stored: userData.wallet?.address,
          session: walletAddress
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session check failed:', error);
      return false;
    }
  }, []);

  const fetchWalletData = useCallback(async () => {
    try {
      const isValid = await checkSession();
      if (!isValid) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Session invalid'
        }));
        return;
      }

      const walletAddress = sessionStorage.getItem('walletAddress');
      const balances = await Promise.all(
        SUPPORTED_TOKENS.map(token => 
          getTokenBalance(
            token.contractAddress,
            walletAddress
          )
        )
      );

      setState({
        address: walletAddress,
        balances: SUPPORTED_TOKENS.reduce((acc, token, i) => ({ 
          ...acc, 
          [token.symbol]: balances[i] 
        }), {}),
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Balance fetch error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load wallet data'
      }));
    }
  }, [checkSession]);

  useEffect(() => {
    let mounted = true;
    let refreshInterval;

    if (mounted) {
      fetchWalletData();
      refreshInterval = setInterval(fetchWalletData, 30000);
    }

    return () => {
      mounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [fetchWalletData]);

  const tokens = SUPPORTED_TOKENS.map(token => ({
    ...token,
    balance: state.balances[token.symbol] || '0',
    price: prices[token.id]?.usd || 0,
    priceChange: prices[token.id]?.usd_24h_change || 0,
    value: (parseFloat(state.balances[token.symbol] || '0') * (prices[token.id]?.usd || 0))
  }));

  return {
    tokens,
    totalValue: tokens.reduce((sum, token) => sum + (token.value || 0), 0),
    address: state.address,
    loading: state.loading || pricesLoading,
    error: state.error,
    checkSession
  };
}