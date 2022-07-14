import { Context } from '@namgold/dmm-solana-sdk'
import { useMemo } from 'react'
import NETWORKS_INFO, { SelectedNetwork } from '../constants/networks'
import useProvider from './useProvider'

const useContext = () => {
  const provider = useProvider()

  const context = useMemo(
    () =>
      provider
        ? new Context(
            provider,
            NETWORKS_INFO[SelectedNetwork].programs.factory,
            NETWORKS_INFO[SelectedNetwork].programs.pool,
            NETWORKS_INFO[SelectedNetwork].programs.router,
          )
        : null,
    [provider],
  )
  return context
}

export default useContext
