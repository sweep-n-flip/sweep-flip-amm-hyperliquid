//  Service layer with dependency injection
import { RouterConfigService } from '../config/RouterConfigService';
import {
  type SwapParameters,
  type SwapQuote
} from '../domain/entities';
import { ContractCallError, RouterError } from '../domain/errors';
import {
  CachedPoolRepository,
  CachedTokenRepository,
  ContractRouterRepository
} from '../repositories/implementations';
import { type ContractClient } from '../repositories/interfaces';
import { SwapQuoteUseCase } from '../usecases/SwapQuoteUseCase';

export class RouterService {
  constructor(
    private readonly swapQuoteUseCase: SwapQuoteUseCase,
    private readonly config: RouterConfigService
  ) {}

  async getSwapQuote(params: SwapParameters): Promise<SwapQuote> {
    try {
      //  Validate chain support
      if (!this.config.isSupportedChain(params.fromToken.length > 0 ? 1 : 1)) {
        throw new Error('Unsupported chain');
      }

      return await this.swapQuoteUseCase.execute(params);
    } catch (error) {
      if (error instanceof RouterError) {
        throw error;
      }
      throw new ContractCallError('getSwapQuote', error);
    }
  }

  async getMultiHopQuote(params: SwapParameters): Promise<SwapQuote> {
    //  Specific method for multi-hop quotes
    const multiHopParams = {
      ...params,
      forceMultiHop: true,
    };
    
    return await this.swapQuoteUseCase.execute(multiHopParams);
  }

  async validateSwapParameters(params: SwapParameters): Promise<boolean> {
    try {
      await this.swapQuoteUseCase.execute(params);
      return true;
    } catch {
      return false;
    }
  }
}

//  Factory function for dependency injection
export function createRouterService(
  chainId: number, 
  chainData: unknown, 
  contractClient: ContractClient
): RouterService {
  const config = RouterConfigService.getInstance();
  
  const routerRepository = new ContractRouterRepository(contractClient, chainId, chainData);
  const tokenRepository = new CachedTokenRepository(contractClient, chainId);
  const poolRepository = new CachedPoolRepository(contractClient, chainId);
  
  const swapQuoteUseCase = new SwapQuoteUseCase(
    routerRepository,
    tokenRepository,
    poolRepository,
    chainId
  );
  
  return new RouterService(swapQuoteUseCase, config);
}

//  Wagmi contract client adapter
export class WagmiContractClient implements ContractClient {
  constructor(private readonly wagmiReadContract: unknown) {}

  async readContract(): Promise<unknown> {
    throw new Error('WagmiContractClient should not be used directly in async context');
  }
}
