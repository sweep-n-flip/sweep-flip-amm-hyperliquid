// Hook to get token prices in USD using router contract quotes
import { useChainContext } from '@/contexts/ChainContext';
import { getContractAddresses } from '@/services/config/ContractAddresses';
import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { formatUnits } from 'viem';
import { useReadContract } from 'wagmi';

interface UseTokenPriceInUSDParams {
  tokenAddress?: Address;
  enabled?: boolean;
}

interface TokenPriceResult {
  price: number | null;
  loading: boolean;
  error: Error | null;
}

export const useTokenPriceInUSD = ({ 
  tokenAddress, 
  enabled = true 
}: UseTokenPriceInUSDParams): TokenPriceResult => {
  const { selectedChainId, selectedChain } = useChainContext();
  const chainId = Number(selectedChainId);

  // Get contract addresses for the current chain
  const contractAddresses = getContractAddresses(chainId);
  
  // Get stablecoin and WETH addresses from chain data (from database)
  const stablecoinAddress = selectedChain?.network?.token?.stableTokenAddress as Address | undefined;
  const wethAddress = selectedChain?.network?.token?.wrappedAddress as Address | undefined;

  // Most stablecoins use 6 decimals (USDC, USDT, etc.)
  const stablecoinDecimals = 6;

  // Try direct path: TOKEN -> USDC
  const { data: directQuote, error: directError } = useReadContract({
    address: contractAddresses.router as Address,
    abi: [
      {
        name: 'getAmountsOut',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'amountIn', type: 'uint256' },
          { name: 'path', type: 'address[]' }
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }]
      }
    ],
    functionName: 'getAmountsOut',
    args: tokenAddress && stablecoinAddress ? [
      BigInt('1000000000000000000'), // 1 token (18 decimals)
      [tokenAddress, stablecoinAddress]
    ] : undefined,
    query: {
      enabled: enabled && !!tokenAddress && !!stablecoinAddress && !!contractAddresses.router,
      retry: false,
    },
  });

  // Try multi-hop path: TOKEN -> WETH -> USDC (if direct fails)
  const { data: multiHopQuote, error: multiHopError } = useReadContract({
    address: contractAddresses.router as Address,
    abi: [
      {
        name: 'getAmountsOut',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'amountIn', type: 'uint256' },
          { name: 'path', type: 'address[]' }
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }]
      }
    ],
    functionName: 'getAmountsOut',
    args: tokenAddress && wethAddress && stablecoinAddress ? [
      BigInt('1000000000000000000'), // 1 token (18 decimals)
      [tokenAddress, wethAddress, stablecoinAddress]
    ] : undefined,
    query: {
      enabled: enabled && !!tokenAddress && !!wethAddress && !!stablecoinAddress && !!contractAddresses.router && !!directError,
      retry: false,
    },
  });

  // Special case for WETH/ETH - get direct WETH -> USDC price
  const { data: wethQuote, error: wethError } = useReadContract({
    address: contractAddresses.router as Address,
    abi: [
      {
        name: 'getAmountsOut',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'amountIn', type: 'uint256' },
          { name: 'path', type: 'address[]' }
        ],
        outputs: [{ name: 'amounts', type: 'uint256[]' }]
      }
    ],
    functionName: 'getAmountsOut',
    args: wethAddress && stablecoinAddress ? [
      BigInt('1000000000000000000'), // 1 ETH (18 decimals)
      [wethAddress, stablecoinAddress]
    ] : undefined,
    query: {
      enabled: enabled && !!wethAddress && !!stablecoinAddress && !!contractAddresses.router && 
               tokenAddress?.toLowerCase() === wethAddress.toLowerCase(),
      retry: false,
    },
  });

  const queryResult = useQuery({
    queryKey: ['tokenPrice', tokenAddress, chainId, 'USD'],
    queryFn: () => {
      if (!tokenAddress || !stablecoinAddress) return null;

      // Handle WETH/ETH special case
      if (tokenAddress.toLowerCase() === wethAddress?.toLowerCase() && wethQuote) {
        const usdcAmount = wethQuote[1]; // Second element is output amount
        return Number(formatUnits(usdcAmount, stablecoinDecimals));
      }

      // Try direct quote first
      if (directQuote && !directError) {
        const usdcAmount = directQuote[1]; // Second element is output amount
        return Number(formatUnits(usdcAmount, stablecoinDecimals));
      }

      // Fallback to multi-hop quote
      if (multiHopQuote && !multiHopError) {
        const usdcAmount = multiHopQuote[2]; // Third element is final output amount
        return Number(formatUnits(usdcAmount, stablecoinDecimals));
      }

      return null;
    },
    enabled: enabled && !!tokenAddress && !!stablecoinAddress,
    staleTime: 60_000, // 1 minute cache
    refetchInterval: 300_000, // Refresh every 5 minutes
    retry: false,
  });

  return {
    price: queryResult.data ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error,
  };
};

export default useTokenPriceInUSD;
