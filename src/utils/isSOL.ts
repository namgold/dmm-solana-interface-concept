import { Currency, SOL, Token } from '@namgold/dmm-solana-sdk'

export const isNotSOL = (currency: Currency): currency is Token => currency !== SOL
