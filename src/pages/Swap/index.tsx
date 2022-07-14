import React, { FC, useCallback, useEffect, useState } from 'react'
import {
  approveTokenForRouter,
  Currency,
  CurrencyAmount,
  Percent,
  Pool,
  Route,
  sendAndConfirmTransaction,
  SOL,
  Token,
  TokenAmount,
  Trade,
  WSOL,
} from '@namgold/dmm-solana-sdk'
import { useWallet } from '@solana/wallet-adapter-react'
import { BN } from '@project-serum/anchor'
import { Button, Col, Form, Row } from 'react-bootstrap'
import styled from 'styled-components'

import { useBalance } from '../../hooks/useBalance'
import { useCurrencyList, useTokenList } from '../../hooks/useTokenlist'
import { convertAmount } from '../../utils/number'
import useContext from '../../hooks/useContext'
import useProvider from '../../hooks/useProvider'
import usePools from '../../hooks/usePools'
import { scanAddress, scanTx } from '../../utils/solscan'
import useRouter from './hooks/useRouter'
import useTrade from './hooks/useTrade'
import { isNotSOL } from '../../utils/isSOL'
import { shortenTx } from '../../utils/address'

const FullWidthButton = styled(Button)`
  width: 100%;
`

const SwapWrapper = styled.div`
  border: 1px solid white;
  padding: 2rem;
  border-radius: 1rem;
  display: grid;
  gap: 2rem;
  width: 650px;
`

const getAddress = (token: Token | Currency): string => {
  return token instanceof Token ? String(token.mint) : 'SOL'
}

const PoolOption = ({
  pool,
  fromValue,
  onSelect,
}: {
  pool: Pool
  fromValue: CurrencyAmount
  onSelect: React.Dispatch<React.SetStateAction<Pool | null>>
}) => {
  let amountOut
  try {
    amountOut = pool.getOutputAmount(
      fromValue instanceof TokenAmount ? fromValue : new TokenAmount(WSOL, fromValue.raw),
    )
  } catch (e) {}
  return (
    <Form.Check
      key={String(pool.address)}
      type='radio'
      id={String(pool.address)}
      onClick={() => onSelect(pool)}
      label={
        <span style={{ whiteSpace: 'pre-line' }}>
          Address:&nbsp;
          <a target='_blank' rel='noopener noreferrer' href={scanAddress(String(pool.address))}>
            {String(pool.address)}
          </a>
          {'\nAmp: ' + pool.amp.toNumber() + '\nAmount out: ' + (amountOut?.[0].toExact() ?? 0)}
        </span>
      }
    />
  )
}

const Swap: FC = () => {
  const { publicKey } = useWallet()
  const [fromValue, setFromValue] = useState<CurrencyAmount | null>(null)
  const [fromToken, setFromToken] = useState<Currency | null>(null)
  const [toValue, setToValue] = useState<CurrencyAmount | null>(null)
  const [toToken, setToToken] = useState<Currency | null>(null)

  const balance = useBalance(fromToken)

  const tokenList = useTokenList()
  const currencyList = useCurrencyList()
  const context = useContext()
  const provider = useProvider()
  const pools = usePools(fromToken, toToken)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const router = useRouter()
  const trade = useTrade({ fromToken, toToken, fromValue, selectedPool })
  const [msg, setMsg] = useState<string | null | JSX.Element>(null)
  const [errorMsg, setErrorMsg] = useState<string | null | JSX.Element>(null)
  const [approved, setApproved] = useState(false)
  const [useSOL, setUseSOL] = useState(true)
  const isFromSOL = fromToken === SOL || fromToken === WSOL

  useEffect(() => {
    // fromToken changed => reset fromValue's value
    if (fromToken instanceof Token) setFromValue(new TokenAmount(fromToken, new BN(10 ** fromToken.decimals)))
    else setFromValue(CurrencyAmount.sol(new BN(10 ** 9)))
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
    toToken && fromToken && context && fromValue && publicKey && provider && selectedPool && router && trade

  useEffect(() => {
    //debug purpose only
    console.groupCollapsed('enableSwap debug info')
    console.log('enableSwap: ', !!enableSwap)
    console.log('enableSwap', !!enableSwap)
    console.log('fromToken', !!fromToken)
    console.log('toToken', !!toToken)
    console.log('context', !!context)
    console.log('fromValue', !!fromValue)
    console.log('publicKey', !!publicKey)
    console.log('provider', !!provider)
    console.log('selectedPool', !!selectedPool)
    console.log('router', !!router)
    console.log('trade', !!trade)
    console.groupEnd()
  }, [enableSwap, fromToken, toToken, context, fromValue, publicKey, provider, selectedPool, router, trade])

  useEffect(() => {
    setSelectedPool(null)
    setApproved(false)
    setMsg(null)
    setErrorMsg(null)
    //reset selected pool right away there is any changing selected tokens
  }, [pools, fromToken, toToken])

  const doSwap = useCallback(() => {
    console.log(`Swapping ${fromValue?.toExact()} ${fromToken?.name} for ${toValue?.toExact()} ${toToken?.name}`)
    const swap = async () => {
      if (enableSwap) {
        // Call Router's method to construct a transaction
        const tx = await router.swap(publicKey, trade, {
          allowedSlippage: new Percent('1', '100'),
        })
        const txHash = await sendAndConfirmTransaction(provider, tx)
        console.log('txHash', txHash)
        setMsg(
          <span>
            Swap success, tx: <a href={scanTx(txHash)}>{shortenTx(txHash)}</a>
          </span>,
        )
      } else {
        console.error('Cant swap yet')
      }
    }
    swap()
  }, [fromValue, fromToken?.name, toValue, toToken?.name, enableSwap, router, publicKey, trade, provider])

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

  const doApprove = useCallback(() => {
    const approve = async () => {
      if (enableSwap) {
        try {
          const allowedSlippage = new Percent('2', '100')

          await approveTokenForRouter(
            router,
            isNotSOL(fromToken) ? fromToken.mint : WSOL.mint,
            publicKey,
            trade.maximumAmountIn(allowedSlippage).raw,
          )
          debugger
          setApproved(true)
          setMsg('Approved')
        } catch (e) {
          setErrorMsg(String(e))
        }
      }
    }
    approve()
  }, [enableSwap, fromToken, publicKey, router, trade])

  return (
    <SwapWrapper>
      <h5>SWAP</h5>
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
                  if (fromToken) setFromValue(convertAmount(parseFloat(event.target.value || '0'), fromToken))
                }}
              />
              <Form.Label>Balance: {balance instanceof CurrencyAmount ? balance.toExact() : '...'}</Form.Label>
            </Col>
            <Col sm={4}>
              <Form.Select
                onChange={(event) => {
                  let token: Currency | null
                  if (event.target.value === 'SOL') token = useSOL ? SOL : WSOL
                  else token = tokenList.find((token) => String(token.mint) === event.target.value) ?? null

                  setFromToken(token)
                  if (token === toToken) setToToken(currencyList.filter((currency) => currency != toToken)[0])
                }}
                value={fromToken ? getAddress(fromToken) : 'SOL'}
              >
                <option style={{ display: 'none' }} />
                <option value='SOL'>{useSOL ? 'SOL' : 'WSOL'}</option>
                {tokenList.map((token) => (
                  <option key={String(token.mint)} value={String(token.mint)}>
                    {token.symbol}
                  </option>
                ))}
              </Form.Select>
              {isFromSOL ? (
                <a onClick={() => setUseSOL((useSOL) => !useSOL)}>
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
                  else token = tokenList.find((token) => String(token.mint) === event.target.value) ?? null
                  setToToken(token)
                  if (token === fromToken) setFromToken(currencyList.filter((currency) => currency != fromToken)[0])
                }}
                value={toToken ? getAddress(toToken) : 'SOL'}
              >
                <option style={{ display: 'none' }} />
                <option value='SOL'>SOL</option>
                {tokenList.map((token) => (
                  <option key={String(token.mint)} value={String(token.mint)}>
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
              <PoolOption pool={pool} key={String(pool.address)} fromValue={fromValue} onSelect={setSelectedPool} />
            ))
          )}
        </Col>
      </Row>
      <Row>
        {isFromSOL ? null : (
          <Col>
            <FullWidthButton variant='success' onClick={doApprove} disabled={!enableSwap}>
              Approve
            </FullWidthButton>
          </Col>
        )}
        <Col>
          <FullWidthButton variant='success' onClick={doSwap} disabled={!enableSwap || !(approved || useSOL)}>
            Swap
          </FullWidthButton>
        </Col>
      </Row>
      {msg ? msg : null}
      {errorMsg ? errorMsg : null}
    </SwapWrapper>
  )
}

export default Swap
