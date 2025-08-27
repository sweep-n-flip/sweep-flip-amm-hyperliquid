'use client'

import { useChainContext } from '@/contexts/ChainContext'
import { usePairs } from '@/hooks/api/usePairs'
import { type TokenData } from '@/hooks/api/useTokensFromDatabase'
import { enrichHyperliquidTokens } from '@/lib/enrichHyperliquidTokens'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from './dialog'

interface TokenSelectorProps {
  children: React.ReactNode
  onSelect: (token: TokenData) => void
  selectedToken?: TokenData
  tokenType: 'erc20' | 'collection'
  title?: string
}

interface TokenListItemProps {
  token: TokenData
  isSelected: boolean
  onSelect: (token: TokenData) => void
}

const TokenListItem = ({ token, onSelect }: TokenListItemProps) => {
  return (
    <div
      className="flex items-center gap-2 p-0 w-full h-[33px] cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onSelect(token)}
    >
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        <Image
          src={token.logo || 'https://assets.relay.link/icons/1/light.png'}
          alt={token.name}
          width={32}
          height={32}
          className="object-cover"
        />
      </div>
      
      <div className="flex-1 flex flex-col items-start">
        <div className="text-sm font-semibold text-[#434343] leading-[17px]">
          {token.isCollection ? token.collection?.symbol || token.symbol : token.symbol}
        </div>
        <div className="text-xs font-normal text-[#8C8C8C] leading-[16px]">
          {token.name}
        </div>
      </div>
      
      <div className="text-sm font-semibold text-[#434343] leading-[17px]">
        0
      </div>
    </div>
  )
}

// Common tokens for quick selection (ETH always first)
const commonTokens = [
  { symbol: 'ETH', name: 'Ethereum', logo: 'https://assets.relay.link/icons/1/light.png' },
  { symbol: 'WETH', name: 'Wrapped Ethereum', logo: 'https://assets.relay.link/icons/1/light.png' },
]

export function TokenSelector({
  children,
  onSelect,
  selectedToken,
  tokenType,
  title
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'token' | 'nft' | 'wnft'>(
    tokenType === 'erc20' ? 'token' : 'nft'
  )
  const { selectedChainId } = useChainContext()

  // Fetch tokens using hybrid approach
  const { tokens: rawTokens, loading, error } = usePairs(Number(selectedChainId))

  //  Enrich Hyperliquid tokens with collection logos
  const allTokens = useMemo(() => 
    enrichHyperliquidTokens(rawTokens, Number(selectedChainId)), 
    [rawTokens, selectedChainId]
  )

  // Filter tokens based on search and selected tab
  const filteredTokens = useMemo(() => {
    let filtered = allTokens
    
    // Filter by type
    if (selectedTab === 'token') {
      filtered = filtered.filter(token => token.isErc20)
    } else if (selectedTab === 'nft') {
      filtered = filtered.filter(token => token.isCollection)
    }
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(token => 
        token.name.toLowerCase().includes(search) ||
        token.symbol.toLowerCase().includes(search) ||
        token.address.toLowerCase().includes(search)
      )
    }
    
    return filtered
  }, [allTokens, selectedTab, searchTerm])

  const handleTabChange = (tab: 'token' | 'nft' | 'wnft') => {
    setSelectedTab(tab)
    setSearchTerm('') // Reset search when switching tabs
  }

  const handleSelect = (token: TokenData) => {
    onSelect(token)
    setOpen(false)
    setSearchTerm('')
  }

  const modalTitle = title || 'Select a Token'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="w-[480px] h-[527px] p-0 bg-white rounded-xl border-none shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-[60px] bg-white border-b border-[#D9D9D9]">
          <DialogTitle className="text-xl font-semibold text-[#434343]">
            {modalTitle}
          </DialogTitle>
        </div>

        {/* Body */}
        <div className="flex flex-col p-4 gap-4 h-[467px] bg-white border-t border-b border-[#D9D9D9]">
          {/* Search Input */}
          <div className="w-full h-12">
            <input
              type="text"
              placeholder="Search name or paste address"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 px-3 bg-white border border-[#D9D9D9] rounded-xl text-base font-normal text-[#8C8C8C] focus:outline-none focus:border-[#FF2E00]"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-start gap-4 w-full h-[33px]">
            <button
              onClick={() => handleTabChange('token')}
              className={cn(
                "flex items-center justify-center px-0 py-2 h-[33px] border-b-2 font-semibold text-sm",
                selectedTab === 'token' 
                  ? "border-[#FF2E00] text-[#FF2E00]" 
                  : "border-transparent text-[#8C8C8C]"
              )}
            >
              Token
            </button>
            <button
              onClick={() => handleTabChange('nft')}
              className={cn(
                "flex items-center justify-center px-0 py-2 h-[33px] border-b-2 font-semibold text-sm",
                selectedTab === 'nft' 
                  ? "border-[#FF2E00] text-[#FF2E00]" 
                  : "border-transparent text-[#8C8C8C]"
              )}
            >
              NFT
            </button>
            <button
              onClick={() => handleTabChange('wnft')}
              className={cn(
                "flex items-center justify-center px-0 py-2 h-[33px] border-b-2 font-semibold text-sm",
                selectedTab === 'wnft' 
                  ? "border-[#FF2E00] text-[#FF2E00]" 
                  : "border-transparent text-[#8C8C8C]"
              )}
            >
              wNFT
            </button>
          </div>

          {/* Common Tokens Section - UNCOMMENT THIS SECTION WHEN IMPLEMENT ALL ECR20 TOKENS*/}
          {/* {selectedTab === 'token' && (
            <div className="flex flex-col gap-2 w-full h-[62px]">
              <div className="text-sm font-normal text-[#8C8C8C]">
                Common tokens
              </div>
              <div className="flex items-start gap-2.5 w-full h-8">
                {commonTokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => {
                      // Find the actual token from ALL tokens (not filtered)
                      let actualToken = allTokens.find(t => t.symbol === token.symbol && t.isErc20)
                      
                      // If token not found, create a fallback token (especially for ETH)
                      if (!actualToken && token.symbol === 'ETH') {
                        // Create a synthetic ETH token if not found in the list
                        actualToken = {
                          _id: 'eth-native',
                          address: '0x0000000000000000000000000000000000000000', // Native ETH address
                          name: 'Ethereum',
                          symbol: 'ETH',
                          decimals: 18,
                          logo: 'https://assets.relay.link/icons/1/light.png',
                          nativeChain: Number(selectedChainId),
                          isErc20: true,
                          isCollection: false,
                          collection: {
                            id: 'eth-native',
                            name: 'Ethereum',
                            symbol: 'ETH',
                            address: '0x0000000000000000000000000000000000000000',
                            logo: 'https://assets.relay.link/icons/1/light.png',
                          },
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        }
                      }
                      
                      if (actualToken) {
                        handleSelect(actualToken)
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3 h-8 bg-white border border-[#D9D9D9] rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full overflow-hidden">
                      <Image
                        src={token.logo}
                        alt={token.symbol}
                        width={16}
                        height={16}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#434343]">
                      {token.symbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )} */}

          {/* Token List */}
          <div className={cn(
            "flex flex-col py-2 gap-4 w-full overflow-y-auto",
            selectedTab === 'token' ? "h-[196px]" : "h-[258px]" // More height when no common tokens
          )}>
            {selectedTab === 'wnft' ? (
              <div className="flex items-center justify-center py-8 text-[#8C8C8C]">
                <p>wNFT functionality coming soon</p>
              </div>
            ) : (
              <>
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF2E00]"></div>
                  </div>
                )}
                
                {error && (
                  <div className="flex items-center justify-center py-8 text-red-500">
                    <p>Error loading tokens: {error}</p>
                  </div>
                )}
                
                {!loading && !error && filteredTokens.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-[#8C8C8C]">
                    <p>No tokens found</p>
                  </div>
                )}
                
                {!loading && !error && filteredTokens.length > 0 && (
                  <div className="space-y-4">
                    {filteredTokens.map((token) => (
                      <TokenListItem
                        key={token._id}
                        token={token}
                        isSelected={selectedToken?.address === token.address}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Manage Tokens Button */}
          <div className="w-full h-8 flex items-center justify-between">
            <button className="flex items-center justify-start w-[137px] h-8 rounded-xl border-none bg-transparent">
              <span className="text-sm font-semibold text-[#FF2E00]">
                Manage Tokens
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
