// AIDEV-NOTE: Hook to get prioritized NFT collections for user (owned collections first)
import { useChainContext } from '@/contexts/ChainContext';
import { type TokenData } from '@/hooks/api/useTokensFromDatabase';
import { HyperliquidCollectionsService } from '@/services/HyperliquidCollections';
import { useMemo } from 'react';
import { useUserCollections } from './useUserCollections';

interface UsePrioritizedCollectionsParams {
  allCollections: TokenData[];
  existingPools?: TokenData[]; // Collections that already have pools
}

interface UsePrioritizedCollectionsReturn {
  prioritizedCollections: TokenData[];
  userCollections: TokenData[];
  availableCollections: TokenData[]; // Collections without existing pools
  userCollectionsWithoutPools: TokenData[];
  defaultSelectedCollection: TokenData | null;
  loading: boolean;
}

export const usePrioritizedCollections = ({
  allCollections,
  existingPools = []
}: UsePrioritizedCollectionsParams): UsePrioritizedCollectionsReturn => {
  const { selectedChainId } = useChainContext();
  
  // Check if this is a Hyperliquid chain to prevent unnecessary Reservoir calls
  const isHyperliquidChain = useMemo(() => 
    HyperliquidCollectionsService.isHyperliquidChain(Number(selectedChainId)), 
    [selectedChainId]
  );

  // Only call useUserCollections for non-Hyperliquid chains
  const { userCollections, loading: userCollectionsLoading } = isHyperliquidChain 
    ? { userCollections: [], loading: false } 
    : useUserCollections();

  const result = useMemo(() => {
    // Get addresses of collections that already have pools
    const existingPoolAddresses = new Set(
      existingPools.map(pool => pool.address.toLowerCase())
    );

    // Filter out collections that already have pools from allCollections
    const availableAllCollections = allCollections.filter(
      collection => !existingPoolAddresses.has(collection.address.toLowerCase())
    );

    // Filter user collections that don't have pools yet
    const userCollectionsWithoutPools = userCollections.filter(
      collection => !existingPoolAddresses.has(collection.address.toLowerCase())
    );

    // Create a map of all collection addresses to avoid duplicates
    const allCollectionAddresses = new Set(
      availableAllCollections.map(collection => collection.address.toLowerCase())
    );

    // Add user collections that are not already in allCollections
    const userCollectionsToAdd = userCollectionsWithoutPools.filter(
      userCollection => !allCollectionAddresses.has(userCollection.address.toLowerCase())
    );

    // Combine all collections with user collections
    const combinedCollections = [
      ...userCollectionsToAdd, // User collections first
      ...availableAllCollections // Then other collections
    ];

    // Create a map of user collection addresses for quick lookup
    const userCollectionAddresses = new Set(
      userCollections.map(collection => collection.address.toLowerCase())
    );
    
    // Mark collections owned by user and add userTokenCount
    const markedCollections = combinedCollections.map(collection => {
      const isOwnedByUser = userCollectionAddresses.has(collection.address.toLowerCase());
      
      if (isOwnedByUser) {
        // Find the user collection to get the token count
        const userCollection = userCollections.find(
          uc => uc.address.toLowerCase() === collection.address.toLowerCase()
        );
        return {
          ...collection,
          userTokenCount: (userCollection as any)?.userTokenCount || 1
        };
      }
      
      return collection;
    });

    // Sort collections: user-owned first, then others
    const prioritizedCollections = markedCollections.sort((a, b) => {
      const aIsOwned = userCollectionAddresses.has(a.address.toLowerCase());
      const bIsOwned = userCollectionAddresses.has(b.address.toLowerCase());
      
      // First, prioritize user-owned collections
      if (aIsOwned && !bIsOwned) return -1;
      if (!aIsOwned && bIsOwned) return 1;
      
      // Among user-owned collections, sort by token count if available
      if (aIsOwned && bIsOwned) {
        const aCount = (a as any).userTokenCount || 0;
        const bCount = (b as any).userTokenCount || 0;
        if (aCount !== bCount) return bCount - aCount; // More tokens first
      }

      // For non-user collections, maintain original order (usually by volume/popularity)
      return 0;
    });

    // Default selection: first user collection without pool, or first available collection
    const defaultSelectedCollection = userCollectionsWithoutPools[0] || combinedCollections[0] || null;

    return {
      prioritizedCollections,
      userCollections,
      availableCollections: combinedCollections,
      userCollectionsWithoutPools,
      defaultSelectedCollection,
    };
  }, [allCollections, existingPools, userCollections]);

  return {
    ...result,
    loading: userCollectionsLoading,
  };
};
