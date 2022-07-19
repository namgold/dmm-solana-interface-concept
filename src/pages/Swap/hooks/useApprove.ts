import { useCallback, useEffect, useState } from 'react'
import { approveTokenForRouter, CurrencyAmount, Percent, Trade, WSOL } from '@namgold/dmm-solana-sdk'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

import useRouter from './useRouter'
import { getAccount } from '@solana/spl-token'
import { isNotSOL } from '../../../utils/isSOL'
import { useAssociatedTokensAccounts } from '../../../hooks/useBalance'

export const useNeedsApproved = ({
  fromValue,
  trade,
}: {
  fromValue: CurrencyAmount | null
  trade: Trade | null
}): {
  needsApproved: boolean | null
  approve: () => void
  approving: boolean
  errorMsg: string | null
  refreshApprove: () => void
} => {
  // boolean: true/false: need or not
  // null: calculating/not enough information
  const [needsApproved, setNeedApproved] = useState<boolean | null>(null)
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const router = useRouter()
  const atas = useAssociatedTokensAccounts()
  const [triggered, setTrigger] = useState(0)
  const refreshApprove = useCallback(() => setTrigger((i) => ++i), [])

  useEffect(() => {
    const calc = async () => {
      setNeedApproved(null)
      if (!fromValue) return null
      if (isNotSOL(fromValue.currency) && fromValue.currency !== WSOL) {
        if (publicKey && fromValue && router && atas) {
          const traderAccount = await getAccount(connection, atas[fromValue.currency.mint.toBase58()].pubkey)
          if (traderAccount.delegate?.equals(await router.getDelegatingAddress())) {
            // found approved value => check if enough
            if (
              BigInt(fromValue.toExact()) >
              traderAccount.delegatedAmount / BigInt(10 ** fromValue.currency.decimals)
            ) {
              setNeedApproved(true)
            } else {
              setNeedApproved(false)
            }
          } else {
            // not found approved value => request approve
            setNeedApproved(true)
          }
        } else {
          setNeedApproved(null)
        }
      } else {
        // SOL not need to approved
        // todo namgold: does WSOL need?
        setNeedApproved(false)
      }
    }
    calc()
  }, [atas, connection, fromValue, publicKey, router, triggered])

  const [approving, setApproving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const doApprove = useCallback(() => {
    const approve = async () => {
      if (fromValue && trade && router && publicKey && needsApproved) {
        try {
          const allowedSlippage = new Percent('2', '100')
          setApproving(true)
          await approveTokenForRouter(
            router,
            isNotSOL(fromValue.currency) ? fromValue.currency.mint : WSOL.mint,
            publicKey,
            trade.maximumAmountIn(allowedSlippage).raw,
          )
          setApproving(false)
          refreshApprove()
          setErrorMsg(null)
        } catch (e: any) {
          setApproving(false)
          if (e?.message) setErrorMsg(e.message)
          else setErrorMsg(String(e))
        }
      }
    }
    approve()
  }, [fromValue, needsApproved, publicKey, refreshApprove, router, trade])

  return { needsApproved, approve: doApprove, approving, errorMsg, refreshApprove }
}
