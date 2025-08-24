'use client';

import { useCallback, useRef, useState } from "react";
import ChainFilter from "./ChainFilter";
import { TableControls } from "./TableControls";
import { TopPoolsTable } from "./TopPoolsTable";
import { TopPoolsTableControls } from "./TopPoolsTableControls";
import { TrendingCollectionsTable } from "./TrendingCollectionsTable";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Debounce hook
function useDebounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

export const TrendingTables = () => {
  const [selectedChainId, setSelectedChainId] = useState<string | number>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [poolsLoading, setPoolsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('collections');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  
  // Estados para ordenação personalizada
  const [collectionsSortBy, setCollectionsSortBy] = useState<string>('');
  const [collectionsSortOrder, setCollectionsSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Estados para ordenação personalizada das pools
  const [poolsSortBy, setPoolsSortBy] = useState<string>('');
  const [poolsSortOrder, setPoolsSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Refs para acessar os métodos refresh das tabelas
  const collectionsRefreshRef = useRef<() => Promise<void>>();
  const poolsRefreshRef = useRef<() => Promise<void>>();

  // Debounced search handler
  const debouncedSearchHandler = useDebounce((value: string) => {
    setDebouncedSearchValue(value);
  }, 500);

  const handleChainChange = (chainId: string | number) => {
    setSelectedChainId(chainId);
  };

  const handleTimeframeChange = (timeframe: '24h' | '7d' | '30d') => {
    setSelectedTimeframe(timeframe);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    debouncedSearchHandler(value);
  };

  // Helper function to convert timeframe to sortBy parameter for collections
  const getSortByFromTimeframe = (timeframe: '24h' | '7d' | '30d') => {
    switch (timeframe) {
      case '24h':
        return 'volume24h';
      case '7d':
        return 'volume7d';
      case '30d':
        return 'volume30d';
      default:
        return 'volume24h';
    }
  };

  // Função para lidar com ordenação personalizada das coleções
  const handleCollectionsSort = (sortKey: string, sortOrder: 'asc' | 'desc') => {
    if (sortKey === '') {
      // Limpa a ordenação personalizada, volta ao padrão do timeframe
      setCollectionsSortBy('');
      setCollectionsSortOrder('desc');
    } else {
      setCollectionsSortBy(sortKey);
      setCollectionsSortOrder(sortOrder);
    }
  };

  // Função para lidar com ordenação personalizada das pools
  const handlePoolsSort = (sortKey: string, sortOrder: 'asc' | 'desc') => {
    if (sortKey === '') {
      // Limpa a ordenação personalizada, volta ao padrão (liquidity)
      setPoolsSortBy('');
      setPoolsSortOrder('desc');
    } else {
      setPoolsSortBy(sortKey);
      setPoolsSortOrder(sortOrder);
    }
  };

  // Determinar qual sortBy usar para as coleções
  const getCollectionsSortBy = () => {
    if (collectionsSortBy) {
      return collectionsSortBy as 'volume24h' | 'volume7d' | 'volume30d' | 'floorPrice' | 'floorChange' | 'volumeChange' | 'items' | 'liquidityCount';
    }
    return getSortByFromTimeframe(selectedTimeframe) as 'volume24h' | 'volume7d' | 'volume30d' | 'floorPrice' | 'floorChange' | 'volumeChange' | 'items' | 'liquidityCount';
  };

  // Determinar qual sortBy usar para as pools
  const getPoolsSortBy = () => {
    if (poolsSortBy) {
      return poolsSortBy;
    }
    return 'poolStats.liquidity'; // Default para pools é liquidity
  };

  const handleRefresh = async () => {
    if (activeTab === 'collections' && collectionsRefreshRef.current) {
      setCollectionsLoading(true);
      await collectionsRefreshRef.current();
      setCollectionsLoading(false);
    } else if (activeTab === 'pools' && poolsRefreshRef.current) {
      setPoolsLoading(true);
      await poolsRefreshRef.current();
      setPoolsLoading(false);
    }
  };

  return (
    <section className="w-full">
      <Card className="w-full overflow-hidden shadow-none border-none">
        <Tabs defaultValue="collections" className="w-full" onValueChange={setActiveTab}>
            <div className="flex h-[60px] items-center justify-between bg-[#F5F5F5] border-b border-[#D9D9D9]">
            <TabsList className="bg-transparent flex h-full">
              <TabsTrigger
                value="collections"
                className="font-semibold text-[#8C8C8C] text-base py-[9px] h-full data-[state=active]:text-[#434343] data-[state=active]:border-b-2 data-[state=active]:border-[#FF2E00] rounded-none border-b-2 border-transparent whitespace-nowrap"
              >
                Trending NFT Collections
              </TabsTrigger>
              <TabsTrigger
                value="pools"
                className="font-semibold text-[#8C8C8C] text-base py-[9px] h-full data-[state=active]:text-[#434343] data-[state=active]:border-b-2 data-[state=active]:border-[#FF2E00] rounded-none border-b-2 border-transparent whitespace-nowrap"
              >
                Top pools
              </TabsTrigger>
            </TabsList>
            
            {/* Chain Filter on the right side */}
            <div className="px-4">
              <ChainFilter
                selectedChainId={selectedChainId}
                onChainChange={handleChainChange}
                showAllOption={true}
              />
            </div>
          </div>

          <TabsContent value="collections">
            <div className="bg-[#F5F5F5] pb-2 pt-4">
              <TableControls 
                onRefresh={handleRefresh}
                loading={collectionsLoading}
                selectedTimeframe={selectedTimeframe}
                onTimeframeChange={handleTimeframeChange}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search collections by name or address..."
              />
            </div>
            <div>
              <TrendingCollectionsTable 
                selectedChainId={selectedChainId}
                onChainChange={handleChainChange}
                sortBy={getCollectionsSortBy()}
                sortOrder={collectionsSortBy ? collectionsSortOrder : 'desc'}
                onSort={handleCollectionsSort}
                currentSortBy={collectionsSortBy}
                currentSortOrder={collectionsSortOrder}
                limit={10}
                onRefreshRef={collectionsRefreshRef}
                search={debouncedSearchValue}
              />
            </div>
          </TabsContent>

          <TabsContent value="pools" >
            <div className="bg-[#F5F5F5] pb-2 pt-4">
              <TopPoolsTableControls 
                onRefresh={handleRefresh}
                loading={poolsLoading}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search pools by collection name..."
              />
            </div>
            <div>
              <TopPoolsTable 
                selectedChainId={selectedChainId}
                onChainChange={handleChainChange}
                sortBy={getPoolsSortBy()}
                sortOrder={poolsSortBy ? poolsSortOrder : 'desc'}
                onSort={handlePoolsSort}
                currentSortBy={poolsSortBy}
                currentSortOrder={poolsSortOrder}
                limit={10}
                onRefreshRef={poolsRefreshRef}
                search={debouncedSearchValue}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </section>
  );
};