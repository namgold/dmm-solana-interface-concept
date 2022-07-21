import { useEffect, useState } from 'react'
import { BN } from '@project-serum/anchor'
import { Currency, CurrencyAmount, Token, TokenAmount } from '@namgold/dmm-solana-sdk'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js'
import { getMint, TOKEN_PROGRAM_ID, AccountLayout, RawAccount, Mint } from '@solana/spl-token'
import { useTokenList } from './useTokenlist'

const cacheSOLBalanceRequest = new WeakMap<Connection, { [publicKey: string]: Promise<number> }>()
export const useSOLBalance = (): CurrencyAmount | false => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [solBalance, setSolBalance] = useState<CurrencyAmount | false>(false)

  useEffect(() => {
    const getBalance = async () => {
      if (publicKey) {
        let balanceRequest = cacheSOLBalanceRequest.get(connection)?.[publicKey.toBase58()]
        if (!balanceRequest) {
          balanceRequest = connection.getBalance(publicKey)
          const connectionCached = cacheSOLBalanceRequest.get(connection) || {}
          connectionCached[publicKey.toBase58()] = balanceRequest
          cacheSOLBalanceRequest.set(connection, connectionCached)
        }
        const balance = await balanceRequest
        if (solBalance === false || new BN(balance).cmp(solBalance.raw) !== 0)
          setSolBalance(CurrencyAmount.sol(new BN(balance)))
      } else {
        if (solBalance !== false) setSolBalance(false)
      }
    }
    setSolBalance(false)
    getBalance()

    // do not add solBalance to deps list, it would trigger infinity loops calling rpc calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, connection])

  return solBalance
}
type Overwrite<T, U> = Omit<T, keyof U> & U

type ParsedMint = {
  mint: Mint
}
type RawAccountParsed = Overwrite<RawAccount, ParsedMint>

type ParsedData = {
  data: RawAccountParsed
}
type AccountInfoParsed = Overwrite<AccountInfo<any>, ParsedData> & {
  pubkey: PublicKey
}

export const useAssociatedTokensAccounts = (): { [mintAddress: string]: AccountInfoParsed } | null => {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [atas, setAtas] = useState<{ [mintAddress: string]: AccountInfoParsed } | null>(null)
  const tokenList = useTokenList()

  useEffect(() => {
    async function getTokenAccounts(publicKey: PublicKey, connection: Connection) {
      const response = await connection.getTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      })
      const atas: { [mintAddress: string]: AccountInfoParsed } = {}
      await Promise.all(
        response.value.map(async (ata) => {
          // use map only to use with Promise.all. It should be understand as .forEach
          const parsedAccountData = AccountLayout.decode(ata.account.data)
          const parsedMintAccountData = {
            ...parsedAccountData,
            mint: await getMint(connection, parsedAccountData.mint),
          }
          const parsedAta: AccountInfoParsed = {
            ...ata.account,
            pubkey: ata.pubkey,
            data: parsedMintAccountData,
          }
          atas[parsedMintAccountData.mint.address.toBase58()] = parsedAta
          return
        }),
      )
      setAtas(atas)
    }

    if (publicKey) {
      getTokenAccounts(publicKey, connection)
    }
  }, [publicKey, connection, tokenList])

  return atas
}

export const useTokensBalances = (): { [mintAddress: string]: TokenAmount | false } => {
  const atas = useAssociatedTokensAccounts()
  const [solBalances, setSolBalances] = useState<{ [mintAddress: string]: TokenAmount | false }>({})
  const tokenList = useTokenList()

  useEffect(() => {
    const newSolBalances: { [mintAddress: string]: TokenAmount | false } = {}
    tokenList.forEach((token) => {
      newSolBalances[token.mint.toBase58()] = false
    })
    setSolBalances(newSolBalances)
  }, [tokenList])

  useEffect(() => {
    async function getTokenAccounts() {
      if (!atas) return
      const newSolBalances: { [mintAddress: string]: TokenAmount } = {}
      // Init all tokens balance by 0
      tokenList.forEach((token) => (newSolBalances[token.mint.toBase58()] = new TokenAmount(token, new BN(0))))

      Object.keys(atas).forEach((ataAddress) => {
        const accountInfo = atas[ataAddress].data
        const token = new Token(accountInfo.mint.address, accountInfo.mint.decimals)
        newSolBalances[accountInfo.mint.address.toBase58()] = new TokenAmount(token, accountInfo.amount)
      })

      setSolBalances(newSolBalances)
    }

    if (atas) {
      getTokenAccounts()
    }
  }, [atas, tokenList])

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
        setBalance(tokensBalances[currency.mint.toBase58()])
      } else {
        setBalance(SOLBalance)
      }
    } else {
      setBalance(false)
    }
  }, [currency, SOLBalance, tokensBalances])

  return balance
}
