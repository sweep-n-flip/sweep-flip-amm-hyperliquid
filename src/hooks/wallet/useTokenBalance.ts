import { type TokenData } from '@/hooks/api/useTokensFromDatabase';
import { useERC20Balance } from './useERC20Balance';
import { useNFTBalance } from './useNFTBalance';
import { usePoolBalance } from './usePoolBalance';

interface UseTokenBalanceResult {
  userBalance: string;
  poolBalance: string;
  userLoading: boolean;
  poolLoading: boolean;
  userError: Error | null;
  poolError: Error | null;
}

export function useTokenBalance(
  token: TokenData | undefined,
  poolAddress?: string
): UseTokenBalanceResult {
  // User balance
  const { balance: userERC20Balance, loading: userERC20Loading, error: userERC20Error } = useERC20Balance(
    token?.isErc20 ? token.address : undefined,
    token?.decimals || 18
  )
  
  const { balance: userNFTBalance, loading: userNFTLoading, error: userNFTError } = useNFTBalance(
    token?.isCollection ? token.address : undefined
  )

  // Pool balance (for "To" token - shows available liquidity)
  const { balance: poolBalance, loading: poolLoading, error: poolError } = usePoolBalance(
    token?.address,
    poolAddress,
    token?.isErc20 ? 'erc20' : 'nft',
    token?.decimals || 18
  )

  return {
    userBalance: token?.isErc20 ? userERC20Balance : userNFTBalance,
    poolBalance,
    userLoading: token?.isErc20 ? userERC20Loading : userNFTLoading,
    poolLoading,
    userError: token?.isErc20 ? userERC20Error : userNFTError,
    poolError,
  }
}
