import React, { useCallback, useMemo, useState } from 'react'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { Button } from 'react-bootstrap'
import '@solana/wallet-adapter-react-ui/styles.css'
import { isValidAddress } from '../../utils/address'

export function SendLamport({ address, value }: { address: string; value: number }): JSX.Element | null {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [sendMsg, setSendMsg] = useState('')
  const isValid = useMemo(() => isValidAddress(address), [address])

  const onClick = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError()
    try {
      setSendMsg('Waiting for wallet confirm')

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(address),
          lamports: value,
        }),
      )
      const blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey
      let signature
      try {
        signature = await sendTransaction(transaction, connection)
      } catch (e) {
        setSendMsg('Rejected')
        setTimeout(() => setSendMsg(''), 1000)
        return
      }
      setSendMsg('Sending .....')
      const result = await connection.confirmTransaction(signature, 'processed')
      setSendMsg(result.value.err?.toString() || 'Success')
      setTimeout(() => setSendMsg(''), 2000)
    } catch (e) {
      setSendMsg('Error')
      setTimeout(() => setSendMsg(''), 1000)
      return
    }
  }, [publicKey, address, value, connection, sendTransaction])

  return (
    <Button variant='success' onClick={onClick} disabled={!publicKey || !isValid || !value || !!sendMsg}>
      {!publicKey ? 'Please connect wallet first' : sendMsg || 'Send lamport!'}
    </Button>
  )
}
