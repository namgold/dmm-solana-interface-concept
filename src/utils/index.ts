import { Currency, SOL, Token, WSOL } from '@namgold/dmm-solana-sdk'

export const getAddress = (token: Token | Currency): string => {
  return token instanceof Token ? token.mint.toBase58() : 'SOL'
}

export const getAddressWithSOL = (token?: Token | Currency | null): string => {
  if (!token) return 'SOL'
  if (token === SOL) return 'SOL'
  if (token === WSOL) return 'SOL'
  return (token as Token).mint.toBase58()
}
