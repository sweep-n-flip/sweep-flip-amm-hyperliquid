'use client'

import { useChainContext } from '@/contexts/ChainContext'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { useEffect, useMemo } from 'react'
import { defineChain } from 'viem'
import { useSwitchChain, WagmiProvider } from 'wagmi'
import {
  apeChain,
  arbitrum,
  base,
  berachain,
  bsc,
  goerli,
  mainnet,
  polygon,
} from 'wagmi/chains'

// Define Hyperliquid chain manually since it's not in wagmi/chains
export const hyperliquid = defineChain({
  id: 999,
  name: 'Hyperliquid',
  network: 'hyperliquid',
  nativeCurrency: {
    decimals: 18,
    name: 'Hyperliquid',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
      webSocket: ['wss://api.hyperliquid.xyz/evm/ws'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://app.hyperliquid.xyz/explorer' },
  }
})

// Create wagmi config outside of component to avoid recreation
const config = getDefaultConfig({
  appName: "Sweep N' Flip",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [hyperliquid],
  ssr: false,
})

function ChainSwitcher() {
  const { selectedChainId } = useChainContext()
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    if (switchChain && selectedChainId) {
      const targetChain = config.chains.find(chain => chain.id === selectedChainId)
      if (targetChain) {
        switchChain({ chainId: targetChain.id })
      }
    }
  }, [selectedChainId, switchChain])

  return null
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { selectedChainId } = useChainContext()

  // Get initial chain
  const initialChain = useMemo(() => {
    return config.chains.find(chain => chain.id === selectedChainId) || hyperliquid
  }, [selectedChainId])

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider initialChain={initialChain}>
        <ChainSwitcher />
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  )
}
