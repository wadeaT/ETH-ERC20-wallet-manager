// src/app/layout.js
import { Inter } from "next/font/google";
import '@/themeStyle/globals.css';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import  ClientProviders  from '@/components/providers/ClientProviders';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-inter",
});

export const metadata = {
  title: "ETH Wallet Hub",
  description: "Manage your Ethereum wallet",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable} suppressHydrationWarning>
        <ErrorBoundary>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}