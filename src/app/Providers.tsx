'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { WalletProvider } from '@/components/WalletProvider';
import { ChainProvider } from '@/contexts/ChainContext';
import { TransactionSettingsProvider } from '@/contexts/TransactionSettingsContext';
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChainProvider>
        <TransactionSettingsProvider>
          <WalletProvider>
            {children}
            <Toaster />
          </WalletProvider>
        </TransactionSettingsProvider>
      </ChainProvider>
    </QueryClientProvider>
  );
}