import { useCallback, useEffect, useState } from 'react';
import { useChains } from './useChains';
import { useTokensFromDatabase, type TokenData } from './useTokensFromDatabase';

export function usePairs(chainId: number) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch NFT collections from your API
  const { tokens: nftTokens, loading: nftLoading, error: nftError } = useTokensFromDatabase({
    chainId,
    limit: 100,
  });

  // Fetch chain data to get native tokens
  const { chains, loading: chainsLoading, error: chainsError, getChainById } = useChains();

  const combineTokens = useCallback(() => {
    if (nftLoading || chainsLoading) {
      setLoading(true);
      return;
    }

    try {
      // Filter NFT tokens from your API
      const nftCollections = nftTokens.filter(token => token.isCollection);
      
      // Get chain data for current chainId
      const chainData = getChainById(chainId);
      const chainTokens: TokenData[] = [];

      if (chainData?.network?.token) {
        const networkToken = chainData.network.token;
        
        // Add native token (ETH, BNB, MATIC, etc.) with native address for UI
        chainTokens.push({
          _id: `native-${chainId}`,
          address: '0x0000000000000000000000000000000000000000', // Keep native address for UI selection
          name: chainData.name.includes('Mainnet') ? chainData.name.replace(' Mainnet', '') : chainData.name,
          symbol: networkToken.symbol,
          decimals: networkToken.decimals,
          logo: chainData.logo,
          nativeChain: chainId,
          isErc20: true,
          isCollection: false,
          collection: {
            id: `native-${chainId}`,
            name: chainData.name.includes('Mainnet') ? chainData.name.replace(' Mainnet', '') : chainData.name,
            symbol: networkToken.symbol,
            address: '0x0000000000000000000000000000000000000000', // Native address for UI
            logo: chainData.logo,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Add wrapped token (WETH, WBNB, WMATIC, etc.) if it exists
        if (networkToken.wrappedAddress) {
          // Map specific wrapped token symbols per chain
          const wrappedSymbolMap: Record<number, string> = {
            1: 'WETH',    // Ethereum Mainnet
            5: 'WETH',    // Goerli
            56: 'WBNB',   // BNB Smart Chain
            137: 'WMATIC', // Polygon
            8453: 'WETH', // Base
            33139: 'WAPE', // Ape Chain
            80084: 'WBERA', // Berachain
          };
          
          const wrappedSymbol = wrappedSymbolMap[chainId] || `W${networkToken.symbol}`;
          
          chainTokens.push({
            _id: `wrapped-${chainId}`,
            address: networkToken.wrappedAddress, // Real wrapped address
            name: `Wrapped ${networkToken.symbol}`,
            symbol: wrappedSymbol,
            decimals: networkToken.decimals,
            logo: chainData.logo,
            nativeChain: chainId,
            isErc20: true,
            isCollection: false,
            collection: {
              id: `wrapped-${chainId}`,
              name: `Wrapped ${networkToken.symbol}`,
              symbol: wrappedSymbol,
              address: networkToken.wrappedAddress, // Real wrapped address
              logo: chainData.logo,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Combine chain tokens with NFT collections
      const combinedTokens = [...chainTokens, ...nftCollections];
      
      // Sort tokens to ensure ETH is always first
      const sortedTokens = combinedTokens.sort((a, b) => {
        // ETH always comes first
        if (a.symbol === 'ETH' && b.symbol !== 'ETH') return -1;
        if (b.symbol === 'ETH' && a.symbol !== 'ETH') return 1;
        
        // WETH comes second
        if (a.symbol === 'WETH' && b.symbol !== 'WETH' && b.symbol !== 'ETH') return -1;
        if (b.symbol === 'WETH' && a.symbol !== 'WETH' && a.symbol !== 'ETH') return 1;
        
        // Rest sorted alphabetically
        return a.symbol.localeCompare(b.symbol);
      });
      
      setTokens(sortedTokens);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to combine tokens');
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [nftTokens, nftLoading, chainsLoading, chainId, getChainById]);

  useEffect(() => {
    combineTokens();
  }, [combineTokens]);

  // Combine errors if any
  useEffect(() => {
    if (nftError || chainsError) {
      setError(nftError || chainsError);
    }
  }, [nftError, chainsError]);

  return { tokens, loading, error };
}
