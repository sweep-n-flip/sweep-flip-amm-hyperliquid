import { useMemo } from 'react';
import { type Address } from 'viem';


import {
  type SwapParameters,
  type SwapQuoteResult
} from './domain/entities';
import { useGetSwapQuote } from './hooks/useGetSwapQuote';

export interface SwapQuoteParams {
  fromToken: Address;
  toToken: Address;
  amount: string;
  tokenIds?: string[];
  isExactInput?: boolean;
  capRoyaltyFee?: boolean;
}

export { type SwapQuoteResult } from './domain/entities';

export function useSwapQuote(params: SwapQuoteParams): SwapQuoteResult {
  const swapParameters: SwapParameters = useMemo(() => ({
    fromToken: params.fromToken,
    toToken: params.toToken,
    amount: params.amount,
    tokenIds: params.tokenIds,
    isExactInput: params.isExactInput,
    capRoyaltyFee: params.capRoyaltyFee,
  }), [params]);
  
  return useGetSwapQuote(swapParameters);
}

export function useERC20ToNFTQuote(
  tokenIds: string[],
  tokenIn: Address,
  collectionAddress: Address,
  capRoyaltyFee: boolean = true,
  enabled: boolean = true
): SwapQuoteResult {
  const params: SwapQuoteParams = {
    fromToken: tokenIn,
    toToken: collectionAddress,
    amount: '0',
    tokenIds,
    isExactInput: false,
    capRoyaltyFee,
  };

  const result = useSwapQuote(params);
  
  return useMemo(() => ({
    ...result,
    loading: enabled ? result.loading : false,
    error: enabled ? result.error : null,
  }), [result, enabled]);
}

