//  Abstract repository interfaces
import { type Address } from 'viem';
import { type PoolReserves, type TokenInfo } from '../domain/entities';

export interface RouterRepository {
  getAmountsInCollection(tokenIds: string[], path: Address[], capRoyaltyFee: boolean): Promise<bigint[]>;
  getAmountsOutCollection(tokenIds: string[], path: Address[], capRoyaltyFee: boolean): Promise<bigint[]>;
  getAmountsInStandard(amountOut: bigint, path: Address[]): Promise<bigint[]>;
  getAmountsOutStandard(amountIn: bigint, path: Address[]): Promise<bigint[]>;
}

export interface TokenRepository {
  getTokenInfo(address: Address): Promise<TokenInfo>;
  getTokenDecimals(address: Address): Promise<number>;
  getWETHAddress(chainId: number): Promise<Address>;
}

export interface PoolRepository {
  checkPoolExists(tokenA: Address, tokenB: Address): Promise<boolean>;
  getPoolReserves(tokenA: Address, tokenB: Address): Promise<PoolReserves>;
  getPoolFee(tokenA: Address, tokenB: Address): Promise<number>;
  getFactoryAddress(): Promise<Address>;
}

export interface ContractClient {
  readContract(params: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args?: unknown[];
  }): Promise<unknown>;
}
