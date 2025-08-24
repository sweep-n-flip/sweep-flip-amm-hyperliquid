# RouterService - Clean Architecture Implementation

## Overview

The RouterService has been refactored to follow Clean Architecture principles, providing better separation of concerns, testability, and maintainability.

## Architecture Layers

### 1. Domain Layer (`domain/`)
- **Entities**: Core business objects (`SwapQuote`, `SwapParameters`, `TokenInfo`, etc.)
- **Errors**: Domain-specific exceptions (`RouterError`, `PoolNotFoundError`, etc.)
- **Enums**: Business constants (`SwapType`, `RouteType`)

### 2. Repository Layer (`repositories/`)
- **Interfaces**: Abstract contracts for data access
- **Implementations**: Concrete implementations for blockchain interaction
- **Caching**: Built-in caching for performance optimization

### 3. Use Cases Layer (`usecases/`)
- **SwapQuoteUseCase**: Business logic for calculating swap quotes
- **Route Optimization**: Logic for finding optimal swap routes
- **Validation**: Parameter validation and business rules

### 4. Infrastructure Layer (`core/`)
- **RouterService**: Main service orchestrating all operations
- **Factory Functions**: Dependency injection and service creation
- **Adapters**: Integration with external libraries (wagmi, viem)

### 5. Configuration Layer (`config/`)
- **RouterConfigService**: Centralized configuration management
- **Settings**: Slippage, gas limits, retry attempts, etc.

### 6. Presentation Layer (`hooks/`)
- **useGetSwapQuote**: React hook with proper wagmi integration
- **useSwapQuote**: Legacy-compatible hook
- **useERC20ToNFTQuote**: Backward compatibility

## Key Benefits

### 1. **Testability**
Each layer can be tested independently:
```typescript
// Test use case without UI
const useCase = new SwapQuoteUseCase(mockRouter, mockToken, mockPool, chainId);
const result = await useCase.execute(params);
```

### 2. **Maintainability**
Clear separation of concerns:
- Business logic in use cases
- Data access in repositories
- Configuration centralized
- UI logic in hooks

### 3. **Extensibility**
Easy to add new features:
- New swap types
- Different routing strategies
- Additional validation rules
- New data sources

### 4. **Error Handling**
Robust error management:
- Domain-specific errors
- Retryable vs non-retryable errors
- Proper error propagation

### 5. **Performance**
Built-in optimizations:
- Repository caching
- Configurable timeouts
- Efficient multi-hop routing

## Usage Examples

### Basic Usage
```typescript
import { useSwapQuote } from '@/services/RouterService';

function SwapComponent() {
  const { inputAmount, outputAmount, loading, error } = useSwapQuote({
    fromToken: '0x...',
    toToken: '0x...',
    amount: '1000',
    tokenIds: ['123', '456'],
    isExactInput: false,
    capRoyaltyFee: true,
  });

  return (
    <div>
      <p>Input: {inputAmount}</p>
      <p>Output: {outputAmount}</p>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Advanced Configuration
```typescript
import { RouterConfigService } from '@/services/config/RouterConfigService';

const config = RouterConfigService.getInstance();
config.updateConfig({
  maxSlippage: 3, // 3% instead of default 5%
  cacheTimeout: 60000, // 1 minute instead of 30 seconds
  retryAttempts: 5, // 5 attempts instead of 3
});
```

### Direct Service Usage
```typescript
import { createRouterService } from '@/services/core/RouterService';

const routerService = createRouterService(chainId, chainData, contractClient);
const quote = await routerService.getSwapQuote(params);
```

## Migration Guide

### From Old RouterService
```typescript
// OLD
const { inputAmount, outputAmount, loading, error } = useERC20ToNFTQuote(
  tokenIds, tokenIn, collectionAddress, capRoyaltyFee, enabled
);

// NEW (same interface, improved implementation)
const { inputAmount, outputAmount, loading, error } = useERC20ToNFTQuote(
  tokenIds, tokenIn, collectionAddress, capRoyaltyFee, enabled
);
```

### Multi-hop Support
```typescript
// NEW - Automatic multi-hop detection
const { inputAmount, outputAmount, isMultiHop, route } = useSwapQuote({
  fromToken: '0x...', // USDT
  toToken: '0x...', // NFT Collection
  tokenIds: ['123'],
  isExactInput: false,
});

// route will be [USDT, WETH, NFT_Collection] if no direct pool exists
// isMultiHop will be true
```

## Testing

### Unit Tests
```typescript
describe('SwapQuoteUseCase', () => {
  it('should calculate ERC20 to NFT quote', async () => {
    const mockRouter = createMockRouter();
    const mockToken = createMockToken();
    const mockPool = createMockPool();
    
    const useCase = new SwapQuoteUseCase(mockRouter, mockToken, mockPool, 1);
    const result = await useCase.execute(params);
    
    expect(result.inputAmount).toBe('1000');
    expect(result.outputAmount).toBe('2');
  });
});
```

### Integration Tests
```typescript
describe('RouterService Integration', () => {
  it('should handle multi-hop routing', async () => {
    const service = createRouterService(1, chainData, contractClient);
    const quote = await service.getSwapQuote(params);
    
    expect(quote.isMultiHop).toBe(true);
    expect(quote.route).toHaveLength(3);
  });
});
```

## Future Enhancements

1. **Batch Operations**: Support for multiple swaps in single transaction
2. **Price Oracles**: Integration with Chainlink or other price feeds
3. **MEV Protection**: Front-running protection mechanisms
4. **Cross-chain**: Support for cross-chain swaps
5. **Analytics**: Detailed swap analytics and monitoring
6. **Governance**: Decentralized parameter management

## Contributing

When adding new features:

1. **Domain First**: Define entities and business rules
2. **Repository**: Add data access interfaces and implementations
3. **Use Cases**: Implement business logic
4. **Service**: Orchestrate use cases
5. **Hooks**: Create React integration
6. **Tests**: Add comprehensive test coverage

This architecture ensures code quality, maintainability, and extensibility for future development.
