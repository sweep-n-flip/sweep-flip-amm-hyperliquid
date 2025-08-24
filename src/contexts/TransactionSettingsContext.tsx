// AIDEV-NOTE: Context for transaction settings to ensure global reactivity
'use client';

import { useTransactionSettings } from '@/hooks/useTransactionSettings';
import React, { createContext, ReactNode, useContext } from 'react';

interface TransactionSettingsContextType {
  slippageTolerance: number;
  transactionDeadline: number;
  setSlippageTolerance: (value: number) => void;
  setTransactionDeadline: (value: number) => void;
  getSlippageDecimal: () => number;
  getSlippagePercentage: () => number;
  getDeadlineInMinutes: () => number;
  calculateMaxAmountIn: (expectedAmount: string | number) => number;
  calculateMinAmountOut: (expectedAmount: string | number) => number;
  getTransactionDeadline: () => number;
}

const TransactionSettingsContext = createContext<TransactionSettingsContextType | undefined>(undefined);

interface TransactionSettingsProviderProps {
  children: ReactNode;
}

export const TransactionSettingsProvider: React.FC<TransactionSettingsProviderProps> = ({ children }) => {
  const transactionSettings = useTransactionSettings();
  
  return (
    <TransactionSettingsContext.Provider value={transactionSettings}>
      {children}
    </TransactionSettingsContext.Provider>
  );
};

export const useTransactionSettingsContext = () => {
  const context = useContext(TransactionSettingsContext);
  if (context === undefined) {
    throw new Error('useTransactionSettingsContext must be used within a TransactionSettingsProvider');
  }
  return context;
};
