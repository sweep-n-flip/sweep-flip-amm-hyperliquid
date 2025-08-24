// AIDEV-NOTE: Hook React para testar e usar dados do subgraph
import { useChainContext } from '@/contexts/ChainContext';
import { subgraphService, SubgraphService } from '@/services/SubgraphService';
import { useQuery } from '@tanstack/react-query';

// AIDEV-NOTE: Hook para buscar todos os pools do subgraph
export const useSubgraphAllPairs = (enabled: boolean = true) => {
  const { selectedChainId } = useChainContext();
  
  return useQuery({
    queryKey: ['subgraph-all-pairs', selectedChainId],
    queryFn: async () => {
      if (!SubgraphService.isChainSupported(Number(selectedChainId))) {
        throw new Error(`Chain ${selectedChainId} not supported by subgraph`);
      }
      return subgraphService.getAllPairs(Number(selectedChainId));
    },
    enabled: enabled && !!selectedChainId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// AIDEV-NOTE: Hook para dados estáticos (combinados)
export const useSubgraphStaticData = () => {
  const { selectedChainId } = useChainContext();

  const collectionsQuery = useQuery({
    queryKey: ['subgraph-nft-collections', selectedChainId],
    queryFn: async () => {
      if (!SubgraphService.isChainSupported(Number(selectedChainId))) {
        throw new Error(`Chain ${selectedChainId} not supported by subgraph`);
      }
      return subgraphService.getCollectionCurrencies(Number(selectedChainId));
    },
    enabled: !!selectedChainId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
  });

  return {
    loading: collectionsQuery.isLoading,
    error: collectionsQuery.error,
    collections: {
      data: collectionsQuery.data || [],
      loading: collectionsQuery.isLoading,
      error: collectionsQuery.error,
    },
    refetch: () => {
      collectionsQuery.refetch();
    },
  };
};

// AIDEV-NOTE: Hook para estatísticas em tempo real
export const useSubgraphRealtimeStats = (enabled: boolean = true) => {
  const { selectedChainId } = useChainContext();
  
  return useQuery({
    queryKey: ['subgraph-realtime-stats', selectedChainId],
    queryFn: async () => {
      if (!SubgraphService.isChainSupported(Number(selectedChainId))) {
        throw new Error(`Chain ${selectedChainId} not supported by subgraph`);
      }
      
      // AIDEV-NOTE: Only get pairs for now, global stats removed
      const allPairs = await subgraphService.getAllPairs(Number(selectedChainId), { first: 10, skip: 0 });

      return {
        pairs: allPairs,
        totalPairs: allPairs.length,
      };
    },
    enabled: enabled && !!selectedChainId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // 1 minuto
    retry: 3,
  });
};
