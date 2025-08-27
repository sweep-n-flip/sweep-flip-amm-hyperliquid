//  Hook for managing ERC20 token approvals for router contract
import { useEffect } from 'react';
import { toast } from 'sonner';
import { type Address, erc20Abi, maxUint256 } from 'viem';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

interface UseTokenApprovalParams {
  tokenAddress: Address;
  spenderAddress: Address; // Router contract address
  amount?: bigint; // Amount to approve, defaults to max
}

export const useTokenApproval = ({ tokenAddress, spenderAddress, amount }: UseTokenApprovalParams) => {
  const { address: userAddress } = useAccount();

  // Validate parameters to prevent invalid calls
  const isValidConfig = Boolean(
    userAddress && 
    tokenAddress && 
    spenderAddress && 
    tokenAddress !== '0x' && 
    spenderAddress !== '0x' &&
    tokenAddress.length === 42 &&
    spenderAddress.length === 42
  );

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress as Address, spenderAddress],
    query: {
      enabled: isValidConfig,
    },
  });

  // Write contract for approval
  const { 
    writeContract: approve, 
    data: approvalHash, 
    isPending: isApproving, 
    error: approvalError,
    reset: resetApproval // Add reset function
  } = useWriteContract();

  // Wait for approval transaction
  const { 
    isLoading: isConfirming, 
    isSuccess: isApprovalConfirmed,
    error: confirmationError 
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isApprovalConfirmed) {
      toast.success('Token approval confirmed!');
      refetchAllowance();
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // Handle confirmation errors
  useEffect(() => {
    if (confirmationError) {
      toast.error(`Approval confirmation failed: ${confirmationError.message}`);
    }
  }, [confirmationError]);

  // Handle approval transaction errors
  useEffect(() => {
    if (approvalError) {
      toast.error(`Approval failed: ${approvalError.message}`);
    }
  }, [approvalError]);

  // Reset approval state when parameters change
  useEffect(() => {
    if (resetApproval) {
      resetApproval();
    }
    // Also refetch allowance when parameters change
    if (refetchAllowance && isValidConfig) {
      refetchAllowance();
    }
  }, [tokenAddress, spenderAddress, amount, userAddress, isValidConfig, resetApproval, refetchAllowance]);

  // Check if approval is needed
  const needsApproval = currentAllowance !== undefined && amount !== undefined 
    ? currentAllowance < amount 
    : currentAllowance === BigInt(0);

  // Check if token is approved for the required amount
  const isApproved = currentAllowance !== undefined && amount !== undefined 
    ? currentAllowance >= amount 
    : currentAllowance !== undefined && currentAllowance > BigInt(0);

  // Function to approve token
  const approveToken = async (approvalAmount?: bigint) => {
    if (!userAddress || !tokenAddress || !spenderAddress) {
      throw new Error('Missing required parameters for approval');
    }

    const amountToApprove = approvalAmount || amount || maxUint256;

    try {
      approve({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, amountToApprove],
      });
      
      toast.success('Approval transaction submitted!');
    } catch (error) {
      toast.error('Failed to submit approval transaction');
      throw error;
    }
  };

  // Function to approve maximum amount (common pattern)
  const approveMax = async () => {
    await approveToken(maxUint256);
  };

  // Return early defaults if configuration is invalid
  if (!isValidConfig) {
    return {
      // State
      currentAllowance: BigInt(0),
      needsApproval: false,
      isApproved: false,
      
      // Actions
      approveToken: async () => { throw new Error('Invalid token approval configuration'); },
      approveMax: async () => { throw new Error('Invalid token approval configuration'); },
      refetchAllowance: () => Promise.resolve(),
      
      // Transaction state
      isApproving: false,
      isConfirming: false,
      isApprovalConfirmed: false,
      approvalHash: undefined,
      
      // Errors
      approvalError: null,
      confirmationError: null,
    };
  }

  return {
    // State
    currentAllowance,
    needsApproval,
    isApproved,
    
    // Actions
    approveToken,
    approveMax,
    refetchAllowance,
    
    // Transaction state
    isApproving,
    isConfirming,
    isApprovalConfirmed,
    approvalHash,
    
    // Errors
    approvalError,
    confirmationError,
  };
};
