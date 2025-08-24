import { gql } from 'graphql-request'

export const COLLECTION_NATIVE_PAIRS_QUERY = gql`
  query GetCollectionNativePairs {
    pairs(where: { discrete0: true, discrete1: false }, first: 1000) {
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
