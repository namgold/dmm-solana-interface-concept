import { AnchorProvider } from '@project-serum/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'

declare global {
  interface Window {
    solana?: any
  }
}

const useProvider = () => {
  const { connection } = useConnection()
  const wallet = window.solana

  const provider = useMemo(
    () => (wallet ? new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions()) : null),
    [connection, wallet],
  )
  return provider
}

export default useProvider
