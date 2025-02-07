import { useState, useEffect } from 'react';
import { priceWs } from '@/lib/services/priceWebSocket';

export function useTokenPrices() {
  const [state, setState] = useState({
    prices: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/prices');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setState({
          prices: data,
          loading: false,
          error: null
        });

        // Subscribe to WebSocket updates for each token
        Object.keys(data).forEach(tokenId => {
          const token = data[tokenId];
          if (token.binanceSymbol) {
            const unsubscribe = priceWs.subscribe(token.binanceSymbol, priceData => {
              setState(prev => ({
                ...prev,
                prices: {
                  ...prev.prices,
                  [tokenId]: {
                    usd: priceData.price,
                    usd_24h_change: priceData.priceChange,
                    lastUpdate: priceData.timestamp
                  }
                }
              }));
            });
            return unsubscribe;
          }
        });
      } catch (error) {
        console.error('Price fetch error:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchPrices();
  }, []);

  return state;
}