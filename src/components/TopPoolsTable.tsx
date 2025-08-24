'use client';

import { useChains } from "@/hooks/api/useChains";
import { useTopPools, type TopPoolData } from "@/hooks/api/useTopPools";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SortableTableHeader } from "./SortableTableHeader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface TopPoolsTableProps {
  selectedChainId?: string | number;
  onChainChange?: (chainId: string | number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortKey: string, sortOrder: 'asc' | 'desc') => void;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
  limit?: number;
  onRefreshRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
  search?: string;
}

export const TopPoolsTable = ({
  selectedChainId = 'all',
  sortBy = 'poolStats.liquidity',
  sortOrder = 'desc',
  onSort,
  currentSortBy,
  currentSortOrder,
  limit = 10,
  onRefreshRef,
  search = ''
}: TopPoolsTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { getChainById } = useChains();

  const { data: pools, loading, error, refresh } = useTopPools({
    chainId: selectedChainId,
    sortBy: sortBy as 'poolStats.liquidity' | 'poolStats.apr' | 'poolStats.totalVolume',
    sortOrder,
    limit,
    search,
  })

  // Exposar função refresh via ref
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = refresh;
    }
  }, [refresh, onRefreshRef]);

  const toggleRow = (rank: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rank)) {
      newExpanded.delete(rank);
    } else {
      newExpanded.add(rank);
    }
    setExpandedRows(newExpanded);
  };

  // Helper function to check if image might be animated and needs unoptimized
  const isReservoirImage = (src: string) => {
    return src.includes('img.reservoir.tools');
  };

  // Helper function to get LP icons based on pool data
  const getLPIcons = (pool: TopPoolData) => {
    // Use the icons directly from the API response
    if (pool.lp?.icons && pool.lp.icons.length > 0) {
      return pool.lp.icons;
    }
    
    // Fallback logic if icons not available
    const chainData = getChainById(pool.chain?.chainId);
    if (chainData?.logo && chainData.logo.trim()) {
      // Return chain icon and collection image
      return [chainData.logo, pool.collectionPool.image];
    }
    
    // Ultimate fallback
    return ['/ethereum-icon.svg', '/collection-icon.svg'];
  };

  return (
    <TooltipProvider>
      <div className="w-full rounded-[12px] overflow-hidden bg-white shadow-[2px_2px_8px_rgba(0,0,0,0.25)]">
      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading pools: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center h-[54px] bg-[#434343] text-white pr-20">
        <div className="w-14 px-3 text-center">
          <span className="text-sm font-semibold whitespace-nowrap">#</span>
        </div>
        <div className="w-80 px-3">
          <span className="text-sm font-semibold whitespace-nowrap">Collection Pool</span>
        </div>
        <div className="w-28 px-3 text-left">
          <span className="text-sm font-semibold whitespace-nowrap">LP</span>
        </div>
        <div className="w-28 px-3 text-right">
          {onSort ? (
            <SortableTableHeader
              label="NFT Price"
              sortKey="poolStats.nftPrice"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <span className="text-sm font-semibold whitespace-nowrap">NFT Price</span>
          )}
        </div>
        <div className="w-28 px-3 text-right">
          {onSort ? (
            <SortableTableHeader
              label="Listings"
              sortKey="poolStats.nftListings"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <span className="text-sm font-semibold whitespace-nowrap">Listings</span>
          )}
        </div>
        <div className="w-28 px-3 text-right">
          <span className="text-sm font-semibold whitespace-nowrap">ETH Offers</span>
        </div>
        <div className="w-28 px-3 text-right">
          {onSort ? (
            <SortableTableHeader
              label="Liquidity"
              sortKey="poolStats.liquidity"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <span className="text-sm font-semibold whitespace-nowrap">Liquidity</span>
          )}
        </div>
        <div className="w-28 px-3 text-right">
          {onSort ? (
            <SortableTableHeader
              label="Volume"
              sortKey="poolStats.totalVolume"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <span className="text-sm font-semibold whitespace-nowrap">Volume</span>
          )}
        </div>
        <div className="w-28 px-3 text-right">
          {onSort ? (
            <SortableTableHeader
              label="Apy"
              sortKey="poolStats.apr"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <span className="text-sm font-semibold whitespace-nowrap">Apy</span>
          )}
        </div>
      </div>

      {/* Table Rows */}
      <div>
        {loading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center h-[68px] border-b border-[#F0F0F0] pr-20 animate-pulse">
              <div className="w-14 px-3 text-center">
                <div className="w-4 h-4 bg-gray-300 rounded mx-auto"></div>
              </div>
              <div className="w-80 px-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="w-32 h-4 bg-gray-300 rounded"></div>
              </div>
              <div className="w-28 px-3">
                <div className="w-16 h-4 bg-gray-300 rounded"></div>
              </div>
              <div className="w-28 px-3">
                <div className="w-12 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-28 px-3">
                <div className="w-8 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-28 px-3">
                <div className="w-12 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-28 px-3">
                <div className="w-16 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-28 px-3">
                <div className="w-12 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-28 px-3">
                <div className="w-8 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
            </div>
          ))
        ) : pools.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>No pools found</p>
          </div>
        ) : (
          pools.map((pool) => (
            <div key={`${pool.collectionPool._id}-${pool.rank}`}>
              {/* Main Row */}
              <div
                className={`flex items-center h-[68px] hover:bg-[#F8F9FB] transition-colors border-b border-[#F0F0F0] pr-20 cursor-pointer ${
                  expandedRows.has(pool.rank) ? 'bg-[#F8F9FB]' : 'bg-white'
                }`}
                onClick={() => pool.expandedData && toggleRow(pool.rank)}
              >
                {/* Rank */}
                <div className="w-14 px-3 text-center">
                  <span className="text-sm text-[#434343] whitespace-nowrap">
                    {pool.rank}
                  </span>
                </div>

                {/* Collection Pool */}
                <div className="w-80 px-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={pool.collectionPool.image || '/rectangle-2-7.png'}
                      alt={pool.collectionPool.name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                      unoptimized={isReservoirImage(pool.collectionPool.image || '')}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-semibold text-[#434343] whitespace-nowrap truncate">
                        {pool.collectionPool.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{pool.collectionPool.name}</p>
                    </TooltipContent>
                  </Tooltip>
                  {pool.collectionPool.verified && (
                    <div className="w-4 h-4 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM11.0234 5.71406L7.73281 10.2766C7.68682 10.3408 7.62619 10.3931 7.55595 10.4291C7.48571 10.4652 7.40787 10.4841 7.32891 10.4841C7.24994 10.4841 7.17211 10.4652 7.10186 10.4291C7.03162 10.3931 6.97099 10.3408 6.925 10.2766L4.97656 7.57656C4.91719 7.49375 4.97656 7.37813 5.07812 7.37813H5.81094C5.97031 7.37813 6.12187 7.45469 6.21562 7.58594L7.32812 9.12969L9.78438 5.72344C9.87813 5.59375 10.0281 5.51562 10.1891 5.51562H10.9219C11.0234 5.51562 11.0828 5.63125 11.0234 5.71406Z" fill="#FF2E00"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* LP */}
              <div className="w-28 px-3 flex items-center justify-start gap-1">
                {pool.lp.hasAddButton ? (
                  <div className="w-6 h-6 bg-[#FF2E00] rounded-full flex items-center justify-center">
                    <PlusIcon className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  getLPIcons(pool).map((icon: string, index: number) => (
                    <div key={index} className="w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={icon}
                        alt="Blockchain icon"
                        width={24}
                        height={24}
                        className="object-cover w-full h-full"
                        unoptimized={isReservoirImage(icon)}
                        onError={(e) => {
                          // Fallback to default icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = '/default-chain-icon.svg';
                        }}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* NFT Price */}
              <div className="w-28 px-3 text-right">
                <span className="text-sm font-semibold text-[#434343] whitespace-nowrap">
                  {pool.nftPrice.value} {pool.nftPrice.currency}
                </span>
              </div>

              {/* Listings */}
              <div className="w-28 px-3 text-right">
                <span className="text-sm font-semibold text-[#434343] whitespace-nowrap">
                  {pool.listings}
                </span>
              </div>

              {/* ETH Offers */}
              <div className="w-28 px-3 text-right">
                <span className="text-sm font-semibold text-[#434343] whitespace-nowrap">
                  {pool.ethOffers.value} {pool.ethOffers.currency}
                </span>
              </div>

              {/* Liquidity */}
              <div className="w-28 px-3 text-right">
                <span className="text-sm font-semibold text-[#434343] whitespace-nowrap">
                  {pool.liquidity}
                </span>
              </div>

              {/* Volume 24h */}
              <div className="w-28 px-3 text-right">
                <span className="text-sm font-semibold text-[#434343] whitespace-nowrap">
                  {pool.volume}
                </span>
              </div>

              {/* APY */}
              <div className="w-28 px-3 text-right">
                <span className="text-sm font-semibold text-[#434343] whitespace-nowrap">
                  {pool.apy}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedRows.has(pool.rank) && pool.expandedData && (
              <div className="bg-[#F5F5F5] border-b border-[#F0F0F0] w-full">
                <div className="py-2">
                  {/* Sub-pools */}
                  {pool.expandedData.subPools.map((subPool, index) => (
                    <div key={index} className="flex items-center h-6 mb-3 last:mb-0 pr-20 w-full">
                      {/* Empty rank space */}
                      <div className="w-14 px-3"></div>

                      {/* Sub-pool name and icons */}
                      <div className="w-80 px-3 flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-semibold text-[#434343] whitespace-nowrap truncate">
                              {subPool.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{subPool.name}</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="w-4 h-4 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM11.0234 5.71406L7.73281 10.2766C7.68682 10.3408 7.62619 10.3931 7.55595 10.4291C7.48571 10.4652 7.40787 10.4841 7.32891 10.4841C7.24994 10.4841 7.17211 10.4652 7.10186 10.4291C7.03162 10.3931 6.97099 10.3408 6.925 10.2766L4.97656 7.57656C4.91719 7.49375 4.97656 7.37813 5.07812 7.37813H5.81094C5.97031 7.37813 6.12187 7.45469 6.21562 7.58594L7.32812 9.12969L9.78438 5.72344C9.87813 5.59375 10.0281 5.51562 10.1891 5.51562H10.9219C11.0234 5.51562 11.0828 5.63125 11.0234 5.71406Z" fill="#FF2E00"/>
                          </svg>
                        </div>
                      </div>

                      {/* LP Icons */}
                      <div className="w-28 px-3 flex items-center justify-start">
                        {getLPIcons(pool).map((icon: string, iconIndex: number) => (
                          <div key={iconIndex} className="w-6 h-6 rounded-full overflow-hidden">
                            <Image
                              src={icon}
                              alt="Token icon"
                              width={24}
                              height={24}
                              className="object-cover w-full h-full"
                              unoptimized={isReservoirImage(icon)}
                              onError={(e) => {
                                // Fallback to default icon if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-chain-icon.svg';
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Sub-pool data */}
                      <div className="w-28 px-3 text-right">
                        <span className="text-sm text-[#434343] whitespace-nowrap">{subPool.nftPrice}</span>
                      </div>
                      <div className="w-28 px-3 text-right">
                        <span className="text-sm text-[#434343] whitespace-nowrap">{subPool.listings}</span>
                      </div>
                      <div className="w-28 px-3 text-right">
                        <span className="text-sm text-[#434343] whitespace-nowrap">{subPool.ethOffers}</span>
                      </div>
                      <div className="w-28 px-3 text-right">
                        <span className="text-sm text-[#434343] whitespace-nowrap">{subPool.liquidity}</span>
                      </div>
                      <div className="w-28 px-3 text-right">
                        <span className="text-sm text-[#434343] whitespace-nowrap">{subPool.volume}</span>
                      </div>
                      <div className="w-28 px-3 text-right">
                        <span className="text-sm text-[#434343] whitespace-nowrap">{subPool.apy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  </div>
  </TooltipProvider>
  );
};