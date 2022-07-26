import NETWORKS_INFO, { SelectedNetwork } from '../constants/networks'
import { Currency, SOL, Token, WSOL } from '@namgold/dmm-solana-sdk'
import { useMemo } from 'react'

const tokenList = NETWORKS_INFO[SelectedNetwork].tokenlist.tokens.map(
  (token) => new Token(token.address, token.decimals, token.symbol, token.name),
)

export const useTokenList = (): Token[] => {
  // const tokenList = useMemo(
  //   () =>
  //     NETWORKS_INFO[SelectedNetwork].tokenlist.tokens.map(
  //       (token) => new Token(token.address, token.decimals, token.symbol, token.name),
  //     ),
  //   [],
  // )
  return tokenList
}

export const useCurrencyList = (useSOL: boolean): Currency[] => {
  const tokenList = useTokenList()
  const currencyList = useMemo(() => [useSOL ? SOL : WSOL, ...tokenList], [tokenList, useSOL])
  return currencyList
}
