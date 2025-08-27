//  Hook for getting pool data by pool ID (LP token address)
import { useQuery } from '@tanstack/react-query';
import { type Address } from 'viem';

import { useChainContext } from '@/contexts/ChainContext';
import { ChainId, subgraphService, type Pair } from '@/services/SubgraphService';

interface UsePoolByIdParams {
  poolId?: Address | string | null;
  enabled?: boolean;
}

interface UsePoolByIdResult {
  pool: Pair | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePoolById({
  poolId,
  enabled = true
}: UsePoolByIdParams): UsePoolByIdResult {
  const { selectedChainId } = useChainContext();

  const {
    data: pool,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pool-by-id', selectedChainId, poolId],
    queryFn: async () => {
      if (!poolId) {
        return null;
      }
      
      const result = await subgraphService.getPoolById(
        selectedChainId as ChainId,
        poolId.toString()
      );
      
      return result;
    },
    enabled: enabled && !!poolId && !!selectedChainId,
    staleTime: 30_000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3,
    refetchOnWindowFocus: false,
  });

  return {
    pool: pool || null,
    loading,
    error: error as Error | null,
    refetch,
  };
}
