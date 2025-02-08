// src/app/api/eth-proxy/route.js
import { NextResponse } from 'next/server';

const RPC_URLS = [
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com',
  'https://rpc.ankr.com/eth',
  'https://ethereum.publicnode.com'
];

export async function POST(request) {
  let lastError;

  try {
    const body = await request.json();

    // Try each RPC endpoint until one works
    for (const rpcUrl of RPC_URLS) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: body.id || Date.now(),
            method: body.method,
            params: body.params || []
          })
        });

        if (!response.ok) {
          lastError = new Error(`HTTP error! status: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.error) {
          lastError = new Error(data.error.message || 'RPC error');
          continue;
        }

        return NextResponse.json(data);
      } catch (error) {
        console.error(`Failed to fetch from ${rpcUrl}:`, error);
        lastError = error;
      }
    }

    throw lastError || new Error('All RPC endpoints failed');
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      },
      { status: 500 }
    );
  }
}