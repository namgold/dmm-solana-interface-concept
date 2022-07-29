import { Currency, CurrencyAmount, Token, TokenAmount } from '@namgold/dmm-solana-sdk'
import { BN } from '@project-serum/anchor'

export const tryConvertAmount = (amount: number, currency: Currency): CurrencyAmount | null => {
  try {
    const bnAmount =
      amount < 0
        ? new BN(Math.round(amount * 10 ** currency.decimals))
        : new BN(String(amount) + '0'.repeat(currency.decimals))

    if (currency instanceof Token) {
      return new TokenAmount(currency, bnAmount)
    }
    return CurrencyAmount.sol(bnAmount)
  } catch (e) {
    return null
  }
}
