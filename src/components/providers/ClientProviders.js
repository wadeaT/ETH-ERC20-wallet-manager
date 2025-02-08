// src/components/ClientProviders.js
'use client';

/**
 * ClientProviders component wraps its child components with necessary context providers.
 * It includes ThemeProvider for theming support and ToastProvider for displaying notifications.
 */

import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from '@/components/common/Toast';
export default function ClientProviders({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}