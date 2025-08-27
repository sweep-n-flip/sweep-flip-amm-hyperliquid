'use client'

import { factoryAbi } from "@/abi/factory";
import { routerAbi } from "@/abi/router";
import { useChainContext } from "@/contexts/ChainContext";
import { usePairs } from "@/hooks/api/usePairs";
import { usePoolByTokens } from "@/hooks/api/usePoolByTokens";
import { type TokenData } from "@/hooks/api/useTokensFromDatabase";
import { useTokenPriceInUSD } from "@/hooks/pricing/useTokenPriceInUSD";
import { useLiquidityFlow } from "@/hooks/useLiquidityFlow";
import { useTokenBalance } from "@/hooks/wallet";
import { useHyperliquidUserNfts } from "@/hooks/wallet/useHyperliquidUserNfts";
import { useLpTokenBalance } from "@/hooks/wallet/useLpTokenBalance";
import { usePoolNfts } from "@/hooks/wallet/usePoolNfts";
import { usePrioritizedCollections } from "@/hooks/wallet/usePrioritizedCollections";
import { useUserNfts } from "@/hooks/wallet/useUserNfts";
import { enrichHyperliquidTokens } from "@/lib/enrichHyperliquidTokens";
import { getContractAddresses } from "@/services/config/ContractAddresses";
import { HyperliquidCollectionsService } from "@/services/HyperliquidCollections";
import { ReservoirService } from "@/services/ReservoirService";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { erc721Abi, type Address } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "./ui/button";
import { CurrencyInput } from "./ui/CurrencyInput";
import { CustomSlider } from "./ui/CustomSlider";
import { NftCollectionInfo } from "./ui/NftCollectionInfo";
import { NftCollectionInput } from "./ui/NftCollectionInput";
import { NftSelectionModal } from "./ui/NftSelectionModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export const LiquidityContent = (): JSX.Element | null => {
  const { selectedChainId, selectedChain } = useChainContext();
  const { address: userAddress } = useAccount();
  
  // Liquidity operation state
  const [liquidityAction, setLiquidityAction] = useState<'create' | 'add' | 'remove'>('create');
  const [liquidityType, setLiquidityType] = useState<'token-nft' | 'eth-nft'>('eth-nft');
  
  // Token selection state
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [collectionAddress, setCollectionAddress] = useState<string | null>(null);
  
  // Amount state
  const [tokenAmount, setTokenAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(1);
  
  // UI state
  const [mounted, setMounted] = useState(false);
  const [showNftModal, setShowNftModal] = useState(false);
  
  // Reservoir collections state for create pool
  const [reservoirCollections, setReservoirCollections] = useState<TokenData[]>([]);
  const [loadingReservoirCollections, setLoadingReservoirCollections] = useState(false);
  const [reservoirContinuation, setReservoirContinuation] = useState<string | undefined>(undefined);
  const [hasMoreReservoirCollections, setHasMoreReservoirCollections] = useState(true);
  const [loadingMoreReservoirCollections, setLoadingMoreReservoirCollections] = useState(false);

  // Fetch tokens using hybrid approach
  const { tokens: rawTokens, loading: tokensLoading } = usePairs(Number(selectedChainId));

  //  Enrich Hyperliquid tokens with collection logos
  const allTokens = useMemo(() => 
    enrichHyperliquidTokens(rawTokens, Number(selectedChainId)), 
    [rawTokens, selectedChainId]
  );

  // Filter tokens by type
  const erc20Tokens = useMemo(() => 
    allTokens.filter(token => token.isErc20), [allTokens]
  );

  const nftTokens = useMemo(() => 
    allTokens.filter(token => token.isCollection), [allTokens]
  );

  // Get prioritized collections (user-owned first) for create mode
  const {
    prioritizedCollections,
    defaultSelectedCollection,
    loading: prioritizedLoading
  } = usePrioritizedCollections({
    allCollections: reservoirCollections,
    existingPools: nftTokens
  });

  // Get selected tokens
  const selectedToken = useMemo(() => {
    if (!tokenAddress) {
      // For Hyperliquid chain, create a default HYPE token if no tokens available
      if (HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId))) {
        // If we have ERC20 tokens from the database, use the first one
        if (erc20Tokens.length > 0) {
          return erc20Tokens[0];
        }
        
        // Fallback to default HYPE token
        return {
          _id: 'hype-hyperliquid',
          address: '0x0000000000000000000000000000000000000000',
          name: 'Hyperliquid',
          symbol: 'HYPE',
          logo: 'https://assets.relay.link/icons/999/light.png',
          isCollection: false,
          isErc20: true,
          nativeChain: Number(selectedChainId),
          decimals: 18,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          collection: {
            id: '0x0000000000000000000000000000000000000000',
            name: 'Hyperliquid',
            symbol: 'HYPE',
            address: '0x0000000000000000000000000000000000000000',
          },
          tokenIds: [],
        } as TokenData;
      }
      
      // Default to ETH for better UX (ETH is more familiar than WETH)
      const ethToken = erc20Tokens.find(token => token.symbol === 'ETH');
      const wethToken = erc20Tokens.find(token => token.symbol === 'WETH');
      return ethToken || wethToken || (erc20Tokens.length > 0 ? erc20Tokens[0] : undefined);
    }
    return erc20Tokens.find(token => token.address === tokenAddress) || undefined;
  }, [tokenAddress, erc20Tokens, selectedChainId]);

  const selectedCollection = useMemo(() => {
    // If we have a collectionAddress, try to find it first
    if (collectionAddress) {
      // Look for the selected collection in both sources
      const fromDatabase = nftTokens.find(token => token.address === collectionAddress);
      const fromReservoir = prioritizedCollections.find(token => token.address === collectionAddress);
      
      const found = fromDatabase || fromReservoir;
      if (found) return found;
    }
    
    // Always default to the first available collection when no collection is selected or found
    if (liquidityAction === 'create') {
      // In create mode, use prioritized collections (user collections first)
      return defaultSelectedCollection || (prioritizedCollections.length > 0 ? prioritizedCollections[0] : undefined) || (nftTokens.length > 0 ? nftTokens[0] : undefined);
    } else {
      // For Add/Remove liquidity, always default to first NFT collection from database
      return nftTokens.length > 0 ? nftTokens[0] : undefined;
    }
  }, [collectionAddress, nftTokens, liquidityAction, defaultSelectedCollection, prioritizedCollections]);

  // Get contract addresses
  const contractAddresses = useMemo(() => {
    return getContractAddresses(Number(selectedChainId));
  }, [selectedChainId]);

  // Create pool transaction hooks
  const { 
    writeContract: createPool,
    data: createPoolHash,
    isPending: isCreatingPool,
    error: createPoolError 
  } = useWriteContract();

  // NFT Approval hooks
  const { 
    writeContract: approveNft,
    data: approveNftHash,
    isPending: isApprovingNft,
    error: approveNftError 
  } = useWriteContract();

  const { 
    isLoading: isNftApproving,
    isSuccess: isNftApproved 
  } = useWaitForTransactionReceipt({
    hash: approveNftHash,
  });

  const { 
    isLoading: isPoolCreating,
    isSuccess: isPoolCreated 
  } = useWaitForTransactionReceipt({
    hash: createPoolHash,
  });

  // Check if pool already exists for selected tokens
  const { data: existingPoolAddress } = useReadContract({
    address: contractAddresses.factory as Address,
    abi: factoryAbi,
    functionName: 'getPair',
    args: selectedToken && selectedCollection ? [
      selectedToken.address as Address,
      (selectedCollection.collection?.id || selectedCollection.address) as Address //  Use wrapper address for getPair
    ] : undefined,
    query: {
      enabled: !!(selectedToken && selectedCollection && liquidityAction === 'create'),
    },
  });

  // Check if NFT collection is approved for router
  const { data: isNftApprovedForRouter, refetch: refetchNftApproval } = useReadContract({
    address: selectedCollection ? ((selectedCollection.collection?.id || selectedCollection.address) as Address) : undefined, //  Use wrapper address for approval check
    abi: erc721Abi,
    functionName: 'isApprovedForAll',
    args: userAddress && selectedCollection ? [
      userAddress,
      contractAddresses.router as Address
    ] : undefined,
    query: {
      enabled: !!(userAddress && selectedCollection && contractAddresses.router && (liquidityAction === 'create' || liquidityAction === 'add')),
    },
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select first user collection for create mode (prevent infinite loops)
  useEffect(() => {
    if (liquidityAction === 'create' && !collectionAddress && defaultSelectedCollection && mounted) {
      // Only auto-select if we don't have a collection selected yet
      setCollectionAddress(defaultSelectedCollection.address);
    }
  }, [liquidityAction, collectionAddress, defaultSelectedCollection, mounted]);

  // AIDEV-NOTE: Auto-select first tokens when they are loaded for Add/Remove liquidity
  useEffect(() => {
    if (!mounted || tokensLoading) return;
    
    // Auto-select first token if none selected for Add/Remove actions
    if ((liquidityAction === 'add' || liquidityAction === 'remove') && !tokenAddress && erc20Tokens.length > 0) {
      // Default to ETH if available, otherwise first ERC20 token
      const ethToken = erc20Tokens.find(token => token.symbol === 'ETH');
      const defaultToken = ethToken || erc20Tokens[0];
      setTokenAddress(defaultToken.address);
    }
    
    // Auto-select first collection if none selected for Add/Remove actions
    if ((liquidityAction === 'add' || liquidityAction === 'remove') && !collectionAddress && nftTokens.length > 0) {
      setCollectionAddress(nftTokens[0].address);
    }
  }, [mounted, tokensLoading, liquidityAction, tokenAddress, collectionAddress, erc20Tokens, nftTokens]);

  // AIDEV-NOTE: Sync collectionAddress when selectedCollection changes automatically
  useEffect(() => {
    if (!mounted || tokensLoading) return;
    
    // Sync collectionAddress when selectedCollection is auto-selected but collectionAddress is still null
    if (selectedCollection && !collectionAddress && (liquidityAction === 'add' || liquidityAction === 'remove')) {
      setCollectionAddress(selectedCollection.address);
    }
  }, [mounted, tokensLoading, selectedCollection, collectionAddress, liquidityAction]);

  // Function to load more Reservoir collections (pagination)
  const loadMoreReservoirCollections = useCallback(async () => {
    if (!reservoirContinuation || !hasMoreReservoirCollections || loadingMoreReservoirCollections) {
      return;
    }
    setLoadingMoreReservoirCollections(true);
    try {
      //  Get next page of collections from Reservoir
      const response = await ReservoirService.getAllCollections(
        Number(selectedChainId),
        20,
        reservoirContinuation
      );

      // Transform to TokenData format
      const newCollections = response.collections.map(collection => ({
        _id: collection.id,
        address: collection.contractAddress,
        name: collection.name,
        symbol: collection.symbol,
        logo: collection.imageUrl,
        isCollection: true,
        isErc20: false,
        nativeChain: Number(selectedChainId),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collection: {
          id: collection.contractAddress,
          name: collection.name,
          symbol: collection.symbol,
          address: collection.contractAddress,
        },
        tokenIds: [], // Will be loaded when user selects NFTs
        // Add metadata for display
        floorPrice: collection.floorPrice,
        volume24h: collection.volume24h,
      } as TokenData));

      // Filter out collections that already have pools OR already exist in current list
      const existingPoolAddresses = new Set(nftTokens.map(token => token.address.toLowerCase()));
      const existingReservoirAddresses = new Set(reservoirCollections.map(token => token.address.toLowerCase()));
      
      const collectionsWithoutPools = newCollections.filter(
        collection => {
          const address = collection.address.toLowerCase();
          return !existingPoolAddresses.has(address) && !existingReservoirAddresses.has(address);
        }
      );
      // Append new collections to existing list
      setReservoirCollections(prev => [...prev, ...collectionsWithoutPools]);
      setReservoirContinuation(response.continuation);
      setHasMoreReservoirCollections(!!response.continuation);
    } catch (error) {
      toast.error('Failed to load more NFT collections');
    } finally {
      setLoadingMoreReservoirCollections(false);
    }
  }, [selectedChainId, reservoirContinuation, hasMoreReservoirCollections, loadingMoreReservoirCollections, nftTokens]);

  // Load NFT collections from Reservoir when in create mode
  useEffect(() => {
    if (liquidityAction === 'create' && mounted && selectedToken) {
      // For Hyperliquid, load custom collections instead of Reservoir
      if (HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId))) {
        setLoadingReservoirCollections(true);
        try {
          const hyperliquidCollections = HyperliquidCollectionsService.getCollections();
          setReservoirCollections(hyperliquidCollections);
          setReservoirContinuation(undefined);
          setHasMoreReservoirCollections(false);
          
          // Auto-select first collection if none selected yet
          if (!collectionAddress && hyperliquidCollections.length > 0) {
            setCollectionAddress(hyperliquidCollections[0].address);
          }
        } catch (error) {
          toast.error('Failed to load Hyperliquid NFT collections');
          setReservoirCollections([]);
        } finally {
          setLoadingReservoirCollections(false);
        }
        return;
      }

      const loadReservoirCollections = async () => {
        setLoadingReservoirCollections(true);
        try {
          //  Get all NFT collections from the chain via Reservoir
          const response = await ReservoirService.getAllCollections(
            Number(selectedChainId),
            20 // API maximum limit is 20
          );

          // Transform to TokenData format
          const allCollections = response.collections.map(collection => ({
            _id: collection.id,
            address: collection.contractAddress,
            name: collection.name,
            symbol: collection.symbol,
            logo: collection.imageUrl,
            isCollection: true,
            isErc20: false,
            nativeChain: Number(selectedChainId),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            collection: {
              id: collection.contractAddress,
              name: collection.name,
              symbol: collection.symbol,
              address: collection.contractAddress,
            },
            tokenIds: [], // Will be loaded when user selects NFTs
            // Add metadata for display
            floorPrice: collection.floorPrice,
            volume24h: collection.volume24h,
          } as TokenData));
          
          // Filter out collections that already have pools using our database
          // Get existing collections with pools from usePairs (nftTokens)
          const existingPoolAddresses = new Set(nftTokens.map(token => token.address.toLowerCase()));
          const collectionsWithoutPools = allCollections.filter(
            collection => !existingPoolAddresses.has(collection.address.toLowerCase())
          );
          
          setReservoirCollections(collectionsWithoutPools);
          setReservoirContinuation(response.continuation);
          setHasMoreReservoirCollections(!!response.continuation);
        } catch (error) {
          toast.error('Failed to load NFT collections from Reservoir');
          setReservoirCollections([]);
        } finally {
          setLoadingReservoirCollections(false);
        }
      };

      if (ReservoirService.isChainSupported(Number(selectedChainId))) {
        loadReservoirCollections();
      } else {
        setReservoirCollections([]);
        setLoadingReservoirCollections(false);
      }
    } else if (liquidityAction !== 'create') {
      // Clear Reservoir collections when not in create mode
      setReservoirCollections([]);
    }
  }, [liquidityAction, mounted, selectedChainId, selectedToken?.address, nftTokens]);

  // Handle NFT approval success
  useEffect(() => {
    if (isNftApproved) {
      toast.success('NFT collection approved successfully!');
      // Refetch approval status to update UI
      refetchNftApproval();
    }
  }, [isNftApproved, refetchNftApproval]);

  // Handle NFT approval errors
  useEffect(() => {
    if (approveNftError) {
      toast.error(`NFT approval failed: ${approveNftError.message}`);
    }
  }, [approveNftError]);

  // Handle pool creation success
  useEffect(() => {
    if (isPoolCreated) {
      toast.success('Pool created successfully!');
      // Reset form state
      setTokenAmount('');
      setEthAmount('');
      setSelectedTokenIds([]);
      setSliderValue(1);
      // Optionally switch to add liquidity tab
      // setLiquidityAction('add');
    }
  }, [isPoolCreated]);

  // Handle pool creation errors
  useEffect(() => {
    if (createPoolError) {
      toast.error(`Pool creation failed: ${createPoolError.message}`);
    }
  }, [createPoolError]);

  //  Additional hydration safety check
  if (typeof window === 'undefined') {
    return null; // Don't render on server
  }

  // Get pool data from database
  const { pool, loading: poolLoading } = usePoolByTokens(
    selectedToken,
    selectedCollection,
    Number(selectedChainId)
  );

  // Get token balances
  const tokenBalance = useTokenBalance(selectedToken, undefined);

  // Check if we're on Hyperliquid chain
  const isHyperliquidChain = useMemo(() => 
    HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId)), 
    [selectedChainId]
  );

  // Fetch user's NFTs for the selected collection - use appropriate hook based on chain
  const userNfts = useUserNfts({
    collectionAddress: mounted && typeof window !== 'undefined' && selectedCollection?.isCollection && !isHyperliquidChain
      ? (selectedCollection.address as `0x${string}`) 
      : null,
    enabled: mounted && typeof window !== 'undefined' && !!selectedCollection?.isCollection && !isHyperliquidChain,
  });

  // Fetch user's NFTs for Hyperliquid collections using native contract calls
  const hyperliquidUserNfts = useHyperliquidUserNfts({
    collectionAddress: mounted && typeof window !== 'undefined' && selectedCollection?.isCollection && isHyperliquidChain
      ? (selectedCollection.address as `0x${string}`) 
      : null,
    enabled: mounted && typeof window !== 'undefined' && !!selectedCollection?.isCollection && isHyperliquidChain,
    chainId: Number(selectedChainId),
  });

  // Fetch pool NFTs for the selected collection
  const poolNfts = usePoolNfts({
    collectionAddress: mounted && typeof window !== 'undefined' && selectedCollection?.isCollection 
      ? (selectedCollection.address as `0x${string}`) 
      : null,
    tokenIds: mounted && typeof window !== 'undefined' && selectedCollection?.tokenIds 
      ? selectedCollection.tokenIds 
      : [],
    enabled: mounted && typeof window !== 'undefined' && !!selectedCollection?.isCollection && !!selectedCollection?.tokenIds?.length,
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

  // Memoize user NFT count using unified data
  const userNftCount = useMemo(() => unifiedUserNfts.tokenIds.length, [unifiedUserNfts.tokenIds]);
  // Use liquidity flow hook for managing operations
  const liquidityFlow = useLiquidityFlow({
    action: liquidityAction,
    liquidityType: liquidityType,
    token: liquidityType === 'token-nft' && selectedToken ? {
      address: selectedToken.address as `0x${string}`,
      symbol: selectedToken.symbol,
      decimals: selectedToken.decimals || 18,
    } : null,
    collection: selectedCollection ? {
      id: selectedCollection.collection?.id || selectedCollection.address, // Use unique collection ID, fallback to wrapper address
      address: (selectedCollection.collection?.id || selectedCollection.address) as Address,
      symbol: selectedCollection.symbol,
    } : null,
    tokenAmount: liquidityType === 'token-nft' ? tokenAmount : undefined,
    ethAmount: liquidityType === 'eth-nft' ? ethAmount : undefined,
    tokenIds: selectedTokenIds,
    liquidityAmount: liquidityAction === 'remove' ? liquidityAmount : undefined,
    liquidityQuote: {
      // TODO: Add liquidity quotes calculation
      expectedTokenAmount: BigInt(0),
      expectedETHAmount: BigInt(0),
      expectedLiquidity: BigInt(0),
    },
  });

  // Check user's LP Token balance for the selected collection
  const userLpTokenBalance = useLpTokenBalance({
    tokenB: selectedCollection ? {
      address: (selectedCollection.collection?.id || selectedCollection.address) as Address, // Use wrapper address for getPair
      symbol: selectedCollection.symbol,
      decimals: 0, // NFT collections don't have decimals
      isErc20: false,
      isCollection: true,
      collection: {
        id: selectedCollection.collection?.id || selectedCollection.address,
        address: (selectedCollection.collection?.address || selectedCollection.address) as string, // Original NFT contract address
      },
    } : null,
    enabled: !!selectedCollection, // Only run when collection is selected
  });

  // Handle action/type changes
  const handleActionChange = (action: 'create' | 'add' | 'remove') => {
    setLiquidityAction(action);
    // Reset amounts when switching
    setTokenAmount('');
    setEthAmount('');
    setLiquidityAmount('');
    setSelectedTokenIds([]);
    setSliderValue(1);
    
    // Auto-select first available tokens for better UX
    if (action === 'add' || action === 'remove') {
      // For Add/Remove liquidity, ensure we have default selections immediately
      if (erc20Tokens.length > 0) {
        // Default to ETH if available, otherwise first ERC20 token
        const ethToken = erc20Tokens.find(token => token.symbol === 'ETH');
        const defaultToken = ethToken || erc20Tokens[0];
        setTokenAddress(defaultToken.address);
      }
      
      if (nftTokens.length > 0) {
        setCollectionAddress(nftTokens[0].address);
      }
    } else if (action === 'create') {
      // For create, reset to allow auto-selection via useEffect
      setTokenAddress(null);
      setCollectionAddress(null);
    }
    
    // Initialize token IDs based on new action
    if ((action === 'create' || action === 'add') && unifiedUserNfts.tokenIds.length > 0) {
      const tokenIds = unifiedUserNfts.tokenIds.slice(0, 1);
      setSelectedTokenIds(tokenIds);
    } else if (action === 'remove' && selectedCollection?.tokenIds) {
      const tokenIds = selectedCollection.tokenIds.slice(0, 1);
      setSelectedTokenIds(tokenIds);
    }
  };

  // Handle token selection
  const handleTokenSelect = (token: TokenData) => {
    setTokenAddress(token.address);
  };

  const handleCollectionSelect = (collection: TokenData) => {
    setCollectionAddress(collection.address);
  };

  // Handle amount changes
  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
  };

  const handleLiquidityAmountChange = (value: string) => {
    setLiquidityAmount(value);
  };

  // Handle MAX button clicks
  const handleMaxTokenAmount = () => {
    if (selectedToken && (liquidityAction === 'add' || liquidityAction === 'create')) {
      const balance = getUserBalance(selectedToken);
      const numericBalance = balance.replace(/[^0-9.]/g, '');
      const cleanBalance = parseFloat(numericBalance);
      if (!isNaN(cleanBalance)) {
        setTokenAmount(cleanBalance.toString());
      }
    }
  };

  const handleMaxEthAmount = () => {
    if (liquidityAction === 'add' || liquidityAction === 'create') {
      // Get ETH/WETH balance from wallet
      const wethBalance = tokenBalance.userBalance || "0";
      const numericBalance = wethBalance.replace(/[^0-9.]/g, '');
      const cleanBalance = parseFloat(numericBalance);
      if (!isNaN(cleanBalance)) {
        setEthAmount(cleanBalance.toString());
      }
    }
  };

  const handleMaxLiquidityAmount = () => {
    if (liquidityAction === 'remove') {
      // Use real LP token balance from liquidityFlow
      const lpBalance = liquidityFlow.lpTokenBalance.balanceFormatted;
      setLiquidityAmount(lpBalance);
    }
  };

  // Get user balance for tokens
  const getUserBalance = (token: typeof selectedToken) => {
    if (!token) return "0";
    
    if (token.isCollection) {
      // For NFT collections, check if this token matches the one we're fetching user NFTs for
      // and if the user actually owns NFTs from this collection
      if (token.address.toLowerCase() === selectedCollection?.address.toLowerCase() && unifiedUserNfts.tokenIds.length > 0) {
        return unifiedUserNfts.tokenIds.length.toString();
      }
      // If collection doesn't match or user has no NFTs, return "0"
      return "0";
    }
    
    return tokenBalance.userBalance || "0";
  };

  // Get pool balance
  const getPoolBalance = useCallback((token: typeof selectedToken) => {
    if (!token) return "0";
    
    if (pool && pool.poolStats) {
      if (token.isCollection) {
        const availableForAdd = Math.max(0, pool.poolStats.nftListings);
        return availableForAdd.toString();
      }
      
      if (token.isErc20) {
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
    }
    
    return tokenBalance.poolBalance || "0";
  }, [pool?.poolStats, tokenBalance.poolBalance]);

  // Get maximum amount available for slider - memoize to prevent infinite re-renders
  const maxAmount = useMemo(() => {
    if (!selectedCollection) return 100;
    
    if (liquidityAction === 'create' || liquidityAction === 'add') {
      // For create and add liquidity, use user's actual NFT count
      return Math.max(1, userNftCount);
    } else {
      // For remove liquidity, use pool NFT listings
      if (pool && pool.poolStats) {
        return Math.max(1, pool.poolStats.nftListings);
      }
      return Math.max(1, selectedCollection.tokenIds?.length || 1);
    }
  }, [liquidityAction, selectedCollection?.address, userNftCount, pool?.poolStats?.nftListings]);

  const getMaxAmount = useCallback((token?: typeof selectedCollection) => {
    // Use memoized maxAmount by default, allow override for specific token
    if (token && token !== selectedCollection) {
      if (liquidityAction === 'create' || liquidityAction === 'add') {
        return Math.max(1, userNftCount);
      } else {
        if (pool && pool.poolStats) {
          return Math.max(1, pool.poolStats.nftListings);
        }
        return Math.max(1, token.tokenIds?.length || 1);
      }
    }
    return maxAmount;
  }, [maxAmount, liquidityAction, selectedCollection, userNftCount, pool?.poolStats]);

  // Get token price in USD using router quotes
  const { price: tokenPriceUSD, loading: priceLoading } = useTokenPriceInUSD({
    tokenAddress: selectedToken?.address as Address,
    enabled: !!selectedToken?.isErc20,
  });

  // Calculate USD value for ERC20 tokens using router-based pricing only
  const getUsdValue = (token: typeof selectedToken, amount: string): string | undefined => {
    if (!token || !token.isErc20 || !amount || amount === '0') return undefined;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return undefined;

    // Only use router-based price - no fallbacks
    if (token.address === selectedToken?.address && tokenPriceUSD && tokenPriceUSD > 0) {
      const value = numericAmount * tokenPriceUSD;
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    // Return undefined if no real price data available
    return undefined;
  };

  // Handle slider value change for NFT quantity
  const handleSliderChange = useCallback((value: number) => {
    const clampedValue = Math.min(Math.max(1, value), maxAmount);
    
    setSliderValue(clampedValue);
    
    // Update selected token IDs based on slider value
    if ((liquidityAction === 'create' || liquidityAction === 'add') && unifiedUserNfts.tokenIds.length > 0) {
      const tokenIds = unifiedUserNfts.tokenIds.slice(0, clampedValue);
      setSelectedTokenIds(tokenIds);
    } else if (liquidityAction === 'remove' && selectedCollection?.tokenIds) {
      const tokenIds = selectedCollection.tokenIds.slice(0, clampedValue);
      setSelectedTokenIds(tokenIds);
    }
  }, [maxAmount, liquidityAction, unifiedUserNfts.tokenIds, selectedCollection?.tokenIds]);

  // Get collection info for display
  const getCollectionInfo = () => {
    if (!selectedCollection || !selectedCollection.isCollection) return null;
    
    const collectionName = selectedCollection.collection?.name || selectedCollection.name;
    const wrapperSymbol =  selectedToken?.symbol || 'WETH';
    
    let listings = "0";
    let offers = "0";
    
    if (pool && pool.poolStats) {
      listings = pool.poolStats.nftListings.toString();
      offers = pool.poolStats.offers.toString();
    } else {
      listings = selectedCollection.tokenIds?.length.toString() || "0";
    }
    
    return {
      name: `${collectionName}/${wrapperSymbol}`,
      listings,
      offers,
    };
  };

  //  NFT Approval Functions
  const handleApproveNft = async () => {
    if (!userAddress || !selectedCollection || !contractAddresses.router) {
      toast.error('Missing required parameters to approve NFT collection');
      return;
    }

    const wrapperAddress = selectedCollection.collection?.id || selectedCollection.address; //  Use wrapper address for approval

    try {
      approveNft({
        address: wrapperAddress as Address, //  Approve wrapper contract, not original NFT contract
        abi: erc721Abi,
        functionName: 'setApprovalForAll',
        args: [
          contractAddresses.router as Address, // spender (router)
          true // approved
        ],
      });

      toast.success('NFT approval transaction submitted!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve NFT collection');
    }
  };

  //  Create Pool Functions
  const handleCreatePool = async () => {
    if (!userAddress || !selectedToken || !selectedCollection || !selectedTokenIds.length) {
      toast.error('Missing required parameters to create pool');
      return;
    }

    const wrapperAddress = selectedCollection.collection?.id || selectedCollection.address; //  Use wrapper address for pool operations

    try {
      // Check if pool already exists
      if (existingPoolAddress && existingPoolAddress !== '0x0000000000000000000000000000000000000000') {
        toast.error('Pool already exists for this token pair');
        return;
      }

      const tokenIdsAsBigInt = selectedTokenIds.map(id => BigInt(id));
      
      if (liquidityType === 'eth-nft') {
        // Create ETH/NFT pool using addLiquidityETHCollection
        const ethAmountWei = BigInt(Math.floor(parseFloat(ethAmount || '0') * 1e18));
        const ethMinAmount = ethAmountWei * BigInt(95) / BigInt(100); // 5% slippage

        createPool({
          address: contractAddresses.router as Address,
          abi: routerAbi,
          functionName: 'addLiquidityETHCollection',
          args: [
            wrapperAddress as Address, //  Use wrapper address for pool creation
            tokenIdsAsBigInt, // tokenIds
            ethMinAmount, // amountETHMin
            userAddress, // to
            BigInt(Math.floor(Date.now() / 1000) + 1200), // deadline (20 minutes)
          ],
          value: ethAmountWei, // Send ETH value
        });
      } else {
        // Create Token/NFT pool using addLiquidityCollection
        const tokenAmountWei = BigInt(Math.floor(parseFloat(tokenAmount || '0') * Math.pow(10, selectedToken.decimals || 18)));
        const tokenMinAmount = BigInt(Math.floor(Number(tokenAmountWei) * 95 / 100)); // 5% slippage

        createPool({
          address: contractAddresses.router as Address,
          abi: routerAbi,
          functionName: 'addLiquidityCollection',
          args: [
            selectedToken.address as Address, // tokenA
            wrapperAddress as Address, //  Use wrapper address for pool creation
            tokenAmountWei, // amountADesired
            tokenIdsAsBigInt, // tokenIdsB
            tokenMinAmount, // amountAMin
            userAddress, // to
            BigInt(Math.floor(Date.now() / 1000) + 1200), // deadline (20 minutes)
          ],
        });
      }

      toast.success('Pool creation transaction submitted!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create pool');
    }
  };

  // Check if pool can be created
  const canCreatePool = () => {
    if (!userAddress || !selectedToken || !selectedCollection) {
      return false;
    }

    // Check if user has NFTs from the selected collection
    if (liquidityAction === 'create') {
      const userBalance = getUserBalance(selectedCollection);
      if (parseInt(userBalance) === 0) {
        return false; // User doesn't own any NFTs from this collection
      }
    }

    if (!selectedTokenIds.length) {
      return false;
    }

    if (liquidityType === 'eth-nft') {
      return parseFloat(ethAmount || '0') > 0;
    } else {
      return parseFloat(tokenAmount || '0') > 0;
    }
  };

  // Get create pool button text
  const getCreatePoolButtonText = () => {
    if (!userAddress) return 'Connect Wallet';
    if (!selectedToken) return 'Select Token';
    if (!selectedCollection) return 'Select NFT Collection';
    
    // Check if user owns any NFTs from the selected collection
    if (liquidityAction === 'create' && selectedCollection) {
      const userBalance = getUserBalance(selectedCollection);
      if (parseInt(userBalance) === 0) {
        return 'You don\'t own NFTs from this collection';
      }
    }
    
    if (!selectedTokenIds.length) return 'Select NFTs';
    
    // Check NFT approval status
    if (isNftApprovedForRouter === false) {
      if (isApprovingNft || isNftApproving) {
        return 'Approving NFT Collection...';
      }
      return 'Approve NFT Collection';
    }
    
    if (liquidityType === 'eth-nft') {
      if (!ethAmount || parseFloat(ethAmount) <= 0) return 'Enter ETH Amount';
    } else {
      if (!tokenAmount || parseFloat(tokenAmount) <= 0) return 'Enter Token Amount';
    }

    if (existingPoolAddress && existingPoolAddress !== '0x0000000000000000000000000000000000000000') {
      return 'Pool Already Exists';
    }

    if (isCreatingPool || isPoolCreating) return 'Creating Pool...';

    return 'Create Pool';
  };

  // Get add liquidity button text (includes NFT approval check)
  const getAddLiquidityButtonText = () => {
    // Check NFT approval status for add liquidity
    if (isNftApprovedForRouter === false && selectedTokenIds.length > 0) {
      if (isApprovingNft || isNftApproving) {
        return 'Approving NFT Collection...';
      }
      return 'Approve NFT Collection';
    }

    // Return the normal liquidity flow button text
    return liquidityFlow.buttonText;
  };

  // Generate NFT items for modal
  const generateNftItems = (token: typeof selectedCollection) => {
    if (!token || !token.isCollection) return [];
    
    //  For create and add liquidity, use user's NFTs; for remove liquidity, use pool NFTs
    let tokenIds: string[] = [];
    let maxNfts = 0;
    
    if (liquidityAction === 'create' || liquidityAction === 'add') {
      // When creating pool or adding liquidity, use user's actual NFT token IDs from wallet
      tokenIds = unifiedUserNfts.tokenIds;
      maxNfts = unifiedUserNfts.tokenIds.length;
    } else {
      // When removing liquidity, use pool NFTs
      tokenIds = token.tokenIds || [];
      maxNfts = getMaxAmount(token);
    }
    
    // Get price per NFT from pool data (for create mode, we don't have pool data yet, so price will be 0)
    const nftPrice = pool?.poolStats?.nftPrice || 0;
    const priceSymbol = (selectedToken?.symbol === 'ETH' || selectedToken?.symbol === 'WETH' || selectedToken?.symbol === 'HYPE') 
      ? (selectedToken?.symbol || 'ETH')
      : (liquidityType === 'eth-nft' ? (selectedToken?.symbol || 'ETH') : (selectedToken?.symbol || 'TOKEN'));
    
    // Generate NFT items using appropriate IDs
    const nftItems = [];
    for (let i = 0; i < Math.min(maxNfts, 100); i++) { // Limit to 100 for performance
      const tokenId = tokenIds[i];
      if (!tokenId) break; // Stop if no more token IDs available
      
      //  Get actual image and name from Reservoir data based on liquidity action
      let nftImage = '/placeholder-nft.svg'; // Default placeholder
      let nftName = `Token #${tokenId}`;
      
      if ((liquidityAction === 'create' || liquidityAction === 'add') && unifiedUserNfts.nfts.length > 0) {
        // For creating pool or adding liquidity, use user's NFT data from wallet
        const userNft = unifiedUserNfts.nfts.find(nft => nft.tokenId === tokenId);
        if (userNft) {
          // Use the best available image, fallback chain: imageLarge -> image -> imageSmall -> placeholder
          nftImage = userNft.imageLarge || userNft.image || userNft.imageSmall || '/placeholder-nft.svg';
          // Use the NFT name if available
          nftName = userNft.name || `Token #${tokenId}`;
        }
      } else if (liquidityAction === 'remove' && poolNfts.nfts.length > 0) {
        // For removing liquidity, use pool NFT data from Reservoir
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
    //  Only open modal when fully hydrated
    if (mounted && typeof window !== 'undefined') {
      const availableNfts = generateNftItems(selectedCollection);
      setShowNftModal(true);
    }
  };

  const handleCloseNftModal = () => {
    setShowNftModal(false);
  };

  const handleConfirmNftSelection = (selectedIds: string[]) => {
    //  Prevent loop by ensuring mounted state
    if (mounted && typeof window !== 'undefined') {
      setSelectedTokenIds(selectedIds);
      setSliderValue(Math.max(1, selectedIds.length));
    }
  };

  // Handle liquidity button click
  const handleLiquidityClick = async () => {
    // Handle create pool action
    if (liquidityAction === 'create') {
      // Check if NFT needs approval first
      if (isNftApprovedForRouter === false) {
        await handleApproveNft();
        return;
      }
      
      await handleCreatePool();
      return;
    }

    // Handle add liquidity action
    if (liquidityAction === 'add') {
      // Check if NFT needs approval first for add liquidity
      if (isNftApprovedForRouter === false && selectedTokenIds.length > 0) {
        await handleApproveNft();
        return;
      }
    }

    if (!liquidityFlow.buttonEnabled) return;
    
    // Validate inputs based on action
    if (liquidityAction === 'add') {
      if (liquidityType === 'token-nft' && (!selectedToken || !tokenAmount)) {
        toast.error('Please select token and enter amount');
        return;
      }
      if (liquidityType === 'eth-nft' && (!selectedToken || !(ethAmount || tokenAmount))) {
        toast.error(`Please enter ${selectedToken?.symbol || 'ETH'} amount`);
        return;
      }
      if (!selectedCollection || selectedTokenIds.length === 0) {
        toast.error('Please select NFTs to add');
        return;
      }
    } else {
      if (!liquidityAmount) {
        toast.error('Please enter LP token amount to remove');
        return;
      }
      if (selectedTokenIds.length === 0) {
        toast.error('Please select NFTs to receive');
        return;
      }
    }
    
    try {
      if (liquidityFlow.buttonAction === 'approveToken') {
        await liquidityFlow.approveToken();
      } else if (liquidityFlow.buttonAction === 'approveLpToken') {
        await liquidityFlow.lpTokenApproval.approveToken();
      } else {
        await liquidityFlow.executeLiquidityTransaction();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  // Loading state - enhanced hydration safety
  if (!mounted || tokensLoading || poolLoading || typeof window === 'undefined') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="w-full h-20 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-full h-20 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-full h-32 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  // No tokens available - but allow Create Pool for Hyperliquid
  if (erc20Tokens.length === 0 && nftTokens.length === 0) {
    // For Hyperliquid, allow create pool even without database tokens
    const isHyperliquid = HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId));
    
    // Show "No tokens available" only if there are no tokens at all, or not in create mode for Hyperliquid
    if (!isHyperliquid || liquidityAction !== 'create') {
      return (
        <div className="flex flex-col items-center gap-4 p-4">
          <div className="text-center text-gray-500">
            No tokens available for {selectedChain?.name || 'selected network'}
          </div>
          {isHyperliquid && (
            <div className="text-center text-sm text-gray-400">
              Switch to "Create Pool" tab to create the first pool on Hyperliquid
            </div>
          )}
        </div>
      );
    }
  }

  const collectionInfo = getCollectionInfo();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Action Tabs */}
      <Tabs value={liquidityAction} onValueChange={(value) => handleActionChange(value as 'create' | 'add' | 'remove')} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="data-[state=active]:text-[#FF2E00]">Create Pool</TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:text-[#FF2E00]">Add Liquidity</TabsTrigger>
          <TabsTrigger value="remove" className="data-[state=active]:text-[#FF2E00]">Remove Liquidity</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          {/* Token Input - Same as Add Liquidity */}
          <CurrencyInput
            amount={liquidityType === 'token-nft' ? tokenAmount : ethAmount}
            currency={selectedToken?.symbol || (HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId)) ? 'HYPE' : 'ETH')}
            value={getUsdValue(selectedToken, liquidityType === 'token-nft' ? tokenAmount : ethAmount)}
            balance={getUserBalance(selectedToken)}
            iconSrc={(HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId)) ? 'https://assets.relay.link/icons/999/light.png' : 'https://assets.relay.link/icons/1/light.png')}
            selectedToken={selectedToken}
            onTokenSelect={handleTokenSelect}
            onAmountChange={(value) => {
              if (selectedToken?.symbol === 'ETH' || selectedToken?.symbol === 'WETH' || selectedToken?.symbol === 'HYPE') {
                setLiquidityType('eth-nft');
                setEthAmount(value);
                setTokenAmount('');
              } else {
                setLiquidityType('token-nft');
                setTokenAmount(value);
                setEthAmount('');
              }
            }}
            onMaxClick={() => {
              if (selectedToken?.symbol === 'ETH' || selectedToken?.symbol === 'WETH' || selectedToken?.symbol === 'HYPE') {
                handleMaxEthAmount();
              } else {
                handleMaxTokenAmount();
              }
            }}
            placeholder="0.0"
            disabled={false}
          />

          {/* NFT Collection Input - Uses Reservoir API for Create Pool */}
          <NftCollectionInput
            amount={selectedTokenIds.length.toString()}
            collection={selectedCollection?.collection?.symbol || selectedCollection?.symbol || 'Select NFT Collection'}
            balance={getUserBalance(selectedCollection)}
            iconSrc={selectedCollection?.logo || '/placeholder-nft.svg'}
            selectedToken={selectedCollection}
            onTokenSelect={handleCollectionSelect}
            onChooseNfts={handleOpenNftModal}
            useReservoir={true}
            reservoirCollections={prioritizedCollections}
            existingPools={nftTokens}
            loadingReservoirCollections={loadingReservoirCollections || prioritizedLoading}
            onLoadMoreReservoirCollections={loadMoreReservoirCollections}
            hasMoreReservoirCollections={hasMoreReservoirCollections}
            loadingMoreReservoirCollections={loadingMoreReservoirCollections}
          >
            <CustomSlider
              value={mounted ? sliderValue : 1}
              onChange={handleSliderChange}
              max={maxAmount}
              step={1}
            />
          </NftCollectionInput>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          {/* Token Input - Always show, user can select ETH or other tokens */}
          <CurrencyInput
            amount={liquidityType === 'token-nft' ? tokenAmount : ethAmount}
            currency={selectedToken?.symbol || (HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId)) ? 'HYPE' : 'ETH')}
            value={getUsdValue(selectedToken, liquidityType === 'token-nft' ? tokenAmount : ethAmount)}
            balance={getUserBalance(selectedToken)}
            iconSrc={selectedToken?.logo || (HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId)) ? 'https://app.hyperliquid.xyz/favicon.ico' : 'https://assets.relay.link/icons/1/light.png')}
            selectedToken={selectedToken}
            onTokenSelect={handleTokenSelect}
            onAmountChange={(value) => {
              if (selectedToken?.symbol === 'ETH' || selectedToken?.symbol === 'WETH' || selectedToken?.symbol === 'HYPE') {
                setLiquidityType('eth-nft');
                setEthAmount(value);
                setTokenAmount('');
              } else {
                setLiquidityType('token-nft');
                setTokenAmount(value);
                setEthAmount('');
              }
            }}
            onMaxClick={() => {
              if (selectedToken?.symbol === 'ETH' || selectedToken?.symbol === 'WETH' || selectedToken?.symbol === 'HYPE') {
                handleMaxEthAmount();
              } else {
                handleMaxTokenAmount();
              }
            }}
            placeholder="0.0"
            disabled={false}
          />

          {/* NFT Collection Input for Add */}
          <NftCollectionInput
            amount={selectedTokenIds.length.toString()}
            collection={selectedCollection?.collection?.symbol || selectedCollection?.symbol || 'Unknown'}
            balance={getUserBalance(selectedCollection)}
            iconSrc={selectedCollection?.logo || '/placeholder-nft.svg'}
            selectedToken={selectedCollection}
            onTokenSelect={handleCollectionSelect}
            onChooseNfts={handleOpenNftModal}
          >
            <CustomSlider
              value={mounted ? sliderValue : 1}
              onChange={handleSliderChange}
              max={maxAmount}
              step={1}
            />
          </NftCollectionInput>
        </TabsContent>

        <TabsContent value="remove" className="space-y-4">
          {/* LP Token Input */}
          <CurrencyInput
            amount={liquidityAmount}
            currency="LP"
            value={undefined} // No USD value for LP tokens
            balance={liquidityFlow.lpTokenBalance.balanceFormatted}
            iconSrc="/icon.png"
            selectedToken={undefined}
            onTokenSelect={() => {}} // LP token is fixed
            onAmountChange={handleLiquidityAmountChange}
            onMaxClick={handleMaxLiquidityAmount}
            placeholder="0.0"
            disabled={false}
          />

          {/* NFT Selection for Remove */}
          <NftCollectionInput
            amount={selectedTokenIds.length.toString()}
            collection={selectedCollection?.collection?.symbol || selectedCollection?.symbol || 'Unknown'}
            balance={getPoolBalance(selectedCollection)}
            iconSrc={selectedCollection?.logo || '/placeholder-nft.svg'}
            selectedToken={selectedCollection}
            onTokenSelect={handleCollectionSelect}
            onChooseNfts={handleOpenNftModal}
          >
            <CustomSlider
              value={mounted ? sliderValue : 1}
              onChange={handleSliderChange}
              max={maxAmount}
              step={1}
            />
          </NftCollectionInput>
        </TabsContent>
      </Tabs>

      {/* Action Button */}
      <div className="w-full">
        <Button 
          className="h-12 w-full bg-[#FF2E00] text-white rounded-xl font-semibold hover:bg-[#e52900]"
          disabled={
            liquidityAction === 'create' 
              ? !canCreatePool() || isCreatingPool || isPoolCreating || isApprovingNft || isNftApproving || (existingPoolAddress && existingPoolAddress !== '0x0000000000000000000000000000000000000000')
              : !liquidityFlow.buttonEnabled || isApprovingNft || isNftApproving
          }
          onClick={handleLiquidityClick}
        >
          {liquidityAction === 'create' ? getCreatePoolButtonText() : getAddLiquidityButtonText()}
        </Button>
      </div>

      {/* Collection Info */}
      {selectedCollection?.isCollection && collectionInfo && (
        <NftCollectionInfo
          name={collectionInfo.name}
          infoItems={[
            { 
              label: "NFT Price", 
              value: pool?.poolStats?.nftPrice 
                ? `${pool.poolStats.nftPrice.toFixed(4)} ${selectedToken?.symbol === 'ETH' || selectedToken?.symbol === 'WETH' || selectedToken?.symbol === 'HYPE'
                    ? (selectedToken?.symbol || 'ETH')
                    : (liquidityType === 'eth-nft' ? (selectedToken?.symbol || 'ETH') : (selectedToken?.symbol || 'TOKEN'))}`
                : '0.0000'
            },
            { 
              label: "Pool Liquidity", 
              value: collectionInfo.listings 
            },
            { 
              label: "Your LP Tokens", 
              value: userLpTokenBalance.balanceFormatted
                ? Number(userLpTokenBalance.balanceFormatted).toFixed(4)
                : "0.0000"
            },
          ]}
          primaryImageSrc={selectedCollection.logo || '/placeholder-nft.svg'}
          secondaryImageSrc={selectedToken?.logo || (HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId)) ? 'https://assets.relay.link/icons/999/light.png' : 'https://assets.relay.link/icons/1/light.png')}
        />
      )}

      {/* NFT Selection Modal */}
      {mounted && typeof window !== 'undefined' && showNftModal && (
        <NftSelectionModal
          isOpen={showNftModal}
          onClose={handleCloseNftModal}
          onConfirm={handleConfirmNftSelection}
          collectionName={selectedCollection?.collection?.name || selectedCollection?.name || 'Unknown Collection'}
          collectionLogo={selectedCollection?.logo || '/placeholder-nft.svg'}
          nftPrice={pool?.poolStats?.nftPrice?.toFixed(4) || '0.0000'}
          priceSymbol={
            liquidityType === 'eth-nft' 
              ? (selectedToken?.symbol || 'ETH')
              : (selectedToken?.symbol || 'TOKEN')
          }
          availableNfts={generateNftItems(selectedCollection)}
          maxSelection={maxAmount}
          initialSelectedIds={selectedTokenIds}
          loading={
            liquidityAction === 'create' || liquidityAction === 'add' 
              ? unifiedUserNfts.loading 
              : poolNfts.loading
          }
        />
      )}
    </div>
  );
};
