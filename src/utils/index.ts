import { Currency, Token } from '@namgold/dmm-solana-sdk'

export const getAddress = (token: Token | Currency): string => {
  return token instanceof Token ? String(token.mint) : 'SOL'
}
