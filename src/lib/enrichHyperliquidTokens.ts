//  Utility to enrich Hyperliquid tokens with collection logos
import { type TokenData } from '@/hooks/api/useTokensFromDatabase';
import { HyperliquidCollectionsService } from '@/services/HyperliquidCollections';

/**
 * Enriches tokens with Hyperliquid collection logos when on Hyperliquid chain
 * @param tokens - Array of tokens to enrich
 * @param chainId - Current chain ID
 * @returns Enriched tokens with logos for Hyperliquid collections
 */
export const enrichHyperliquidTokens = (tokens: TokenData[], chainId: number): TokenData[] => {
  if (!HyperliquidCollectionsService.isHyperliquidChain(chainId)) {
    return tokens;
  }

  const hyperliquidCollections = HyperliquidCollectionsService.getCollections();
  
  return tokens.map(token => {
    // Only process NFT collections
    if (!token.isCollection) return token;
    
    // Find matching Hyperliquid collection
    const hyperliquidCollection = hyperliquidCollections.find(
      hc => hc.address.toLowerCase() === token.address.toLowerCase()
    );
    
    if (hyperliquidCollection && hyperliquidCollection.logo) {
      return {
        ...token,
        logo: hyperliquidCollection.logo,
        collection: {
          ...token.collection,
          logo: hyperliquidCollection.logo,
        }
      };
    }
    
    return token;
  });
};
