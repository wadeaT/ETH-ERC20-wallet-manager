// src/lib/services/coingeckoService.js
import { COINGECKO_IDS, PRICE_REFERENCES } from '@/lib/constants/coingecko-ids';

export async function getTokenPriceHistory(symbol, days = 1) {
  try {
    // Check if this token's price follows another token
    const referenceSymbol = PRICE_REFERENCES[symbol] || symbol;
    const coingeckoId = COINGECKO_IDS[referenceSymbol];

    if (!coingeckoId) {
      console.warn(`No CoinGecko ID found for token: ${symbol}`);
      return [];
    }

    const response = await fetch(
      `/api/prices?action=history&id=${coingeckoId}&days=${days}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new TypeError("Received non-JSON response");
    }
    
    const data = await response.json();
    
    if (!data.prices || !Array.isArray(data.prices)) {
      console.warn(`Invalid price data for token: ${symbol}`);
      return [];
    }

    return data.prices.map(([timestamp, price]) => ({
      time: timestamp,
      price: price
    }));
    
  } catch (error) {
    console.error(`Error fetching ${symbol} price history:`, error);
    return [];
  }
}

export async function getTokenMarketData(symbol) {
  try {
    // Check if this token's price follows another token
    const referenceSymbol = PRICE_REFERENCES[symbol] || symbol;
    const coingeckoId = COINGECKO_IDS[referenceSymbol];

    if (!coingeckoId) {
      console.warn(`No CoinGecko ID found for token: ${symbol}`);
      return null;
    }

    const response = await fetch(
      `/api/prices?action=market&id=${coingeckoId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new TypeError("Received non-JSON response");
    }
    
    const data = await response.json();
    
    // If this token follows another token's price, adjust the name and symbol
    if (PRICE_REFERENCES[symbol]) {
      data.name = symbol;
      data.symbol = symbol.toLowerCase();
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${symbol} market data:`, error);
    return null;
  }
}