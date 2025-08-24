// AIDEV-NOTE: Domain entities - pure business logic
import { type Address } from 'viem';

export interface SwapQuote {
  readonly inputAmount: string;
  readonly outputAmount: string;
  readonly priceImpact: string;
  readonly minimumReceived: string;
  readonly route: Address[];
  readonly gasEstimate?: string;
  readonly isMultiHop: boolean;
  readonly royaltyAmount?: string;
}

export interface SwapParameters {
  readonly fromToken: Address;
  readonly toToken: Address;
  readonly amount: string;
  readonly tokenIds?: readonly string[];
  readonly isExactInput?: boolean;
  readonly capRoyaltyFee?: boolean;
  readonly slippageTolerance?: number;
}

export interface SwapRoute {
  readonly path: Address[];
  readonly isViable: boolean;
  readonly estimatedGas: bigint;
  readonly priceImpact: number;
  readonly type: RouteType;
}

export interface TokenInfo {
  readonly address: Address;
  readonly symbol: string;
  readonly name: string;
  readonly decimals: number;
  readonly isErc20: boolean;
}

export interface PoolReserves {
  readonly reserve0: bigint;
  readonly reserve1: bigint;
  readonly blockTimestampLast: number;
}

export enum SwapType {
  ERC20_TO_ERC20 = 'ERC20_TO_ERC20',
  ERC20_TO_NFT = 'ERC20_TO_NFT',
  NFT_TO_ERC20 = 'NFT_TO_ERC20',
}

export enum RouteType {
  DIRECT = 'DIRECT',
  MULTI_HOP = 'MULTI_HOP',
}

export interface SwapQuoteResult {
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  minimumReceived: string;
  maximumSent?: string; // AIDEV-NOTE: For slippage protection on buying
  route: Address[];
  loading: boolean;
  error: Error | null;
  isMultiHop: boolean;
  gasEstimate?: string;
}
