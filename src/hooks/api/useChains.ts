'use client'

import { useCallback, useEffect, useState } from 'react'

export interface ChainData {
  _id: string
  chainId: number | string
  name: string
  symbol?: string
  logo: string
  enabled?: boolean
  isTestnet?: boolean
  rpcAddress?: string
  explorerUrl?: string
  factoryAddress?: string
  routerAddress?: string
  initCodeHash?: string
  network?: {
    token?: {
      symbol: string
      decimals: number
      address: string
      wrappedAddress?: string
      stableTokenAddress?: string
    }
  }
}

export interface ChainsResponse {
  success: boolean
  data: ChainData[]
}

export interface UseChainsState {
  chains: ChainData[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getChainById: (chainId: number) => ChainData | undefined
  getChainBySymbol: (symbol: string) => ChainData | undefined
}

const API_BASE_URL = process.env.NEXT_PUBLIC_COCKPIT_API_URL

export function useChains(): UseChainsState {
  const [chains, setChains] = useState<ChainData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChains = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Remove isTestnet parameter since it's not defined
      const params = new URLSearchParams()

      const response = await fetch(`${API_BASE_URL}/api/chains/?${params}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ChainsResponse = await response.json()

      if (!result.success) {
        throw new Error('Failed to fetch chains')
      }

      // Filter chains - only enabled ones, or if enabled field doesn't exist, include all non-testnet chains
      setChains(result.data.filter(chain => 
        chain.enabled !== false && !chain.isTestnet
      ))
    } catch (err) {
      console.error('Error fetching chains:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await fetchChains()
  }, [fetchChains])

  const getChainById = useCallback((chainId: number): ChainData | undefined => {
    return chains.find(chain => chain.chainId === chainId)
  }, [chains])

  const getChainBySymbol = useCallback((symbol: string): ChainData | undefined => {
    return chains.find(chain => chain.symbol && chain.symbol.toLowerCase() === symbol.toLowerCase())
  }, [chains])

  // Initial fetch
  useEffect(() => {
    fetchChains()
  }, [fetchChains])

  return {
    chains,
    loading,
    error,
    refresh,
    getChainById,
    getChainBySymbol,
  }
}