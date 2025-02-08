// src/app/dashboard/history/page.js
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { TransactionFilters } from '@/components/features/transaction/TransactionFilters';
import { TransactionTable } from '@/components/features/transaction/TransactionTable';
import { formatTransactions } from '@/lib/services/transactionService';
import { SecurityNotice } from '@/components/common/SecurityNotice';
import { Inbox } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const API_BASE_URL = 'https://api.etherscan.io/api';

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export default function HistoryPage() {
  const { address, loading: walletLoading } = useWallet();
  const [state, setState] = useState({
    transactions: [],
    loading: true,
    error: null,
    searchQuery: '',
    filterType: 'all',
    showFilter: false
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Prepare API URLs
        const normalTxUrl = `${API_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
        const tokenTxUrl = `${API_BASE_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

        console.log('Fetching transactions for address:', address);

        // Fetch transactions with retry logic
        const [normalData, tokenData] = await Promise.all([
          fetchWithRetry(normalTxUrl),
          fetchWithRetry(tokenTxUrl)
        ]);

        console.log('API Response:', { 
          normal: { status: normalData.status, message: normalData.message },
          token: { status: tokenData.status, message: tokenData.message }
        });

        // Handle API errors or no transactions
        if (normalData.status === '0' && normalData.message === 'No transactions found') {
          normalData.result = [];
        }
        if (tokenData.status === '0' && tokenData.message === 'No transactions found') {
          tokenData.result = [];
        }

        // Check for other API errors
        if (normalData.status === '0' && normalData.message !== 'No transactions found' ||
            tokenData.status === '0' && tokenData.message !== 'No transactions found') {
          throw new Error(normalData.message || tokenData.message || 'API Error');
        }

        // Process transactions
        const normalTxs = Array.isArray(normalData.result) ? normalData.result : [];
        const tokenTxs = Array.isArray(tokenData.result) ? tokenData.result : [];

        const allTransactions = formatTransactions(
          [...normalTxs, ...tokenTxs],
          address
        ).sort((a, b) => b.date - a.date);

        console.log(`Found ${allTransactions.length} transactions`);

        setState(prev => ({
          ...prev,
          transactions: allTransactions,
          loading: false,
          error: null
        }));
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to load transaction history. Please try again later.',
          loading: false
        }));
      }
    };

    fetchTransactions();
  }, [address]);

  const { transactions, loading, error, searchQuery, filterType, showFilter } = state;

  // Filter transactions based on search query and filter type
  const filteredTransactions = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (!searchQuery) return true;
    
    const search = searchQuery.toLowerCase();
    return (
      tx.hash.toLowerCase().includes(search) ||
      tx.from.toLowerCase().includes(search) ||
      tx.to.toLowerCase().includes(search) ||
      tx.token.toLowerCase().includes(search)
    );
  });

  if (walletLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!address) {
    return (
      <Card className="p-8 bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Wallet Not Connected</h3>
          <p className="text-muted-foreground">
            Please connect your wallet to view transaction history.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
        
        {transactions.length > 0 && (
          <TransactionFilters
            searchQuery={searchQuery}
            onSearchChange={(value) => setState(prev => ({ 
              ...prev, 
              searchQuery: value 
            }))}
            filterType={filterType}
            onFilterChange={(value) => setState(prev => ({ 
              ...prev, 
              filterType: value,
              showFilter: false
            }))}
            showFilter={showFilter}
            onToggleFilter={() => setState(prev => ({ 
              ...prev, 
              showFilter: !prev.showFilter 
            }))}
          />
        )}
      </div>

      {error && <SecurityNotice type="error">{error}</SecurityNotice>}

      {!error && (!transactions.length || !filteredTransactions.length) ? (
        <Card className="p-8 bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
            <p className="text-muted-foreground max-w-sm">
              {!transactions.length 
                ? "You haven't made any transactions yet. Your transaction history will appear here."
                : "No transactions match your current filters. Try adjusting your search criteria."}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-4 text-muted-foreground font-medium">Type</th>
                  <th className="p-4 text-muted-foreground font-medium">Token</th>
                  <th className="p-4 text-muted-foreground font-medium">Amount</th>
                  <th className="p-4 text-muted-foreground font-medium">From</th>
                  <th className="p-4 text-muted-foreground font-medium">To</th>
                  <th className="p-4 text-muted-foreground font-medium">Date</th>
                  <th className="p-4 text-muted-foreground font-medium">Status</th>
                  <th className="p-4 text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <TransactionTable transactions={filteredTransactions} />
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}