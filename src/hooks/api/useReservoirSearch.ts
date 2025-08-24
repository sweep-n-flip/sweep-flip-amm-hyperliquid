import { ReservoirService } from '@/services/ReservoirService'
import { useCallback, useState } from 'react'
import { type TokenData } from './useTokensFromDatabase'

interface ReservoirSearchResult {
  results: TokenData[]
  loading: boolean
  error: string | null
  hasMore: boolean
  continuation?: string
}

export function useReservoirSearch(chainId: number) {
  const [searchResults, setSearchResults] = useState<ReservoirSearchResult>({
    results: [],
    loading: false,
    error: null,
    hasMore: false,
  })

  const search = useCallback(async (searchTerm: string, reset = true) => {
    if (!searchTerm.trim()) {
      setSearchResults({
        results: [],
        loading: false,
        error: null,
        hasMore: false,
      })
      return
    }

    // Check if chainId is supported
    if (!ReservoirService.isChainSupported(chainId)) {
      console.warn(`⚠️ Reservoir API not supported for chain ID ${chainId}, skipping search`)
      setSearchResults({
        results: [],
        loading: false,
        error: `Search not available for this network (Chain ID: ${chainId})`,
        hasMore: false,
      })
      return
    }

    try {
      if (reset) {
        setSearchResults(prev => ({ ...prev, loading: true, error: null }))
      }

      console.log('🔍 Searching Reservoir for:', searchTerm, 'on chain:', chainId)

      // Call Reservoir API to search collections
      const response = await ReservoirService.searchCollections(
        chainId,
        searchTerm,
        20, // limit
        reset ? undefined : searchResults.continuation
      )

      // Transform Reservoir response to TokenData format
      const transformedResults: TokenData[] = response.collections.map((collection: any) => ({
        _id: collection.id,
        address: collection.contractAddress,
        name: collection.name,
        symbol: collection.symbol,
        logo: collection.imageUrl,
        nativeChain: chainId,
        isErc20: false,
        isCollection: true,
        collection: {
          id: collection.id,
          name: collection.name,
          symbol: collection.symbol,
          address: collection.contractAddress,
          logo: collection.imageUrl,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add metadata from Reservoir if available
        floorPrice: collection.floorPrice,
        volume24h: collection.volume24h,
      }) as TokenData)

      setSearchResults({
        results: reset ? transformedResults : [...searchResults.results, ...transformedResults],
        loading: false,
        error: null,
        hasMore: !!response.continuation,
        continuation: response.continuation,
      })

    } catch (error) {
      console.error('❌ Error searching Reservoir collections:', error)
      setSearchResults(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }))
    }
  }, [chainId, searchResults.continuation, searchResults.results])

  const loadMore = useCallback(() => {
    // This will be called by the infinite scroll
    // We'll pass the search term from the component
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults({
      results: [],
      loading: false,
      error: null,
      hasMore: false,
    })
  }, [])

  return {
    ...searchResults,
    search,
    loadMore,
    clearSearch,
  }
}
