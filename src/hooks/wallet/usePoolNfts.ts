// AIDEV-NOTE: Hook to fetch NFTs from a pool/collection using Reservoir API
import { useChainContext } from '@/contexts/ChainContext';
import { ReservoirService, type CollectionTokenData } from '@/services/ReservoirService';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Address } from 'viem';

interface UsePoolNftsParams {
  collectionAddress: Address | null;
  tokenIds: string[];
  enabled?: boolean;
}

interface UsePoolNftsReturn {
  nfts: CollectionTokenData[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const usePoolNfts = ({ 
  collectionAddress, 
  tokenIds,
  enabled = true 
}: UsePoolNftsParams): UsePoolNftsReturn => {
  const { selectedChainId } = useChainContext();
  const [nfts, setNfts] = useState<CollectionTokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoize tokenIds to prevent unnecessary re-renders
  const memoizedTokenIds = useMemo(() => 
    JSON.stringify(tokenIds), [tokenIds]
  );

  const fetchPoolNfts = useCallback(async () => {
    if (!collectionAddress || !tokenIds.length || !enabled) {
      setNfts([]);
      return;
    }

    const chainId = Number(selectedChainId);
    
    // Check if Reservoir supports this chain
    if (!ReservoirService.isChainSupported(chainId)) {
      const supportedChains = ReservoirService.getSupportedChains();
      const errorMsg = `Reservoir API not supported for chain ${chainId}. Supported chains: ${supportedChains.join(', ')}`;
      setError(new Error(errorMsg));
      setNfts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const poolNfts = await ReservoirService.getCollectionTokens(
        collectionAddress,
        tokenIds,
        chainId
      );

      setNfts(poolNfts);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch pool NFTs'));
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [collectionAddress, memoizedTokenIds, selectedChainId, enabled]);

  useEffect(() => {
    if (collectionAddress && tokenIds.length > 0 && enabled) {
      fetchPoolNfts();
    }
  }, [collectionAddress, memoizedTokenIds, enabled, selectedChainId]);

  // Create a mapping of tokenId to NFT data for easier lookup
  const nftsByTokenId = useMemo(() => {
    const mapping: Record<string, CollectionTokenData> = {};
    nfts.forEach(nft => {
      mapping[nft.tokenId] = nft;
    });
    return mapping;
  }, [nfts]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchPoolNfts,
    // Additional utility for easy lookup
    getNftByTokenId: (tokenId: string) => nftsByTokenId[tokenId],
  } as UsePoolNftsReturn & { getNftByTokenId: (tokenId: string) => CollectionTokenData | undefined };
};
