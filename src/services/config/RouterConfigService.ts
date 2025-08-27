//  Configuration as a service
import { getSupportedChains } from './ContractAddresses';

export interface RouterConfig {
  readonly maxSlippage: number;
  readonly defaultGasLimit: bigint;
  readonly cacheTimeout: number;
  readonly retryAttempts: number;
  readonly supportedChains: number[];
  readonly priceImpactThreshold: number;
}

export class RouterConfigService {
  private static instance: RouterConfigService;
  private config: RouterConfig;

  private constructor() {
    this.config = {
      maxSlippage: 5, // 5%
      defaultGasLimit: BigInt(300000),
      cacheTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      supportedChains: getSupportedChains(),
      priceImpactThreshold: 3, // 3%
    };
  }

  static getInstance(): RouterConfigService {
    if (!RouterConfigService.instance) {
      RouterConfigService.instance = new RouterConfigService();
    }
    return RouterConfigService.instance;
  }

  getConfig(): RouterConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  isSupportedChain(chainId: number): boolean {
    return this.config.supportedChains.includes(chainId);
  }

  getMaxSlippage(): number {
    return this.config.maxSlippage;
  }

  getDefaultGasLimit(): bigint {
    return this.config.defaultGasLimit;
  }

  getCacheTimeout(): number {
    return this.config.cacheTimeout;
  }

  getRetryAttempts(): number {
    return this.config.retryAttempts;
  }

  getPriceImpactThreshold(): number {
    return this.config.priceImpactThreshold;
  }
}
