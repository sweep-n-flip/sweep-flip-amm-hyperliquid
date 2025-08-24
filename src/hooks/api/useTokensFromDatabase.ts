'use client'

import { useCallback, useEffect, useState } from 'react'

export interface TokenData {
  _id: string
  address: string
  name: string
  symbol: string
  decimals?: number
  logo?: string
  nativeChain: number | string
  isErc20: boolean
  isCollection: boolean
  tokenIds?: string[]
  collection: {
    id: string
    name: string
    symbol: string
    address: string
    logo?: string
    banner?: string
  }
  wrapper?: {
    id: string
    name: string
    symbol: string
    isErc20: boolean
    isCollection: boolean
    address: string
  }
  createdAt: string
  updatedAt: string
}

export interface TokensResponse {
  success: boolean
  data: TokenData[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalDocs: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface UseTokensOptions {
  page?: number
  limit?: number
  search?: string
  chainId?: number | string
  isErc20?: boolean
  isCollection?: boolean
  tokenAddress?: string
  tokenName?: string
  tokenSymbol?: string
}

export interface UseTokensState {
  tokens: TokenData[]
  loading: boolean
  error: string | null
  pagination: TokensResponse['pagination'] | null
  refresh: () => Promise<void>
  getTokenByAddress: (address: string) => TokenData | undefined
  getTokensByChain: (chainId: number) => TokenData[]
  getErc20Tokens: () => TokenData[]
  getCollectionTokens: () => TokenData[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_COCKPIT_API_URL

export function useTokensFromDatabase(options: UseTokensOptions = {}): UseTokensState {
  const {
    page = 1,
    limit = 20,
    search = '',
    chainId,
    isErc20,
    isCollection,
    tokenAddress,
    tokenName,
    tokenSymbol,
  } = options

  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<TokensResponse['pagination'] | null>(null)

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      if (page) params.append('page', page.toString())
      if (limit) params.append('limit', limit.toString())
      if (search) params.append('search', search)
      if (chainId) params.append('chainId', chainId.toString())
      if (isErc20 !== undefined) params.append('isErc20', isErc20.toString())
      if (isCollection !== undefined) params.append('isCollection', isCollection.toString())
      if (tokenAddress) params.append('tokenAddress', tokenAddress)
      if (tokenName) params.append('tokenName', tokenName)
      if (tokenSymbol) params.append('tokenSymbol', tokenSymbol)

      const url = `${API_BASE_URL}/api/tokens/?${params}`;

      const response = await fetch(url, {
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

      const result: TokensResponse = await response.json()

      if (!result.success) {
        throw new Error('Failed to fetch tokens')
      }

      setTokens(result.data)
      setPagination(result.pagination)
    } catch (err) {
      console.error('Error fetching tokens:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, chainId, isErc20, isCollection, tokenAddress, tokenName, tokenSymbol])

  const refresh = useCallback(async () => {
    await fetchTokens()
  }, [fetchTokens])

  const getTokenByAddress = useCallback((address: string): TokenData | undefined => {
    return tokens.find((token: TokenData) => token.address.toLowerCase() === address.toLowerCase())
  }, [tokens])

  const getTokensByChain = useCallback((chainId: number): TokenData[] => {
    return tokens.filter((token: TokenData) => token.nativeChain === chainId)
  }, [tokens])

  const getErc20Tokens = useCallback((): TokenData[] => {
    return tokens.filter((token: TokenData) => token.isErc20)
  }, [tokens])

  const getCollectionTokens = useCallback((): TokenData[] => {
    return tokens.filter((token: TokenData) => token.isCollection)
  }, [tokens])

  // Initial fetch
  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  return {
    tokens,
    loading,
    error,
    pagination,
    refresh,
    getTokenByAddress,
    getTokensByChain,
    getErc20Tokens,
    getCollectionTokens,
  }
}
