import { useMemo } from 'react';
import { erc20Abi } from 'viem';
import { useAccount, useBalance, useReadContract } from 'wagmi';

interface UseERC20BalanceResult {
  balance: string;
  loading: boolean;
  error: Error | null;
}

export function useERC20Balance(
  tokenAddress: string | undefined,
  decimals: number = 18
): UseERC20BalanceResult {
  const { address: userAddress } = useAccount()

  // Check if it's native token (ETH)
  const isNativeToken = tokenAddress === '0x0000000000000000000000000000000000000000' || !tokenAddress

  // Use useBalance for native tokens (ETH)
  const {
    data: nativeBalanceData,
    isLoading: isNativeLoading,
    error: nativeError,
  } = useBalance({
    address: userAddress,
    query: {
      enabled: !!userAddress && isNativeToken,
    },
  })

  // Use useReadContract for ERC20 tokens
  const {
    data: erc20BalanceData,
    isLoading: isERC20Loading,
    error: erc20Error,
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && !!tokenAddress && !isNativeToken,
    },
  })

  return useMemo(() => {
    if (isNativeToken) {
      return {
        balance: nativeBalanceData?.formatted || '0',
        loading: isNativeLoading,
        error: nativeError,
      }
    }

    // For ERC20 tokens, format the balance
    const rawBalance = erc20BalanceData as bigint | undefined
    const formattedBalance = rawBalance 
      ? (Number(rawBalance) / Math.pow(10, decimals)).toFixed(4)
      : '0'

    return {
      balance: formattedBalance,
      loading: isERC20Loading,
      error: erc20Error,
    }
  }, [
    isNativeToken,
    nativeBalanceData,
    isNativeLoading,
    nativeError,
    erc20BalanceData,
    isERC20Loading,
    erc20Error,
    decimals,
  ])
}
