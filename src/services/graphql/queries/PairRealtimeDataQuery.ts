import { gql } from 'graphql-request'

export const PAIR_REALTIME_DATA_QUERY = gql`
  query getPairRealtimeData($pairId: String!) {
    pair(id: $pairId) {
      id
      discrete0
      discrete1
      token0 {
        id
        symbol
        name
        decimals
        tokenIds
        collection {
          id
          name
          symbol
        }
      }
      token1 {
        id
        symbol
        name
        decimals
        tokenIds
        collection {
          id
          name
          symbol
        }
      }
      reserve0
      reserve1
      totalSupply
    }
  }
`
