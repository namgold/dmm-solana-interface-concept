import { Currency, Token } from '@namgold/dmm-solana-sdk'

export const getAddress = (token: Token | Currency): string => {
  return token instanceof Token ? token.mint.toBase58() : 'SOL'
}
