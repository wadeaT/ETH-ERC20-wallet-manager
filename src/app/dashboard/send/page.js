// src/app/dashboard/send/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/common/FormField';
import { TokenSelector } from '@/components/features/token/TokenSelector';
import { AmountInput } from '@/components/features/transaction/AmountInput';
import { useWallet } from '@/hooks/useWallet';
import { SecurityNotice } from '@/components/common/SecurityNotice';
import { ethers } from 'ethers';
import { sendTransaction } from '@/lib/services/transactionService';

export default function SendPage() {
  const router = useRouter();
  const { tokens, loading } = useWallet();
  
  const [state, setState] = useState({
    toAddress: '',
    amount: '',
    password: '', // Add password field
    selectedToken: tokens[0],
    showTokenSelect: false,
    isLoading: false,
    error: ''
  });

  const handleStateChange = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const validateAddress = (address) => {
    if (!address) return 'Recipient address is required';
    if (!ethers.isAddress(address)) return 'Invalid Ethereum address';
    return '';
  };

  const validateAmount = (amount, token) => {
    if (!amount) return 'Amount is required';
    if (isNaN(amount) || parseFloat(amount) <= 0) return 'Invalid amount';
    if (parseFloat(amount) > parseFloat(token.balance)) {
      return 'Insufficient balance';
    }
    return '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const { toAddress, amount, selectedToken, password } = state;

    // Validate inputs
    const addressError = validateAddress(toAddress);
    if (addressError) {
      handleStateChange({ error: addressError });
      return;
    }

    const amountError = validateAmount(amount, selectedToken);
    if (amountError) {
      handleStateChange({ error: amountError });
      return;
    }

    if (!password) {
      handleStateChange({ error: 'Password is required to confirm transaction' });
      return;
    }

    handleStateChange({ isLoading: true, error: '' });

    try {
      await sendTransaction(toAddress, amount, selectedToken, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Send error:', error);
      handleStateChange({ 
        error: error.message || 'Transaction failed. Please try again.',
        isLoading: false 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { toAddress, amount, password, selectedToken, showTokenSelect, isLoading, error } = state;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground mb-8">
        Send {selectedToken?.symbol}
      </h1>

      <Card className="bg-card/50 backdrop-blur-sm p-6">
        <form onSubmit={handleSend} className="space-y-6">
          {/* Token Selection */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Select Token
            </label>
            <TokenSelector 
              selectedToken={selectedToken}
              tokens={tokens}
              onSelect={(token) => {
                handleStateChange({ 
                  selectedToken: token,
                  showTokenSelect: false 
                });
              }}
              showSelect={showTokenSelect}
              onToggleSelect={() => handleStateChange({ 
                showTokenSelect: !showTokenSelect 
              })}
            />
          </div>

          {/* Recipient Address */}
          <FormField
            label="Recipient Address"
            type="text"
            value={toAddress}
            onChange={(e) => {
              handleStateChange({ 
                toAddress: e.target.value,
                error: '' 
              });
            }}
            placeholder="0x..."
          />

          {/* Amount Input */}
          <AmountInput
            amount={amount}
            onAmountChange={(value) => {
              handleStateChange({ 
                amount: value,
                error: '' 
              });
            }}
            onSetMax={() => {
              handleStateChange({ 
                amount: selectedToken.balance,
                error: '' 
              });
            }}
            token={selectedToken}
          />

          {/* Password Confirmation */}
          <FormField
            label="Confirm Password"
            type="password"
            value={password}
            onChange={(e) => {
              handleStateChange({ 
                password: e.target.value,
                error: '' 
              });
            }}
            placeholder="Enter your password to confirm"
          />

          {/* Error Display */}
          {error && <SecurityNotice type="error">{error}</SecurityNotice>}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !amount || !toAddress || !password}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              `Send ${selectedToken?.symbol}`
            )}
          </Button>
        </form>
      </Card>

      {/* Security Notice */}
      <SecurityNotice type="warning" title="Transaction Security">
        <ul className="space-y-1 text-sm">
          <li>• Always verify the recipient's address before sending</li>
          <li>• Transactions cannot be reversed once confirmed</li>
          <li>• Make sure you have enough ETH for gas fees</li>
          <li>• Enter your password to confirm the transaction</li>
        </ul>
      </SecurityNotice>
    </div>
  );
}