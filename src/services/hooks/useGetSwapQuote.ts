//  React hook facade with proper wagmi integration and slippage
import { useCallback, useEffect, useMemo } from 'react';
import { type Address } from 'viem';
import { useReadContract } from 'wagmi';

import { erc20Abi } from '@/abi/erc20';
import { factoryAbi } from '@/abi/factory';
import { routerAbi } from '@/abi/router';
import { useChainContext } from '@/contexts/ChainContext';
import { useTransactionSettingsContext } from '@/contexts/TransactionSettingsContext';
import { usePairs } from '@/hooks/api/usePairs';
import { usePoolByTokens } from '@/hooks/api/usePoolByTokens';

import { getContractAddresses } from '../config/ContractAddresses';
import {
  RouteType,
  type SwapParameters,
  type SwapQuoteResult,
  SwapType
} from '../domain/entities';
//  React-specific contract client that works with wagmi
export class ReactContractClient {
  constructor(
    private readonly routerAddress: Address,
    private readonly factoryAddress: Address
  ) {}

  //  These methods return objects that can be used with wagmi hooks
  getRouterReadParams(functionName: string, args?: unknown[]) {
    return {
      address: this.routerAddress,
      abi: routerAbi,
      functionName,
      args,
    };
  }

  getFactoryReadParams(functionName: string, args?: unknown[]) {
    return {
      address: this.factoryAddress,
      abi: factoryAbi,
      functionName,
      args,
    };
  }

  getERC20ReadParams(tokenAddress: Address, functionName: string, args?: unknown[]) {
    return {
      address: tokenAddress,
      abi: erc20Abi,
      functionName,
      args,
    };
  }
}

export function useGetSwapQuote(params: SwapParameters): SwapQuoteResult {  
  const { selectedChainId, selectedChain } = useChainContext();
  
  //  Get slippage tolerance for calculations
  const { slippageTolerance } = useTransactionSettingsContext();
  
  //  Get contract addresses for current chain
  const contractAddresses = useMemo(() => {
    const addresses = getContractAddresses(Number(selectedChainId));
    return {
      router: selectedChain?.routerAddress || addresses.router,
      factory: addresses.factory,
      weth: addresses.weth,
    };
  }, [selectedChainId, selectedChain]);

  const { router: routerAddress, weth: wethAddress } = contractAddresses;

  //  Get tokens data from API
  const { tokens } = usePairs(Number(selectedChainId));
  
  //  Convert native token addresses to wrapped addresses for quotes
  const getWrappedTokenAddress = useCallback((tokenAddress: Address): Address => {
    // If it's the zero address (native token), use the wrapped version
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      return wethAddress as Address;
    }
    
    return tokenAddress;
  }, [wethAddress]);
  
  //  Get actual addresses for quotes (convert native to wrapped)
  const fromTokenAddressForQuote = useMemo(() => {
    return getWrappedTokenAddress(params.fromToken);
  }, [params.fromToken, getWrappedTokenAddress]);
  
  const toTokenAddressForQuote = useMemo(() => {
    return getWrappedTokenAddress(params.toToken);
  }, [params.toToken, getWrappedTokenAddress]);
  
  //  Find token data based on addresses with safety checks
  const fromTokenData = useMemo(() => {
    if (!tokens || !params.fromToken) return undefined;
    return tokens.find(token => 
      token?.address?.toLowerCase() === params.fromToken.toLowerCase()
    );
  }, [tokens, params.fromToken]);
  
  const toTokenData = useMemo(() => {
    if (!tokens || !params.toToken) return undefined;
    return tokens.find(token => 
      token?.address?.toLowerCase() === params.toToken.toLowerCase()
    );
  }, [tokens, params.toToken]);

  //  Get pool data from API
  const { pool, canSwap } = usePoolByTokens(
    fromTokenData,
    toTokenData,
    Number(selectedChainId)
  );

  //  Determine swap type
  const swapType = useMemo(() => {
    if (params.tokenIds && params.tokenIds.length > 0) {
      return params.isExactInput ? SwapType.NFT_TO_ERC20 : SwapType.ERC20_TO_NFT;
    }
    return SwapType.ERC20_TO_ERC20;
  }, [params.tokenIds, params.isExactInput]);

  //  Determine route based on API data
  const route = useMemo(() => {
    // Early return if tokens are not loaded yet
    if (!tokens || tokens.length === 0) {
      return null;
    }

    if (swapType === SwapType.ERC20_TO_ERC20) {
      // For ERC20 to ERC20, use wrapped addresses for quotes
      return { path: [fromTokenAddressForQuote, toTokenAddressForQuote], type: RouteType.DIRECT };
    }

    if (!canSwap) {
      return null;
    }

    //  For NFT swaps, use pool data from API with correct native token
    if (pool) {
      // Get the pool's ERC20 token address and convert it if it's native
      const poolErc20TokenRaw = pool.erc20Token?.address;
      
      if (!poolErc20TokenRaw) {
        return null;
      }
      
      // Convert pool's token address the same way we convert user's token
      const poolErc20Token = getWrappedTokenAddress(poolErc20TokenRaw as Address);
      
      // Check if the user's selected ERC20 token matches the pool's ERC20 token
      const userErc20Token = swapType === SwapType.ERC20_TO_NFT ? fromTokenAddressForQuote : toTokenAddressForQuote;
      
      if (poolErc20Token.toLowerCase() === userErc20Token.toLowerCase()) {
        // Direct swap with pool's ERC20 token - use wrapped addresses for quotes
        return { 
          path: swapType === SwapType.ERC20_TO_NFT 
            ? [fromTokenAddressForQuote, params.toToken]
            : [params.fromToken, toTokenAddressForQuote], 
          type: RouteType.DIRECT 
        };
      } else {
        // Multi-hop: User's ERC20 -> Pool's ERC20 -> NFT (or vice versa)
        return { 
          path: swapType === SwapType.ERC20_TO_NFT 
            ? [fromTokenAddressForQuote, poolErc20Token as Address, params.toToken]
            : [params.fromToken, poolErc20Token as Address, toTokenAddressForQuote],
          type: RouteType.MULTI_HOP 
        };
      }
    } else {
      return { 
        path: swapType === SwapType.ERC20_TO_NFT
          ? [fromTokenAddressForQuote, wethAddress, params.toToken]
          : [params.fromToken, wethAddress, toTokenAddressForQuote], 
        type: RouteType.MULTI_HOP 
      };
    }
  }, [swapType, canSwap, pool, params.fromToken, params.toToken, wethAddress, tokens, fromTokenAddressForQuote, toTokenAddressForQuote, getWrappedTokenAddress]);

  //  Execute quote based on route type
  const { data: directQuote, refetch: refetchDirectQuote } = useReadContract({
    address: routerAddress as Address,
    abi: routerAbi,
    functionName: swapType === SwapType.ERC20_TO_NFT ? 'getAmountsInCollection' : 'getAmountsOutCollection',
    args: swapType === SwapType.ERC20_TO_NFT 
      ? [params.tokenIds?.map(id => BigInt(id)) || [], (route?.path || []) as Address[], params.capRoyaltyFee || true]
      : [params.tokenIds?.map(id => BigInt(id)) || [], (route?.path || []) as Address[], params.capRoyaltyFee || true],
    query: {
      enabled: Boolean(route?.type === RouteType.DIRECT && params.tokenIds?.length && swapType !== SwapType.ERC20_TO_ERC20),
    },
  });


  //  Multi-hop quote - for NFT swaps through intermediate token
  const { data: nftQuote, refetch: refetchNftQuote } = useReadContract({
    address: routerAddress as Address,
    abi: routerAbi,
    functionName: swapType === SwapType.ERC20_TO_NFT ? 'getAmountsInCollection' : 'getAmountsOutCollection',
    args: swapType === SwapType.ERC20_TO_NFT
      ? [params.tokenIds?.map(id => BigInt(id)) || [], [route?.path?.[1], route?.path?.[2]].filter(Boolean) as Address[], params.capRoyaltyFee || true]
      : [params.tokenIds?.map(id => BigInt(id)) || [], [route?.path?.[0], route?.path?.[1]].filter(Boolean) as Address[], params.capRoyaltyFee || true],
    query: {
      enabled: Boolean(route?.type === RouteType.MULTI_HOP && params.tokenIds?.length && swapType !== SwapType.ERC20_TO_ERC20 && route?.path?.length === 3),
    },
  });

  //  Multi-hop quote - for ERC20 to ERC20 conversion
  const { data: erc20Quote, refetch: refetchErc20Quote } = useReadContract({
    address: routerAddress as Address,
    abi: routerAbi,
    functionName: swapType === SwapType.ERC20_TO_NFT ? 'getAmountsIn' : 'getAmountsOut',
    args: swapType === SwapType.ERC20_TO_NFT
      ? [nftQuote?.[0] || BigInt(0), [route?.path?.[0], route?.path?.[1]].filter(Boolean) as Address[]]
      : [nftQuote?.[1] || BigInt(0), [route?.path?.[1], route?.path?.[2]].filter(Boolean) as Address[]],
    query: {
      enabled: Boolean(route?.type === RouteType.MULTI_HOP && nftQuote && swapType !== SwapType.ERC20_TO_ERC20 && route?.path?.length === 3),
    },
  });

  //  Get token decimals for formatting - use wrapped addresses
  const { data: fromTokenDecimals } = useReadContract({
    address: fromTokenAddressForQuote,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: Boolean(fromTokenData?.isErc20),
    },
  });

  const { data: toTokenDecimals } = useReadContract({
    address: toTokenAddressForQuote,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: Boolean(toTokenData?.isErc20),
    },
  });

  //  Refetch quotes when slippage changes
  useEffect(() => {
    
    if (route?.type === RouteType.DIRECT && params.tokenIds?.length) {
      refetchDirectQuote();
    } else if (route?.type === RouteType.MULTI_HOP && params.tokenIds?.length) {
      refetchNftQuote();
      if (nftQuote) {
        refetchErc20Quote();
      }
    }
  }, [slippageTolerance, route?.type, params.tokenIds?.length, refetchDirectQuote, refetchNftQuote, refetchErc20Quote, nftQuote]);

  //  Process results and return formatted quote with slippage protection
  return useMemo(() => {
    // Show loading state if tokens are not loaded yet
    if (!tokens || tokens.length === 0) {
      return {
        inputAmount: '0',
        outputAmount: '0',
        priceImpact: '0',
        minimumReceived: '0',
        route: [params.fromToken, params.toToken],
        loading: true,
        error: null,
        isMultiHop: false,
      };
    }

    if (!route) {
      return {
        inputAmount: '0',
        outputAmount: '0',
        priceImpact: '0',
        minimumReceived: '0',
        route: [params.fromToken, params.toToken],
        loading: false,
        error: new Error('No route found'),
        isMultiHop: false,
      };
    }

    if (swapType === SwapType.ERC20_TO_ERC20) {
      return {
        inputAmount: params.amount || '0',
        outputAmount: '0',
        priceImpact: '0',
        minimumReceived: '0',
        route: route.path,
        loading: false,
        error: new Error('ERC20 to ERC20 swap not implemented yet'),
        isMultiHop: route.type === RouteType.MULTI_HOP,
      };
    }

    //  Handle direct quotes with slippage protection
    if (route.type === RouteType.DIRECT && directQuote) {
      const decimals = swapType === SwapType.ERC20_TO_NFT ? fromTokenDecimals : toTokenDecimals;
      const amount = swapType === SwapType.ERC20_TO_NFT ? directQuote[0] : directQuote[1];
      const expectedAmount = decimals ? (Number(amount) / Math.pow(10, decimals)) : 0;
      
      if (swapType === SwapType.ERC20_TO_NFT) {
        //  Buying NFTs - apply slippage directly to the result
        const slippageMultiplier = 1 + (slippageTolerance / 10000); // slippageTolerance is in basis points (500 = 5%)
        const amountWithSlippage = expectedAmount * slippageMultiplier;
        
        return {
          inputAmount: amountWithSlippage.toString(), // Amount with slippage applied
          outputAmount: (params.tokenIds?.length || 0).toString(),
          priceImpact: `${(slippageTolerance / 100).toFixed(2)}%`,
          minimumReceived: (params.tokenIds?.length || 0).toString(), // NFTs are exact
          maximumSent: amountWithSlippage.toString(), // Same as inputAmount
          route: route.path,
          loading: false,
          error: null,
          isMultiHop: false,
        };
      } else {
        //  Selling NFTs - apply slippage to reduce the expected output
        const slippageMultiplier = 1 - (slippageTolerance / 10000); // Reduce by slippage
        const amountWithSlippage = expectedAmount * slippageMultiplier;
        
        return {
          inputAmount: (params.tokenIds?.length || 0).toString(),
          outputAmount: amountWithSlippage.toString(), // Reduced amount with slippage
          priceImpact: `${(slippageTolerance / 100).toFixed(2)}%`,
          minimumReceived: amountWithSlippage.toString(), // Same as outputAmount
          route: route.path,
          loading: false,
          error: null,
          isMultiHop: false,
        };
      }
    }

    //  Handle multi-hop quotes with slippage protection
    if (route.type === RouteType.MULTI_HOP && erc20Quote) {
      const decimals = swapType === SwapType.ERC20_TO_NFT ? fromTokenDecimals : toTokenDecimals;
      const amount = swapType === SwapType.ERC20_TO_NFT ? erc20Quote[0] : erc20Quote[1];
      const expectedAmount = decimals ? (Number(amount) / Math.pow(10, decimals)) : 0;
      
      if (swapType === SwapType.ERC20_TO_NFT) {
        //  Multi-hop buy - apply slippage directly to the result
        const slippageMultiplier = 1 + (slippageTolerance / 10000); // slippageTolerance is in basis points
        const amountWithSlippage = expectedAmount * slippageMultiplier;
        
        return {
          inputAmount: amountWithSlippage.toString(), // Amount with slippage applied
          outputAmount: (params.tokenIds?.length || 0).toString(),
          priceImpact: `${(slippageTolerance / 100).toFixed(2)}%`,
          minimumReceived: (params.tokenIds?.length || 0).toString(),
          maximumSent: amountWithSlippage.toString(), // Same as inputAmount
          route: route.path,
          loading: false,
          error: null,
          isMultiHop: true,
        };
      } else {
        //  Multi-hop sell - apply slippage to reduce expected output
        const slippageMultiplier = 1 - (slippageTolerance / 10000); // Reduce by slippage
        const amountWithSlippage = expectedAmount * slippageMultiplier;
        
        return {
          inputAmount: (params.tokenIds?.length || 0).toString(),
          outputAmount: amountWithSlippage.toString(), // Reduced amount with slippage
          priceImpact: `${(slippageTolerance / 100).toFixed(2)}%`,
          minimumReceived: amountWithSlippage.toString(), // Same as outputAmount
          route: route.path,
          loading: false,
          error: null,
          isMultiHop: true,
        };
      }
    }

    //  Loading state
    return {
      inputAmount: '0',
      outputAmount: '0',
      priceImpact: '0',
      minimumReceived: '0',
      route: route.path,
      loading: true,
      error: null,
      isMultiHop: route.type === RouteType.MULTI_HOP,
    };
  }, [route, directQuote, erc20Quote, fromTokenDecimals, toTokenDecimals, swapType, params, tokens, slippageTolerance]);
}
