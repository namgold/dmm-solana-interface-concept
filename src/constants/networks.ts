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

const SupportedSolanaNetworks = [
  // WalletAdapterNetwork.Mainnet, //enable when filled NETWORKS_INFO configs
  WalletAdapterNetwork.Testnet,
  // WalletAdapterNetwork.Devnet, //enable when filled NETWORKS_INFO configs
] as const
type SupportedSolanaNetwork = typeof SupportedSolanaNetworks[number]

const NETWORKS_INFO: { [key in SupportedSolanaNetwork]: NetworkInfo } = {
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

export const SelectedNetwork = SupportedSolanaNetworks.includes(process.env.REACT_APP_NETWORK as any)
  ? (process.env.REACT_APP_NETWORK as SupportedSolanaNetwork)
  : SupportedSolanaNetworks[0]
