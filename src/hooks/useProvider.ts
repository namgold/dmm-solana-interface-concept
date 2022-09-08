import { AnchorProvider } from '@project-serum/anchor'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'

declare global {
  interface Window {
    solana?: any
  }
}

const useProvider = () => {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  const provider = useMemo(
    () => (wallet ? new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions()) : null),
    [connection, wallet],
  )
  return provider
}

export default useProvider
