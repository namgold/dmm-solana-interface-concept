import React, { FC, ReactNode, useMemo } from 'react'
import { createDefaultAuthorizationResultCache, SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SolletWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  SolletExtensionWalletAdapter,
  Coin98WalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

import '@solana/wallet-adapter-react-ui/styles.css'
import { SelectedNetwork } from '../../constants/networks'

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(SelectedNetwork), [])

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new SolanaMobileWalletAdapter({
        appIdentity: { name: 'KyberSwap DMM Solana' },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
      }),
      new PhantomWalletAdapter({ network: SelectedNetwork }),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter({ network: SelectedNetwork }),
      new SolflareWalletAdapter({ network: SelectedNetwork }),
      new TorusWalletAdapter(),
      new Coin98WalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new SolletWalletAdapter({ network: SelectedNetwork }),
    ],
    [],
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default Context
