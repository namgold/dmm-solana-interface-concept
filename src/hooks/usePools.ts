import { Currency, Fetcher, Pool, SOL, Token, WSOL } from '@namgold/dmm-solana-sdk'
import { useEffect, useState } from 'react'
import useContext from './useContext'

const usePools = (fromToken: Currency | null, toToken: Currency | null): Pool[] | null | undefined => {
  const context = useContext()
  const [pools, setPools] = useState<Pool[] | null | undefined>(undefined)

  useEffect(() => {
    setPools(undefined)
  }, [context, fromToken, toToken])

  useEffect(() => {
    const fetch = async () => {
      if (fromToken && toToken && context) {
        try {
          let pools: Pool[]
          if (fromToken === SOL) pools = await Fetcher.fetchPoolData(WSOL, toToken as Token, context)
          else if (toToken === SOL) pools = await Fetcher.fetchPoolData(fromToken as Token, WSOL, context)
          else pools = await Fetcher.fetchPoolData(fromToken as Token, toToken as Token, context)
          setPools(pools)
        } catch (e) {
          console.error('Cant fetch pools\n', e)
          setPools(null)
        }
      }
    }
    fetch()
  }, [context, fromToken, toToken])
  return pools
}

export default usePools
