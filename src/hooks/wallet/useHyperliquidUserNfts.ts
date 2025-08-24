// AIDEV-NOTE: Hook to fetch NFTs owned by user for Hyperliquid collections using native contract calls
import { HyperliquidCollectionsService } from '@/services/HyperliquidCollections';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Address } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';

interface HyperliquidUserNftData {
  tokenId: string;
  contractAddress: string;
  name: string;
  image: string;
  imageSmall?: string;
  imageLarge?: string;
  collection: {
    name: string;
    symbol: string;
  };
}

interface UseHyperliquidUserNftsParams {
  collectionAddress: Address | null;
  enabled?: boolean;
  chainId?: number;
}

interface UseHyperliquidUserNftsReturn {
  nfts: HyperliquidUserNftData[];
  tokenIds: string[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useHyperliquidUserNfts = ({ 
  collectionAddress, 
  enabled = true,
  chainId = 999
}: UseHyperliquidUserNftsParams): UseHyperliquidUserNftsReturn => {
  const { address: userAddress } = useAccount();
  const [nfts, setNfts] = useState<HyperliquidUserNftData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tokenIds, setTokenIds] = useState<string[]>([]);

  // Check if this is a Hyperliquid chain and if the collection is supported
  const isHyperliquidChain = useMemo(() => 
    HyperliquidCollectionsService.isHyperliquidChain(chainId), 
    [chainId]
  );

  const hyperliquidCollection = useMemo(() => {
    if (!collectionAddress || !isHyperliquidChain) return null;
    const collections = HyperliquidCollectionsService.getCollections();
    return collections.find(c => c.address.toLowerCase() === collectionAddress.toLowerCase());
  }, [collectionAddress, isHyperliquidChain]);

  // Get all token IDs owned by user using tokensOfOwner
  const { 
    data: tokensOfOwnerResult, 
    isLoading: tokensLoading, 
    refetch: refetchTokens 
  } = useReadContracts({
    contracts: collectionAddress && userAddress && isHyperliquidChain ? [{
      address: collectionAddress,
      abi: [
        {
          name: 'tokensOfOwner',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'owner', type: 'address' }],
          outputs: [{ name: '', type: 'uint256[]' }],
        }
      ],
      functionName: 'tokensOfOwner',
      args: [userAddress],
      chainId,
    }] : [],
    query: {
      enabled: !!(collectionAddress && userAddress && isHyperliquidChain && enabled),
    }
  });

  // Process results and create NFT data
  useEffect(() => {
    if (!hyperliquidCollection || !tokensOfOwnerResult) {
      setNfts([]);
      setTokenIds([]);
      return;
    }

    try {
      // Get the token IDs array from the contract result
      const userTokenIds = tokensOfOwnerResult[0]?.result as bigint[] | undefined;
      
      if (!userTokenIds || userTokenIds.length === 0) {
        setNfts([]);
        setTokenIds([]);
        return;
      }

      const validTokenIds: string[] = [];
      const nftData: HyperliquidUserNftData[] = [];

      userTokenIds.forEach((tokenIdBigInt) => {
        const tokenId = tokenIdBigInt.toString();
        validTokenIds.push(tokenId);

        // Create NFT data with collection info
        nftData.push({
          tokenId,
          contractAddress: hyperliquidCollection.address,
          name: `${hyperliquidCollection.name} #${tokenId}`,
          image: hyperliquidCollection.logo || '/placeholder-nft.svg',
          imageSmall: hyperliquidCollection.logo || '/placeholder-nft.svg',
          imageLarge: hyperliquidCollection.logo || '/placeholder-nft.svg',
          collection: {
            name: hyperliquidCollection.name,
            symbol: hyperliquidCollection.symbol,
          },
        });
      });

      setTokenIds(validTokenIds);
      setNfts(nftData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process user NFTs'));
      setNfts([]);
      setTokenIds([]);
    }
  }, [hyperliquidCollection, tokensOfOwnerResult]);

  // Handle loading states
  useEffect(() => {
    setLoading(tokensLoading);
  }, [tokensLoading]);

  // Refetch function
  const refetch = useCallback(async () => {
    await refetchTokens();
  }, [refetchTokens]);

  // Early return if not Hyperliquid or not enabled
  if (!isHyperliquidChain || !enabled || !collectionAddress || !userAddress) {
    return {
      nfts: [],
      tokenIds: [],
      loading: false,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  return {
    nfts,
    tokenIds,
    loading,
    error,
    refetch,
  };
};
