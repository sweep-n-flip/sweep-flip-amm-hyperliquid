import { gql } from 'graphql-request'

export const COLLECTION_CURRENCIES_QUERY = gql`
  query GetCollectionCurrencies {
    currencies(where: { collection_not: null }) {
      name
      id
      symbol
      decimals
      wrapping
      tokenIds
      collection {
        id
        name
        symbol
      }
    }
  }
`
