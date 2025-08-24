import { gql } from 'graphql-request'

export const PAIR_MONTHLY_TOTAL_VOLUME_QUERY = gql`
  query getAllPairMonth($pair: String) {
    pairMonths(where: { pair: $pair }) {
      id
      month
      volume0
      volume1
      reserve0
      reserve1
    }
  }
`
