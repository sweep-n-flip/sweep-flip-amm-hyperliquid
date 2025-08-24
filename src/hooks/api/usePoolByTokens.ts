import { useCallback, useEffect, useMemo, useState } from 'react'
import { type TokenData } from './useTokensFromDatabase'

// AIDEV-NOTE: Enhanced pool structure with comprehensive token data
export interface PoolData {
  _id: string
  poolId: string
  chainId: number
  name: string
  poolDetails: {
    poolId: string
    token0Id: string
    token1Id: string
  }
  chain: {
    id: number
    name: string
    nativeToken: string // WETH, WMATIC, etc.
  }
  token0: {
    id: string     
    address: string
    symbol: string
    isErc20: boolean
    isCollection: boolean
  }
  token1: {
    id: string 
    address: string 
    symbol: string
    isErc20: boolean
    isCollection: boolean
  }
  // Enhanced token references for easier access
  erc20Token?: {
    address: string
    symbol: string
    name: string
  }
  nftToken?: {
    address: string
    symbol: string
    name: string
    collectionAddress: string
    wrapperAddress: string
  }
  poolStats: {
    liquidity: number
    reserve0: number
    reserve1: number
    nftPrice: number
    nftListings: number
    offers: number
    apr: number
    totalVolume: number
  }
}

interface UsePoolByTokensResult {
  pool: PoolData | null
  loading: boolean
  error: string | null
  canSwap: boolean
  swapDirection: 'erc20-to-nft' | 'nft-to-erc20' | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_COCKPIT_API_URL

export function usePoolByTokens(
  fromToken: TokenData | undefined,
  toToken: TokenData | undefined,
  chainId: number
): UsePoolByTokensResult {
  const [pool, setPool] = useState<PoolData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const findPool = useCallback(async () => {
    if (!fromToken || !toToken) {
      setPool(null)
      setLoading(false)
      setError(null)
      return
    }

    // Determinar direção do swap
    const isErc20ToNft = fromToken.isErc20 && toToken.isCollection
    const isNftToErc20 = fromToken.isCollection && toToken.isErc20

    if (!isErc20ToNft && !isNftToErc20) {
      setPool(null)
      setLoading(false)
      setError('Invalid swap direction')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Para ERC20 → NFT: sempre possível, mas vamos buscar pool para mostrar dados
      // Para NFT → ERC20: precisa existir pool específica
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        limit: '100', // Buscar várias pools para encontrar a específica
      })

      const response = await fetch(`${API_BASE_URL}/api/pools/?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch pools')
      }

      const data = await response.json()
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response format')
      }

      // Procurar pool que contenha os tokens específicos
      const nftToken = fromToken.isCollection ? fromToken : toToken
      const nftAddress = nftToken.address.toLowerCase()
      
      const matchingPool = data.data.find((poolData: { collectionPool?: { address?: string } }) => {
        const collectionAddress = poolData.collectionPool?.address?.toLowerCase()
        return collectionAddress === nftAddress
      })

      if (matchingPool) {
        // Converter para o formato PoolData
        const collectionToken = fromToken.isCollection ? fromToken : toToken
        const erc20Token = fromToken.isErc20 ? fromToken : toToken
        
        const poolData: PoolData = {
          _id: matchingPool._id,
          poolId: matchingPool.poolId || matchingPool._id,
          chainId: matchingPool.chain?.chainId || chainId,
          name: matchingPool.collectionPool?.name || 'Unknown Pool',
          poolDetails: {
            poolId: matchingPool.pool.poolId,
            token0Id: matchingPool.pool.token0Id,
            token1Id: matchingPool.pool.token1Id,
          },
          chain: {
            id: matchingPool.chain?.chainId || chainId,
            name: matchingPool.chain?.name || 'Unknown Chain',
            nativeToken: matchingPool.chain?.nativeToken || 'WETH', // Default fallback
          },
          token0: {
            id: matchingPool.token0?.id || collectionToken.address,
            address: collectionToken.address,
            symbol: collectionToken.symbol,
            isErc20: false,
            isCollection: true,
          },
          token1: {
            id: matchingPool.token1?.id || erc20Token.address,
            address: erc20Token.address,
            symbol: erc20Token.symbol,
            isErc20: true,
            isCollection: false,
          },
          // AIDEV-NOTE: Enhanced token references for easier access
          erc20Token: {
            address: erc20Token.address,
            symbol: erc20Token.symbol,
            name: erc20Token.name || erc20Token.symbol,
          },
          nftToken: {
            address: collectionToken.address,
            symbol: collectionToken.symbol,
            name: collectionToken.name || collectionToken.symbol,
            collectionAddress: collectionToken.address,
            wrapperAddress: matchingPool.wrapperAddress || collectionToken.address, // API should provide this
          },
          poolStats: {
            liquidity: matchingPool.poolStats?.liquidity || 0,
            reserve0: matchingPool.poolStats?.reserve0 || 0,
            reserve1: matchingPool.poolStats?.reserve1 || 0,
            nftPrice: matchingPool.poolStats?.nftPrice || 0,
            nftListings: matchingPool.poolStats?.nftListings || 0,
            offers: matchingPool.poolStats?.offers || 0,
            apr: matchingPool.poolStats?.apr || 0,
            totalVolume: matchingPool.poolStats?.totalVolume || 0,
          },
        }

        setPool(poolData)
      } else {
        // Para ERC20 → NFT: sem pool específica, mas ainda é possível
        if (isErc20ToNft) {
          setPool(null) // Não há pool específica, mas swap é possível
        } else {
          // Para NFT → ERC20: sem pool = impossível
          setPool(null)
          setError('No pool found for this NFT-to-ERC20 swap')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pool data')
      setPool(null)
    } finally {
      setLoading(false)
    }
  }, [fromToken, toToken, chainId])

  useEffect(() => {
    findPool()
  }, [findPool])

  // Determinar se o swap é possível
  const swapDirection = useMemo(() => {
    if (!fromToken || !toToken) return null
    
    if (fromToken.isErc20 && toToken.isCollection) return 'erc20-to-nft'
    if (fromToken.isCollection && toToken.isErc20) return 'nft-to-erc20'
    
    return null
  }, [fromToken, toToken])

  const canSwap = useMemo(() => {
    if (!swapDirection) return false
    
    // ERC20 → NFT: sempre possível (função genérica)
    if (swapDirection === 'erc20-to-nft') return true
    
    // NFT → ERC20: só possível se existir pool
    if (swapDirection === 'nft-to-erc20') return pool !== null
    
    return false
  }, [swapDirection, pool])

  return {
    pool,
    loading,
    error,
    canSwap,
    swapDirection,
  }
}
