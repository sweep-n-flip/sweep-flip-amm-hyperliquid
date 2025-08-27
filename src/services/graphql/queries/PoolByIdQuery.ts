//  Query to get pool data by pool ID (which is the LP token address)
import { gql } from 'graphql-request';

export const POOL_BY_ID_QUERY = gql`
  query GetPoolById($poolId: String!) {
    pairs(where: {id: $poolId}) {
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
      totalSupply
    }
  }
`;
