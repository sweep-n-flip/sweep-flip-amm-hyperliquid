//  Centralized exports for all GraphQL queries
export { COLLECTION_CURRENCIES_QUERY } from './CollectionCurrenciesQuery';
export { COLLECTION_NATIVE_PAIRS_QUERY } from './CollectionNativePairsQuery';
export { ERC20_NATIVE_PAIRS_QUERY } from './Erc20NativePairsQuery';
export { NATIVE_COLLECTION_PAIRS_QUERY } from './NativeCollectionPairsQuery';
export { PAIR_DAILY_VOLUME_QUERY } from './PairDailyVolumeQuery';
export { PAIR_MONTHLY_TOTAL_VOLUME_QUERY } from './PairMonthlyVolumeQuery';
export { PAIR_REALTIME_DATA_QUERY } from './PairRealtimeDataQuery';
export { POOL_BY_ID_QUERY } from './PoolByIdQuery';

//  TypeScript interfaces for query responses
export interface SubgraphToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenIds?: string[];
  collection?: {
    id: string;
    name: string;
    symbol: string;
    wrapper?: {
      id: string;
    };
  };
}

export interface SubgraphPair {
  id: string;
  discrete0: boolean;
  discrete1: boolean;
  token0: SubgraphToken;
  token1: SubgraphToken;
  reserve0: string;
  reserve1: string;
  totalSupply?: string;
}

export interface SubgraphCurrency {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  wrapping?: string;
  tokenIds?: string[];
  collection?: {
    id: string;
    name: string;
    symbol: string;
  };
}

export interface PairDayData {
  id: string;
  day: string;
  volume0: string;
  volume1: string;
  reserve0: string;
  reserve1: string;
}

export interface PairMonthData {
  id: string;
  month: string;
  volume0: string;
  volume1: string;
  reserve0: string;
  reserve1: string;
}

export interface PairRealtimeToken {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  tokenIds: string[];
  collection: {
    id: string;
    name: string;
    symbol: string;
  } | null;
}

export interface PairRealtimeData {
  id: string;
  discrete0: boolean;
  discrete1: boolean;
  token0: PairRealtimeToken;
  token1: PairRealtimeToken;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
}

export interface PairRealtimeDataResponse {
  pair: PairRealtimeData;
}
