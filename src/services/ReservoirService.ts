//  Service for interacting with Reservoir API to fetch NFT data
import { type Address } from 'viem';

// Chain ID to Reservoir API URL mapping
const RESERVOIR_BASE_URLS: Record<number, string> = {
  // Mainnets
  1: 'https://api.reservoir.tools', // Ethereum
  137: 'https://api-polygon.reservoir.tools', // Polygon
  8453: 'https://api-base.reservoir.tools', // Base
  42161: 'https://api-arbitrum.reservoir.tools', // Arbitrum
  10: 'https://api-optimism.reservoir.tools', // Optimism
  56: 'https://api-bsc.reservoir.tools', // BNB Smart Chain
  43114: 'https://api-avalanche.reservoir.tools', // Avalanche
  33979: 'https://api-apechain.reservoir.tools', // ApeChain
  80084: 'https://api-berachain.reservoir.tools', // Berachain
  81457: 'https://api-blast.reservoir.tools', // Blast
  324: 'https://api-zksync.reservoir.tools', // zkSync
  7777777: 'https://api-zora.reservoir.tools', // Zora Network
  // Add more chains as needed
  
  // Testnets
  11155111: 'https://api-sepolia.reservoir.tools', // Sepolia
  80002: 'https://api-amoy.reservoir.tools', // Amoy (Polygon testnet)
  84532: 'https://api-base-sepolia.reservoir.tools', // Base Sepolia
};

interface ReservoirToken {
  token: {
    chainId: number;
    contract: string;
    tokenId: string;
    kind: string;
    name?: string;
    image?: string;
    imageSmall?: string;
    imageLarge?: string;
    metadata?: {
      imageOriginal?: string;
      imageMimeType?: string;
      tokenURI?: string;
    };
    description?: string;
    collection: {
      id: string;
      name: string;
      slug?: string;
      symbol: string;
      imageUrl?: string;
      isSpam?: boolean;
      floorAskPrice?: {
        currency: {
          contract: string;
          name: string;
          symbol: string;
          decimals: number;
        };
        amount: {
          raw: string;
          decimal: number;
          usd: number;
          native: number;
        };
      };
    };
  };
  ownership: {
    tokenCount: string;
    onSaleCount: string;
    acquiredAt: string;
  };
}

interface ReservoirUserTokensResponse {
  tokens: ReservoirToken[];
  continuation?: string;
}

export interface UserNftData {
  tokenId: string;
  contractAddress: string;
  name?: string;
  image?: string;
  imageSmall?: string;
  imageLarge?: string;
  metadata?: {
    imageOriginal?: string;
    tokenURI?: string;
  };
  collection: {
    name: string;
    symbol: string;
  };
  acquiredAt: string;
}

export interface CollectionTokenData {
  tokenId: string;
  contractAddress: string;
  name?: string;
  image?: string;
  imageSmall?: string;
  imageLarge?: string;
  metadata?: {
    imageOriginal?: string;
    tokenURI?: string;
  };
  collection: {
    name: string;
    symbol: string;
  };
}

interface ReservoirTokenResponse {
  tokens: Array<{
    token: {
      chainId: number;
      contract: string;
      tokenId: string;
      name?: string;
      image?: string;
      imageSmall?: string;
      imageLarge?: string;
      metadata?: {
        imageOriginal?: string;
        tokenURI?: string;
      };
      collection: {
        id: string;
        name: string;
        symbol: string;
      };
    };
  }>;
  continuation?: string;
}

export class ReservoirService {
  private static getApiKey(): string {
    const apiKey = process.env.NEXT_PUBLIC_RESERVOIR_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ NEXT_PUBLIC_RESERVOIR_API_KEY not found, using demo key');
      return 'demo-api-key';
    }
    return apiKey;
  }

  private static getBaseUrl(chainId: number): string {
    const baseUrl = RESERVOIR_BASE_URLS[chainId];
    if (!baseUrl) {
      throw new Error(`Reservoir API not supported for chain ID ${chainId}`);
    }
    return baseUrl;
  }

  /**
   * Fetch all NFTs owned by a user for a specific collection
   */
  static async getUserNftsForCollection(
    userAddress: Address,
    collectionAddress: Address,
    chainId: number
  ): Promise<UserNftData[]> {
    try {
      const baseUrl = this.getBaseUrl(chainId);
      const apiKey = this.getApiKey();

      const url = new URL(`${baseUrl}/users/${userAddress}/tokens/v10`);
      
      // Add query parameters
      url.searchParams.append('collection', collectionAddress);
      url.searchParams.append('limit', '20');
      url.searchParams.append('excludeSpam', 'true');
      url.searchParams.append('excludeNsfw', 'false');
      url.searchParams.append('sortBy', 'acquiredAt');
      url.searchParams.append('sortDirection', 'desc');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Reservoir API error: ${response.status} ${response.statusText}`);
      }

      const data: ReservoirUserTokensResponse = await response.json();
      // Transform Reservoir response to our format
      const userNfts: UserNftData[] = data.tokens.map(item => ({
        tokenId: item.token.tokenId,
        contractAddress: item.token.contract,
        name: item.token.name || `Token #${item.token.tokenId}`,
        image: item.token.image || item.token.collection.imageUrl,
        imageSmall: item.token.imageSmall,
        imageLarge: item.token.imageLarge,
        metadata: {
          imageOriginal: item.token.metadata?.imageOriginal || item.token.collection.imageUrl,
          tokenURI: item.token.metadata?.tokenURI,
        },
        collection: {
          name: item.token.collection.name,
          symbol: item.token.collection.symbol,
        },
        acquiredAt: item.ownership.acquiredAt,
      }));

      return userNfts;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch all NFTs owned by a user across all collections
   */
  public static async getAllUserNfts(
    userAddress: string,
    chainId: number,
    collectionSlugs?: string[]
  ): Promise<ReservoirToken[]> {
    try {
      const baseUrl = this.getBaseUrl(chainId);
      const apiKey = this.getApiKey();

      const params = new URLSearchParams({
        user: userAddress,
        includeAttributes: 'true',
        sortBy: 'acquiredAt',
        sortDirection: 'desc',
        limit: '20',
      });

      if (collectionSlugs?.length) {
        params.append('collection', collectionSlugs.join(','));
      }

      const response = await fetch(
        `${baseUrl}/users/${userAddress}/tokens/v10?${params.toString()}`,
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search NFT collections by name, symbol, or contract address
   */
  static async searchCollections(
    chainId: number,
    searchTerm: string,
    limit: number = 20,
    continuation?: string
  ): Promise<{
    collections: Array<{
      id: string;
      name: string;
      symbol: string;
      imageUrl?: string;
      contractAddress: string;
      floorPrice?: number;
      volume24h?: number;
    }>;
    continuation?: string;
  }> {
    try {
      const baseUrl = this.getBaseUrl(chainId);
      const apiKey = this.getApiKey();

      // Ensure limit doesn't exceed API maximum of 20
      const apiLimit = Math.min(limit, 20);

      const url = new URL(`${baseUrl}/collections/v7`);
      
      // Add query parameters for search
      url.searchParams.append('limit', apiLimit.toString());
      url.searchParams.append('sortBy', 'allTimeVolume');
      url.searchParams.append('sortDirection', 'desc');
      url.searchParams.append('includeTopBid', 'true');
      url.searchParams.append('normalizeRoyalties', 'true');
      
      // Add search parameters - Reservoir supports multiple search types
      // Check if search term looks like a contract address
      if (searchTerm.startsWith('0x') && searchTerm.length === 42) {
        url.searchParams.append('id', searchTerm.toLowerCase());
      } else {
        // Search by name or symbol
        url.searchParams.append('name', searchTerm);
      }
      
      // Add continuation token for pagination
      if (continuation) {
        url.searchParams.append('continuation', continuation);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Reservoir API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform response to our format
      const collections = (data.collections || []).map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        symbol: collection.symbol || collection.name?.slice(0, 4).toUpperCase() || 'NFT',
        imageUrl: collection.image,
        contractAddress: collection.id,
        floorPrice: collection.floorAsk?.price?.amount?.native,
        volume24h: collection.volume?.['1day'],
      }));

      return {
        collections,
        continuation: data.continuation,
      };

    } catch (error) {
      console.error('❌ Error searching collections from Reservoir:', error);
      throw error;
    }
  }

  /**
   * Fetch all NFT collections available on a chain (trending/popular collections)
   */
  static async getAllCollections(
    chainId: number,
    limit: number = 20,
    continuation?: string
  ): Promise<{
    collections: Array<{
      id: string;
      name: string;
      symbol: string;
      imageUrl?: string;
      contractAddress: string;
      floorPrice?: number;
      volume24h?: number;
    }>;
    continuation?: string;
  }> {
    try {
      const baseUrl = this.getBaseUrl(chainId);
      const apiKey = this.getApiKey();

      // Ensure limit doesn't exceed API maximum of 20
      const apiLimit = Math.min(limit, 20);

      const url = new URL(`${baseUrl}/collections/v7`);
      
      // Add query parameters for trending collections
      url.searchParams.append('limit', apiLimit.toString());
      url.searchParams.append('sortBy', 'allTimeVolume');
      url.searchParams.append('sortDirection', 'desc');
      url.searchParams.append('includeTopBid', 'true');
      url.searchParams.append('normalizeRoyalties', 'true');
      
      // Add continuation token for pagination
      if (continuation) {
        url.searchParams.append('continuation', continuation);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Reservoir API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform response to our format
      const collections = (data.collections || []).map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        symbol: collection.symbol || collection.name?.slice(0, 4).toUpperCase() || 'NFT',
        imageUrl: collection.image,
        contractAddress: collection.id,
        floorPrice: collection.floorAsk?.price?.amount?.native,
        volume24h: collection.volume?.['1day'],
      }));

      return {
        collections,
        continuation: data.continuation,
      };

    } catch (error) {
      console.error('❌ Error fetching all collections from Reservoir:', error);
      throw error;
    }
  }

  /**
   * Fetch specific tokens from a collection with their images
   */
  static async getCollectionTokens(
    collectionAddress: Address,
    tokenIds: string[],
    chainId: number
  ): Promise<CollectionTokenData[]> {
    try {
      const baseUrl = this.getBaseUrl(chainId);
      const apiKey = this.getApiKey();

      // Reservoir API expects tokens in format: "contract:tokenId"
      const formattedTokens = tokenIds.map(tokenId => `${collectionAddress}:${tokenId}`);
      
      // Split into chunks of 20 (API limit)
      const chunks = [];
      for (let i = 0; i < formattedTokens.length; i += 20) {
        chunks.push(formattedTokens.slice(i, i + 20));
      }

      let allTokens: CollectionTokenData[] = [];

      // Process each chunk
      for (const chunk of chunks) {
        const url = new URL(`${baseUrl}/tokens/v7`);
        
        // Add query parameters
        chunk.forEach(token => {
          url.searchParams.append('tokens', token);
        });

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'accept': '*/*',
            'x-api-key': apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Reservoir API error: ${response.status} ${response.statusText}`);
        }

        const data: ReservoirTokenResponse = await response.json();

        // Transform Reservoir response to our format
        const chunkTokens: CollectionTokenData[] = data.tokens.map(item => ({
          tokenId: item.token.tokenId,
          contractAddress: item.token.contract,
          name: item.token.name || `Token #${item.token.tokenId}`,
          image: item.token.image,
          imageSmall: item.token.imageSmall,
          imageLarge: item.token.imageLarge,
          metadata: {
            imageOriginal: item.token.metadata?.imageOriginal,
            tokenURI: item.token.metadata?.tokenURI,
          },
          collection: {
            name: item.token.collection.name,
            symbol: item.token.collection.symbol,
          },
        }));

        allTokens = [...allTokens, ...chunkTokens];
      }

      return allTokens;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if Reservoir API is supported for a given chain
   */
  static isChainSupported(chainId: number): boolean {
    return chainId in RESERVOIR_BASE_URLS;
  }

  /**
   * Get the list of supported chain IDs
   */
  static getSupportedChains(): number[] {
    return Object.keys(RESERVOIR_BASE_URLS).map(Number);
  }
}
