import React, { useEffect, useState } from 'react'
import { BN } from '@project-serum/anchor'
import { Currency, CurrencyAmount, Token, TokenAmount, WSOL, currencyEquals } from '@namgold/dmm-solana-sdk'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey } from '@solana/web3.js'
import { getMint, TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token'
import { useTokenList } from './useTokenlist'

export const useSOLBalance = (): CurrencyAmount | false => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [solBalance, setSolBalance] = useState<CurrencyAmount | false>(false)

  useEffect(() => {
    const getBalance = async () => {
      if (publicKey) {
        const balance = await connection.getBalance(publicKey)
        setSolBalance(CurrencyAmount.sol(new BN(balance)))
      } else {
        if (solBalance !== false) setSolBalance(false)
      }
    }
    setSolBalance(false)
    getBalance()
  }, [publicKey, connection])

  return solBalance
}

export const useTokensBalances = (): { [mint: string]: TokenAmount | false } => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [solBalances, setSolBalances] = useState<{ [mint: string]: TokenAmount | false }>({})
  const tokenList = useTokenList()

  useEffect(() => {
    const newSolBalances: { [mint: string]: TokenAmount | false } = {}
    tokenList.forEach((token) => {
      newSolBalances[String(token.mint)] = false
    })
    setSolBalances(newSolBalances)
  }, [tokenList])

  useEffect(() => {
    async function getTokenAccounts(publicKey: PublicKey, connection: Connection) {
      const response = await connection.getTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      })
      const results = await Promise.all(
        response.value.map(async (e) => {
          const accountInfo = AccountLayout.decode(e.account.data)
          const mintPubkey = new PublicKey(accountInfo.mint)
          const mintData = await getMint(connection, mintPubkey)
          const token = new Token(mintPubkey, mintData.decimals)
          return [token, new TokenAmount(token, accountInfo.amount)] as [Token, TokenAmount]
        }),
      )
      const newSolBalances: { [mint: string]: TokenAmount | false } = {}

      tokenList.forEach((token) => (newSolBalances[String(token.mint)] = new TokenAmount(token, new BN(0))))

      results.forEach((result) => {
        newSolBalances[String(result[0].mint)] = result[1]
      })
      setSolBalances(newSolBalances)
    }

    if (publicKey) {
      getTokenAccounts(publicKey, connection)
    }
  }, [publicKey, connection, tokenList])

  return solBalances
}

export const useBalance = (currency: Currency | null): CurrencyAmount | false => {
  const SOLBalance = useSOLBalance()
  const tokensBalances = useTokensBalances()
  const [balance, setBalance] = useState<CurrencyAmount | false>(false)

  useEffect(() => {
    setBalance(false)
  }, [currency])

  useEffect(() => {
    if (currency) {
      if (currency instanceof Token) {
        setBalance(tokensBalances[String(currency.mint)])
      } else {
        setBalance(SOLBalance)
      }
    } else {
      setBalance(false)
    }
  }, [currency, SOLBalance, tokensBalances])

  return balance
}
