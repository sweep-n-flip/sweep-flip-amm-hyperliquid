import { useMemo } from 'react';
import { erc20Abi, erc721Abi } from 'viem';
import { useReadContract } from 'wagmi';

interface UsePoolBalanceResult {
  balance: string;
  loading: boolean;
  error: Error | null;
}

export function usePoolBalance(
  tokenAddress: string | undefined,
  poolAddress: string | undefined,
  tokenType: 'erc20' | 'nft',
  decimals: number = 18
): UsePoolBalanceResult {
  // For ERC20 tokens, get balance from pool
  const {
    data: erc20BalanceData,
    isLoading: isERC20Loading,
    error: erc20Error,
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [poolAddress as `0x${string}`],
    query: {
      enabled: !!tokenAddress && !!poolAddress && tokenType === 'erc20',
    },
  })

  // For NFT tokens, get balance from pool
  const {
    data: nftBalanceData,
    isLoading: isNFTLoading,
    error: nftError,
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc721Abi,
    functionName: 'balanceOf',
    args: [poolAddress as `0x${string}`],
    query: {
      enabled: !!tokenAddress && !!poolAddress && tokenType === 'nft',
    },
  })

  return useMemo(() => {
    if (tokenType === 'erc20') {
      const rawBalance = erc20BalanceData as bigint | undefined
      const formattedBalance = rawBalance 
        ? (Number(rawBalance) / Math.pow(10, decimals)).toFixed(4)
        : '0'

      return {
        balance: formattedBalance,
        loading: isERC20Loading,
        error: erc20Error,
      }
    } else {
      // For NFT collections, balance is just the count
      const rawBalance = nftBalanceData as bigint | undefined
      const formattedBalance = rawBalance ? rawBalance.toString() : '0'

      return {
        balance: formattedBalance,
        loading: isNFTLoading,
        error: nftError,
      }
    }
  }, [
    tokenType,
    erc20BalanceData,
    isERC20Loading,
    erc20Error,
    nftBalanceData,
    isNFTLoading,
    nftError,
    decimals,
  ])
}
