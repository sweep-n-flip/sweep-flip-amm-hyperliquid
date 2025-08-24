'use client'

import { ChainData, useChains } from '@/hooks/api/useChains'
import { createContext, useContext, useMemo, useState } from 'react'

interface ChainContextType {
  selectedChainId: number | string
  setSelectedChainId: (chainId: number | string) => void
  selectedChain: ChainData | undefined
  chains: ChainData[]
  loading: boolean
  error: string | null
}

const ChainContext = createContext<ChainContextType | undefined>(undefined)

export function useChainContext() {
  const context = useContext(ChainContext)
  if (!context) {
    throw new Error('useChainContext must be used within a ChainProvider')
  }
  return context
}

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const { chains: apiChains, loading, error } = useChains()
  const [selectedChainId, setSelectedChainId] = useState<number | string>(999)
  
  // Add Hyperliquid chain manually if not present in API
  const chains = useMemo(() => {
    const hasHyperliquid = apiChains.some(chain => chain.chainId === 999)
    
    if (!hasHyperliquid) {
      // Add Hyperliquid chain manually
      const hyperliquidChain: ChainData = {
        _id: 'hyperliquid-999',
        chainId: 999,
        name: 'Hyperliquid',
        symbol: 'HYPE',
        logo: 'https://app.hyperliquid.xyz/favicon.ico',
        enabled: true,
        isTestnet: false,
        rpcAddress: 'https://rpc.hyperliquid.xyz/evm',
        explorerUrl: 'https://app.hyperliquid.xyz/explorer',
        network: {
          token: {
            symbol: 'HYPE',
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
          }
        }
      }
      
      return [...apiChains, hyperliquidChain]
    }
    
    return apiChains
  }, [apiChains])
  
  const selectedChain = useMemo(() => 
    chains.find(chain => chain.chainId === selectedChainId), 
    [chains, selectedChainId]
  )
  
  const contextValue = useMemo(() => ({
    selectedChainId,
    setSelectedChainId,
    selectedChain,
    chains,
    loading,
    error
  }), [selectedChainId, selectedChain, chains, loading, error])
  
  return (
    <ChainContext.Provider value={contextValue}>
      {children}
    </ChainContext.Provider>
  )
}
