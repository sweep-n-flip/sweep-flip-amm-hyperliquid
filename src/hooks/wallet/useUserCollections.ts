// AIDEV-NOTE: Hook to fetch all NFT collections owned by user using Reservoir API
import { useChainContext } from '@/contexts/ChainContext';
import { type TokenData } from '@/hooks/api/useTokensFromDatabase';
import { ReservoirService } from '@/services/ReservoirService';
import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface UseUserCollectionsReturn {
  userCollections: TokenData[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useUserCollections = (): UseUserCollectionsReturn => {
  const { address: userAddress } = useAccount();
  const { selectedChainId } = useChainContext();
  const [userCollections, setUserCollections] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserCollections = useCallback(async () => {
    if (!userAddress || !selectedChainId) {
      setUserCollections([]);
      return;
    }

    // Check if Reservoir is supported for this chain
    if (!ReservoirService.isChainSupported(Number(selectedChainId))) {
      console.warn(`⚠️ Reservoir API not supported for chain ID ${selectedChainId}`);
      setUserCollections([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all user's NFTs to extract unique collections
      const userNftTokens = await ReservoirService.getAllUserNfts(
        userAddress,
        Number(selectedChainId)
      );


      // Extract unique collections from user's NFTs
      const collectionsMap = new Map<string, TokenData>();

      userNftTokens.forEach(tokenData => {
        const nft = tokenData.token;
        const ownership = tokenData.ownership;
        const collection = nft.collection;
        const contractAddress = nft.contract; // Use nft.contract instead of collection.id

        // Skip spam collections
        if (collection.isSpam) {
          return;
        }
        if (!collectionsMap.has(contractAddress)) {
          // Create TokenData format for each collection
          const collectionToken: TokenData = {
            _id: collection.id,
            address: contractAddress,
            name: collection.name,
            symbol: collection.symbol,
            logo: collection.imageUrl,
            nativeChain: Number(selectedChainId),
            isErc20: false,
            isCollection: true,
            collection: {
              id: collection.id,
              name: collection.name,
              symbol: collection.symbol,
              address: contractAddress,
              logo: collection.imageUrl,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Add metadata from Reservoir
            floorPrice: collection.floorAskPrice?.amount?.decimal,
            volume24h: undefined, // Not available in user tokens API
            // Add count of NFTs user owns in this collection
            userTokenCount: parseInt(ownership.tokenCount) || 1,
          } as TokenData & { userTokenCount: number };

          collectionsMap.set(contractAddress, collectionToken);
        } else {
          // Increment the count of NFTs in this collection
          const existing = collectionsMap.get(contractAddress)!;
          (existing as any).userTokenCount += parseInt(ownership.tokenCount) || 1;
        }
      });

      const collections = Array.from(collectionsMap.values());

      setUserCollections(collections);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user collections');
      console.error('❌ Error fetching user collections:', error);
      setError(error);
      setUserCollections([]);
    } finally {
      setLoading(false);
    }
  }, [userAddress, selectedChainId]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchUserCollections();
  }, [fetchUserCollections]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    fetchUserCollections();
  }, [fetchUserCollections]);

  return {
    userCollections,
    loading,
    error,
    refetch,
  };
};
