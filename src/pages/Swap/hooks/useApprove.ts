import { useEffect, useState } from 'react'
import { CurrencyAmount, WSOL } from '@namgold/dmm-solana-sdk'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

import useRouter from './useRouter'
import { getAccount } from '@solana/spl-token'
import { isNotSOL } from '../../../utils/isSOL'

export const useNeedsApproved = ({ fromValue }: { fromValue: CurrencyAmount | null }): boolean | null => {
  // boolean: true/false: need or not
  // null: calculating/not enough information
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const router = useRouter()
  const [needsApproved, setNeedApproved] = useState<boolean | null>(null)

  useEffect(() => {
    setNeedApproved(null)
    const calc = async () => {
      if (!fromValue) return null
      if (isNotSOL(fromValue.currency) && fromValue.currency !== WSOL) {
        if (publicKey && fromValue && router) {
          setNeedApproved(true)
          // error at line below, so temporary cant check balance approved yet.
          const traderAccount = await getAccount(connection, publicKey)
          if (traderAccount.delegate && traderAccount.delegate.equals(await router.getDelegatingAddress())) {
            //f found approved value => check if enough
            if (BigInt(fromValue.toExact()) > traderAccount.delegatedAmount) {
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
        setNeedApproved(false)
      }
    }
    calc()
  }, [connection, fromValue, publicKey, router])

  return needsApproved
}
