import { useMemo } from 'react';
import { erc721Abi } from 'viem';
import { useAccount, useReadContract } from 'wagmi';

interface UseNFTBalanceResult {
  balance: string;
  loading: boolean;
  error: Error | null;
}

export function useNFTBalance(
  collectionAddress: string | undefined
): UseNFTBalanceResult {
  const { address: userAddress } = useAccount();

  // Use useReadContract for NFT balance
  const {
    data: nftBalanceData,
    isLoading,
    error,
  } = useReadContract({
    address: collectionAddress as `0x${string}`,
    abi: erc721Abi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && !!collectionAddress,
    },
  });

  return useMemo(() => {
    // Return loading state if no user address or collection address
    if (!userAddress || !collectionAddress) {
      return {
        balance: '0',
        loading: false,
        error: null,
      };
    }

    // For NFT collections, balance is just the count
    const rawBalance = nftBalanceData as bigint | undefined;
    const formattedBalance = rawBalance ? rawBalance.toString() : '0';

    return {
      balance: formattedBalance,
      loading: isLoading,
      error: error,
    };
  }, [nftBalanceData, isLoading, error, userAddress, collectionAddress]);
}
