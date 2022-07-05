import React, { useCallback, useState } from 'react'
import { WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { Button } from 'react-bootstrap'

export function SendLamport(address: string, value: number): JSX.Element | null {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [sendMsg, setSendMsg] = useState('')
  const onClick = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError()

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(address),
        lamports: value,
      })
    )
    setSendMsg('Waiting for confirm')
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
    setTimeout(() => setSendMsg(''), 5000)
  }, [publicKey, sendTransaction, connection])

  return publicKey ? (
    <Button variant='success' onClick={onClick} disabled={!publicKey && sendMsg}>
      {sendMsg || 'Send 1 lamport to a random address!'}
    </Button>
  ) : null
}
