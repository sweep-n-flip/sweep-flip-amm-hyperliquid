//  Hook for querying LP token balance from Uniswap V2 pairs
import { useMemo } from 'react';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';

import { factoryAbi } from '@/abi/factory';
import { useChainContext } from '@/contexts/ChainContext';
import { getContractAddresses } from '@/services/config/ContractAddresses';

interface Token {
  address: Address;
  symbol: string;
  decimals: number;
  isErc20?: boolean;
  isCollection?: boolean;
  collection?: {
    id: string;
    address: string;
  };
}

interface UseLpTokenBalanceParams {
  tokenA?: Token | null;
  tokenB?: Token | null;
  enabled?: boolean;
}

interface LpTokenBalanceResult {
  balance: bigint;
  balanceFormatted: string;
  totalSupply: bigint;
  sharePercentage: number;
  pairAddress: Address | null;
  wrapperAddress: Address | null;
  pairExists: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useLpTokenBalance({
  tokenB,
  enabled = true
}: UseLpTokenBalanceParams): LpTokenBalanceResult {
  const { address: userAddress } = useAccount();
  const { selectedChainId, selectedChain } = useChainContext();

  //  This hook finds LP token balance for WRAPPED_TOKEN/NFT_COLLECTION pairs
  // tokenA (ETH) is ignored - we always use wrapped token of current chain
  // tokenB should be the NFT collection with:
  //   - address: wrapper contract address (for getPair)
  //   - collection.id: unique collection ID (for identification)
  //   - collection.address: original NFT contract address (for reference)

  // Get contract addresses including wrapped token for current chain
  const contractAddresses = useMemo(() => {
    return getContractAddresses(Number(selectedChainId));
  }, [selectedChainId]);

  // Get factory address
  const factoryAddress = useMemo(() => {
    return selectedChain?.factoryAddress || contractAddresses.factory;
  }, [selectedChain, contractAddresses]);

  // Get wrapped token address for current chain (not mocked)
  const wrappedTokenAddress = useMemo(() => {
    return contractAddresses.weth;
  }, [contractAddresses]);

  // Determine actual token addresses for the LP pair
  const actualTokenA = useMemo(() => {
    //  For LP tokens, always use wrapped token of current chain as tokenA
    // This is the token that pairs with NFT collections in LP pools
    return wrappedTokenAddress;
  }, [wrappedTokenAddress]);
  
  const actualTokenB = useMemo(() => {
    // For NFT collections, use the wrapper address (tokenB.address)
    // This is the address that getPair expects to find the LP pool
    return tokenB?.address;
  }, [tokenB]);
  
  // Get pair address from factory using getPair function - this returns the LP token address
  const { data: pairAddress, isLoading: isPairLoading, error: pairError } = useReadContract({
    address: factoryAddress as Address,
    abi: factoryAbi,
    functionName: 'getPair',
    args: actualTokenA && actualTokenB ? [actualTokenA, actualTokenB] : undefined,
    query: {
      enabled: enabled && !!actualTokenA && !!actualTokenB && !!factoryAddress,
    },
  })
  
  // Check if pair exists (not zero address) - pairAddress IS the LP Token address
  const pairExists = useMemo(() => {
    return pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';
  }, [pairAddress]);

  // Get LP token balance for user - using pairAddress which IS the LP token contract
  const { data: lpBalance, isLoading: isBalanceLoading, error: balanceError } = useReadContract({
    address: pairAddress as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: enabled && !!pairAddress && !!userAddress && pairExists,
      refetchInterval: 10_000, // Refresh every 10 seconds
    },
  });

  // Get total supply for calculating share percentage - using pairAddress as LP token
  const { data: totalSupply, isLoading: isTotalSupplyLoading } = useReadContract({
    address: pairAddress as Address,
    abi: erc20Abi,
    functionName: 'totalSupply',
    query: {
      enabled: enabled && !!pairAddress && pairExists,
      refetchInterval: 30_000, // Refresh every 30 seconds
    },
  });

  // Calculate share percentage
  const sharePercentage = useMemo(() => {
    if (!lpBalance || !totalSupply || totalSupply === BigInt(0)) {
      return 0;
    }
    return (Number(lpBalance) / Number(totalSupply)) * 100;
  }, [lpBalance, totalSupply]);

  // Format balance
  const balanceFormatted = useMemo(() => {
    if (!lpBalance) return '0';
    return formatUnits(lpBalance, 18); // LP tokens have 18 decimals
  }, [lpBalance]);


  // Determine loading state
  const isLoading = isPairLoading || isBalanceLoading || isTotalSupplyLoading;

  // Determine error state
  const error = pairError || balanceError || null;

  return {
    balance: lpBalance || BigInt(0),
    balanceFormatted,
    totalSupply: totalSupply || BigInt(0),
    sharePercentage,
    pairAddress: (pairExists ? pairAddress : null) as Address | null,
    wrapperAddress: null,
    pairExists: !!pairExists,
    isLoading,
    error,
  };
}
