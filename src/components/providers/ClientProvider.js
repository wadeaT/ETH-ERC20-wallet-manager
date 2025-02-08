// src/app/ClientProvider.js
'use client'


/**
 * ClientProvider component that initializes and provides a React Query client to its child components.
 * This setup allows for efficient state management of server-state in React applications using React Query.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function ClientProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}