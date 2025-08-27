//  Comprehensive balance validation for swap operations
import { useMemo } from 'react';
import { type Address, erc20Abi, erc721Abi, formatUnits, parseUnits } from 'viem';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';

interface Token {
  address: Address;
  symbol: string;
  decimals: number;
  isErc20?: boolean;
  isCollection?: boolean;
}

interface BalanceValidationResult {
  hasEnoughBalance: boolean;
  userBalance: string;
  userBalanceFormatted: string;
  requiredAmount: string;
  requiredAmountFormatted: string;
  validationError: string | null;
  isLoading: boolean;
}

interface UseBalanceValidationParams {
  token: Token | null;
  amount: string;
  tokenIds?: string[];
  enabled?: boolean;
}

export function useBalanceValidation({
  token,
  amount,
  tokenIds,
  enabled = true
}: UseBalanceValidationParams): BalanceValidationResult {
  const { address: userAddress } = useAccount();

  // For ERC20 tokens, check balance via balanceOf
  const { data: erc20Balance, isLoading: isLoadingErc20 } = useReadContract({
    address: token?.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: enabled && !!userAddress && !!token?.isErc20 && !!token?.address,
    },
  });

  // For NFT collections, check balance via balanceOf
  const { data: nftBalance, isLoading: isLoadingNft } = useReadContract({
    address: token?.address,
    abi: erc721Abi,
    functionName: 'balanceOf',
    args: [userAddress as Address],
    query: {
      enabled: enabled && !!userAddress && !!token?.isCollection && !!token?.address,
    },
  });

  // For NFT collections, also check ownership of specific token IDs
  const nftOwnershipQueries = useMemo(() => {
    if (!token?.isCollection || !tokenIds?.length || !userAddress) {
      return [];
    }

    return tokenIds.map(tokenId => ({
      address: token.address,
      abi: erc721Abi,
      functionName: 'ownerOf' as const,
      args: [BigInt(tokenId)],
    }));
  }, [token?.isCollection, token?.address, tokenIds, userAddress]);

  const { data: ownershipData, isLoading: isLoadingOwnership } = useReadContracts({
    contracts: nftOwnershipQueries,
    query: {
      enabled: enabled && nftOwnershipQueries.length > 0,
    },
  });

  return useMemo(() => {
    const loading = isLoadingErc20 || isLoadingNft || isLoadingOwnership;

    // Return loading state if still fetching data
    if (loading) {
      return {
        hasEnoughBalance: false,
        userBalance: '0',
        userBalanceFormatted: '0',
        requiredAmount: amount || '0',
        requiredAmountFormatted: amount || '0',
        validationError: null,
        isLoading: true,
      };
    }

    // Return early if validation is disabled or missing required data
    if (!enabled || !token || !userAddress || !amount || amount === '0') {
      return {
        hasEnoughBalance: true,
        userBalance: '0',
        userBalanceFormatted: '0',
        requiredAmount: amount || '0',
        requiredAmountFormatted: amount || '0',
        validationError: null,
        isLoading: false,
      };
    }

    try {
      // ERC20 token validation
      if (token.isErc20) {
        const userBalanceBigInt = (erc20Balance as bigint) || BigInt(0);
        const requiredAmountBigInt = parseUnits(amount, token.decimals);

        const userBalanceFormatted = formatUnits(userBalanceBigInt, token.decimals);
        const requiredAmountFormatted = formatUnits(requiredAmountBigInt, token.decimals);

        const hasEnoughBalance = userBalanceBigInt >= requiredAmountBigInt;
        const validationError = hasEnoughBalance 
          ? null 
          : `Insufficient ${token.symbol}. You have ${userBalanceFormatted} but need ${requiredAmountFormatted}.`;

        return {
          hasEnoughBalance,
          userBalance: userBalanceBigInt.toString(),
          userBalanceFormatted,
          requiredAmount: requiredAmountBigInt.toString(),
          requiredAmountFormatted,
          validationError,
          isLoading: false,
        };
      }

      // NFT collection validation
      if (token.isCollection) {
        const userNftBalance = (nftBalance as bigint) || BigInt(0);
        const requiredQuantity = BigInt(tokenIds?.length || parseInt(amount) || 0);

        // Check if user has enough NFTs in the collection
        const hasEnoughNfts = userNftBalance >= requiredQuantity;

        // Check ownership of specific NFT token IDs if provided
        let ownsAllTokens = true;
        let missingTokenIds: string[] = [];

        if (tokenIds?.length && ownershipData) {
          for (let i = 0; i < tokenIds.length; i++) {
            const ownershipResult = ownershipData[i];
            if (ownershipResult.status === 'success') {
              const owner = ownershipResult.result as Address;
              if (owner.toLowerCase() !== userAddress.toLowerCase()) {
                ownsAllTokens = false;
                missingTokenIds.push(tokenIds[i]);
              }
            } else {
              // If we can't determine ownership, assume user doesn't own it
              ownsAllTokens = false;
              missingTokenIds.push(tokenIds[i]);
            }
          }
        }

        const hasEnoughBalance = hasEnoughNfts && ownsAllTokens;
        
        let validationError: string | null = null;
        if (!hasEnoughNfts) {
          validationError = `Insufficient ${token.symbol} NFTs. You have ${userNftBalance.toString()} but need ${requiredQuantity.toString()}.`;
        } else if (!ownsAllTokens) {
          validationError = `You don't own the selected NFTs: ${missingTokenIds.join(', ')}`;
        }

        return {
          hasEnoughBalance,
          userBalance: userNftBalance.toString(),
          userBalanceFormatted: userNftBalance.toString(),
          requiredAmount: requiredQuantity.toString(),
          requiredAmountFormatted: requiredQuantity.toString(),
          validationError,
          isLoading: false,
        };
      }

      // Fallback for unknown token types
      return {
        hasEnoughBalance: true,
        userBalance: '0',
        userBalanceFormatted: '0',
        requiredAmount: amount,
        requiredAmountFormatted: amount,
        validationError: null,
        isLoading: false,
      };

    } catch (error) {
      console.error('[Balance Validation] Error validating balance:', error);
      return {
        hasEnoughBalance: false,
        userBalance: '0',
        userBalanceFormatted: '0',
        requiredAmount: amount,
        requiredAmountFormatted: amount,
        validationError: 'Error validating balance',
        isLoading: false,
      };
    }
  }, [
    token,
    userAddress,
    amount,
    tokenIds,
    enabled,
    erc20Balance,
    nftBalance,
    ownershipData,
    isLoadingErc20,
    isLoadingNft,
    isLoadingOwnership,
  ]);
}
