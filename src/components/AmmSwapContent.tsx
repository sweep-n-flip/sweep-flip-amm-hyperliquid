'use client'

import { useChainContext } from "@/contexts/ChainContext";
import { usePairs } from "@/hooks/api/usePairs";
import { usePoolByTokens } from "@/hooks/api/usePoolByTokens";
import { type TokenData } from "@/hooks/api/useTokensFromDatabase";
import { useTokenPriceInUSD } from "@/hooks/pricing/useTokenPriceInUSD";
import { useNftPoolInfo } from "@/hooks/subgraph/useNftPoolInfo";
import { useSwapFlow } from "@/hooks/useSwapFlow";
import { useTokenBalance } from "@/hooks/wallet";
import { useHyperliquidUserNfts } from "@/hooks/wallet/useHyperliquidUserNfts";
import { usePoolNfts } from "@/hooks/wallet/usePoolNfts";
import { useUserNfts } from "@/hooks/wallet/useUserNfts";
import { enrichHyperliquidTokens } from "@/lib/enrichHyperliquidTokens";
import { HyperliquidCollectionsService } from "@/services/HyperliquidCollections";
import { useSwapQuote } from '@/services/RouterService';
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Address } from 'viem';
import { ArrowButton } from "./ui/ArrowButton";
import { Button } from "./ui/button";
import { CurrencyInput } from "./ui/CurrencyInput";
import { CustomSlider } from "./ui/CustomSlider";
import { NftCollectionInfo } from "./ui/NftCollectionInfo";
import { NftCollectionInput } from "./ui/NftCollectionInput";
import { NftSelectionModal } from "./ui/NftSelectionModal";

export const AmmSwapContent = (): JSX.Element => {
  const { selectedChainId, selectedChain } = useChainContext();
  const [sliderValue, setSliderValue] = useState(1);
  const [fromTokenAddress, setFromTokenAddress] = useState<string | null>(null);
  const [toTokenAddress, setToTokenAddress] = useState<string | null>(null);
  const [swapDirection, setSwapDirection] = useState<'erc20-to-nft' | 'nft-to-erc20'>('erc20-to-nft');
  const [mounted, setMounted] = useState(false);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [showNftModal, setShowNftModal] = useState(false);

  // Fetch tokens using hybrid approach (Uniswap + internal API)
  const { tokens: rawTokens, loading: tokensLoading } = usePairs(Number(selectedChainId));

  //  Enrich Hyperliquid tokens with collection logos
  const allTokens = useMemo(() => 
    enrichHyperliquidTokens(rawTokens, Number(selectedChainId)), 
    [rawTokens, selectedChainId]
  );

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to check if token is native ETH
  const isNativeToken = (token: TokenData | undefined) => {
    if (!token) return false;
    return token.symbol === 'ETH' && token.isErc20;
  };

  // Filter tokens by type
  const erc20Tokens = useMemo(() => 
    allTokens.filter(token => token.isErc20), [allTokens]
  );

  const nftTokens = useMemo(() => 
    allTokens.filter(token => token.isCollection), [allTokens]
  );

  // Get selected tokens based on swap direction
  const fromToken = useMemo(() => {
    if (swapDirection === 'erc20-to-nft') {
      if (!fromTokenAddress) {
        // Default to ETH if available, otherwise first ERC20 token
        const ethToken = erc20Tokens.find(token => token.symbol === 'ETH');
        return ethToken || erc20Tokens[0];
      }
      return erc20Tokens.find(token => token.address === fromTokenAddress);
    } else {
      if (!fromTokenAddress) return nftTokens[0]; // Default to first NFT
      return nftTokens.find(token => token.address === fromTokenAddress);
    }
  }, [fromTokenAddress, erc20Tokens, nftTokens, swapDirection]);

  const toToken = useMemo(() => {
    if (swapDirection === 'erc20-to-nft') {
      if (!toTokenAddress) return nftTokens[0]; // Default to first NFT
      return nftTokens.find(token => token.address === toTokenAddress);
    } else {
      if (!toTokenAddress) {
        // Default to ETH if available, otherwise first ERC20 token
        const ethToken = erc20Tokens.find(token => token.symbol === 'ETH');
        return ethToken || erc20Tokens[0];
      }
      return erc20Tokens.find(token => token.address === toTokenAddress);
    }
  }, [toTokenAddress, erc20Tokens, nftTokens, swapDirection]);

  // Get pool data from database using usePoolByTokens
  const { pool, loading: poolLoading } = usePoolByTokens(
    fromToken,
    toToken,
    Number(selectedChainId)
  );

  const nftPoolInfo = useNftPoolInfo({
    poolId: pool?.poolDetails.poolId, 
    enabled: !!(pool?.token0?.id && pool?.token1?.id && (fromToken?.isCollection || toToken?.isCollection)),
  });
  
  const fromTokenBalance = useTokenBalance(fromToken, undefined);
  const toTokenBalance = useTokenBalance(toToken, undefined);

  // Check if we're on Hyperliquid chain
  const isHyperliquidChain = useMemo(() => 
    HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId)), 
    [selectedChainId]
  );

  //  Fetch user's NFTs when selling NFTs (NFT → ERC20) - use appropriate hook based on chain
  const userNfts = useUserNfts({
    collectionAddress: mounted && swapDirection === 'nft-to-erc20' && fromToken?.isCollection && !isHyperliquidChain
      ? (fromToken.address as `0x${string}`) 
      : null,
    enabled: mounted && swapDirection === 'nft-to-erc20' && !!fromToken?.isCollection && !isHyperliquidChain,
  });

  // Fetch user's NFTs for Hyperliquid collections using native contract calls
  const hyperliquidUserNfts = useHyperliquidUserNfts({
    collectionAddress: mounted && swapDirection === 'nft-to-erc20' && fromToken?.isCollection && isHyperliquidChain
      ? (fromToken.address as `0x${string}`) 
      : null,
    enabled: mounted && swapDirection === 'nft-to-erc20' && !!fromToken?.isCollection && isHyperliquidChain,
    chainId: Number(selectedChainId),
  });

  //  Fetch pool NFTs when buying NFTs (ERC20 → NFT)
  const poolNfts = usePoolNfts({
    collectionAddress: mounted && swapDirection === 'erc20-to-nft' && toToken?.isCollection 
      ? (toToken.address as `0x${string}`) 
      : null,
    tokenIds: mounted && swapDirection === 'erc20-to-nft' && nftPoolInfo.data?.tokenIds
      ? nftPoolInfo.data.tokenIds
      : [],
    enabled: mounted && swapDirection === 'erc20-to-nft' && !!toToken?.isCollection && !!nftPoolInfo.data?.tokenIds?.length,
  });

  // Create unified user NFT data combining both hooks
  const unifiedUserNfts = useMemo(() => {
    if (isHyperliquidChain) {
      return {
        nfts: hyperliquidUserNfts.nfts,
        tokenIds: hyperliquidUserNfts.tokenIds,
        loading: hyperliquidUserNfts.loading,
        error: hyperliquidUserNfts.error,
      };
    } else {
      return {
        nfts: userNfts.nfts,
        tokenIds: userNfts.tokenIds,
        loading: userNfts.loading,
        error: userNfts.error,
      };
    }
  }, [isHyperliquidChain, hyperliquidUserNfts, userNfts]);

  //  Memoize user NFT count using unified data
  const userNftCount = useMemo(() => unifiedUserNfts.tokenIds.length, [unifiedUserNfts.tokenIds]);

  // Determine swap type based on token types
  const swapType = useMemo(() => {
    if (swapDirection === 'erc20-to-nft') {
      // ERC20/Native → NFT
      return isNativeToken(fromToken) ? 'native-to-nft' : 'erc20-to-nft';
    } else {
      // NFT → ERC20/Native
      return isNativeToken(toToken) ? 'nft-to-native' : 'nft-to-erc20';
    }
  }, [swapDirection, fromToken, toToken]);

  // Get swap quote using RouterService
  const swapQuote = useSwapQuote({
    fromToken: fromToken?.address as `0x${string}`,
    toToken: toToken?.address as `0x${string}`,
    amount: fromAmount,
    tokenIds: selectedTokenIds,
    isExactInput: swapDirection === 'nft-to-erc20', // For NFT→ERC20: exact input, for ERC20→NFT: exact output
    capRoyaltyFee: true,
  });

  // Use swap flow hook for managing approvals and swaps
  const swapFlow = useSwapFlow({
    fromToken: fromToken ? {
      address: fromToken.address as `0x${string}`,
      symbol: fromToken.symbol,
      decimals: fromToken.decimals || 18,
      isErc20: fromToken.isErc20,
      isCollection: fromToken.isCollection,
    } : null,
    toToken: toToken ? {
      address: toToken.address as `0x${string}`,
      symbol: toToken.symbol,
      isCollection: toToken.isCollection,
      isErc20: toToken.isErc20,
    } : null,
    //  Use quote amounts for accurate approval
    amount: swapDirection === 'erc20-to-nft' 
      ? (swapQuote.inputAmount || fromAmount)  // Use calculated input amount for ERC20→NFT
      : (swapQuote.outputAmount || toAmount),  // Use calculated output amount for NFT→ERC20
    tokenIds: selectedTokenIds,
    swapType: swapType, // Use the dynamically determined swap type
    swapQuote: {
      amountIn: swapQuote.inputAmount,
      amountOut: swapQuote.outputAmount,
    },
  });

  // Update toAmount when quote changes
  useEffect(() => {
    if (swapQuote.inputAmount && swapQuote.inputAmount !== '0' && swapQuote.inputAmount !== fromAmount) {
      // For ERC20→NFT swaps, use inputAmount as the calculated amount to pay
      if (swapDirection === 'erc20-to-nft') {
        setFromAmount(swapQuote.inputAmount);
      }
    }
    if (swapQuote.outputAmount && swapQuote.outputAmount !== '0' && swapQuote.outputAmount !== toAmount) {
      // For NFT→ERC20 swaps, use outputAmount as the calculated amount to receive
      if (swapDirection === 'nft-to-erc20') {
        setToAmount(swapQuote.outputAmount);
      }
    }
  }, [swapQuote.inputAmount, swapQuote.outputAmount, swapDirection, fromAmount, toAmount]);

  // Handle arrow button click to swap direction
  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === 'erc20-to-nft' ? 'nft-to-erc20' : 'erc20-to-nft');
    // Reset token selections when direction changes
    setFromTokenAddress(null);
    setToTokenAddress(null);
  };

  // Handle token selection
  const handleFromTokenSelect = (token: TokenData) => {
    setFromTokenAddress(token.address);
  };

  const handleToTokenSelect = (token: TokenData) => {
    setToTokenAddress(token.address);
  };

  // Handle amount changes
  const handleFromAmountChange = (value: string) => {
    // Only allow manual input for NFT→ERC20/Native direction
    if (swapDirection === 'nft-to-erc20') {
      setFromAmount(value);
    }
  };

  const handleToAmountChange = () => {
    // To amount is calculated automatically, so we don't allow direct editing
    // This function is provided for interface compatibility
  };

  // Handle MAX button clicks
  const handleMaxFromAmount = () => {
    // Only allow MAX for NFT→ERC20/Native direction
    if (fromToken && swapDirection === 'nft-to-erc20') {
      const balance = getUserBalance(fromToken);
      // Remove any formatting and extract the number
      const numericBalance = balance.replace(/[^0-9.]/g, '');
      
      // Convert to number and back to string to remove trailing zeros
      const cleanBalance = parseFloat(numericBalance);
      if (!isNaN(cleanBalance)) {
        setFromAmount(cleanBalance.toString());
      }
    }
  };

  const handleMaxToAmount = () => {
    // To amount is calculated automatically, so MAX doesn't apply
    // This function is provided for interface compatibility
  };

  // Get user balance for FROM token (what user has in wallet)
  const getUserBalance = (token: typeof fromToken) => {
    if (!token) return "0";
    
    //  For NFT → ERC20 swaps, show actual NFT count from wallet using unified data
    if (swapDirection === 'nft-to-erc20' && token === fromToken && token.isCollection) {
      return unifiedUserNfts.tokenIds.length.toString();
    }
    
    if (token === fromToken) {
      return fromTokenBalance.userBalance || "0";
    }
    if (token === toToken) {
      return toTokenBalance.userBalance || "0";
    }
    return "0";
  };

  // Get pool balance for TO token (what's available in pool)
  const getPoolBalance = useCallback((token: typeof toToken) => {
    if (!token) return "0";
    
    // For NFT collections, prioritize subgraph data
    if (token.isCollection && nftPoolInfo.data) {
      const availableForPurchase = Math.max(0, nftPoolInfo.data.nftListings - 1);
      return availableForPurchase.toString();
    }
    
    // Use pool data from database for ERC20 tokens
    if (token.isErc20 && pool && pool.poolStats) {
      const token0Address = pool.token0.address.toLowerCase();
      const token1Address = pool.token1.address.toLowerCase();
      const tokenAddress = token.address.toLowerCase();
      
      if (tokenAddress === token0Address) {
        return pool.poolStats.reserve0.toString();
      }
      if (tokenAddress === token1Address) {
        return pool.poolStats.reserve1.toString();
      }
    }
    
    // Fallback to wallet balance data for tokens not covered above
    if (token === fromToken) {
      return fromTokenBalance.poolBalance || "0";
    }
    if (token === toToken) {
      return toTokenBalance.poolBalance || "0";
    }
    return "0";
  }, [nftPoolInfo.data, pool?.poolStats?.reserve0, pool?.poolStats?.reserve1, pool?.token0?.address, pool?.token1?.address, fromToken?.address, toToken?.address, fromTokenBalance.poolBalance, toTokenBalance.poolBalance]);

  // Get maximum amount available for slider (from token data or pool balance)
  const getMaxAmount = useCallback((token: typeof toToken) => {
    if (!token) return 100;
    
    //  For NFT → ERC20 swaps, use user's actual NFT count
    if (swapDirection === 'nft-to-erc20' && token === fromToken && token?.isCollection) {
      return Math.max(1, userNftCount); // User can sell all their NFTs
    }
    
    // For NFT collections, prioritize subgraph data
    if (token.isCollection && nftPoolInfo.data) {
      const nftListings = nftPoolInfo.data.nftListings;
      const maxPurchasable = Math.max(0, nftListings - 1); // Always leave 1 NFT in pool
      return Math.min(Math.max(1, maxPurchasable), 1000);
    }
    
    // For ERC20 tokens, use pool database data
    if (token.isErc20 && pool && pool.poolStats) {
      const token0Address = pool.token0.address.toLowerCase();
      const token1Address = pool.token1.address.toLowerCase();
      const tokenAddress = token.address.toLowerCase();
      
      let reserve = 0;
      if (tokenAddress === token0Address) {
        reserve = pool.poolStats.reserve0;
      } else if (tokenAddress === token1Address) {
        reserve = pool.poolStats.reserve1;
      }
      
      // Convert to reasonable units (assuming 18 decimals)
      const maxFromReserve = Math.floor(reserve / 1e18) || 100;
      return Math.min(Math.max(1, maxFromReserve), 1000);
    }
    
    // Fallback logic for tokens not covered above
    // For NFT collections, use nftPoolInfo tokenIds when available, otherwise fallback to token tokenIds
    if (token.isCollection) {
      if (nftPoolInfo.data?.tokenIds?.length) {
        // Always leave at least 1 NFT in pool
        const maxPurchasable = Math.max(0, nftPoolInfo.data.tokenIds.length - 1);
        return Math.max(1, maxPurchasable);
      } else if (token.tokenIds?.length) {
        // Always leave at least 1 NFT in pool
        const maxPurchasable = Math.max(0, token.tokenIds.length - 1);
        return Math.max(1, maxPurchasable);
      }
    }
    
    // Final fallback to pool balance
    const poolBalance = getPoolBalance(token);
    const maxFromPool = parseInt(poolBalance) || 100;
    
    // For NFT collections, always leave at least 1 in pool
    if (token.isCollection) {
      const maxPurchasable = Math.max(0, maxFromPool - 1);
      return Math.min(Math.max(1, maxPurchasable), 1000);
    }
    
    // Return reasonable maximum (at least 1, cap at 1000 to avoid UI issues)
    return Math.min(Math.max(1, maxFromPool), 1000);
  }, [nftPoolInfo.data, pool?.poolStats, swapDirection, fromToken?.address, userNftCount, getPoolBalance]);

  // Get token prices in USD using router quotes
  const { price: fromTokenPriceUSD, loading: fromPriceLoading } = useTokenPriceInUSD({
    tokenAddress: fromToken?.address as Address,
    enabled: !!fromToken?.isErc20,
  });

  const { price: toTokenPriceUSD, loading: toPriceLoading } = useTokenPriceInUSD({
    tokenAddress: toToken?.address as Address,
    enabled: !!toToken?.isErc20,
  });

  // Calculate USD value for ERC20 tokens using router-based pricing only
  const getUsdValue = (token: typeof fromToken, amount: string): string | undefined => {
    if (!token || !token.isErc20 || !amount || amount === '0') return undefined;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return undefined;

    // Only use router-based price - no fallbacks
    let tokenPrice = null;
    if (token === fromToken && fromTokenPriceUSD) {
      tokenPrice = fromTokenPriceUSD;
    } else if (token === toToken && toTokenPriceUSD) {
      tokenPrice = toTokenPriceUSD;
    }

    // Only return USD value if we have real router price data
    if (tokenPrice && tokenPrice > 0) {
      const value = numericAmount * tokenPrice;
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    // Return undefined if no real price data available
    return undefined;
  };

  // Initialize slider value based on swap direction
  useEffect(() => {
    if (!mounted) return;
    
    if (swapDirection === 'nft-to-erc20') {
      const amount = parseInt(fromAmount) || 1;
      const maxAmount = getMaxAmount(fromToken);
      const newSliderValue = Math.min(Math.max(1, amount), maxAmount);
      if (newSliderValue !== sliderValue) {
        setSliderValue(newSliderValue);
      }
    } else {
      const amount = parseInt(toAmount) || 1;
      const maxAmount = getMaxAmount(toToken);
      const newSliderValue = Math.min(Math.max(1, amount), maxAmount);
      if (newSliderValue !== sliderValue) {
        setSliderValue(newSliderValue);
      }
    }
  }, [mounted, swapDirection, fromAmount, toAmount, fromToken?.address, toToken?.address, sliderValue]);

  // Handle slider value change for NFT quantity
  const handleSliderChange = (value: number) => {
    // Ensure minimum value is 1 and maximum is based on available tokens
    const maxAmount = swapDirection === 'nft-to-erc20' ? getMaxAmount(fromToken) : getMaxAmount(toToken);
    const clampedValue = Math.min(Math.max(1, value), maxAmount);
    
    // Additional check for NFT collections: ensure we don't exceed pool limit using subgraph data
    let finalValue = clampedValue;
    const currentToken = swapDirection === 'nft-to-erc20' ? fromToken : toToken;
    if (currentToken?.isCollection && nftPoolInfo.data) {
      const maxPurchasable = Math.max(0, nftPoolInfo.data.nftListings - 1);
      finalValue = Math.min(clampedValue, maxPurchasable);
    }
    
    setSliderValue(finalValue);
    
    // Update fromAmount or toAmount based on swap direction
    if (swapDirection === 'nft-to-erc20') {
      setFromAmount(finalValue.toString());
      //  For NFT → ERC20, use user's real NFT token IDs using unified data
      const currentToken = fromToken;
      if (currentToken?.isCollection && unifiedUserNfts.tokenIds.length > 0) {
        const tokenIds = unifiedUserNfts.tokenIds.slice(0, finalValue);
        setSelectedTokenIds(tokenIds);
      }
    } else {
      setToAmount(finalValue.toString());
      // Use real token IDs from subgraph data
      if (nftPoolInfo.data?.tokenIds && nftPoolInfo.data.tokenIds.length > 0) {
        const tokenIds = nftPoolInfo.data.tokenIds.slice(0, finalValue);
        setSelectedTokenIds(tokenIds);
      }
    }
  };

  // Ensure selectedTokenIds is properly set for NFT swaps
  useEffect(() => {
    if (swapDirection === 'erc20-to-nft' && toToken?.isCollection) {
      if (nftPoolInfo.data?.tokenIds && nftPoolInfo.data.tokenIds.length > 0) {
        const tokenIds = nftPoolInfo.data.tokenIds.slice(0, sliderValue);
        if (JSON.stringify(tokenIds) !== JSON.stringify(selectedTokenIds)) {
          setSelectedTokenIds(tokenIds);
        }
      }
    } else if (swapDirection === 'nft-to-erc20' && fromToken?.isCollection) {
      if (unifiedUserNfts.tokenIds.length > 0) {
        const tokenIds = unifiedUserNfts.tokenIds.slice(0, sliderValue);
        if (JSON.stringify(tokenIds) !== JSON.stringify(selectedTokenIds)) {
          setSelectedTokenIds(tokenIds);
        }
      }
    }
  }, [swapDirection, sliderValue, toToken?.address, nftPoolInfo.data?.tokenIds, fromToken?.address, unifiedUserNfts.tokenIds, selectedTokenIds]);

  // Format amount for display
  const formatAmount = (amount: string, isErc20: boolean): string => {
    if (isErc20) {
      // For ERC20, return the value as is for input, allow empty
      return amount || '';
    } else {
      // For NFT amounts, minimum is 1
      const num = parseInt(amount);
      if (isNaN(num) || num < 1) return '1';
      return num.toString();
    }
  };



  // Generate NFT items for the modal
  const generateNftItems = (token: typeof fromToken | typeof toToken) => {
    if (!token || !token.isCollection) return [];
    
    //  For NFT→ERC20 swaps, use user's wallet NFTs; for ERC20→NFT, use pool NFTs
    let tokenIds: string[] = [];
    let maxNfts = 0;
    
    if (swapDirection === 'nft-to-erc20' && token === fromToken) {
      // When selling NFTs, use user's actual NFT token IDs from wallet using unified data
      tokenIds = unifiedUserNfts.tokenIds;
      maxNfts = unifiedUserNfts.tokenIds.length;
    } else {
      // When buying NFTs, use pool NFTs from subgraph data
      tokenIds = nftPoolInfo.data?.tokenIds || [];
      maxNfts = getMaxAmount(token);
    }
    
    // Get price per NFT from subgraph data
    const nftPrice = nftPoolInfo.data?.nftPrice || 0;
    const priceSymbol = swapDirection === 'erc20-to-nft' 
      ? (fromToken?.symbol || 'ETH')
      : (toToken?.symbol || 'ETH');
    
    // Generate NFT items using appropriate IDs
    const nftItems = [];
    for (let i = 0; i < Math.min(maxNfts, 100); i++) { // Limit to 100 for performance
      const tokenId = tokenIds[i];
      if (!tokenId) break; // Stop if no more token IDs available
      
      //  Get actual image and name from Reservoir data based on swap direction
      let nftImage = '/placeholder-nft.svg'; // Default placeholder
      let nftName = `Token #${tokenId}`;
      
      if (swapDirection === 'nft-to-erc20' && unifiedUserNfts.nfts.length > 0) {
        // For selling NFTs, use user's NFT data from wallet using unified data
        const userNft = unifiedUserNfts.nfts.find(nft => nft.tokenId === tokenId);
        if (userNft) {
          // Use the best available image, fallback chain: imageLarge -> image -> imageSmall -> placeholder
          nftImage = userNft.imageLarge || userNft.image || userNft.imageSmall || '/placeholder-nft.svg';
          // Use the NFT name if available
          nftName = userNft.name || `Token #${tokenId}`;
        }
      } else if (swapDirection === 'erc20-to-nft' && poolNfts.nfts.length > 0) {
        // For buying NFTs, use pool NFT data from Reservoir
        const poolNft = poolNfts.nfts.find(nft => nft.tokenId === tokenId);
        if (poolNft) {
          // Use the best available image, fallback chain: imageLarge -> image -> imageSmall -> placeholder
          nftImage = poolNft.imageLarge || poolNft.image || poolNft.imageSmall || '/placeholder-nft.svg';
          // Use the NFT name if available
          nftName = poolNft.name || `Token #${tokenId}`;
        }
      }
      
      nftItems.push({
        id: tokenId,
        image: nftImage,
        name: nftName,
        price: nftPrice.toFixed(4),
        priceSymbol,
      });
    }
    
    return nftItems;
  };

  // Handle NFT modal
  const handleOpenNftModal = () => {
    setShowNftModal(true);
  };

  const handleCloseNftModal = () => {
    setShowNftModal(false);
  };

  const handleConfirmNftSelection = (selectedIds: string[]) => {
    setSelectedTokenIds(selectedIds);
    setSliderValue(selectedIds.length);
    
    // Update amounts based on swap direction
    if (swapDirection === 'erc20-to-nft') {
      setToAmount(selectedIds.length.toString());
    } else {
      setFromAmount(selectedIds.length.toString());
    }
  };

  // Loading state
  if (!mounted || tokensLoading || poolLoading) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="w-full h-20 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-full h-20 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // No tokens available
  if (!fromToken || !toToken) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-center text-gray-500">
          No tokens available for {selectedChain?.name || 'selected network'}
        </div>
      </div>
    );
  }

  const fromAmountFormatted = formatAmount(fromAmount, fromToken?.isErc20 || false);
  const toAmountFormatted = formatAmount(toAmount, toToken?.isErc20 || false);

  // Handle swap button click
  const handleSwapClick = async () => {
    if (!swapFlow.buttonEnabled) return;
    
    // Validate that we have real token IDs for NFT swaps
    if (swapDirection === 'erc20-to-nft' && toToken?.isCollection) {
      if (!nftPoolInfo.data?.tokenIds || nftPoolInfo.data.tokenIds.length === 0) {
        toast.error('No NFT token IDs available in pool. Cannot proceed with swap.');
        return;
      }
      if (!selectedTokenIds || selectedTokenIds.length === 0) {
        toast.error('No NFT token IDs selected. Please adjust the slider.');
        return;
      }
    } else if (swapDirection === 'nft-to-erc20' && fromToken?.isCollection) {
      if (unifiedUserNfts.loading) {
        toast.error('Still loading your NFTs. Please wait...');
        return;
      }
      if (unifiedUserNfts.error) {
        toast.error(`Error loading NFTs: ${unifiedUserNfts.error.message}`);
        return;
      }
      if (!unifiedUserNfts.tokenIds || unifiedUserNfts.tokenIds.length === 0) {
        toast.error('You do not own any NFTs from this collection.');
        return;
      }
      if (!selectedTokenIds || selectedTokenIds.length === 0) {
        toast.error('No NFT token IDs selected. Please adjust the slider.');
        return;
      }
    }
    
    try {
      if (swapFlow.buttonAction === 'approve') {
        await swapFlow.approveToken();
      } else if (swapFlow.buttonAction === 'swap') {
        await swapFlow.executeSwapTransaction();
      }
    } catch (error) {
      console.error('❌ Swap flow error:', error);
      toast.error(error instanceof Error ? error.message : 'Swap failed');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* From Token Input */}
      {fromToken?.isErc20 ? (
        <CurrencyInput
          amount={fromAmountFormatted}
          currency={fromToken.symbol}
          value={getUsdValue(fromToken, fromAmount)}
          balance={getUserBalance(fromToken)}
          iconSrc={fromToken.logo || 'https://assets.relay.link/icons/1/light.png'}
          selectedToken={fromToken}
          onTokenSelect={handleFromTokenSelect}
          onAmountChange={handleFromAmountChange}
          onMaxClick={handleMaxFromAmount}
          placeholder="0"
          isCalculated={swapDirection === 'erc20-to-nft'} // Calculated for ERC20→NFT
        />
      ) : (
        <NftCollectionInput
          amount={fromAmountFormatted}
          collection={fromToken?.collection?.symbol || fromToken?.symbol || 'Unknown'}
          balance={
            swapDirection === 'nft-to-erc20' && unifiedUserNfts.loading 
              ? 'Loading...'
              : getUserBalance(fromToken)
          }
          iconSrc={fromToken?.logo || '/placeholder-nft.svg'}
          selectedToken={fromToken}
          onTokenSelect={handleFromTokenSelect}
          onChooseNfts={handleOpenNftModal}
          chainId={Number(selectedChainId)}
        >
          {/*  For NFT → ERC20, add slider to FROM input */}
          {swapDirection === 'nft-to-erc20' && (
            <CustomSlider
              value={sliderValue}
              onChange={handleSliderChange}
              max={getMaxAmount(fromToken)}
              step={1}
            />
          )}
        </NftCollectionInput>
      )}

      {/* Arrow Button */}
      <div onClick={handleSwapDirection} className="cursor-pointer">
        <ArrowButton />
      </div>

      {/* To Token Input */}
      {toToken?.isErc20 ? (
        <CurrencyInput
          amount={toAmountFormatted}
          currency={toToken.symbol}
          value={getUsdValue(toToken, toAmount)}
          balance={getPoolBalance(toToken)}
          iconSrc={toToken.logo || '/https://assets.relay.link/icons/1/light.png'}
          selectedToken={toToken}
          onTokenSelect={handleToTokenSelect}
          onAmountChange={handleToAmountChange}
          onMaxClick={handleMaxToAmount}
          disabled={true} // Output amount is calculated automatically
          placeholder="0"
          isCalculated={true} // Always calculated for TO token
        />
      ) : (
        <NftCollectionInput
          amount={toAmountFormatted}
          collection={toToken?.collection?.symbol || toToken?.symbol || 'Unknown'}
          balance={getPoolBalance(toToken)}
          iconSrc={toToken?.logo || '/placeholder-nft.svg'}
          selectedToken={toToken}
          onTokenSelect={handleToTokenSelect}
          onChooseNfts={handleOpenNftModal}
          chainId={Number(selectedChainId)}
        >
          <CustomSlider
            value={sliderValue}
            onChange={handleSliderChange}
            max={getMaxAmount(toToken)}
            step={1}
          />
        </NftCollectionInput>
      )}

      {/* Swap Quote Info */}
      {swapQuote.loading && (
        <div className="text-sm text-gray-500 animate-pulse">
          Fetching quote...
        </div>
      )}
      
      {swapQuote.error && (
        <div className="text-sm text-red-500">
          Error: {swapQuote.error.message}
        </div>
      )}

      {/* Swap Button */}
      <div className="w-full">
        {/* Show warning when no real token IDs are available */}
        {((swapDirection === 'erc20-to-nft' && toToken?.isCollection && (!toToken.tokenIds || toToken.tokenIds.length === 0)) ||
          (swapDirection === 'nft-to-erc20' && fromToken?.isCollection && !unifiedUserNfts.loading && unifiedUserNfts.tokenIds.length === 0)) && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {swapDirection === 'erc20-to-nft' 
                ? '⚠️ No real NFT token IDs available from API. Cannot proceed with swap.'
                : '⚠️ You do not own any NFTs from this collection.'
              }
            </p>
          </div>
        )}

        {/* Show loading state for user NFTs */}
        {swapDirection === 'nft-to-erc20' && fromToken?.isCollection && unifiedUserNfts.loading && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🔄 Loading your NFTs...
            </p>
          </div>
        )}

        {/* Show error state for user NFTs */}
        {swapDirection === 'nft-to-erc20' && fromToken?.isCollection && unifiedUserNfts.error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ❌ Error loading NFTs: {unifiedUserNfts.error.message}
            </p>
          </div>
        )}
      
        <Button 
          className="h-12 w-full bg-[#FF2E00] text-white rounded-xl font-semibold hover:bg-[#e52900]"
          disabled={!swapFlow.buttonEnabled || 
            ((swapDirection === 'erc20-to-nft' && toToken?.isCollection && (!toToken.tokenIds || toToken.tokenIds.length === 0)) ||
             (swapDirection === 'nft-to-erc20' && fromToken?.isCollection && (unifiedUserNfts.loading || unifiedUserNfts.tokenIds.length === 0)))}
          onClick={handleSwapClick}
        >
          {swapFlow.buttonText}
        </Button>
      </div>

      {/* NFT Collection Info - Only show when TO token is NFT */}
      {toToken?.isCollection && nftPoolInfo.data && (
        <NftCollectionInfo
          name={`${toToken?.collection?.name || toToken?.name}/${fromToken?.symbol || 'ETH'}`}
          infoItems={[
            { 
              label: "NFT Price", 
              value: `${nftPoolInfo.data.nftPrice.toFixed(4)} ${fromToken?.symbol || 'ETH'}`
            },
            { 
              label: "NFT Listings", 
              value: Math.max(0, nftPoolInfo.data.nftListings - 1).toString()
            },
            { 
              label: "NFT Offers", 
              value: nftPoolInfo.data.offers.toString()
            },
          ]}
          primaryImageSrc={toToken.logo || '/placeholder-nft.svg'}
          secondaryImageSrc={fromToken?.logo || 'https://assets.relay.link/icons/1/light.png'}
        />
      )}

      {/* Show loading state for NFT Collection Info */}
      {toToken?.isCollection && nftPoolInfo.isLoading && (
        <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading NFT pool data...</div>
        </div>
      )}

      {/* Show error state for NFT Collection Info */}
      {toToken?.isCollection && nftPoolInfo.error && (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="text-sm text-red-800">
            ❌ Error loading NFT pool data: {nftPoolInfo.error.message}
          </div>
        </div>
      )}

      {/* NFT Selection Modal */}
      {showNftModal && (
        <NftSelectionModal
          isOpen={showNftModal}
          onClose={handleCloseNftModal}
          onConfirm={handleConfirmNftSelection}
          collectionName={
            swapDirection === 'erc20-to-nft' 
              ? (toToken?.collection?.name || toToken?.name || 'Unknown Collection')
              : (fromToken?.collection?.name || fromToken?.name || 'Unknown Collection')
          }
          collectionLogo={
            swapDirection === 'erc20-to-nft' 
              ? (toToken?.logo || '/placeholder-nft.svg')
              : (fromToken?.logo || '/placeholder-nft.svg')
          }
          nftPrice={
            nftPoolInfo.data?.nftPrice?.toFixed(4) || '0.0000'
          }
          priceSymbol={
            swapDirection === 'erc20-to-nft' 
              ? (fromToken?.symbol || 'ETH')
              : (toToken?.symbol || 'ETH')
          }
          availableNfts={
            swapDirection === 'erc20-to-nft' 
              ? generateNftItems(toToken)
              : generateNftItems(fromToken)
          }
          maxSelection={
            swapDirection === 'erc20-to-nft' 
              ? getMaxAmount(toToken)
              : getMaxAmount(fromToken)
          }
          initialSelectedIds={selectedTokenIds}
          loading={
            swapDirection === 'nft-to-erc20' 
              ? unifiedUserNfts.loading 
              : poolNfts.loading
          }
        />
      )}
    </div>
  );
};
