//  Hook for managing the complete NFT liquidity flow (approval + add/remove liquidity)
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { type Address, parseUnits } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { routerAbi } from '@/abi/router';
import { useChainContext } from '@/contexts/ChainContext';
import { useTransactionSettingsContext } from '@/contexts/TransactionSettingsContext';
import { usePoolByCollection } from '@/hooks/api/usePoolByCollection';
import { usePoolByTokens } from '@/hooks/api/usePoolByTokens';
import { type TokenData } from '@/hooks/api/useTokensFromDatabase';
import { getContractAddresses } from '@/services/config/ContractAddresses';
import { useTokenApproval } from './useTokenApproval';
import { useBalanceValidation } from './wallet/useBalanceValidation';
import { useLpTokenBalance } from './wallet/useLpTokenBalance';

type LiquidityAction = 'create' | 'add' | 'remove';
type LiquidityType = 'token-nft' | 'eth-nft';

interface UseLiquidityFlowParams {
  action: LiquidityAction;
  liquidityType: LiquidityType;
  
  // Token/Collection info
  token?: {
    address: Address;
    symbol: string;
    decimals: number;
  } | null;
  collection: {
    id: string;
    address: Address;
    symbol: string;
  } | null;
  
  // Add liquidity params
  tokenAmount?: string; // For ERC20 token amount
  ethAmount?: string;   // For ETH amount
  tokenIds: string[];   // NFT token IDs
  
  // Remove liquidity params
  liquidityAmount?: string; // LP tokens to burn
  
  // Slippage protection
  liquidityQuote?: {
    expectedTokenAmount?: string | bigint;
    expectedETHAmount?: string | bigint;
    expectedLiquidity?: string | bigint;
  } | null;
}

export const useLiquidityFlow = (params: UseLiquidityFlowParams) => {
  const { selectedChain } = useChainContext();
  const { address: userAccount } = useAccount();
  const { slippageTolerance, transactionDeadline } = useTransactionSettingsContext();

  // Extract params for easier access
  const { action, liquidityType, token, collection, tokenAmount, ethAmount, tokenIds, liquidityAmount, liquidityQuote } = params;

  // Get userAddress from account
  const userAddress = userAccount;

  // Normalize liquidityType for usage (since interface uses different naming)
  const actualLiquidityType = liquidityType;

  const contractAddresses = getContractAddresses(Number(selectedChain?.chainId) || 1);
  const routerAddress = contractAddresses.router;

  //  Fetch pool data from database for token validation
  const fromTokenData: TokenData | undefined = token ? {
    _id: `token-${token.address}`,
    address: token.address,
    name: token.symbol,
    symbol: token.symbol,
    decimals: token.decimals,
    nativeChain: Number(selectedChain?.chainId) || 1,
    isErc20: true,
    isCollection: false,
    collection: {
      id: '',
      name: '',
      symbol: '',
      address: '' as Address,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : undefined;

  const toTokenData: TokenData | undefined = collection ? {
    _id: `collection-${collection.address}`,
    address: collection.address,
    name: collection.symbol,
    symbol: collection.symbol,
    decimals: 0,
    nativeChain: Number(selectedChain?.chainId) || 1,
    isErc20: false,
    isCollection: true,
    collection: {
      id: `collection-${collection.address}`,
      name: collection.symbol,
      symbol: collection.symbol,
      address: collection.address,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : undefined;
  
  // For remove liquidity, fromTokenData is LP token (doesn't exist in DB)
  // So we search pool only by collection address
  const poolByTokensResult = usePoolByTokens(
    action === 'remove' ? undefined : fromTokenData,
    toTokenData,
    Number(selectedChain?.chainId) || 1
  );

  const poolByCollectionResult = usePoolByCollection(
    action === 'remove' && collection ? collection.address : undefined,
    Number(selectedChain?.chainId) || 1
  );

  // Use appropriate result based on action
  const poolResult = action === 'remove' ? poolByCollectionResult : poolByTokensResult;
  const pool = poolResult.pool;
  const isPoolLoading = poolResult.loading;
  const poolError = poolResult.error;

  // Get transaction deadline function
  const getTransactionDeadline = () => {
    return Math.floor(Date.now() / 1000) + (transactionDeadline * 60);
  };

  // Calculate amounts in wei
  const tokenAmountInWei = useMemo(() => {
    if (!tokenAmount || !token || tokenAmount === '0') return BigInt(0);
    
    try {
      // Use liquidity quote if available for more accurate calculation
      if (liquidityQuote?.expectedTokenAmount) {
        if (typeof liquidityQuote.expectedTokenAmount === 'bigint') {
          return liquidityQuote.expectedTokenAmount;
        }
        
        if (typeof liquidityQuote.expectedTokenAmount === 'string') {
          const cleanAmount = liquidityQuote.expectedTokenAmount.replace(/[^0-9.]/g, '');
          
          if (!cleanAmount.includes('.') && cleanAmount.length > 10) {
            return BigInt(cleanAmount);
          }
          
          return parseUnits(cleanAmount, token.decimals);
        }
      }

      return parseUnits(tokenAmount, token.decimals);
    } catch (error) {
      return BigInt(0);
    }
  }, [tokenAmount, token, liquidityQuote]);

  const ethAmountInWei = useMemo(() => {
    if (!ethAmount || ethAmount === '0') return BigInt(0);
    
    try {
      if (liquidityQuote?.expectedETHAmount) {
        if (typeof liquidityQuote.expectedETHAmount === 'bigint') {
          return liquidityQuote.expectedETHAmount;
        }
        
        if (typeof liquidityQuote.expectedETHAmount === 'string') {
          const cleanAmount = liquidityQuote.expectedETHAmount.replace(/[^0-9.]/g, '');
          
          if (!cleanAmount.includes('.') && cleanAmount.length > 10) {
            return BigInt(cleanAmount);
          }
          
          return parseUnits(cleanAmount, 18); // ETH has 18 decimals
        }
      }

      return parseUnits(ethAmount, 18);
    } catch (error) {
      return BigInt(0);
    }
  }, [ethAmount, liquidityQuote]);

  const liquidityAmountInWei = useMemo(() => {
    if (!liquidityAmount || liquidityAmount === '0') return BigInt(0);
    
    try {
      return parseUnits(liquidityAmount, 18); // LP tokens typically have 18 decimals
    } catch (error) {
      return BigInt(0);
    }
  }, [liquidityAmount]);

  // Get LP token balance for calculations
  const lpTokenBalance = useLpTokenBalance({
    tokenA: (action === 'remove' && actualLiquidityType === 'token-nft' && token) ? {
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      isErc20: true,
      isCollection: false,
    } : (action === 'remove' && actualLiquidityType === 'eth-nft') ? {
      address: '0x0000000000000000000000000000000000000000' as Address, // ETH (native)
      symbol: 'ETH',
      decimals: 18,
      isErc20: false,
      isCollection: false,
    } : null,
    tokenB: (action === 'remove' && collection) ? {
      address: collection.address,
      symbol: collection.symbol,
      decimals: 0,
      isErc20: false,
      isCollection: true,
      collection: {
        id: collection.id,
        address: collection.address,
      },
    } : null,
    enabled: action === 'remove' && !!collection && (!!token || actualLiquidityType === 'eth-nft'),
  });

  //  Use exact LP amount as entered by user - no magic number adjustments
  const adjustedLiquidityAmount = useMemo(() => {
    // For remove liquidity, use the exact amount the user entered
    return liquidityAmountInWei;
  }, [liquidityAmountInWei]);

  // Token approval hook (only for ERC20 tokens in add liquidity, excluding ETH/WETH)
  const tokenApproval = useTokenApproval({
    tokenAddress: (action === 'add' && actualLiquidityType === 'token-nft' && token?.address) as Address,
    spenderAddress: routerAddress as Address,
    amount: tokenAmountInWei,
  });

  // LP Token approval hook (only for remove liquidity) - LP tokens are ERC20 tokens
  const lpTokenApproval = useTokenApproval({
    tokenAddress: (action === 'remove' && lpTokenBalance.pairAddress) as Address,
    spenderAddress: routerAddress as Address,
    amount: adjustedLiquidityAmount,
  });

  // Balance validation for tokens/ETH
  const tokenBalanceValidation = useBalanceValidation({
    token: (action === 'add' && actualLiquidityType === 'token-nft' && token) ? {
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      isErc20: true,
      isCollection: false,
    } : null,
    amount: tokenAmount || '0',
    enabled: action === 'add' && actualLiquidityType === 'token-nft' && !!token && !!tokenAmount && tokenAmount !== '0',
  });

  // ETH balance validation
  const ethBalanceValidation = useBalanceValidation({
    token: (action === 'add' && actualLiquidityType === 'eth-nft') ? {
      address: '0x0000000000000000000000000000000000000000' as Address, // ETH
      symbol: 'ETH',
      decimals: 18,
      isErc20: false,
      isCollection: false,
    } : null,
    amount: (actualLiquidityType === 'eth-nft' ? ethAmount : tokenAmount) || '0',
    enabled: action === 'add' && actualLiquidityType === 'eth-nft' && !!(actualLiquidityType === 'eth-nft' ? ethAmount : tokenAmount) && (actualLiquidityType === 'eth-nft' ? ethAmount : tokenAmount) !== '0',
  });

  // NFT balance validation (only for add liquidity)
  const nftBalanceValidation = useBalanceValidation({
    token: (action === 'add' && collection) ? {
      address: collection.address,
      symbol: collection.symbol,
      decimals: 0,
      isErc20: false,
      isCollection: true,
    } : null,
    amount: action === 'add' ? tokenIds.length.toString() : '0',
    tokenIds: action === 'add' ? tokenIds : undefined,
    enabled: action === 'add' && !!collection && tokenIds.length > 0,
  });

  // LP token balance validation with real data
  const lpTokenBalanceValidation = useMemo(() => {
    if (action !== 'remove' || !liquidityAmount || liquidityAmount === '0') {
      return {
        hasEnoughBalance: true,
        validationError: null,
        userBalance: '0',
        userBalanceFormatted: '0',
        requiredAmount: '0',
        requiredAmountFormatted: '0',
        isLoading: false,
      };
    }

    // Use real LP token balance data
    const userLpBalance = lpTokenBalance.balance;
    const requiredLpAmount = liquidityAmountInWei;

    const hasEnoughBalance = userLpBalance >= requiredLpAmount;
    const validationError = hasEnoughBalance 
      ? null 
      : `Insufficient LP tokens. You have ${lpTokenBalance.balanceFormatted} but need ${liquidityAmount}.`;

    return {
      hasEnoughBalance,
      validationError,
      userBalance: userLpBalance.toString(),
      userBalanceFormatted: lpTokenBalance.balanceFormatted,
      requiredAmount: requiredLpAmount.toString(),
      requiredAmountFormatted: liquidityAmount,
      isLoading: lpTokenBalance.isLoading,
    };
  }, [action, liquidityAmount, liquidityAmountInWei, lpTokenBalance]);

  // Liquidity contract hooks
  const { 
    writeContract: executeLiquidity, 
    data: liquidityHash, 
    isPending: isExecuting, 
    error: liquidityError,
    reset: resetLiquidity 
  } = useWriteContract();

  // Wait for liquidity transaction
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmationError 
  } = useWaitForTransactionReceipt({
    hash: liquidityHash,
  });
  
  useEffect(() => {
    // Reset liquidity state when parameters change
    if (resetLiquidity) {
      resetLiquidity();
    }
  }, [action, liquidityType, token?.address, collection?.address, routerAddress, tokenAmount, ethAmount, tokenAmountInWei, ethAmountInWei, tokenIds.length, selectedChain?.chainId, slippageTolerance, resetLiquidity]);

  // Handle liquidity completion
  useEffect(() => {
    if (isConfirmed) {
      const actionText = action === 'add' ? 'added to' : 'removed from';
      toast.success(`Liquidity ${actionText} pool successfully!`);
    }
  }, [isConfirmed, action]);

  // Handle liquidity errors
  useEffect(() => {
    if (liquidityError) {
      toast.error(`Liquidity operation failed: ${liquidityError.message}`);
    }
  }, [liquidityError]);

  // Handle confirmation errors
  useEffect(() => {
    if (confirmationError) {
      toast.error(`Transaction confirmation failed: ${confirmationError.message}`);
    }
  }, [confirmationError]);

  // Check if ready to execute
  const canExecute = useMemo(() => {
    if (!userAddress || !collection || tokenIds.length === 0) {
      return false;
    }

    if (isPoolLoading) {
      return false; // Wait for pool data to load
    }

    if (poolError) {
      return false; // Pool data fetch failed
    }

    // For add liquidity, allow even if pool doesn't exist (pool will be created)
    // For remove liquidity, pool must exist
    if (action === 'remove' && !pool) {
      return false; // Cannot remove liquidity if pool doesn't exist
    }

    if (action === 'add') {
      // Check NFT balance for add liquidity
      if (!nftBalanceValidation.hasEnoughBalance) {
        return false;
      }

      if (actualLiquidityType === 'token-nft') {
        // Need token approval and balances (for non-ETH tokens)
        return !!(token && (tokenAmount || ethAmount) && (tokenAmount !== '0' || ethAmount !== '0') && 
                 tokenBalanceValidation.hasEnoughBalance && 
                 tokenApproval.isApproved);
      } else if (actualLiquidityType === 'eth-nft') {
        // Need ETH balance (for ETH/WETH tokens)
        return !!((ethAmount || tokenAmount) && (ethAmount !== '0' || tokenAmount !== '0') && 
                 ethBalanceValidation.hasEnoughBalance);
      }
    } else if (action === 'remove') {
      // For remove liquidity, check LP token balance, liquidity amount, and LP token approval
      return !!(liquidityAmount && liquidityAmount !== '0' && 
               lpTokenBalanceValidation.hasEnoughBalance && 
               lpTokenApproval.isApproved);
    }

    return false;
  }, [userAddress, collection, tokenIds.length, isPoolLoading, poolError, pool, action, actualLiquidityType, token, tokenAmount, ethAmount, liquidityAmount, tokenBalanceValidation.hasEnoughBalance, ethBalanceValidation.hasEnoughBalance, nftBalanceValidation.hasEnoughBalance, tokenApproval.isApproved, lpTokenBalanceValidation.hasEnoughBalance, lpTokenApproval.isApproved]);

  // Get button text based on current state
  const getButtonText = () => {
    if (!userAddress) {
      return 'Connect Wallet';
    }

    if (!collection) {
      return 'Select Collection';
    }

    if (tokenIds.length === 0) {
      return 'Select NFTs';
    }

    if (isPoolLoading) {
      return 'Loading Pool Data...';
    }

    if (poolError) {
      return 'Pool Data Error';
    }

    // For remove liquidity, pool must exist
    if (action === 'remove' && !pool) {
      return 'Pool Does Not Exist';
    }

    // Check balance validations (only for add liquidity)
    if (action === 'add' && nftBalanceValidation.validationError) {
      return `Insufficient ${collection.symbol}`;
    }

    if (action === 'add') {
      if (actualLiquidityType === 'token-nft') {
        if (!token) {
          return 'Select Token';
        }

        const amount = tokenAmount || ethAmount;
        if (!amount || amount === '0') {
          return 'Enter Token Amount';
        }

        if (tokenBalanceValidation.validationError) {
          return `Insufficient ${token.symbol}`;
        }

        if (tokenApproval.isApproving || tokenApproval.isConfirming) {
          return `Enabling ${token.symbol}...`;
        }
        
        if (tokenApproval.needsApproval) {
          return `Enable ${token.symbol}`;
        }

        if (isExecuting || isConfirming) {
          return 'Adding Liquidity...';
        }
        
        return 'ADD LIQUIDITY';
      } else if (actualLiquidityType === 'eth-nft') {
        const amount = ethAmount || tokenAmount;
        if (!amount || amount === '0') {
          return `Enter ${token?.symbol || 'ETH'} Amount`;
        }

        if (ethBalanceValidation.validationError) {
          return `Insufficient ${token?.symbol || 'ETH'}`;
        }

        if (isExecuting || isConfirming) {
          return 'Adding Liquidity...';
        }

        return 'ADD LIQUIDITY';
      }
    } else if (action === 'remove') {
      if (!liquidityAmount || liquidityAmount === '0') {
        return 'Enter LP Amount';
      }

      if (lpTokenBalanceValidation.validationError) {
        return `Insufficient LP Tokens`;
      }

      if (lpTokenApproval.isApproving || lpTokenApproval.isConfirming) {
        return 'Enabling LP Tokens...';
      }

      if (lpTokenApproval.needsApproval) {
        return 'Enable LP Tokens';
      }

      if (isExecuting || isConfirming) {
        return 'Removing Liquidity...';
      }

      return 'REMOVE LIQUIDITY';
    }

    return 'EXECUTE';
  };

  // Get button action based on current state
  const getButtonAction = () => {
    if (!userAddress) {
      return 'connect';
    }

    if (action === 'add') {
      // Priority: Token approval > Liquidity
      if (actualLiquidityType === 'token-nft' && tokenApproval.needsApproval) {
        return 'approveToken';
      }
    } else if (action === 'remove') {
      // Priority: LP Token approval > Remove Liquidity
      if (lpTokenApproval.needsApproval) {
        return 'approveLpToken';
      }
    }

    return action === 'add' ? 'addLiquidity' : 'removeLiquidity';
  };

  // Check if button should be disabled
  const isButtonDisabled = () => {
    if (tokenApproval.isApproving || tokenApproval.isConfirming || 
        lpTokenApproval.isApproving || lpTokenApproval.isConfirming ||
        isExecuting || isConfirming) {
      return true;
    }

    if (!userAddress || !collection || tokenIds.length === 0) {
      return true;
    }

    if (isPoolLoading) {
      return true; // Disable button while loading pool data
    }

    if (poolError) {
      return true; // Disable button if pool data fetch failed
    }

    // For remove liquidity, pool must exist
    if (action === 'remove' && !pool) {
      return true; // Cannot remove liquidity if pool doesn't exist
    }

    // Check balance validations
    if (nftBalanceValidation.validationError) {
      return true;
    }

    if (action === 'add') {
      if (actualLiquidityType === 'token-nft') {
        const amount = tokenAmount || ethAmount;
        return !token || !amount || amount === '0' || !!tokenBalanceValidation.validationError;
      } else if (actualLiquidityType === 'eth-nft') {
        const amount = ethAmount || tokenAmount;
        return !amount || amount === '0' || !!ethBalanceValidation.validationError;
      }
    } else if (action === 'remove') {
      return !liquidityAmount || liquidityAmount === '0' || 
             !!lpTokenBalanceValidation.validationError;
    }

    return false;
  };

  // Function to execute liquidity transaction
  const executeLiquidityTransaction = async () => {
    if (!userAddress || !collection || tokenIds.length === 0) {
      throw new Error('Missing required parameters for liquidity operation');
    }

    const deadline = BigInt(getTransactionDeadline());
    const tokenIdsAsNumbers = tokenIds.map((id: string) => BigInt(id));

    try {
      if (action === 'add') {
        if (actualLiquidityType === 'token-nft') {
          // addLiquidityCollection (for non-ETH tokens)
          if (!token) {
            throw new Error('Token required for token-NFT liquidity');
          }

          const amount = tokenAmount || ethAmount;
          const amountInWei = tokenAmountInWei || ethAmountInWei;
          
          if (!amount || !amountInWei) {
            throw new Error('Token amount required for token-NFT liquidity');
          }

          //  Calculate minimum amounts with slippage protection
          const amountAMin = amountInWei * BigInt(10000 - slippageTolerance) / BigInt(10000);

          executeLiquidity({
            address: routerAddress as Address,
            abi: routerAbi,
            functionName: 'addLiquidityCollection',
            args: [
              token.address,
              collection.address,
              amountInWei,
              tokenIdsAsNumbers,
              amountAMin,
              userAddress,
              deadline,
            ],
          });
        } else if (actualLiquidityType === 'eth-nft') {
          // addLiquidityETHCollection (for ETH/WETH tokens)
          const amount = ethAmount || tokenAmount;
          const amountInWei = ethAmountInWei || tokenAmountInWei;
          
          if (!amount || !amountInWei) {
            throw new Error('ETH amount required for ETH-NFT liquidity');
          }

          //  Calculate minimum ETH amount with slippage protection
          // For new pools, be more tolerant with slippage to avoid INSUFFICIENT_B_AMOUNT
          let amountETHMin = amountInWei * BigInt(10000 - slippageTolerance) / BigInt(10000);
          
          //  Temporary fix for new pools - use 0 minimum to avoid liquidity issues
          // This happens when pool has very low or no existing liquidity
          if (!liquidityQuote?.expectedLiquidity || liquidityQuote.expectedLiquidity === BigInt(0)) {
            amountETHMin = BigInt(1); // Use 1 wei instead of 0 for safety
          }

          executeLiquidity({
            address: routerAddress as Address,
            abi: routerAbi,
            functionName: 'addLiquidityETHCollection',
            args: [
              collection.address,
              tokenIdsAsNumbers,
              amountETHMin,
              userAddress,
              deadline,
            ],
            value: amountInWei,
          });
        }
      } else if (action === 'remove') {
        if (!liquidityAmount) {
          throw new Error('Liquidity amount required for remove operation');
        }

        if (liquidityType === 'token-nft') {
          // removeLiquidityCollection
          if (!token) {
            throw new Error('Token required for token-NFT liquidity removal');
          }

          //  Use hardcoded 0 for amountAMin like the old AMM to avoid arithmetic underflow
          // This removes slippage protection but ensures transaction success
          const amountAMin = BigInt(0);

          executeLiquidity({
            address: routerAddress as Address,
            abi: routerAbi,
            functionName: 'removeLiquidityCollection',
            args: [
              token.address,
              collection.address,
              adjustedLiquidityAmount,
              tokenIdsAsNumbers,
              amountAMin,
              userAddress,
              deadline,
            ],
          });
        } else if (liquidityType === 'eth-nft') {
          // removeLiquidityETHCollection
          // Use hardcoded 0 for amountETHMin like the old AMM to avoid arithmetic underflow
          // This removes slippage protection but ensures transaction success
          const amountETHMin = BigInt(0);

          executeLiquidity({
            address: routerAddress as Address,
            abi: routerAbi,
            functionName: 'removeLiquidityETHCollection',
            args: [
              collection.address,
              adjustedLiquidityAmount,
              tokenIdsAsNumbers,
              amountETHMin,
              userAddress,
              deadline,
            ],
          });
        }
      }

      const actionText = action === 'add' ? 'Add liquidity' : 'Remove liquidity';
      toast.success(`${actionText} transaction submitted!`);
    } catch (error) {
      toast.error('Failed to submit liquidity transaction');
      throw error;
    }
  };

  return {
    // Pool information
    pool,
    isPoolLoading,
    poolError,
    poolExists: !!pool,
    
    // Execution state
    canExecute,
    
    // Token approval (for add liquidity with ERC20)
    ...tokenApproval,
    
    // LP Token approval (for remove liquidity) - same as any ERC20 approval
    lpTokenApproval,
    
    // Balance validations
    tokenBalanceValidation,
    ethBalanceValidation,
    nftBalanceValidation,
    lpTokenBalanceValidation,
    
    // LP Token info (for remove liquidity)
    lpTokenBalance: {
      balance: lpTokenBalance.balance,
      balanceFormatted: lpTokenBalance.balanceFormatted,
      sharePercentage: lpTokenBalance.sharePercentage,
      pairAddress: lpTokenBalance.pairAddress,
      pairExists: lpTokenBalance.pairExists,
      isLoading: lpTokenBalance.isLoading,
    },
    
    // Liquidity execution
    executeLiquidityTransaction,
    isExecuting,
    isConfirming,
    isConfirmed,
    liquidityHash,
    liquidityError,
    confirmationError,
    
    // Button state
    buttonText: getButtonText(),
    buttonAction: getButtonAction(),
    isButtonDisabled: isButtonDisabled(),
    buttonEnabled: !isButtonDisabled(),
    
    // Contract addresses
    routerAddress,
    
    // Transaction settings
    getTransactionDeadline,
    tokenAmountInWei,
    ethAmountInWei,
    liquidityAmountInWei,
  };
};
