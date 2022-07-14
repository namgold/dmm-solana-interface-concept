import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js'
import * as SPLToken from '@solana/spl-token'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

// get token accounts by owner

const connection = new Connection(clusterApiUrl(WalletAdapterNetwork.Testnet))

async function main() {
  // 1. you can fetch all token account by an owner
  const response = await connection.getTokenAccountsByOwner(
    new PublicKey('EBs4dM86EmmAJoiNyvCsX7dBNx67zWXqZ1uG7k79mPgf'), // owner here
    {
      programId: TOKEN_PROGRAM_ID,
    },
  )
  response.value.forEach((e) => {
    console.log(`pubkey: ${e.pubkey.toBase58()}`)
    const accountInfo = SPLToken.AccountLayout.decode(e.account.data)
    console.log(`mint: ${new PublicKey(accountInfo.mint)}`)
    console.log(`amount: ${SPLToken.u64.fromBuffer(accountInfo.amount)}`)
    console.log()
  })
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err)
    process.exit(-1)
  },
)
