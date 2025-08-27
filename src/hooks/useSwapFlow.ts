//  Hook for managing the complete swap flow (approval + swap)
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { type Address, parseUnits } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

import { routerAbi } from '@/abi/router';
import { useChainContext } from '@/contexts/ChainContext';
import { useTransactionSettingsContext } from '@/contexts/TransactionSettingsContext';
import { getContractAddresses } from '@/services/config/ContractAddresses';
import { useTokenApproval } from './useTokenApproval';
import { useBalanceValidation } from './wallet/useBalanceValidation';

interface UseSwapFlowParams {
  fromToken: {
    address: Address;
    symbol: string;
    decimals: number;
    isErc20: boolean;
    isCollection?: boolean;
  } | null;
  toToken: {
    address: Address;
    symbol: string;
    isCollection: boolean;
    isErc20?: boolean;
  } | null;
  amount: string;
  tokenIds?: string[];
  swapType: 'erc20-to-nft' | 'nft-to-erc20' | 'native-to-nft' | 'nft-to-native';
  swapQuote?: {
    amountIn?: string | bigint;
    amountOut?: string | bigint;
  } | null;
}

export const useSwapFlow = ({ fromToken, toToken, amount, tokenIds, swapType, swapQuote }: UseSwapFlowParams) => {
  const { address: userAddress } = useAccount();
  const { selectedChainId, selectedChain } = useChainContext();
  const { getTransactionDeadline, slippageTolerance } = useTransactionSettingsContext();

  // Get router contract address
  const routerAddress = useMemo(() => {
    const addresses = getContractAddresses(Number(selectedChainId));
    return selectedChain?.routerAddress || addresses.router;
  }, [selectedChainId, selectedChain]);

  // Calculate amount in wei for approval
  const amountInWei = useMemo(() => {
    if (!amount || !fromToken || amount === '0') return BigInt(0);
    
    try {
      // Use swap quote amount if available for more accurate approval
      if (swapQuote?.amountIn) {
        if (typeof swapQuote.amountIn === 'bigint') {
          return swapQuote.amountIn;
        }
        
        // Handle string conversion more safely
        if (typeof swapQuote.amountIn === 'string') {
          // Clean the string - remove any non-numeric characters except decimal point
          const cleanAmount = swapQuote.amountIn.replace(/[^0-9.]/g, '');
          
          // Check if it's already in wei format (no decimal point, large number)
          if (!cleanAmount.includes('.') && cleanAmount.length > 10) {
            return BigInt(cleanAmount);
          }
          
          // If it has decimals, treat as ETH/token units and convert to wei
          if (fromToken.isErc20) {
            return parseUnits(cleanAmount, fromToken.decimals);
          } else {
            return BigInt(cleanAmount.split('.')[0] || '0'); // Take integer part for NFTs
          }
        }
        
        // If it's a number, convert to string first
        if (typeof swapQuote.amountIn === 'number') {
          const stringAmount: string = Number(swapQuote.amountIn).toString();
          if (fromToken.isErc20) {
            return parseUnits(stringAmount, fromToken.decimals);
          } else {
            return BigInt(Math.floor(swapQuote.amountIn));
          }
        }
      }

      // Fallback: use the amount parameter
      // For ERC20 tokens, convert to wei using decimals
      if (fromToken.isErc20) {
        return parseUnits(amount, fromToken.decimals);
      }
      // For NFTs, amount represents quantity (no decimals needed)
      return BigInt(amount);
    } catch (error) {
      return BigInt(0);
    }
  }, [amount, fromToken, swapQuote]);

  // Token approval hook (only for ERC20 tokens, not for native ETH)
  const needsApproval = swapType === 'erc20-to-nft' && fromToken?.isErc20;
  const tokenApproval = useTokenApproval({
    tokenAddress: needsApproval ? (fromToken?.address as Address) : '0x0000000000000000000000000000000000000000',
    spenderAddress: routerAddress as Address,
    amount: amountInWei,
  });

  // For native swaps, create a mock approval object
  const mockApproval = {
    needsApproval: false,
    isApproved: true,
    isApproving: false,
    isConfirming: false,
    currentAllowance: BigInt(0),
    approveToken: async () => {},
  };

  // Get the appropriate approval object based on swap type
  const approval = needsApproval ? tokenApproval : mockApproval;

  // Balance validation for FROM token
  const balanceValidation = useBalanceValidation({
    token: fromToken ? {
      address: fromToken.address,
      symbol: fromToken.symbol,
      decimals: fromToken.decimals,
      isErc20: fromToken.isErc20,
      isCollection: fromToken.isCollection,
    } : null,
    amount,
    tokenIds: swapType === 'nft-to-erc20' ? tokenIds : undefined,
    enabled: !!fromToken && !!amount && amount !== '0',
  });

  // Swap contract hooks
  const { 
    writeContract: executeSwap, 
    data: swapHash, 
    isPending: isSwapping, 
    error: swapError,
    reset: resetSwap 
  } = useWriteContract();

  // Wait for swap transaction
  const { 
    isLoading: isSwapConfirming, 
    isSuccess: isSwapConfirmed,
    error: swapConfirmationError 
  } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  // Reset swap state when parameters change
  useEffect(() => {
    if (resetSwap) {
      resetSwap();
    }
  }, [fromToken?.address, toToken?.address, routerAddress, amount, amountInWei, swapType, selectedChainId, slippageTolerance, resetSwap, approval.currentAllowance, approval.needsApproval]);

  // Handle swap completion
  useEffect(() => {
    if (isSwapConfirmed) {
      toast.success('Swap completed successfully!');
    }
  }, [isSwapConfirmed]);

  // Handle swap errors
  useEffect(() => {
    if (swapError) {
      toast.error(`Swap failed: ${swapError.message}`);
    }
  }, [swapError]);

  // Handle swap confirmation errors
  useEffect(() => {
    if (swapConfirmationError) {
      toast.error(`Swap confirmation failed: ${swapConfirmationError.message}`);
    }
  }, [swapConfirmationError]);

  // Check if ready to swap
  const canSwap = useMemo(() => {
    // Basic validations
    if (!userAddress || !fromToken || !toToken || !amount || amount === '0') {
      return false;
    }

    // Check if user has sufficient balance
    if (!balanceValidation.hasEnoughBalance) {
      return false;
    }

    // For ERC20->NFT swaps, need token approval first
    if (swapType === 'erc20-to-nft' && fromToken.isErc20) {
      return approval.isApproved;
    }

    // For Native->NFT swaps, no approval needed
    if (swapType === 'native-to-nft') {
      return tokenIds && tokenIds.length > 0;
    }

    // For NFT->ERC20 swaps, no approval needed (NFTs are transferred directly)
    if (swapType === 'nft-to-erc20') {
      return tokenIds && tokenIds.length > 0;
    }

    // For NFT->Native swaps, no approval needed
    if (swapType === 'nft-to-native') {
      return tokenIds && tokenIds.length > 0;
    }

    return false;
  }, [userAddress, fromToken, toToken, amount, swapType, approval.isApproved, tokenIds, balanceValidation.hasEnoughBalance]);

  // Get button text based on current state
  const getButtonText = () => {
    if (!userAddress) {
      return 'Connect Wallet';
    }

    if (!fromToken || !toToken) {
      return 'Select Tokens';
    }

    if (!amount || amount === '0') {
      return 'Enter Amount';
    }

     // Check balance validation first
    if (balanceValidation.validationError) {
      return `Insufficient ${fromToken.symbol}`;
    }
    // For ERC20->NFT swaps
    if (swapType === 'erc20-to-nft' && fromToken.isErc20) {
      if (approval.isApproving || approval.isConfirming) {
        return `Enabling ${fromToken.symbol}...`;
      }
      
      if (approval.needsApproval) {
        return `Enable ${fromToken.symbol}`;
      }

      if (isSwapping || isSwapConfirming) {
        return 'Swapping...';
      }
      
      return 'SWAP';
    }

    // For Native->NFT swaps
    if (swapType === 'native-to-nft') {
      if (!tokenIds || tokenIds.length === 0) {
        return 'Select NFTs';
      }

      if (isSwapping || isSwapConfirming) {
        return 'Swapping...';
      }

      return 'SWAP';
    }

    // For NFT->ERC20 swaps
    if (swapType === 'nft-to-erc20') {
      if (!tokenIds || tokenIds.length === 0) {
        return 'Select NFTs';
      }

      if (isSwapping || isSwapConfirming) {
        return 'Swapping...';
      }

      return 'SWAP';
    }

    // For NFT->Native swaps
    if (swapType === 'nft-to-native') {
      if (!tokenIds || tokenIds.length === 0) {
        return 'Select NFTs';
      }

      if (isSwapping || isSwapConfirming) {
        return 'Swapping...';
      }

      return 'SWAP';
    }

    return 'SWAP';
  };

  // Get button action based on current state
  const getButtonAction = () => {
    if (!userAddress) {
      return 'connect';
    }

    // For ERC20->NFT swaps
    if (swapType === 'erc20-to-nft' && fromToken?.isErc20) {
      if (approval.needsApproval) {
        return 'approve';
      }
      return 'swap';
    }

    // For Native->NFT, NFT->ERC20, and NFT->Native swaps
    if (swapType === 'native-to-nft' || swapType === 'nft-to-erc20' || swapType === 'nft-to-native') {
      return 'swap';
    }

    return 'swap';
  };

  // Check if button should be disabled
  const isButtonDisabled = () => {
    if (approval.isApproving || approval.isConfirming || isSwapping || isSwapConfirming) {
      return true;
    }

    if (!userAddress || !fromToken || !toToken || !amount || amount === '0') {
      return true;
    }

    // Disable if balance validation fails
    if (balanceValidation.validationError) {
      return true;
    }

    return false;
  };

  // Function to execute swap transaction
  const executeSwapTransaction = async () => {
    if (!userAddress || !fromToken || !toToken || !tokenIds || tokenIds.length === 0) {
      throw new Error('Missing required parameters for swap');
    }

    const deadline = BigInt(getTransactionDeadline());
    const tokenIdsAsNumbers = tokenIds.map(id => BigInt(id));

    try {
      if (swapType === 'erc20-to-nft') {
        // ERC20 → NFT: swapTokensForExactTokensCollection
        const path = [fromToken.address, toToken.address];
        
        //  Use dynamic slippage from user settings
        let amountInMax: bigint;
        
        if (amountInWei > BigInt(0)) {
          // Convert slippage tolerance from basis points to percentage
          // slippageTolerance is in basis points (e.g., 100 = 1%, 500 = 5%)
          const slippageMultiplier = BigInt(10000 + slippageTolerance) / BigInt(10000);
          amountInMax = amountInWei * slippageMultiplier;
        } else {
          // Fallback: use a reasonable amount based on the amount parameter
          const fallbackAmount = parseUnits(amount || '1', fromToken.decimals);
          const fallbackSlippageMultiplier = BigInt(10000 + Math.max(slippageTolerance, 1000)) / BigInt(10000); // Minimum 10% slippage as fallback
          amountInMax = fallbackAmount * fallbackSlippageMultiplier;
        }

        executeSwap({
          address: routerAddress as Address,
          abi: routerAbi,
          functionName: 'swapTokensForExactTokensCollection',
          args: [
            tokenIdsAsNumbers,
            amountInMax,
            path,
            true, // capRoyaltyFee
            userAddress,
            deadline,
          ],
        });
      } else if (swapType === 'nft-to-erc20') {
        // NFT → ERC20: swapExactTokensForTokensCollection
        const path = [fromToken.address, toToken.address];
        
        //  Use dynamic slippage for minimum amount out
        // For selling NFTs, we calculate minimum amount we're willing to accept
        let amountOutMin = BigInt(0);
        
        if (swapQuote?.amountOut) {
          try {
            let expectedAmountOut: bigint;
            
            if (typeof swapQuote.amountOut === 'bigint') {
              expectedAmountOut = swapQuote.amountOut;
            } else if (typeof swapQuote.amountOut === 'string') {
              const cleanAmount = swapQuote.amountOut.replace(/[^0-9.]/g, '');
              if (!cleanAmount.includes('.') && cleanAmount.length > 10) {
                expectedAmountOut = BigInt(cleanAmount);
              } else {
                expectedAmountOut = parseUnits(cleanAmount, toToken.isErc20 ? 18 : 0);
              }
            } else {
              expectedAmountOut = BigInt(Math.floor(Number(swapQuote.amountOut)));
            }
            
            // Calculate minimum amount with slippage protection
            // For output, we reduce the expected amount by slippage tolerance
            const slippageReduction = BigInt(10000 - slippageTolerance) / BigInt(10000);
            amountOutMin = expectedAmountOut * slippageReduction;
          } catch (error) {
            amountOutMin = BigInt(0);
          }
        }

        executeSwap({
          address: routerAddress as Address,
          abi: routerAbi,
          functionName: 'swapExactTokensForTokensCollection',
          args: [
            tokenIdsAsNumbers,
            amountOutMin,
            path,
            true, // capRoyaltyFee
            userAddress,
            deadline,
          ],
        });
      } else if (swapType === 'native-to-nft') {
        const addresses = getContractAddresses(Number(selectedChainId));
        const wethAddress = addresses.weth; // Get WETH address from config
        
        const path = [wethAddress, toToken.address]; // [WETH, NFT_COLLECTION]
        
        //  For ETH->NFT swaps, we send the ETH value and don't need amountInMax
        // The contract will use the sent ETH value as the maximum input
        executeSwap({
          address: routerAddress as Address,
          abi: routerAbi,
          functionName: 'swapETHForExactTokensCollection',
          args: [
            tokenIdsAsNumbers,
            path,
            true, // capRoyaltyFee
            userAddress,
            deadline,
          ],
          value: amountInWei, // Send ETH value with the transaction
        });
      } else if (swapType === 'nft-to-native') {
        // NFT → Native ETH: swapExactTokensForETHCollection
        const addresses = getContractAddresses(Number(selectedChainId));
        const wethAddress = addresses.weth;
        const path = [fromToken.address, wethAddress]; // [NFT_COLLECTION, WETH]

        //  Use dynamic slippage for minimum ETH amount out
        let amountOutMin = BigInt(0);
        
        if (swapQuote?.amountOut) {
          try {
            let expectedAmountOut: bigint;
            
            if (typeof swapQuote.amountOut === 'bigint') {
              expectedAmountOut = swapQuote.amountOut;
            } else if (typeof swapQuote.amountOut === 'string') {
              const cleanAmount = swapQuote.amountOut.replace(/[^0-9.]/g, '');
              if (!cleanAmount.includes('.') && cleanAmount.length > 10) {
                expectedAmountOut = BigInt(cleanAmount);
              } else {
                expectedAmountOut = parseUnits(cleanAmount, 18); // ETH has 18 decimals
              }
            } else {
              expectedAmountOut = BigInt(Math.floor(Number(swapQuote.amountOut)));
            }
            
            // Calculate minimum amount with slippage protection
            const slippageReduction = BigInt(10000 - slippageTolerance) / BigInt(10000);
            amountOutMin = expectedAmountOut * slippageReduction;
          } catch (error) {
            amountOutMin = BigInt(0);
          }
        }

        executeSwap({
          address: routerAddress as Address,
          abi: routerAbi,
          functionName: 'swapExactTokensForETHCollection',
          args: [
            tokenIdsAsNumbers,
            amountOutMin,
            path,
            true, // capRoyaltyFee
            userAddress,
            deadline,
          ],
        });
      }

      toast.success('Swap transaction submitted!');
    } catch (error) {
      toast.error('Failed to submit swap transaction');
      throw error;
    }
  };

  return {
    // Approval state
    canSwap,
    
    // Token approval (includes needsApproval, isApproved, etc.)
    ...approval,
    
    // Balance validation
    balanceValidation,
    
    // Swap execution
    executeSwapTransaction,
    isSwapping,
    isSwapConfirming,
    isSwapConfirmed,
    swapHash,
    swapError,
    swapConfirmationError,
    
    // Button state
    buttonText: getButtonText(),
    buttonAction: getButtonAction(),
    isButtonDisabled: isButtonDisabled(),
    buttonEnabled: !isButtonDisabled(), // For backward compatibility
    
    // Contract addresses
    routerAddress,
    
    // Transaction settings
    getTransactionDeadline,
    amountInWei,
  };
};
