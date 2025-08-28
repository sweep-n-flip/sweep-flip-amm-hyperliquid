//  Hook to fetch NFTs owned by user for a specific collection using Reservoir API
import { useChainContext } from '@/contexts/ChainContext';
import { ReservoirService } from '@/services/ReservoirService';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Address } from 'viem';
import { useAccount } from 'wagmi';

interface UserNftData {
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

interface UseUserNftsParams {
  collectionAddress: Address | null;
  enabled?: boolean;
}

interface UseUserNftsReturn {
  nfts: UserNftData[];
  tokenIds: string[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useUserNfts = ({ 
  collectionAddress, 
  enabled = true 
}: UseUserNftsParams): UseUserNftsReturn => {
  const { address: userAddress } = useAccount();
  const { selectedChainId } = useChainContext();
  const [nfts, setNfts] = useState<UserNftData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserNfts = useCallback(async () => {
    if (!userAddress || !collectionAddress || !enabled) {
      // setNfts([]); // Do not clear NFTs here to prevent flickering
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
      const userNfts = await ReservoirService.getUserNftsForCollection(
        userAddress,
        collectionAddress,
        chainId
      );

      setNfts(userNfts);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user NFTs'));
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [userAddress, collectionAddress, selectedChainId, enabled]);

  useEffect(() => {
    if (userAddress && collectionAddress && enabled) {
      fetchUserNfts();
    }
  }, [userAddress, collectionAddress, selectedChainId, enabled]);

  const tokenIds = useMemo(() => nfts.map(nft => nft.tokenId), [nfts]);

  return {
    nfts,
    tokenIds,
    loading,
    error,
    refetch: fetchUserNfts,
  };
};