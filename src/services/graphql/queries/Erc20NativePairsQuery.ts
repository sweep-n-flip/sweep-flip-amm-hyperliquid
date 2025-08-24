import { gql } from 'graphql-request'

export const ERC20_NATIVE_PAIRS_QUERY = gql`
  query GetErc20NativePairs {
    pairs(where: { discrete0: false, discrete1: false }, first: 1000) {
      id
      discrete0
      discrete1
      token0 {
        id
        name
        symbol
        decimals
        tokenIds
        collection {
          id
          name
          symbol
          wrapper {
            id
          }
        }
      }
      token1 {
        id
        name
        symbol
        decimals
        tokenIds
        collection {
          id
          name
          symbol
          wrapper {
            id
          }
        }
      }
      reserve0
      reserve1
    }
  }
`
