import { useCallback, useEffect, useState } from 'react'
import { type PoolData } from './usePoolByTokens'

interface UsePoolByCollectionResult {
  pool: PoolData | null
  loading: boolean
  error: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_COCKPIT_API_URL

export function usePoolByCollection(
  collectionAddress: string | undefined,
  chainId: number
): UsePoolByCollectionResult {
  const [pool, setPool] = useState<PoolData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const findPool = useCallback(async () => {
    if (!collectionAddress) {
      setPool(null)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        chainId: chainId.toString(),
        limit: '100',
      })

      const response = await fetch(`${API_BASE_URL}/api/pools/?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch pools')
      }

      const data = await response.json()
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response format')
      }

      // Procurar pool que contenha a collection específica
      const nftAddress = collectionAddress.toLowerCase()
      
      const matchingPool = data.data.find((poolData: { collectionPool?: { address?: string } }) => {
        const collectionAddr = poolData.collectionPool?.address?.toLowerCase()
        return collectionAddr === nftAddress
      })

      if (matchingPool) {
        // Converter para o formato PoolData simplificado
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
            nativeToken: matchingPool.chain?.nativeToken || 'WETH',
          },
          token0: {
            id: matchingPool.token0?.id || collectionAddress,
            address: collectionAddress,
            symbol: matchingPool.collectionPool?.symbol || 'NFT',
            isErc20: false,
            isCollection: true,
          },
          token1: {
            id: matchingPool.token1?.id || matchingPool.chain?.nativeToken || 'WETH',
            address: matchingPool.token1?.address || '',
            symbol: matchingPool.token1?.symbol || 'WETH',
            isErc20: true,
            isCollection: false,
          },
          erc20Token: {
            address: matchingPool.token1?.address || '',
            symbol: matchingPool.token1?.symbol || 'WETH',
            name: matchingPool.token1?.name || matchingPool.token1?.symbol || 'WETH',
          },
          nftToken: {
            address: collectionAddress,
            symbol: matchingPool.collectionPool?.symbol || 'NFT',
            name: matchingPool.collectionPool?.name || 'NFT Collection',
            collectionAddress: collectionAddress,
            wrapperAddress: matchingPool.wrapperAddress || collectionAddress,
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
        setPool(null)
        setError('No pool found for this collection')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pool data')
      setPool(null)
    } finally {
      setLoading(false)
    }
  }, [collectionAddress, chainId])

  useEffect(() => {
    findPool()
  }, [findPool])

  return {
    pool,
    loading,
    error,
  }
}
