import React, { FC, MouseEventHandler, useCallback, useEffect, useState } from 'react'
import {
  AMPLIFICATION_FACTOR_BPS,
  Currency,
  CurrencyAmount,
  Percent,
  Pool,
  sendAndConfirmTransaction,
  SOL,
  Token,
  TokenAmount,
  WSOL,
} from '@namgold/dmm-solana-sdk'
import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@project-serum/anchor'
import { Col, Form, Row } from 'react-bootstrap'
import styled from 'styled-components'

import { useBalance } from '../../hooks/useBalance'
import { useCurrencyList, useTokenList } from '../../hooks/useTokenlist'
import { tryConvertAmount } from '../../utils/number'
import useContext from '../../hooks/useContext'
import useProvider from '../../hooks/useProvider'
import usePools from '../../hooks/usePools'
import { scanAddress, scanTx } from '../../utils/solscan'
import useRouter from './hooks/useRouter'
import useTrade from './hooks/useTrade'
import { shortenTx } from '../../utils/address'
import { useNeedsApproved } from './hooks/useApprove'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { FullWidthButton } from '../../components/Button'
import { getAddressWithSOL } from '../../utils'
import { CenterText } from '../../components/Text'

const SwapWrapper = styled.div`
  border: 1px solid white;
  padding: 2rem;
  border-radius: 1rem;
  display: grid;
  gap: 2rem;
  width: 650px;
`

const PoolOption = ({
  pool,
  fromValue,
  onSelect,
}: {
  pool: Pool
  fromValue: CurrencyAmount
  onSelect: React.Dispatch<React.SetStateAction<Pool | null>>
}) => {
  let tokenAmountOut: TokenAmount
  try {
    tokenAmountOut = pool.getOutputAmount(
      fromValue instanceof TokenAmount ? fromValue : new TokenAmount(WSOL, fromValue.raw),
    )[0]
  } catch (e) {
    return null
  }
  return (
    <Form.Check
      key={pool.address.toBase58()}
      type='radio'
      id={pool.address.toBase58()}
      onClick={() => onSelect(pool)}
      name='pool'
      label={
        <span style={{ whiteSpace: 'pre-line' }}>
          Amount out: {tokenAmountOut.toExact() ?? 0} {tokenAmountOut.token.symbol}
          <br />
          Amp: {pool.amp.toNumber() / AMPLIFICATION_FACTOR_BPS}
          <br />
          Address:&nbsp;
          <a target='_blank' rel='noopener noreferrer' href={scanAddress(pool.address.toBase58())}>
            {pool.address.toBase58()} ↗
          </a>
        </span>
      }
    />
  )
}

const Swap: FC = () => {
  const { setVisible } = useWalletModal()
  const { publicKey } = useWallet()
  const [fromValue, setFromValue] = useState<CurrencyAmount | null>(null)
  const [fromToken, setFromToken] = useState<Currency | null>(null)
  const [toValue, setToValue] = useState<CurrencyAmount | null>(null)
  const [toToken, setToToken] = useState<Currency | null>(null)
  const [useSOL, setUseSOL] = useState(true)
  const isFromSOL = fromToken === SOL || fromToken === WSOL

  const balance = useBalance(fromToken)

  const tokenList = useTokenList()
  const currencyList = useCurrencyList(useSOL)
  const context = useContext()
  const provider = useProvider()
  const pools = usePools(fromToken, toToken)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const router = useRouter()
  const trade = useTrade({ fromToken, toToken, fromValue, selectedPool })
  const [msg, setMsg] = useState<string | null | JSX.Element>(null)
  const [errorMsg, setErrorMsg] = useState<string | null | JSX.Element>(null)

  const {
    needsApproved,
    approve,
    approving,
    errorMsg: approveErrorMsg,
    refreshApprove,
  } = useNeedsApproved({ fromValue, trade })

  useEffect(() => {
    // clear msg/errorMsg when the other appeared so they wont shown up together at the same time
    errorMsg && setMsg(null)
  }, [errorMsg])

  useEffect(() => {
    msg && setErrorMsg(null)
  }, [msg])

  useEffect(() => {
    approveErrorMsg && setErrorMsg(approveErrorMsg)
  }, [approveErrorMsg])

  useEffect(() => {
    // fromToken changed => reset fromValue's value with value = 1
    if (fromToken instanceof Token) setFromValue(new TokenAmount(fromToken, new BN(10).pow(new BN(fromToken.decimals))))
    else setFromValue(CurrencyAmount.sol(new BN(10).pow(new BN(9))))
  }, [fromToken])

  useEffect(() => {
    // check if fromValue > balance => setFromValue(balance)
    if (balance && fromValue && balance.lessThan(fromValue)) {
      setFromValue(balance)
    }
  }, [fromValue, balance])

  useEffect(() => {
    if (!fromToken && !toToken && currencyList.length >= 2) {
      setFromToken(currencyList[0])
      setToToken(currencyList[1])
    }
  }, [currencyList, fromToken, toToken, publicKey])

  const enableSwap =
    toToken && fromToken && context && fromValue && publicKey && provider && selectedPool && router && !!trade

  useEffect(() => {
    setSelectedPool(null)
    setMsg(null)
    setErrorMsg(null)
    //reset selected pool right away there is any changing selected tokens
  }, [pools, fromToken, toToken])

  const toggleUseSOL = useCallback(() => {
    if (fromToken === SOL) setFromToken(WSOL)
    else if (fromToken === WSOL) setFromToken(SOL)
    else if (toToken === WSOL) setToToken(SOL)
    else if (toToken === WSOL) setToToken(SOL)

    setUseSOL((useSOL) => !useSOL)
  }, [fromToken, toToken])

  const [swapping, setSwapping] = useState(false)
  const doSwap = useCallback(() => {
    const swap = async () => {
      if (enableSwap) {
        try {
          // Call Router's method to construct a transaction
          const tx = await router.swap(publicKey, trade, {
            allowedSlippage: new Percent('1', '100'),
          })
          setSwapping(true)
          const txHash = await sendAndConfirmTransaction(provider, tx)
          setSwapping(false)
          console.log('txHash', txHash)
          setMsg(
            <span>
              Swap success, tx: <a href={scanTx(txHash)}>{shortenTx(txHash)}</a>
            </span>,
          )
          refreshApprove()
        } catch (e: any) {
          setSwapping(false)
          if (e?.message) setErrorMsg(e.message)
          else setErrorMsg(String(e))
        }
      } else {
        console.error('Cant swap yet')
      }
    }
    if (enableSwap) {
      swap()
    }
  }, [enableSwap, router, publicKey, trade, provider, refreshApprove])

  useEffect(() => {
    const calculateOut = async () => {
      // setToValue(Math.random())
      if (fromValue && fromToken && toToken && selectedPool) {
        setToValue(
          selectedPool?.getOutputAmount(
            fromToken === SOL ? new TokenAmount(WSOL, fromValue.raw) : (fromValue as TokenAmount),
          )[0],
        )
      } else setToValue(null)
    }
    calculateOut()
  }, [fromValue, fromToken, selectedPool, toToken])

  const onConnect: MouseEventHandler<HTMLButtonElement> = useCallback(() => setVisible(true), [setVisible])

  return (
    <SwapWrapper>
      <CenterText>
        <h5>SWAP</h5>
      </CenterText>
      <Form>
        <Form.Group className='mb-3'>
          <Form.Label>Swap:</Form.Label>
          <Row>
            <Col sm={8}>
              <Form.Control
                type='number'
                value={fromValue?.toExact()}
                onChange={(event) => {
                  if (!event.target.value) setFromValue(null)
                  if (fromToken) {
                    const newValue = tryConvertAmount(parseFloat(event.target.value || '0'), fromToken)
                    newValue && setFromValue(newValue)
                  }
                }}
              />
              <Form.Label>
                Balance:{' '}
                {!publicKey ? 'Please connect wallet' : balance instanceof CurrencyAmount ? balance.toExact() : '...'}
              </Form.Label>
            </Col>
            <Col sm={4}>
              <Form.Select
                onChange={(event) => {
                  let token: Currency | null
                  if (event.target.value === 'SOL') token = useSOL ? SOL : WSOL
                  else token = tokenList.find((token) => token.mint.toBase58() === event.target.value) ?? null

                  setFromToken(token)
                  if (token === toToken) setToToken(currencyList.filter((currency) => currency != toToken)[0])
                }}
                value={getAddressWithSOL(fromToken)}
              >
                <option style={{ display: 'none' }} />
                <option value='SOL'>{useSOL ? 'SOL' : 'WSOL'}</option>
                {tokenList.map((token) => (
                  <option key={token.mint.toBase58()} value={token.mint.toBase58()}>
                    {token.symbol}
                  </option>
                ))}
              </Form.Select>
              {isFromSOL ? (
                <a onClick={toggleUseSOL}>
                  <Form.Label>Use {useSOL ? 'WSOL' : 'SOL'}</Form.Label>
                </a>
              ) : null}
            </Col>
          </Row>
        </Form.Group>

        <Form.Group className='mb-3' controlId='formBasicPassword'>
          <Form.Label>For</Form.Label>
          <Row>
            <Col sm={8}>
              <Form.Control type='number' value={toValue?.toExact() ?? 0} readOnly />
            </Col>
            <Col sm={4}>
              <Form.Select
                onChange={(event) => {
                  let token: Currency | null
                  if (event.target.value === 'SOL') token = SOL
                  else token = tokenList.find((token) => token.mint.toBase58() === event.target.value) ?? null
                  setToToken(token)
                  if (token === fromToken) setFromToken(currencyList.filter((currency) => currency != fromToken)[0])
                }}
                value={getAddressWithSOL(toToken)}
              >
                <option style={{ display: 'none' }} />
                <option value='SOL'>SOL</option>
                {tokenList.map((token) => (
                  <option key={token.mint.toBase58()} value={token.mint.toBase58()}>
                    {token.symbol}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Form.Group>
      </Form>
      <Row>
        <Col>
          <Form.Label>Pools:</Form.Label>
          {!pools && <br />}
          {pools === null ? (
            <Form.Label>Pools not found</Form.Label>
          ) : pools === undefined ? (
            <Form.Label>Finding pools</Form.Label>
          ) : (
            fromValue &&
            pools.map((pool) => (
              <PoolOption pool={pool} key={pool.address.toBase58()} fromValue={fromValue} onSelect={setSelectedPool} />
            ))
          )}
        </Col>
      </Row>
      <Row>
        {!publicKey ? (
          <Col>
            <FullWidthButton variant='success' onClick={onConnect}>
              Connect Wallet
            </FullWidthButton>
          </Col>
        ) : (
          <>
            {needsApproved === null || needsApproved ? (
              <Col>
                <FullWidthButton
                  variant='success'
                  onClick={approve}
                  disabled={approving || !enableSwap || !needsApproved}
                >
                  {approving ? 'Approving ...' : 'Approve'}
                </FullWidthButton>
              </Col>
            ) : null}
            <Col>
              <FullWidthButton
                variant='success'
                onClick={doSwap}
                disabled={swapping || !enableSwap || needsApproved || needsApproved === null}
              >
                {swapping ? 'Swapping' : 'Swap'}
              </FullWidthButton>
            </Col>
          </>
        )}
      </Row>
      {msg ? msg : null}
      {errorMsg ? errorMsg : null}
    </SwapWrapper>
  )
}

export default Swap
