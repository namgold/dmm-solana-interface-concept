import { PublicKey } from '@solana/web3.js'

export const isValidAddress = (address: string): boolean => {
  try {
    if (!address) return false
    const pub = new PublicKey(address)
    return PublicKey.isOnCurve(pub)
  } catch (e) {
    return false
  }
}

export const shortenAddress = (address: string): string => {
  return address.slice(0, 3) + '...' + address.slice(-3)
}
