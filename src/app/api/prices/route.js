import { NextResponse } from 'next/server';
import { SUPPORTED_TOKENS } from '@/lib/constants/tokens';

/**
 * Base URL for the CoinGecko API.
 */
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

/**
 * Duration for caching API responses (5 minutes).
 */
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * In-memory cache for storing API responses to reduce redundant requests.
 * Keys are action-tokenId pairs, and values contain timestamped data.
 */
const cache = {};

/**
 * Fetches data from a given URL with retry logic.
 * Retries up to a specified number of times before failing.
 *
 * @param {string} url - The API endpoint to fetch data from.
 * @param {number} [retries=2] - Number of retry attempts before throwing an error.
 * @returns {Promise<Object>} - The parsed JSON response from the API.
 * @throws {Error} - Throws an error if all attempts fail.
 */
async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ETH Wallet Hub'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

/**
 * Handles incoming GET requests to fetch cryptocurrency price data.
 * Supports fetching all supported token prices, specific token details, or historical market data.
 *
 * @param {Request} request - The incoming HTTP request containing query parameters.
 * @returns {Promise<Response>} - The response containing JSON data.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // Generate a cache key based on action and token ID
    const cacheKey = `${action || 'all'}-${id || 'prices'}`;
    
    // Return cached data if available and not expired
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
      return NextResponse.json(cache[cacheKey].data);
    }

    // Fetch prices for all supported tokens if no specific action or token ID is provided
    if (!action && !id) {
      const ids = SUPPORTED_TOKENS.map(token => token.id).join(',');
      const data = await fetchWithRetry(
        `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24h_change=true`
      );

      // Transform response data
      const transformedData = {};
      Object.entries(data).forEach(([tokenId, prices]) => {
        transformedData[tokenId] = {
          usd: prices.usd,
          usd_24h_change: prices.usd_24h_change,
          lastUpdate: Date.now()
        };
      });

      // Store in cache and return response
      cache[cacheKey] = { timestamp: Date.now(), data: transformedData };
      return NextResponse.json(transformedData);
    }

    // Handle requests for specific tokens
    if (!id) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    // Determine API endpoint based on requested action
    const days = searchParams.get('days') || '1';
    const apiUrl = action === 'history' 
      ? `${COINGECKO_API}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
      : `${COINGECKO_API}/coins/${id}?localization=false&market_data=true`;

    // Fetch data from CoinGecko API
    const data = await fetchWithRetry(apiUrl);
    
    // Store in cache and return response
    cache[cacheKey] = { timestamp: Date.now(), data };
    return NextResponse.json(data);

  } catch (error) {
    console.error('API error:', error);

    // Return cached data if available as a fallback
    const cacheKey = `all-prices`;
    if (cache[cacheKey]) {
      return NextResponse.json(cache[cacheKey].data);
    }

    // Generate fallback data with default values for all supported tokens
    const fallbackData = SUPPORTED_TOKENS.reduce((acc, token) => {
      acc[token.id] = { usd: 0, usd_24h_change: 0, lastUpdate: Date.now() };
      return acc;
    }, {});
    
    return NextResponse.json(fallbackData);
  }
}
