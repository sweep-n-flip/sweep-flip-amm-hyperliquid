'use client';

import { useChains } from "@/hooks/api/useChains";
import { useTrendingCollections } from "@/hooks/api/useTrendingCollections";
import { PlusIcon } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { SortableTableHeader } from "./SortableTableHeader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface TrendingCollectionsTableProps {
  selectedChainId?: string | number;
  onChainChange?: (chainId: string | number) => void;
  sortBy?: 'volume24h' | 'volume7d' | 'volume30d' | 'floorPrice' | 'floorChange' | 'volumeChange' | 'items' | 'liquidityCount';
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortKey: string, sortOrder: 'asc' | 'desc') => void;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
  limit?: number;
  onRefreshRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
  search?: string;
}

export const TrendingCollectionsTable = ({
  selectedChainId = 'all',
  sortBy = 'volume24h',
  sortOrder = 'desc',
  onSort,
  currentSortBy,
  currentSortOrder,
  limit = 10,
  onRefreshRef,
  search = ''
}: TrendingCollectionsTableProps) => {
  const { getChainById } = useChains();
  const { data: collections, loading, error, refresh } = useTrendingCollections({
    chainId: selectedChainId,
    sortBy,
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

  const formatChange = (change: string) => {
    const isPositive = !change.startsWith('-')
    return (
      <span className={`font-semibold ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {change}
      </span>
    )
  }

  return (
    <TooltipProvider>
      <div className="w-full rounded-[12px] overflow-hidden bg-white shadow-[2px_2px_8px_rgba(0,0,0,0.25)]">
      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading collections: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center h-[54px] bg-[#434343] text-white gap-4 pr-16">
        <div className="w-14 text-center">
          <span className="text-sm font-semibold whitespace-nowrap">#</span>
        </div>
        <div className="w-80">
          <span className="text-sm font-semibold whitespace-nowrap">Collection</span>
        </div>
        <div className="w-24 text-center">
          <span className="text-sm font-semibold whitespace-nowrap">Chain</span>
        </div>
        <div className="w-32 text-left">
          <span className="text-sm font-semibold whitespace-nowrap">Liquidity Pool</span>
        </div>
        <div className="w-24 h-full">
          {onSort ? (
            <SortableTableHeader
              label="Floor"
              sortKey="floorPrice"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <div className="px-3 h-full flex">
              <span className="text-sm font-semibold whitespace-nowrap">Floor</span>
            </div>
          )}
        </div>
        <div className="w-28 h-full">
          {onSort ? (
            <SortableTableHeader
              label="Floor Change"
              sortKey="floorChange"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <div className="px-3 h-full flex">
              <span className="text-sm font-semibold whitespace-nowrap">Floor Change</span>
            </div>
          )}
        </div>
        <div className="w-24 h-full">
          {onSort ? (
            <SortableTableHeader
              label="Volume"
              sortKey={sortBy && sortBy.includes('volume') ? sortBy : 'volume24h'}
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <div className="px-3 h-full flex items-center justify-end">
              <span className="text-sm font-semibold whitespace-nowrap">Volume</span>
            </div>
          )}
        </div>
        <div className="w-32 h-full">
          {onSort ? (
            <SortableTableHeader
              label="Volume Change"
              sortKey="volumeChange"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <div className="h-full flex">
              <span className="text-sm font-semibold whitespace-nowrap">Volume Change</span>
            </div>
          )}
        </div>
        <div className="w-24 h-full ">
          {onSort ? (
            <SortableTableHeader
              label="Items"
              sortKey="items"
              currentSortBy={currentSortBy}
              currentSortOrder={currentSortOrder}
              onSort={onSort}
              align="right"
            />
          ) : (
            <div className="h-full flex">
              <span className="text-sm font-semibold whitespace-nowrap">Items</span>
            </div>
          )}
        </div>
      </div>

      {/* Table Rows */}
      <div>
        {loading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center h-14 border-b border-[#F0F0F0] pr-20 animate-pulse">
              <div className="w-14 px-3 text-center">
                <div className="w-4 h-4 bg-gray-300 rounded mx-auto"></div>
              </div>
              <div className="w-80 px-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="w-24 h-4 bg-gray-300 rounded"></div>
              </div>
              <div className="w-24 px-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full mx-auto"></div>
              </div>
              <div className="w-32 px-3">
                <div className="w-16 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-24 px-3">
                <div className="w-12 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-28 px-3">
                <div className="w-8 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-24 px-3">
                <div className="w-12 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-32 px-3">
                <div className="w-8 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
              <div className="w-24 px-3">
                <div className="w-8 h-4 bg-gray-300 rounded ml-auto"></div>
              </div>
            </div>
          ))
        ) : collections.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>No trending collections found</p>
          </div>
        ) : (
          collections.map((collection) => (
            <div
              key={`${collection.collection._id}-${collection.rank}`}
              className="flex items-center h-14 hover:bg-[#F8F9FB] transition-colors border-b border-[#F0F0F0] last:border-b-0 pr-20"
            >
              {/* Rank */}
              <div className="w-14 px-3 text-center">
                <span className="text-sm text-[#434343] whitespace-nowrap">
                  {collection.rank}
                </span>
              </div>

              {/* Collection */}
              <div className="w-72 px-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={collection.collection.image || '/rectangle-2-7.png'}
                    alt={collection.collection.name}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-semibold text-[#434343] whitespace-nowrap truncate">
                      {collection.collection.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{collection.collection.name}</p>
                  </TooltipContent>
                </Tooltip>
                {collection.collection.verified && (
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM11.0234 5.71406L7.73281 10.2766C7.68682 10.3408 7.62619 10.3931 7.55595 10.4291C7.48571 10.4652 7.40787 10.4841 7.32891 10.4841C7.24994 10.4841 7.17211 10.4652 7.10186 10.4291C7.03162 10.3931 6.97099 10.3408 6.925 10.2766L4.97656 7.57656C4.91719 7.49375 4.97656 7.37813 5.07812 7.37813H5.81094C5.97031 7.37813 6.12187 7.45469 6.21562 7.58594L7.32812 9.12969L9.78438 5.72344C9.87813 5.59375 10.0281 5.51562 10.1891 5.51562H10.9219C11.0234 5.51562 11.0828 5.63125 11.0234 5.71406Z" fill="#FF2E00"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Chain */}
              <div className="w-24 px-3 flex items-start justify-left">
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <Image
                    src={getChainById(collection.chain.chainId)?.logo || collection.chain.icon || '/default-chain-icon.svg'}
                    alt={collection.chain.name}
                    width={24}
                    height={24}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-chain-icon.svg';
                    }}
                  />
                </div>
              </div>

            {/* Liquidity Pool */}
            <div className="w-16  flex items-start justify-start gap-1">
              {collection.liquidityPools.hasAddButton ? (
                <div className="w-6 h-6 bg-[#FF2E00] rounded-full flex items-center justify-center">
                  <PlusIcon className="w-4 h-4 text-white" />
                </div>
              ) : (
                collection.liquidityPools.icons?.map((icon, index) => (
                  <div key={index} className="w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={icon}
                      alt="Blockchain icon"
                      width={24}
                      height={24}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Floor */}
            <div className="w-24 px-3 text-center">
              <span className="text-sm text-[#434343] whitespace-nowrap">
                {collection.floor.value} {collection.floor.currency}
              </span>
            </div>

            {/* Floor Change */}
            <div className="w-28 px-3 text-right">
              {formatChange(collection.floorChange)}
            </div>

            {/* Volume */}
            <div className="w-24 px-3 text-right">
              <span className="text-sm text-[#434343] whitespace-nowrap">
                {collection.volume.value} {collection.volume.currency}
              </span>
            </div>

            {/* Volume Change */}
            <div className="w-32 px-3 text-right">
              {formatChange(collection.volumeChange)}
            </div>

            {/* Items */}
            <div className="w-24 px-3 text-right">
              <span className="text-sm text-[#434343] whitespace-nowrap">
                {collection.items}
              </span>
            </div>
          </div>
        ))
      )}
      </div>
    </div>
    </TooltipProvider>
  );
};