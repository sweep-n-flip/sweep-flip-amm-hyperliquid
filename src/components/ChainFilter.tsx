'use client'

import { ChainData, useChains } from '@/hooks/api/useChains'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface ChainFilterProps {
  selectedChainId: string | number
  onChainChange: (chainId: string | number) => void
  className?: string
  showAllOption?: boolean
}

export function ChainFilter({ 
  selectedChainId, 
  onChainChange, 
  className = '',
  showAllOption = true 
}: ChainFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { chains, loading } = useChains()

  // Helper function to get chain icon with fallback
  const getChainIcon = (chain: ChainData) => {
    return chain.logo || '/globe.svg'
  }

  const selectedChain = chains.find(chain => 
    chain.chainId.toString() === selectedChainId.toString()
  )

  const allOption: ChainData = { 
    _id: 'all', 
    chainId: 'all' as string, 
    name: 'All Chains', 
    symbol: 'ALL', 
    logo: '/globe.svg',
    enabled: true 
  }

  const options = showAllOption ? [allOption, ...chains] : chains

  const handleSelect = (chain: ChainData) => {
    onChainChange(chain.chainId)
    setIsOpen(false)
  }

  if (loading) {
    return (
      <div className={`inline-flex items-center px-3 py-2 bg-gray-100 rounded-lg animate-pulse ${className}`}>
        <div className="w-5 h-5 bg-gray-300 rounded-full mr-2"></div>
        <div className="w-16 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  const displayChain = selectedChainId === 'all' ? allOption : selectedChain

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Select chain"
      >
        {displayChain && (
          <>
            <Image
              src={getChainIcon(displayChain)}
              alt={displayChain.name}
              width={20}
              height={20}
              className="rounded-full"
              onError={(e) => {
                // Fallback to a default icon if the image fails to load
                const target = e.target as HTMLImageElement;
                target.src = '/globe.svg';
              }}
            />
            <span className="text-sm font-medium text-gray-700">
              {displayChain.symbol}
            </span>
          </>
        )}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((chain) => (
            <button
              key={chain._id}
              onClick={() => handleSelect(chain)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                (selectedChainId === 'all' && chain._id === 'all') ||
                (selectedChainId !== 'all' && chain.chainId.toString() === selectedChainId.toString())
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700'
              }`}
            >
              <Image
                src={getChainIcon(chain)}
                alt={chain.name}
                width={20}
                height={20}
                className="rounded-full"
                onError={(e) => {
                  // Fallback to a default icon if the image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = '/globe.svg';
                }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{chain.name}</div>
                <div className="text-xs text-gray-500">{chain.symbol}</div>
              </div>
              {((selectedChainId === 'all' && chain._id === 'all') ||
                (selectedChainId !== 'all' && chain.chainId.toString() === selectedChainId.toString())) && (
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChainFilter
