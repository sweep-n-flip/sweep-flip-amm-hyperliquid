// AIDEV-NOTE: Hook para dados de NFT em tempo real via subgraph
import { useChainContext } from '@/contexts/ChainContext';
import { subgraphService, SubgraphService } from '@/services/SubgraphService';
import { useQuery } from '@tanstack/react-query';

interface NftPoolInfo {
  nftPrice: number;
  nftListings: number;
  offers: number;
  totalSupply: number;
  tokenIds: string[];
}

interface UseNftPoolInfoProps {
  poolId: string | undefined;  
  enabled?: boolean;
}

export const useNftPoolInfo = ({ poolId, enabled = true }: UseNftPoolInfoProps) => {
  const { selectedChainId } = useChainContext();

  return useQuery({
    queryKey: ['nft-pool-info', selectedChainId, poolId],
    queryFn: async (): Promise<NftPoolInfo | null> => {
      if (!selectedChainId || !poolId) return null;
      if (!SubgraphService.isChainSupported(Number(selectedChainId))) {
        throw new Error(`Chain ${selectedChainId} not supported by subgraph`);
      }

      try { 
        const pairData = await subgraphService.getPairRealtimeData(
          Number(selectedChainId), 
          poolId 
        );     

        if (!pairData) {
          return null;
        }

        // Find the pair that has one NFT token (discrete) and one ERC20 token
        const hasNft = pairData.discrete0 || pairData.discrete1;
        const hasErc20 = !pairData.discrete0 || !pairData.discrete1;
        
        if (!hasNft || !hasErc20) {
          return null;
        }


        // AIDEV-NOTE: Calculate NFT metrics from pair data
        const { reserve0, reserve1, discrete0, totalSupply, token0, token1 } = pairData;

        // Identify which token is NFT (discrete) and which is ERC20
        const isToken0Nft = discrete0;
        
        // Calculate NFT price (ERC20 reserve / NFT reserve)
        const nftReserve = isToken0Nft ? parseFloat(reserve0) : parseFloat(reserve1);
        const erc20Reserve = isToken0Nft ? parseFloat(reserve1) : parseFloat(reserve0);
        
        const nftPrice = nftReserve > 0 ? erc20Reserve / nftReserve : 0;

        // NFT listings = number of NFTs in pool (reserve of NFT token)
        const nftListings = Math.floor(nftReserve);

        // Offers = we can approximate based on ERC20 reserve divided by NFT price
        const offers = nftPrice > 0 ? Math.floor(erc20Reserve / nftPrice) : 0;

        // Total supply from pair data
        const supply = parseFloat(totalSupply || '0');

        // Get tokenIds from NFT token (either token0 or token1)
        const nftToken = isToken0Nft ? token0 : token1;
        const tokenIds = nftToken.tokenIds || [];

        const result = {
          nftPrice,
          nftListings,
          offers,
          totalSupply: supply,
          tokenIds,
        };
        
        return result;
      } catch (error) {
        throw error;
      }
    },
    enabled: enabled && !!selectedChainId && !!poolId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // 1 minuto
    retry: 3,
  });
};
