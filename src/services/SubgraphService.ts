// AIDEV-NOTE: Service for interacting with The Graph subgraphs
import { GraphQLClient } from 'graphql-request';
import { COLLECTION_CURRENCIES_QUERY } from './graphql/queries/CollectionCurrenciesQuery';
import { COLLECTION_NATIVE_PAIRS_QUERY } from './graphql/queries/CollectionNativePairsQuery';
import { ERC20_NATIVE_PAIRS_QUERY } from './graphql/queries/Erc20NativePairsQuery';
import { PairRealtimeDataResponse } from './graphql/queries/index';
import { NATIVE_COLLECTION_PAIRS_QUERY } from './graphql/queries/NativeCollectionPairsQuery';
import { PAIR_DAILY_VOLUME_QUERY } from './graphql/queries/PairDailyVolumeQuery';
import { PAIR_MONTHLY_TOTAL_VOLUME_QUERY } from './graphql/queries/PairMonthlyVolumeQuery';
import { PAIR_REALTIME_DATA_QUERY } from './graphql/queries/PairRealtimeDataQuery';

// AIDEV-NOTE: Chain IDs that match the backend configuration
export enum ChainId {
  ETHEREUM = 1,
  BSC = 56,
  POLYGON = 137,
  BASE = 8453,
  BERACHAIN = 80084,
  APE_CHAIN = 33139,
  HYPERLIQUID = 999,
}

// AIDEV-NOTE: Subgraph URLs copied from backend-v3 configuration
const SUBGRAPH_ENDPOINTS: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'https://api.studio.thegraph.com/query/109189/snf-mainnet/version/latest',
  [ChainId.BASE]: 'https://api.studio.thegraph.com/query/109189/snf-basemain/version/latest',
  [ChainId.BERACHAIN]: 'https://api.goldsky.com/api/public/project_cm08eswaacp6901wwdaxnfyjq/subgraphs/nftfy-beratest/v1.0.13-uni/gn',
  [ChainId.APE_CHAIN]: 'https://api.goldsky.com/api/public/project_cm7280omkluph010hczhc146w/subgraphs/snf-amm-apechain/v1.0.13-uni/gn',
  [ChainId.BSC]: 'https://api.studio.thegraph.com/query/109189/snf-bscmain/version/latest',
  [ChainId.POLYGON]: 'https://api.studio.thegraph.com/query/109189/snf-maticmain/version/latest',
  [ChainId.HYPERLIQUID]: 'https://api.goldsky.com/api/public/project_cmejhyc7rqen501wed6sxgbn3/subgraphs/snf-hyperevm/v1.0.13-uni/gn',
};

// AIDEV-NOTE: Types based on the actual subgraph schema
export interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals?: number;
  tokenIds?: string[];
  collection?: {
    id: string;
    name: string;
    symbol: string;
  };
}

export interface Pair {
  id: string;
  discrete0: boolean;
  discrete1: boolean;
  token0: Token;
  token1: Token;
  reserve0: string;
  reserve1: string;
  totalSupply?: string;
}

export interface PairDay {
  id: string;
  day: number;
  volume0: string;
  volume1: string;
  reserve0: string;
  reserve1: string;
}

export interface PairMonth {
  id: string;
  month: number;
  volume0: string;
  volume1: string;
  reserve0: string;
  reserve1: string;
}

export class SubgraphService {
  private clients: Map<ChainId, GraphQLClient> = new Map();

  constructor() {
    // Initialize clients for all supported chains
    Object.entries(SUBGRAPH_ENDPOINTS).forEach(([chainId, endpoint]) => {
      this.clients.set(Number(chainId) as ChainId, new GraphQLClient(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
      }));
    });
  }

  private getClient(chainId: ChainId): GraphQLClient {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`Subgraph client not available for chain ${chainId}`);
    }
    return client;
  }

  // AIDEV-NOTE: Get ERC20/Native tokens paired with collections
  async getERC20CollectionPairs(chainId: ChainId, first: number = 100, skip: number = 0) {
    const client = this.getClient(chainId);
    const response: any = await client.request(ERC20_NATIVE_PAIRS_QUERY, { first, skip });
    return response.pairs as Pair[];
  }

  // AIDEV-NOTE: Get Collection/ERC20 pairs
  async getCollectionERC20Pairs(chainId: ChainId, first: number = 100, skip: number = 0) {
    const client = this.getClient(chainId);
    const response: any = await client.request(COLLECTION_NATIVE_PAIRS_QUERY, { first, skip });
    return response.pairs as Pair[];
  }

  // AIDEV-NOTE: Get Native/Collection pairs
  async getNativeCollectionPairs(chainId: ChainId, first: number = 100, skip: number = 0) {
    const client = this.getClient(chainId);
    const response: any = await client.request(NATIVE_COLLECTION_PAIRS_QUERY, { first, skip });
    return response.pairs as Pair[];
  }

  // AIDEV-NOTE: Get all collection currencies
  async getCollectionCurrencies(chainId: ChainId, first: number = 100, skip: number = 0) {
    const client = this.getClient(chainId);
    const response: any = await client.request(COLLECTION_CURRENCIES_QUERY, { first, skip });
    return response.currencies as Token[];
  }

  // AIDEV-NOTE: Get daily volume for a specific pair
  async getPairDailyVolume(chainId: ChainId, pairId: string) {
    const client = this.getClient(chainId);
    const response: any = await client.request(PAIR_DAILY_VOLUME_QUERY, { pair: pairId });
    return response.pairDays as PairDay[];
  }

  // AIDEV-NOTE: Get monthly volume for a specific pair
  async getPairMonthlyVolume(chainId: ChainId, pairId: string) {
    const client = this.getClient(chainId);
    const response: any = await client.request(PAIR_MONTHLY_TOTAL_VOLUME_QUERY, { pair: pairId });
    return response.pairMonths as PairMonth[];
  }

  // AIDEV-NOTE: Get all pairs for a chain (combines all types)
  async getAllPairs(chainId: ChainId, firstOrOptions: number | { first?: number; skip?: number } = 100, skip: number = 0) {
    let first = 100;
    let skipValue = 0;
    
    if (typeof firstOrOptions === 'object') {
      first = firstOrOptions.first || 100;
      skipValue = firstOrOptions.skip || 0;
    } else {
      first = firstOrOptions;
      skipValue = skip;
    }

    const [erc20Pairs, collectionPairs, nativePairs] = await Promise.all([
      this.getERC20CollectionPairs(chainId, first, skipValue),
      this.getCollectionERC20Pairs(chainId, first, skipValue),
      this.getNativeCollectionPairs(chainId, first, skipValue),
    ]);

    // AIDEV-NOTE: Remove duplicates by ID to prevent React key conflicts
    const allPairs = [...erc20Pairs, ...collectionPairs, ...nativePairs];
    const uniquePairs = allPairs.filter((pair, index, array) => 
      array.findIndex(p => p.id === pair.id) === index
    );

    return uniquePairs;
  }
  async getPairRealtimeData(chainId: ChainId, poolId: string) {
    const client = this.getClient(chainId);
    const response: PairRealtimeDataResponse = await client.request(
      PAIR_REALTIME_DATA_QUERY,
      { pairId: poolId }
    );
    return response.pair || null;
  }

  // AIDEV-NOTE: Check if subgraph is available for a chain
  static isChainSupported(chainId: number): boolean {
    return chainId in SUBGRAPH_ENDPOINTS;
  }

  // AIDEV-NOTE: Get supported chain IDs
  static getSupportedChains(): ChainId[] {
    return Object.keys(SUBGRAPH_ENDPOINTS).map(Number) as ChainId[];
  }
}

// Export singleton instance
export const subgraphService = new SubgraphService();
