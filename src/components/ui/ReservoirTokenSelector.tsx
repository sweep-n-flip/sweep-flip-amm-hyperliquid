'use client'

import { useReservoirSearch } from '@/hooks/api/useReservoirSearch'
import { type TokenData } from '@/hooks/api/useTokensFromDatabase'
import { usePrioritizedCollections } from '@/hooks/wallet/usePrioritizedCollections'
import { HyperliquidCollectionsService } from '@/services/HyperliquidCollections'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from './dialog'

interface ReservoirTokenSelectorProps {
  children: React.ReactNode
  onSelect: (token: TokenData) => void
  selectedToken?: TokenData
  collections: TokenData[]
  existingPools?: TokenData[] // Collections that already have pools
  loading?: boolean
  title?: string
  chainId?: number // Make chainId optional with fallback
  // Pagination props
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
}

interface TokenListItemProps {
  token: TokenData
  isSelected: boolean
  onSelect: (token: TokenData) => void
}

const TokenListItem = ({ token, onSelect }: TokenListItemProps) => {
  // Extract additional metadata if available
  const floorPrice = (token as any).floorPrice;
  const volume24h = (token as any).volume24h;
  const userTokenCount = (token as any).userTokenCount;
  
  // Get symbol and handle long contract addresses
  const symbol = token.collection?.symbol || token.symbol || 'NFT';
  const displaySymbol = symbol.length > 15 ? `${symbol.slice(0, 12)}...` : symbol;
  
  return (
    <div
      className="flex items-center gap-2 p-2 w-full cursor-pointer hover:bg-gray-50 transition-colors rounded-lg min-h-[48px] max-h-[64px]"
      onClick={() => onSelect(token)}
    >
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Image
          src={token.logo || 'https://assets.relay.link/icons/1/light.png'}
          alt={token.name}
          width={32}
          height={32}
          className="object-cover"
        />
      </div>
      
      <div className="flex-1 flex flex-col items-start min-w-0 overflow-hidden">
        <div className="flex items-center gap-1">
          <div 
            className="text-sm font-semibold text-[#434343] leading-[17px] truncate"
            title={symbol} // Show full symbol on hover
          >
            {displaySymbol}
          </div>
          {userTokenCount && userTokenCount > 0 && (
            <div className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
              {userTokenCount}
            </div>
          )}
        </div>
        <div className="text-xs font-normal text-[#8C8C8C] leading-[16px] truncate w-full">
          {token.name}
        </div>
      </div>
      
      <div className="text-xs text-[#8C8C8C] leading-[16px] flex-shrink-0">
        NFT
      </div>
    </div>
  )
}

export function ReservoirTokenSelector({
  children,
  onSelect,
  selectedToken,
  collections,
  existingPools = [],
  loading = false,
  title = "Select NFT Collection",
  chainId = 1, // Default to Ethereum mainnet
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}: ReservoirTokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Check if we're on Hyperliquid chain
  const isHyperliquidChain = HyperliquidCollectionsService.isHyperliquidChain(chainId)

  // Use Reservoir search hook with fallback chainId (only if not Hyperliquid)
  const reservoirSearch = useReservoirSearch(isHyperliquidChain ? 1 : chainId) // Use Ethereum as fallback for Hyperliquid

  // Get Hyperliquid collections if on that chain
  const hyperliquidCollections = useMemo(() => {
    return isHyperliquidChain ? HyperliquidCollectionsService.getCollections() : []
  }, [isHyperliquidChain])

  // Merge collections: use Hyperliquid list if on that chain, otherwise use provided collections
  const allCollections = useMemo(() => {
    return isHyperliquidChain ? hyperliquidCollections : collections
  }, [isHyperliquidChain, hyperliquidCollections, collections])

  // Get prioritized collections (user-owned first)
  const {
    prioritizedCollections,
    userCollections,
    defaultSelectedCollection,
    loading: prioritizedLoading
  } = usePrioritizedCollections({
    allCollections: allCollections, // Use merged collections
    existingPools
  })
  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // AIDEV-NOTE: Auto-select removed to prevent infinite loops
  // Auto-selection will be handled by parent component instead

  // Handle search with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    // If search is cleared, clear any search results
    if (!value.trim()) {
      if (!isHyperliquidChain) {
        reservoirSearch.clearSearch()
      }
      return
    }

    // For Hyperliquid, we don't need to debounce since it's a local search
    if (isHyperliquidChain) {
      // Search will be handled in displayCollections useMemo
      return
    }

    // Debounce search by 500ms for Reservoir
    const timeout = setTimeout(() => {
      reservoirSearch.search(value.trim())
    }, 500)
    
    setSearchTimeout(timeout)
  }, [searchTimeout, reservoirSearch, isHyperliquidChain])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Determine which collections to show
  const displayCollections = useMemo(() => {
    if (searchTerm.trim()) {
      if (isHyperliquidChain) {
        // Use local search for Hyperliquid collections
        return HyperliquidCollectionsService.searchCollections(searchTerm.trim())
      } else {
        // Show Reservoir search results when searching
        return reservoirSearch.results
      }
    } else {
      // Show prioritized collections when not searching (user-owned first)
      return prioritizedCollections
    }
  }, [searchTerm, isHyperliquidChain, reservoirSearch.results, prioritizedCollections])

  // Determine loading state
  const isLoading = searchTerm.trim() 
    ? (isHyperliquidChain ? false : reservoirSearch.loading) // Hyperliquid search is instant
    : (loading || prioritizedLoading)

  // Determine if has more items (Hyperliquid collections are all loaded at once)
  const hasMoreItems = isHyperliquidChain ? false : (searchTerm.trim() ? reservoirSearch.hasMore : hasMore)

  // Determine if loading more (not applicable for Hyperliquid)
  const isLoadingMore = isHyperliquidChain ? false : (searchTerm.trim() ? false : loadingMore)

  // Handle scroll for infinite loading with Intersection Observer
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Cleanup observer when modal closes
  useEffect(() => {
    if (!open) {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [open])

  useEffect(() => {
    if (!isMounted || !hasMoreItems || !open) {
      return
    }

    // For search results, we don't need infinite scroll yet (can be added later)
    if (searchTerm.trim()) {
      return
    }

    // Only setup observer for initial collections
    if (!onLoadMore) {
      return
    }

    // Add a small delay to ensure DOM is ready
    const setupObserver = () => {
      const triggerElement = loadMoreTriggerRef.current
      const scrollContainer = scrollContainerRef.current
      
      if (!triggerElement || !scrollContainer) {
        return null
      }

      // Clean up existing observer
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          
          if (entry.isIntersecting && hasMoreItems && !isLoadingMore && onLoadMore) {
            onLoadMore()
          }
        },
        {
          root: scrollContainer,
          threshold: 0.1,
          rootMargin: '50px',
        }
      )

      observer.observe(triggerElement)
      observerRef.current = observer
      
      return observer
    }

    // Setup observer immediately
    let observer = setupObserver()
    
    // If setup failed, try again after a short delay
    if (!observer) {
      const timeout = setTimeout(() => {
        observer = setupObserver()
      }, 100)
      
      return () => {
        clearTimeout(timeout)
        if (observerRef.current) {
          observerRef.current.disconnect()
          observerRef.current = null
        }
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [isMounted, onLoadMore, hasMoreItems, isLoadingMore, displayCollections.length, open, searchTerm])

  // Legacy scroll handler as fallback
  const handleScroll = useCallback(() => {
    if (!isMounted) return
    
    if (!scrollContainerRef.current) {
      return;
    }
    
    if (!onLoadMore) {
      return;
    }
    
    if (!hasMoreItems) {
      return;
    }
    
    if (isLoadingMore) {
      return;
    }

    // Skip scroll handler during search
    if (searchTerm.trim()) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // Reduced threshold
    
    // Trigger load more when user is near the bottom (within 50px)
    if (isNearBottom) {
      onLoadMore()
    }
  }, [isMounted, onLoadMore, hasMoreItems, isLoadingMore, searchTerm])

  // Add scroll event listener as fallback
  useEffect(() => {
    if (!isMounted) return

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [handleScroll, isMounted])

  const handleSelect = (token: TokenData) => {
    onSelect(token)
    setOpen(false)
    setSearchTerm('')
    // Clear search results when closing (only for Reservoir)
    if (!isHyperliquidChain) {
      reservoirSearch.clearSearch()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <div className="flex flex-col h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <DialogTitle className="text-lg font-semibold">
              {title}
            </DialogTitle>   
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={isHyperliquidChain 
                  ? "Search Hyperliquid collections by name, symbol, or contract address..."
                  : "Search collections by name, symbol, or contract address..."
                }
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Collections List */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4"
            style={{ maxWidth: '100%' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  {searchTerm.trim() 
                    ? (isHyperliquidChain ? 'Searching Hyperliquid collections...' : 'Searching Reservoir...') 
                    : (isHyperliquidChain ? 'Loading Hyperliquid collections...' : 'Loading collections from Reservoir...')
                  }
                </span>
              </div>
            ) : displayCollections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-gray-500 mb-2">
                  {searchTerm ? 'No collections found' : 'No NFT collections available'}
                </div>
                <div className="text-xs text-gray-400">
                  {searchTerm 
                    ? 'Try searching by collection name, symbol, or contract address' 
                    : (isHyperliquidChain 
                        ? 'Connect your wallet to see your Hyperliquid NFT collections'
                        : 'Connect your wallet to see your NFT collections'
                      )
                  }
                </div>
                {!isHyperliquidChain && reservoirSearch.error && (
                  <div className="text-xs text-red-500 mt-2">
                    Error: {reservoirSearch.error}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  {displayCollections.map((token) => (
                    <TokenListItem
                      key={token.address}
                      token={token}
                      isSelected={selectedToken?.address === token.address}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
                
                {/* Intersection Observer trigger element - only for initial collections */}
                {hasMoreItems && !isLoading && !searchTerm.trim() && (
                    <div 
                    ref={loadMoreTriggerRef} 
                    className="h-10 flex items-center justify-center mt-2 bg-transparent"
                    style={{ 
                      minHeight: '40px',
                      visibility: 'visible',
                      opacity: 1
                    }}
                    >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading more collections...</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                      Scroll to load more
                      </div>
                    )}
                    </div>
                  )}
                  
                  {/* End of collections message */}
                  {!hasMoreItems && displayCollections.length > 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      {searchTerm.trim() 
                        ? 'End of search results' 
                        : 'All collections loaded'
                      }
                    </div>
                  )}
                  
                  {/* Legacy load more indicator (fallback) */}
                {isLoadingMore && !hasMoreItems && !searchTerm.trim() && (
                  <div className="flex items-center justify-center py-4 mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading more collections...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
