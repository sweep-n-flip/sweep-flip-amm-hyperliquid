import { gql } from 'graphql-request'

export const PAIR_DAILY_VOLUME_QUERY = gql`
  query getPairDays($pair: String!) {
    pairDays(where: { pair: $pair }, orderBy: day, orderDirection: desc, first: 7) {
      id
      day
      volume0
      volume1
      reserve0
      reserve1
    }
  }
`
