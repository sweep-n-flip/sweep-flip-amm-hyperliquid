//  Centralized transaction settings hook similar to AMM legacy
import { useEffect, useState } from 'react'

export interface TransactionSettings {
  slippageTolerance: number // In basis points (100 = 1%)
  transactionDeadline: number // In seconds
}

export const useTransactionSettings = () => {
  const [slippageTolerance, setSlippageTolerance] = useState(100) // Default 1%
  const [transactionDeadline, setTransactionDeadline] = useState(1200) // Default 20 minutes
  const [isHydrated, setIsHydrated] = useState(false)

  //  Initialize values from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSlippage = localStorage.getItem('slippageTolerance')
      const savedDeadline = localStorage.getItem('transactionDeadline')
      
      if (savedSlippage) setSlippageTolerance(parseInt(savedSlippage))
      if (savedDeadline) setTransactionDeadline(parseInt(savedDeadline))
      
      setIsHydrated(true)
    }
  }, [])
  //  Persist to localStorage when values change (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('slippageTolerance', slippageTolerance.toString())
    }
  }, [slippageTolerance, isHydrated])

  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('transactionDeadline', transactionDeadline.toString())
    }
  }, [transactionDeadline, isHydrated])

  //  Helper functions for common calculations
  const getSlippageDecimal = () => slippageTolerance / 10000 // Convert basis points to decimal
  const getSlippagePercentage = () => slippageTolerance / 100 // Convert basis points to percentage
  const getDeadlineInMinutes = () => transactionDeadline / 60 // Convert seconds to minutes
  
  //  Calculate amounts with slippage protection
  const calculateMaxAmountIn = (expectedAmount: string | number) => {
    const amount = typeof expectedAmount === 'string' ? parseFloat(expectedAmount) : expectedAmount
    return amount * (1 + getSlippageDecimal())
  }
  
  const calculateMinAmountOut = (expectedAmount: string | number) => {
    const amount = typeof expectedAmount === 'string' ? parseFloat(expectedAmount) : expectedAmount
    return amount * (1 - getSlippageDecimal())
  }

  //  Get transaction deadline for contract calls
  const getTransactionDeadline = () => {
    return Math.floor(Date.now() / 1000) + transactionDeadline
  }

  //  Wrapper function to add logging
  const loggedSetSlippageTolerance = (value: number) => {
    console.log('[setSlippageTolerance] Setting new value:', value);
    setSlippageTolerance(value);
  };

  return {
    // Settings
    slippageTolerance,
    transactionDeadline,
    setSlippageTolerance: loggedSetSlippageTolerance,
    setTransactionDeadline,
    
    // Helper calculations
    getSlippageDecimal,
    getSlippagePercentage,
    getDeadlineInMinutes,
    calculateMaxAmountIn,
    calculateMinAmountOut,
    getTransactionDeadline,
  }
}
