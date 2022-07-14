import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { SelectedNetwork } from '../constants/networks'

const scanHostname = 'https://solscan.io'

const cluster = () =>
  (SelectedNetwork as WalletAdapterNetwork) === WalletAdapterNetwork.Mainnet ? '' : '?cluster=' + SelectedNetwork

export const scanAddress = (address: string) => {
  return `${scanHostname}/address/${address}${cluster()}`
}

export const scanTx = (txAddress: string) => {
  return `${scanHostname}/tx/${txAddress}${cluster()}`
}
