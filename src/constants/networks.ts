import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import TestnetTokenlist from './tokenlists/solana.testnet.tokenlist.json'

export type TokenListToken = {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI: string
}

export type TokenList = {
  name: string
  keywords: string[]
  timestamp: string
  logoURI: string
  tokens: TokenListToken[]
}

export type NetworkInfo = {
  tokenlist: TokenList
  programs: {
    pool: string
    factory: string
    router: string
  }
}

export type SupportedNetwork = Extract<
  WalletAdapterNetwork,
  WalletAdapterNetwork.Testnet
  // | WalletAdapterNetwork.Mainnet
>

export const SupportedNetwork = {
  Testnet: WalletAdapterNetwork.Testnet,
} as const

const NETWORKS_INFO: { [key in SupportedNetwork]: NetworkInfo } = {
  [WalletAdapterNetwork.Testnet]: {
    tokenlist: TestnetTokenlist,
    programs: {
      pool: 'EKdy97aMrjjxtq4CJh9vN24WuHVsuLz4qtDjyYqttviN',
      factory: 'CwzigBwGVn25LdyLsqzSX3iwhPwQXoxYcXxSM4sjWoBU',
      router: '6VdLuZvVxdgFYQiCQ1VDBBdE27RahXzv2wCxwG4FAzAn',
    },
  },
}

export default NETWORKS_INFO

export const SelectedNetwork: SupportedNetwork =
  process.env.REACT_APP_NETWORK && process.env.REACT_APP_NETWORK in SupportedNetwork
    ? (process.env.REACT_APP_NETWORK as SupportedNetwork)
    : SupportedNetwork.Testnet
