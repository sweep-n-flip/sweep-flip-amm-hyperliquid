'use client'

import { useCallback, useEffect, useState } from 'react'

export interface TrendingCollectionData {
  rank: number
  collection: {
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
  liquidityPools: {
    icons: string[]
    hasAddButton?: boolean
    poolCount: number
  }
  floor: {
    value: string
    currency: string
    priceInUsd?: number
  }
  floorChange: string
  volume: {
    value: string
    currency: string
    volumeInUsd?: number
  }
  volumeChange: string
  items: string
  marketStats: {
    totalSupply: number
    ownersCount: number
    listedCount: number
  }
  updatedAt: string
}

export interface TrendingCollectionsResponse {
  success: boolean
  data: TrendingCollectionData[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalDocs: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface UseTrendingCollectionsOptions {
  page?: number
  limit?: number
  chainId?: string | number
  sortBy?: 'volume24h' | 'volume7d' | 'volume30d' | 'floorPrice' | 'floorChange' | 'volumeChange' | 'items' | 'liquidityCount'
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface UseTrendingCollectionsState {
  data: TrendingCollectionData[]
  loading: boolean
  error: string | null
  pagination: TrendingCollectionsResponse['pagination'] | null
  refresh: () => Promise<void>
  hasMore: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_COCKPIT_API_URL

export function useTrendingCollections(options: UseTrendingCollectionsOptions = {}): UseTrendingCollectionsState {
  const {
    page = 1,
    limit = 10,
    chainId = 'all',
    sortBy = 'volume24h',
    sortOrder = 'desc',
    search = '',
  } = options

  const [data, setData] = useState<TrendingCollectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<TrendingCollectionsResponse['pagination'] | null>(null)

  const fetchCollections = useCallback(async () => {
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

      const response = await fetch(`${API_BASE_URL}/api/trending-collections/?${params}`, {
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

      const result: TrendingCollectionsResponse = await response.json()

      if (!result.success) {
        throw new Error('Failed to fetch trending collections')
      }

      setData(result.data)
      setPagination(result.pagination)
    } catch (err) {
      console.error('Error fetching trending collections:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [page, limit, chainId, sortBy, sortOrder, search])

  const refresh = useCallback(async () => {
    await fetchCollections()
  }, [fetchCollections])

  // Initial fetch
  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

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
