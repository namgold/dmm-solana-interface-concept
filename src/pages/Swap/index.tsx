import React, { FC, useCallback, useEffect, useState } from 'react'
import {
  Currency,
  CurrencyAmount,
  Fetcher,
  Percent,
  Pool,
  Route,
  Router,
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
import { shortenAddress } from '../../utils/address'
import { scanAddress } from '../../utils/solscan'

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
  const amountOut = pool.getOutputAmount(
    fromValue instanceof TokenAmount ? fromValue : new TokenAmount(WSOL, fromValue.raw),
  )
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
          {'\nAmp: ' + pool.amp.toNumber() + '\nAmount out: ' + amountOut[0].toExact()}
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
  const enableSwap = toToken && fromToken && context && fromValue && publicKey && provider && selectedPool

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
    console.groupEnd()
  }, [enableSwap, fromToken, toToken, context, fromValue, publicKey, provider, selectedPool])

  useEffect(() => {
    setSelectedPool(null)
    //reset selected pool right away there is any changing selected tokens
  }, [pools, fromToken, toToken])

  const doSwap = useCallback(() => {
    console.log(`Swapping ${fromValue?.toExact()} ${fromToken?.name} for ${toValue?.toExact()} ${toToken?.name}`)
    const swap = async () => {
      if (enableSwap) {
        let trade: Trade
        if (fromToken === SOL) trade = Trade.exactIn(new Route([selectedPool], WSOL, toToken), fromValue)
        else if (toToken === SOL) trade = Trade.exactIn(new Route([selectedPool], fromToken, WSOL), fromValue)
        else trade = Trade.exactIn(new Route([selectedPool], fromToken, toToken), fromValue)

        const router = new Router(context)
        // Call Router's method to construct a transaction
        const tx = await router.swap(publicKey, trade, {
          allowedSlippage: new Percent('1', '100'),
        })
        const txHash = await sendAndConfirmTransaction(provider, tx)
        console.log('txHash', txHash)
      } else {
        console.error('Cant swap yet')
      }
    }
    swap()
  }, [fromValue, fromToken, toValue, toToken, enableSwap, context, selectedPool, publicKey, provider])

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

  // todo namgold:
  // - lấy list token từ tokenlist, info có sẵn
  // - show list đó lên select
  // - số max query theo sau list đó ??? buồn ngủ vl r
  // - khi swap, thêm 1 bước tạo ví nếu chưa có

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
                  if (fromToken) setFromValue(convertAmount(parseFloat(event.target.value), fromToken))
                }}
              />
            </Col>
            <Col sm={4}>
              <Form.Select
                onChange={(event) => {
                  let token: Currency | null
                  if (event.target.value === 'SOL') token = SOL
                  else token = tokenList.find((token) => String(token.mint) === event.target.value) ?? null

                  setFromToken(token)
                  if (token === toToken) setToToken(currencyList.filter((currency) => currency != toToken)[0])
                }}
                value={fromToken ? getAddress(fromToken) : 'SOL'}
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
            <Form.Label>Balance: {balance instanceof CurrencyAmount ? balance.toExact() : '...'}</Form.Label>
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
      Pools:
      <div>
        {pools === null
          ? 'Pools not found'
          : pools === undefined
          ? 'Loading pools'
          : fromValue &&
            pools.map((pool) => (
              <PoolOption pool={pool} key={String(pool.address)} fromValue={fromValue} onSelect={setSelectedPool} />
            ))}
      </div>
      <Button variant='success' onClick={doSwap} disabled={!enableSwap}>
        Swap
      </Button>
    </SwapWrapper>
  )
}

export default Swap
