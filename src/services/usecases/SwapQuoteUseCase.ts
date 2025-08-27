//  Use cases - application business rules
import { formatUnits } from 'viem';
import {
  RouteType,
  type SwapParameters,
  type SwapQuote,
  type SwapRoute,
  SwapType
} from '../domain/entities';
import {
  ContractCallError,
  InvalidParametersError,
  PoolNotFoundError,
  RouterError,
  UnsupportedSwapTypeError
} from '../domain/errors';
import {
  type PoolRepository,
  type RouterRepository,
  type TokenRepository
} from '../repositories/interfaces';

export class SwapQuoteUseCase {
  constructor(
    private readonly routerRepository: RouterRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly poolRepository: PoolRepository,
    private readonly chainId: number
  ) {}

  async execute(params: SwapParameters): Promise<SwapQuote> {
    //  Business rule validation
    this.validateParameters(params);

    //  Determine swap type
    const swapType = this.determineSwapType(params);

    //  Get optimal route
    const route = await this.getOptimalRoute(params, swapType);

    //  Calculate quote based on route
    return await this.calculateQuote(params, route, swapType);
  }

  private validateParameters(params: SwapParameters): void {
    if (!params.fromToken || !params.toToken) {
      throw new InvalidParametersError('Invalid token addresses');
    }

    if (params.tokenIds && params.tokenIds.length === 0) {
      throw new InvalidParametersError('Token IDs cannot be empty array');
    }

    if (params.slippageTolerance && (params.slippageTolerance < 0 || params.slippageTolerance > 50)) {
      throw new InvalidParametersError('Slippage tolerance must be between 0 and 50%');
    }
  }

  private determineSwapType(params: SwapParameters): SwapType {
    if (params.tokenIds && params.tokenIds.length > 0) {
      return params.isExactInput ? SwapType.NFT_TO_ERC20 : SwapType.ERC20_TO_NFT;
    }
    return SwapType.ERC20_TO_ERC20;
  }

  private async getOptimalRoute(params: SwapParameters, swapType: SwapType): Promise<SwapRoute> {
    //  Try direct route first
    const directRoute = await this.tryDirectRoute(params, swapType);
    if (directRoute.isViable) {
      return directRoute;
    }

    //  Fallback to multi-hop
    return await this.getMultiHopRoute(params, swapType);
  }

  private async tryDirectRoute(params: SwapParameters, swapType: SwapType): Promise<SwapRoute> {
    try {
      //  For NFT swaps, check if direct pool exists
      if (swapType === SwapType.ERC20_TO_NFT || swapType === SwapType.NFT_TO_ERC20) {
        const poolExists = await this.poolRepository.checkPoolExists(params.fromToken, params.toToken);
        
        if (poolExists) {
          return {
            path: [params.fromToken, params.toToken],
            isViable: true,
            estimatedGas: BigInt(150000),
            priceImpact: 0.1,
            type: RouteType.DIRECT,
          };
        }
      }

      return {
        path: [params.fromToken, params.toToken],
        isViable: false,
        estimatedGas: BigInt(0),
        priceImpact: 0,
        type: RouteType.DIRECT,
      };
    } catch {
      return {
        path: [params.fromToken, params.toToken],
        isViable: false,
        estimatedGas: BigInt(0),
        priceImpact: 0,
        type: RouteType.DIRECT,
      };
    }
  }

  private async getMultiHopRoute(params: SwapParameters, swapType: SwapType): Promise<SwapRoute> {
    //  For NFT swaps, use WETH as intermediary
    if (swapType === SwapType.ERC20_TO_NFT || swapType === SwapType.NFT_TO_ERC20) {
      const wethAddress = await this.tokenRepository.getWETHAddress(this.chainId);
      
      try {
        //  Check if multi-hop route is viable
        const pool1Exists = await this.poolRepository.checkPoolExists(params.fromToken, wethAddress);
        const pool2Exists = await this.poolRepository.checkPoolExists(wethAddress, params.toToken);
        
        if (pool1Exists && pool2Exists) {
          return {
            path: [params.fromToken, wethAddress, params.toToken],
            isViable: true,
            estimatedGas: BigInt(250000),
            priceImpact: 0.3,
            type: RouteType.MULTI_HOP,
          };
        }
      } catch {
        //  Fall through to error
      }
    }

    throw new PoolNotFoundError(params.fromToken, params.toToken);
  }

  private async calculateQuote(params: SwapParameters, route: SwapRoute, swapType: SwapType): Promise<SwapQuote> {
    try {
      switch (swapType) {
        case SwapType.ERC20_TO_NFT:
          return await this.calculateERC20ToNFTQuote(params, route);
        case SwapType.NFT_TO_ERC20:
          return await this.calculateNFTToERC20Quote(params, route);
        case SwapType.ERC20_TO_ERC20:
          return await this.calculateERC20ToERC20Quote();
        default:
          throw new UnsupportedSwapTypeError(swapType);
      }
    } catch (error) {
      if (error instanceof RouterError) {
        throw error;
      }
      throw new ContractCallError('calculateQuote', error);
    }
  }

  private async calculateERC20ToNFTQuote(params: SwapParameters, route: SwapRoute): Promise<SwapQuote> {
    const tokenIds = params.tokenIds || [];
    
    if (route.type === RouteType.DIRECT) {
      //  Direct ERC20 → NFT quote
      const amounts = await this.routerRepository.getAmountsInCollection(
        [...tokenIds],
        route.path,
        params.capRoyaltyFee || true
      );
      
      const fromTokenDecimals = await this.tokenRepository.getTokenDecimals(params.fromToken);
      const inputAmount = formatUnits(amounts[0], fromTokenDecimals);
      
      return {
        inputAmount,
        outputAmount: tokenIds.length.toString(),
        priceImpact: route.priceImpact.toString(),
        minimumReceived: tokenIds.length.toString(),
        route: route.path,
        gasEstimate: route.estimatedGas.toString(),
        isMultiHop: false,
      };
    } else {
      //  Multi-hop ERC20 → WETH → NFT quote
      const wethAddress = route.path[1]; // WETH is the intermediary
      
      // Step 1: Get WETH needed for NFTs
      const wethToNftAmounts = await this.routerRepository.getAmountsInCollection(
        [...tokenIds],
        [wethAddress, params.toToken],
        params.capRoyaltyFee || true
      );
      
      // Step 2: Get ERC20 needed for WETH
      const erc20ToWethAmounts = await this.routerRepository.getAmountsInStandard(
        wethToNftAmounts[0],
        [params.fromToken, wethAddress]
      );
      
      const fromTokenDecimals = await this.tokenRepository.getTokenDecimals(params.fromToken);
      const inputAmount = formatUnits(erc20ToWethAmounts[0], fromTokenDecimals);
      
      return {
        inputAmount,
        outputAmount: tokenIds.length.toString(),
        priceImpact: route.priceImpact.toString(),
        minimumReceived: tokenIds.length.toString(),
        route: route.path,
        gasEstimate: route.estimatedGas.toString(),
        isMultiHop: true,
      };
    }
  }

  private async calculateNFTToERC20Quote(params: SwapParameters, route: SwapRoute): Promise<SwapQuote> {
    const tokenIds = params.tokenIds || [];
    
    if (route.type === RouteType.DIRECT) {
      //  Direct NFT → ERC20 quote
      const amounts = await this.routerRepository.getAmountsOutCollection(
        [...tokenIds],
        route.path,
        params.capRoyaltyFee || true
      );
      
      const toTokenDecimals = await this.tokenRepository.getTokenDecimals(params.toToken);
      const outputAmount = formatUnits(amounts[1], toTokenDecimals);
      
      return {
        inputAmount: tokenIds.length.toString(),
        outputAmount,
        priceImpact: route.priceImpact.toString(),
        minimumReceived: outputAmount,
        route: route.path,
        gasEstimate: route.estimatedGas.toString(),
        isMultiHop: false,
      };
    } else {
      //  Multi-hop NFT → WETH → ERC20 quote
      const wethAddress = route.path[1]; // WETH is the intermediary
      
      // Step 1: Get WETH from NFTs
      const nftToWethAmounts = await this.routerRepository.getAmountsOutCollection(
        [...tokenIds],
        [params.fromToken, wethAddress],
        params.capRoyaltyFee || true
      );
      
      // Step 2: Get ERC20 from WETH
      const wethToErc20Amounts = await this.routerRepository.getAmountsOutStandard(
        nftToWethAmounts[1],
        [wethAddress, params.toToken]
      );
      
      const toTokenDecimals = await this.tokenRepository.getTokenDecimals(params.toToken);
      const outputAmount = formatUnits(wethToErc20Amounts[1], toTokenDecimals);
      
      return {
        inputAmount: tokenIds.length.toString(),
        outputAmount,
        priceImpact: route.priceImpact.toString(),
        minimumReceived: outputAmount,
        route: route.path,
        gasEstimate: route.estimatedGas.toString(),
        isMultiHop: true,
      };
    }
  }

  private async calculateERC20ToERC20Quote(): Promise<SwapQuote> {
    //  ERC20 to ERC20 swap - not yet implemented
    throw new UnsupportedSwapTypeError('ERC20 to ERC20 swap not implemented yet');
  }
}
