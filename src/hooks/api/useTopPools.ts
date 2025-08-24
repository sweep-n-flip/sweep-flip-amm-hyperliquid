'use client'

import { useCallback, useEffect, useState } from 'react'

export interface TopPoolData {
  rank: number
  collectionPool: {
    _id: string
    name: string
    image: string
    verified: boolean
    address: string
  }
  chain: {
    _id: string
    chainId: number
    name: string
    symbol: string
    icon: string
  }
  lp: {
    icons: string[]
    hasAddButton?: boolean
  }
  nftPrice: {
    value: string
    currency: string
  }
  listings: string
  ethOffers: {
    value: string
    currency: string
  }
  liquidity: string
  volume: string
  apy: string
  expandedData?: {
    subPools: {
      name: string;
      icons: string[];
      nftPrice: string;
      listings: string;
      ethOffers: string;
      liquidity: string;
      volume: string;
      apy: string;
    }[];
  }
}

export interface TopPoolsResponse {
  success: boolean
  data: TopPoolData[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalDocs: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface UseTopPoolsOptions {
  page?: number
  limit?: number
  chainId?: string | number
  sortBy?: 'poolStats.liquidity' | 'poolStats.apr' | 'poolStats.totalVolume'
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface UseTopPoolsState {
  data: TopPoolData[]
  loading: boolean
  error: string | null
  pagination: TopPoolsResponse['pagination'] | null
  refresh: () => Promise<void>
  hasMore: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_COCKPIT_API_URL

export function useTopPools(options: UseTopPoolsOptions = {}): UseTopPoolsState {
  const {
    page = 1,
    limit = 10,
    chainId = 'all',
    sortBy = 'poolStats.liquidity',
    sortOrder = 'desc',
    search = '',
  } = options

  const [data, setData] = useState<TopPoolData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<TopPoolsResponse['pagination'] | null>(null)

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        chainId: chainId.toString(),
        sortBy,
        sortOrder,
      })

      // Add search parameter if provided
      if (search && search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`${API_BASE_URL}/api/pools/?${params}`, {
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

      const result: TopPoolsResponse = await response.json()

      if (!result.success) {
        throw new Error('Failed to fetch pools')
      }

      setData(result.data)
      setPagination(result.pagination)
    } catch (err) {
      console.error('Error fetching top pools:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock data due to API error')
        setPagination({
          page: 1,
          limit: 10,
          totalPages: 1,
          totalDocs: 5,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }
    } finally {
      setLoading(false)
    }
  }, [page, limit, chainId, sortBy, sortOrder, search])

  const refresh = useCallback(async () => {
    await fetchPools()
  }, [fetchPools])

  // Initial fetch
  useEffect(() => {
    fetchPools()
  }, [fetchPools])

  const hasMore = pagination ? pagination.hasNextPage : false

  return {
    data,
    loading,
    error,
    pagination,
    refresh,
    hasMore,
  }
}

