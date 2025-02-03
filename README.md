# ETH Wallet Hub

ETH Wallet Hub is a modern, secure Ethereum wallet management application built with Next.js. It provides a user-friendly interface for managing Ethereum and ERC-20 tokens with real-time price tracking and portfolio management.

## Features

- **Secure Wallet Management**: Create, restore, and manage Ethereum wallets with industry-standard security
- **Real-time Token Tracking**: Live price updates and portfolio tracking for major ERC-20 tokens
- **Transaction Management**: Send, receive, and track transaction history
- **Portfolio Analytics**: Visual representation of your portfolio performance
- **Multi-token Support**: Support for ETH and ERC-20 tokens
- **Responsive Design**: Fully responsive interface that works on desktop and mobile devices

## Technology Stack

- Next.js 15
- React 18
- Ethers.js 6
- Firebase (Authentication & Firestore)
- TailwindCSS
- Framer Motion
- Recharts

## Getting Started

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/eth-wallet-hub.git
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:
    Create a `.env.local` file with the following variables:
    ```bash
    NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key
    NEXT_PUBLIC_MAINNET_RPC_URL=your_ethereum_node_url
    NEXT_PUBLIC_MORALIS_API_KEY=your_moralis_key
    ```

4. Run the development server:
    ```bash
    npm run dev
    ```

## License

This project is licensed under the MIT License.
