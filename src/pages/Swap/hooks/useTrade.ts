import { Currency, CurrencyAmount, Pool, Route, SOL, Trade, WSOL } from '@namgold/dmm-solana-sdk'
import { useMemo } from 'react'

const useTrade = ({
  fromToken,
  toToken,
  fromValue,
  selectedPool,
}: {
  fromToken: Currency | null
  toToken: Currency | null
  fromValue: CurrencyAmount | null
  selectedPool: Pool | null
}) => {
  const trade = useMemo(() => {
    try {
      return fromToken && toToken && fromValue && selectedPool
        ? Trade.exactIn(new Route([selectedPool], fromToken, toToken), fromValue)
        : null
    } catch (e) {
      return null
    }
  }, [fromToken, fromValue, selectedPool, toToken])
  return trade
}

export default useTrade
