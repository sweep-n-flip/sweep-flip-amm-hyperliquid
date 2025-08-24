// AIDEV-NOTE: Concrete repository implementations
import { erc20Abi } from '@/abi/erc20';
import { factoryAbi } from '@/abi/factory';
import { routerAbi } from '@/abi/router';
import { type Address } from 'viem';
import { getContractAddresses } from '../config/ContractAddresses';
import { type PoolReserves, type TokenInfo } from '../domain/entities';
import { ContractCallError, PoolNotFoundError } from '../domain/errors';
import {
  type ContractClient,
  type PoolRepository,
  type RouterRepository,
  type TokenRepository
} from './interfaces';

export class ContractRouterRepository implements RouterRepository {
  constructor(
    private readonly contractClient: ContractClient,
    private readonly chainId: number,
    private readonly chainData?: unknown
  ) {}

  async getAmountsInCollection(tokenIds: string[], path: Address[], capRoyaltyFee: boolean): Promise<bigint[]> {
    const routerAddress = this.getRouterAddress();
    
    try {
      const result = await this.contractClient.readContract({
        address: routerAddress,
        abi: routerAbi,
        functionName: 'getAmountsInCollection',
        args: [tokenIds.map(id => BigInt(id)), path, capRoyaltyFee],
      });
      return result as bigint[];
    } catch (error) {
      throw new ContractCallError('getAmountsInCollection', error);
    }
  }

  async getAmountsOutCollection(tokenIds: string[], path: Address[], capRoyaltyFee: boolean): Promise<bigint[]> {
    const routerAddress = this.getRouterAddress();
    
    try {
      const result = await this.contractClient.readContract({
        address: routerAddress,
        abi: routerAbi,
        functionName: 'getAmountsOutCollection',
        args: [tokenIds.map(id => BigInt(id)), path, capRoyaltyFee],
      });
      return result as bigint[];
    } catch (error) {
      throw new ContractCallError('getAmountsOutCollection', error);
    }
  }

  async getAmountsInStandard(amountOut: bigint, path: Address[]): Promise<bigint[]> {
    const routerAddress = this.getRouterAddress();
    
    try {
      const result = await this.contractClient.readContract({
        address: routerAddress,
        abi: routerAbi,
        functionName: 'getAmountsIn',
        args: [amountOut, path],
      });
      return result as bigint[];
    } catch (error) {
      throw new ContractCallError('getAmountsIn', error);
    }
  }

  async getAmountsOutStandard(amountIn: bigint, path: Address[]): Promise<bigint[]> {
    const routerAddress = this.getRouterAddress();
    
    try {
      const result = await this.contractClient.readContract({
        address: routerAddress,
        abi: routerAbi,
        functionName: 'getAmountsOut',
        args: [amountIn, path],
      });
      return result as bigint[];
    } catch (error) {
      throw new ContractCallError('getAmountsOut', error);
    }
  }

  private getRouterAddress(): Address {
    const chainData = this.chainData as { routerAddress?: Address } | undefined;
    if (chainData?.routerAddress) {
      return chainData.routerAddress;
    }
    
    return getContractAddresses(this.chainId).router;
  }
}

export class CachedTokenRepository implements TokenRepository {
  private cache = new Map<Address, TokenInfo>();
  
  constructor(
    private readonly contractClient: ContractClient,
    private readonly chainId: number
  ) {}

  async getTokenInfo(address: Address): Promise<TokenInfo> {
    if (this.cache.has(address)) {
      return this.cache.get(address)!;
    }

    try {
      const [symbol, name, decimals] = await Promise.all([
        this.contractClient.readContract({
          address,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        this.contractClient.readContract({
          address,
          abi: erc20Abi,
          functionName: 'name',
        }),
        this.contractClient.readContract({
          address,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      ]);

      const tokenInfo: TokenInfo = {
        address,
        symbol: symbol as string,
        name: name as string,
        decimals: decimals as number,
        isErc20: true,
      };

      this.cache.set(address, tokenInfo);
      return tokenInfo;
    } catch (error) {
      throw new ContractCallError('getTokenInfo', error);
    }
  }

  async getTokenDecimals(address: Address): Promise<number> {
    const tokenInfo = await this.getTokenInfo(address);
    return tokenInfo.decimals;
  }

  async getWETHAddress(chainId: number): Promise<Address> {
    return getContractAddresses(chainId).weth;
  }
}

export class CachedPoolRepository implements PoolRepository {
  private poolCache = new Map<string, boolean>();
  private reserveCache = new Map<string, PoolReserves>();
  
  constructor(
    private readonly contractClient: ContractClient,
    private readonly chainId: number
  ) {}

  async checkPoolExists(tokenA: Address, tokenB: Address): Promise<boolean> {
    const cacheKey = `${tokenA}-${tokenB}`;
    
    if (this.poolCache.has(cacheKey)) {
      return this.poolCache.get(cacheKey)!;
    }

    try {
      const factoryAddress = await this.getFactoryAddress();
      const pairAddress = await this.contractClient.readContract({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: 'getPair',
        args: [tokenA, tokenB],
      });
      
      const exists = (pairAddress as string) !== '0x0000000000000000000000000000000000000000';
      this.poolCache.set(cacheKey, exists);
      
      return exists;
    } catch (error) {
      throw new ContractCallError('checkPoolExists', error);
    }
  }

  async getPoolReserves(tokenA: Address, tokenB: Address): Promise<PoolReserves> {
    const cacheKey = `${tokenA}-${tokenB}`;
    
    if (this.reserveCache.has(cacheKey)) {
      return this.reserveCache.get(cacheKey)!;
    }

    const factoryAddress = await this.getFactoryAddress();
    const pairAddress = await this.contractClient.readContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: 'getPair',
      args: [tokenA, tokenB],
    });

    if ((pairAddress as string) === '0x0000000000000000000000000000000000000000') {
      throw new PoolNotFoundError(tokenA, tokenB);
    }

    try {
      const reserves = await this.contractClient.readContract({
        address: pairAddress as Address,
        abi: [
          {
            inputs: [],
            name: 'getReserves',
            outputs: [
              { internalType: 'uint112', name: 'reserve0', type: 'uint112' },
              { internalType: 'uint112', name: 'reserve1', type: 'uint112' },
              { internalType: 'uint32', name: 'blockTimestampLast', type: 'uint32' },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'getReserves',
      });

      const reserveArray = reserves as [bigint, bigint, number];
      const poolReserves: PoolReserves = {
        reserve0: reserveArray[0],
        reserve1: reserveArray[1],
        blockTimestampLast: reserveArray[2],
      };

      this.reserveCache.set(cacheKey, poolReserves);
      return poolReserves;
    } catch (error) {
      throw new ContractCallError('getPoolReserves', error);
    }
  }

  async getPoolFee(): Promise<number> {
    // AIDEV-NOTE: Most pools have 0.3% fee (3000 basis points)
    return 3000;
  }

  async getFactoryAddress(): Promise<Address> {
    return getContractAddresses(this.chainId).factory;
  }
}
