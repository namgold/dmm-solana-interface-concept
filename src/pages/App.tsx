import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import React, { FC } from 'react'
import { SendLamport } from '../components/SendLamport'

require('./App.css')
require('@solana/wallet-adapter-react-ui/styles.css')

const App: FC = () => {
  return (
    <div className='App'>
      <WalletMultiButton />
      <SendLamport address='HdTPmcFS3GTT2LqyRf1VRVoAKxhBiiiXWy11P3gnP5zr' value={14} />
    </div>
  )
}

export default App
