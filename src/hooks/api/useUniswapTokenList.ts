import { useChainContext } from '@/contexts/ChainContext';
import { useCallback, useEffect, useState } from 'react';

interface UniswapToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

interface TokenList {
  name: string;
  version: { major: number; minor: number; patch: number };
  tokens: UniswapToken[];
}

interface ConvertedToken {
  _id: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
  nativeChain: number;
  isErc20: boolean;
  isCollection: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useUniswapTokenList(chainId: number) {
  const { selectedChain } = useChainContext();
  const [tokens, setTokens] = useState<ConvertedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fixed timestamp to prevent hydration mismatch
  const fixedTimestamp = '2024-01-01T00:00:00.000Z';

  // Dynamic logo mapping based on chain and token
  const getTokenLogo = (symbol: string, chainId: number): string => {
    const logoMap: Record<string, Record<number, string> | string> = {
      'ETH': {
        1: 'https://assets.relay.link/icons/1/light.png', // Ethereum Mainnet
        5: 'https://assets.relay.link/icons/1/light.png', // Goerli
        8453: 'https://assets.relay.link/icons/1/light.png', // Base
        33139: 'https://assets.relay.link/icons/1/light.png', // Ape Chain
        80084: 'https://assets.relay.link/icons/1/light.png', // Berachain
      },
      'WETH': 'https://assets.relay.link/icons/1/light.png',
      'BNB': 'https://assets.relay.link/icons/56/light.png',
      'MATIC': 'https://assets.relay.link/icons/137/light.png',
      'APE': 'https://assets.relay.link/icons/33139/light.png',
      'BERA': 'https://assets.relay.link/icons/80084/light.png'
    };

    const tokenLogo = logoMap[symbol];
    
    if (typeof tokenLogo === 'string') {
      return tokenLogo;
    } else if (typeof tokenLogo === 'object') {
      return tokenLogo[chainId] || 'https://assets.relay.link/icons/1/light.png';
    }

    // Fallback: try to use chain-specific icon
    return `https://assets.relay.link/icons/${chainId}/light.png`;
  };

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Return only essential tokens: ETH, WETH, and native chain token
      const filteredTokens: ConvertedToken[] = [];
      
      if (selectedChain?.network?.token) {
        // Add native chain token (ETH for Ethereum, but actual native token for other chains)
        const nativeTokenSymbol = selectedChain.network.token.symbol || 'ETH';
        const nativeTokenName = nativeTokenSymbol === 'ETH' ? 'Ethereum' : 
          selectedChain.name?.includes('BNB') ? 'BNB' :
          selectedChain.name?.includes('Polygon') ? 'MATIC' :
          selectedChain.name?.includes('Base') ? 'Ethereum' :
          selectedChain.name?.includes('Ape') ? 'ApeCoin' :
          selectedChain.name?.includes('Bera') ? 'BERA' :
          nativeTokenSymbol;

        filteredTokens.push({
          _id: selectedChain.network.token.address,
          address: selectedChain.network.token.address,
          name: nativeTokenName,
          symbol: nativeTokenSymbol,
          decimals: selectedChain.network.token.decimals || 18,
          logo: getTokenLogo(nativeTokenSymbol, chainId),
          nativeChain: chainId,
          isErc20: true,
          isCollection: false,
          createdAt: fixedTimestamp,
          updatedAt: fixedTimestamp,
        });

        // Add WETH if it's different from native token and available
        if (selectedChain.network.token.wrappedAddress && 
            selectedChain.network.token.wrappedAddress !== selectedChain.network.token.address) {
          filteredTokens.push({
            _id: selectedChain.network.token.wrappedAddress,
            address: selectedChain.network.token.wrappedAddress,
            name: 'Wrapped Ethereum',
            symbol: 'WETH',
            decimals: 18,
            logo: "https://ethereum-optimism.github.io/data/WETH/logo.png",
            nativeChain: chainId,
            isErc20: true,
            isCollection: false,
            createdAt: fixedTimestamp,
            updatedAt: fixedTimestamp,
          });
        }

        // For non-Ethereum chains, also add ETH if it exists in the Uniswap token list
        if (nativeTokenSymbol !== 'ETH') {
          try {
            const response = await fetch('https://ipfs.io/ipns/tokens.uniswap.org');
            if (response.ok) {
              const tokenList: TokenList = await response.json();
              
              // Find ETH token for this chain
              const ethToken = tokenList.tokens.find(token => 
                token.chainId === chainId && 
                token.symbol === 'ETH'
              );
              
              if (ethToken) {
                filteredTokens.push({
                  _id: ethToken.address,
                  address: ethToken.address,
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: ethToken.decimals,
                  logo: ethToken.logoURI || getTokenLogo('ETH', chainId),
                  nativeChain: chainId,
                  isErc20: true,
                  isCollection: false,
                  createdAt: fixedTimestamp,
                  updatedAt: fixedTimestamp,
                });
              }
            }
          } catch (error) {
            // Silently fail if we can't fetch the token list
            console.warn('Failed to fetch Uniswap token list for ETH token', error);
          }
        }
      }

      const sortedTokens = filteredTokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
      setTokens(sortedTokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [chainId, selectedChain, fixedTimestamp]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, loading, error, refresh: fetchTokens };
}
