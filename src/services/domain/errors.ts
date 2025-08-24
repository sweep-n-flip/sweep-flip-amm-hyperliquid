// AIDEV-NOTE: Domain-specific errors
import { type Address } from 'viem';

export abstract class RouterError extends Error {
  abstract readonly code: string;
  abstract readonly retryable: boolean;
  
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PoolNotFoundError extends RouterError {
  readonly code = 'POOL_NOT_FOUND';
  readonly retryable = false;
  
  constructor(tokenA: Address, tokenB: Address) {
    super(`Pool not found between ${tokenA} and ${tokenB}`);
  }
}

export class InsufficientLiquidityError extends RouterError {
  readonly code = 'INSUFFICIENT_LIQUIDITY';
  readonly retryable = false;
  
  constructor(path: Address[]) {
    super(`Insufficient liquidity for path: ${path.join(' -> ')}`);
  }
}

export class ExcessiveSlippageError extends RouterError {
  readonly code = 'EXCESSIVE_SLIPPAGE';
  readonly retryable = false;
  
  constructor(expected: string, actual: string) {
    super(`Slippage too high. Expected: ${expected}, Actual: ${actual}`);
  }
}

export class ContractCallError extends RouterError {
  readonly code = 'CONTRACT_CALL_ERROR';
  readonly retryable = true;
  
  constructor(functionName: string, cause: unknown) {
    super(`Contract call failed: ${functionName}`);
    Object.defineProperty(this, 'cause', {
      value: cause,
      writable: false,
      configurable: true
    });
  }
}

export class InvalidParametersError extends RouterError {
  readonly code = 'INVALID_PARAMETERS';
  readonly retryable = false;
  
  constructor(message: string) {
    super(`Invalid parameters: ${message}`);
  }
}

export class UnsupportedSwapTypeError extends RouterError {
  readonly code = 'UNSUPPORTED_SWAP_TYPE';
  readonly retryable = false;
  
  constructor(swapType: string) {
    super(`Unsupported swap type: ${swapType}`);
  }
}
