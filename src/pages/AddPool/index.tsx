import React, { FC, MouseEventHandler, useCallback, useEffect, useState } from 'react'
import { Currency, CurrencyAmount, FEE_BPS, FEE_OPTIONS, SOL, Token, TokenAmount, WSOL } from '@namgold/dmm-solana-sdk'
import styled from 'styled-components'

import { CenterText } from '../../components/Text/index'
import usePools from '../../hooks/usePools'
import { useCurrencyList, useTokenList } from '../../hooks/useTokenlist'
import { Col, Form, FormLabel, Row } from 'react-bootstrap'
import { getAddressWithSOL } from '../../utils'
import { useWallet } from '@solana/wallet-adapter-react'
import { tryConvertAmount } from '../../utils/number'
import { useBalance } from '../../hooks/useBalance'
import { BN } from 'bn.js'
import { FullWidthButton } from '../../components/Button'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

const Wrapper = styled.div`
  border: 1px solid white;
  padding: 2rem;
  border-radius: 1rem;
  display: grid;
  gap: 2rem;
  width: 550px;
`

const AddPool: FC = () => {
  const [currency1Value, setCurrency1Value] = useState<CurrencyAmount | null>(null)
  const [currency1, setCurrency1] = useState<Currency | null>(null)
  const [currency2Value, setCurrency2Value] = useState<CurrencyAmount | null>(null)
  const [currency2, setCurrency2] = useState<Currency | null>(null)
  const [useSOL, setUseSOL] = useState(true)
  const [ampInput, setAmpInput] = useState<string>('1')
  const amp = parseFloat(ampInput)

  const currency1Balance = useBalance(currency1)
  const currency2Balance = useBalance(currency2)
  const [fee, setFee] = useState<number>(FEE_OPTIONS[0])

  const { publicKey } = useWallet()

  const tokenList = useTokenList()
  const currencyList = useCurrencyList(useSOL)
  const pools = usePools(currency1, currency2)

  const isCurrency1SOL = currency1 === SOL || currency1 === WSOL
  const isCurrency2SOL = currency2 === SOL || currency2 === WSOL

  useEffect(() => {
    if (!currency1 && !currency2 && currencyList.length >= 2) {
      setCurrency1(currencyList[0])
      setCurrency2(currencyList[1])
    }
  }, [currencyList, currency1, currency2])

  useEffect(() => {
    // fromToken changed => reset fromValue's value with value = 1
    if (currency1 instanceof Token)
      setCurrency1Value(new TokenAmount(currency1, new BN(10).pow(new BN(currency1.decimals))))
    else setCurrency1Value(CurrencyAmount.sol(new BN(10).pow(new BN(9))))
  }, [currency1])

  useEffect(() => {
    // check if fromValue > balance => setFromValue(balance)
    if (currency1Balance && currency1Value && currency1Balance.lessThan(currency1Value)) {
      setCurrency1Value(currency1Balance)
    }
  }, [currency1Value, currency1Balance])

  useEffect(() => {
    // check if fromValue > balance => setFromValue(balance)
    if (currency2Balance && currency2Value && currency2Balance.lessThan(currency2Value)) {
      setCurrency2Value(currency2Balance)
    }
  }, [currency2Value, currency2Balance])

  const toggleUseSOL = useCallback(() => {
    if (currency1 === SOL) setCurrency1(WSOL)
    else if (currency1 === WSOL) setCurrency1(SOL)
    else if (currency2 === SOL) setCurrency2(WSOL)
    else if (currency2 === WSOL) setCurrency2(SOL)

    setUseSOL((useSOL) => !useSOL)
  }, [currency1, currency2])

  const enableCreate = currency1 && currency2 && currency1Value && currency2Value && publicKey && fee && amp
  const [creating, setCreating] = useState(false)
  const doCreate = useCallback(() => {
    setCreating(true)
    setTimeout(() => setCreating(false), 2000)
  }, [])

  const { setVisible } = useWalletModal()
  const onConnect: MouseEventHandler<HTMLButtonElement> = useCallback(() => setVisible(true), [setVisible])

  return (
    <Wrapper>
      <CenterText>
        <h5>CREATE POOL</h5>
      </CenterText>

      <Form>
        <FormLabel>Select Pair</FormLabel>
        <Row className='mb-2'>
          <Col sm={8}>
            <Form.Control
              type='number'
              value={currency1Value?.toExact()}
              onChange={(event) => {
                if (!event.target.value) setCurrency1Value(null)
                if (currency1) {
                  const newValue = tryConvertAmount(parseFloat(event.target.value || '0'), currency1)
                  newValue && setCurrency1Value(newValue)
                }
              }}
              autoComplete='chrome-off'
            />
            <Form.Label>
              Balance:{' '}
              {!publicKey
                ? 'Please connect wallet'
                : currency1Balance instanceof CurrencyAmount
                ? currency1Balance.toExact()
                : '...'}
            </Form.Label>
          </Col>
          <Col sm={4}>
            <Form.Select
              onChange={(event) => {
                let token: Currency | null
                if (event.target.value === 'SOL') token = useSOL ? SOL : WSOL
                else token = tokenList.find((token) => token.mint.toBase58() === event.target.value) ?? null

                setCurrency1(token)
                if (token === currency2) setCurrency2(currencyList.filter((currency) => currency != currency2)[0])
              }}
              value={getAddressWithSOL(currency1)}
            >
              <option style={{ display: 'none' }} />
              <option value='SOL'>{useSOL ? 'SOL' : 'WSOL'}</option>
              {tokenList.map((token) => (
                <option key={token.mint.toBase58()} value={token.mint.toBase58()}>
                  {token.symbol}
                </option>
              ))}
            </Form.Select>
            {isCurrency1SOL ? (
              <a onClick={toggleUseSOL}>
                <Form.Label>Use {useSOL ? 'WSOL' : 'SOL'}</Form.Label>
              </a>
            ) : null}
          </Col>
        </Row>
        <Row className='mb-2'>
          <Col sm={8}>
            <Form.Control
              type='number'
              value={currency2Value?.toExact() ?? 0}
              onChange={(event) => {
                if (!event.target.value) setCurrency2Value(null)
                if (currency2) {
                  const newValue = tryConvertAmount(parseFloat(event.target.value || '0'), currency2)
                  newValue && setCurrency2Value(newValue)
                }
              }}
              autoComplete='chrome-off'
            />
            <Form.Label>
              Balance:{' '}
              {!publicKey
                ? 'Please connect wallet'
                : currency2Balance instanceof CurrencyAmount
                ? currency2Balance.toExact()
                : '...'}
            </Form.Label>
          </Col>
          <Col sm={4}>
            <Form.Select
              onChange={(event) => {
                let token: Currency | null
                if (event.target.value === 'SOL') token = useSOL ? SOL : WSOL
                else token = tokenList.find((token) => token.mint.toBase58() === event.target.value) ?? null
                setCurrency2(token)
                if (token === currency1) setCurrency1(currencyList.filter((currency) => currency != currency1)[0])
              }}
              value={getAddressWithSOL(currency2)}
            >
              <option style={{ display: 'none' }} />
              <option value='SOL'>{useSOL ? 'SOL' : 'WSOL'}</option>
              {tokenList.map((token) => (
                <option key={token.mint.toBase58()} value={token.mint.toBase58()}>
                  {token.symbol}
                </option>
              ))}
            </Form.Select>
            {isCurrency2SOL ? (
              <a onClick={toggleUseSOL}>
                <Form.Label>Use {useSOL ? 'WSOL' : 'SOL'}</Form.Label>
              </a>
            ) : null}
          </Col>
        </Row>
        <hr />
        <Row className='mb-3'>
          <Col>
            <FormLabel>AMP</FormLabel>
            <Form.Control type='number' value={ampInput} onChange={(e) => setAmpInput(e.target.value || '1')} />
          </Col>
          <Col sm={4}>
            <FormLabel>Fee</FormLabel>

            <Form.Select onChange={(event) => setFee(parseInt(event.target.value) || FEE_OPTIONS[0])} value={fee}>
              {FEE_OPTIONS.map((fee) => (
                <option key={fee} value={fee}>
                  {(fee / FEE_BPS) * 100} %
                </option>
              ))}
            </Form.Select>
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
              <Col>
                <FullWidthButton variant='success' onClick={doCreate} disabled={creating || !enableCreate}>
                  {creating
                    ? '🚧 Under construction'
                    : // 'Creating Pool'
                      'Create Pool'}
                </FullWidthButton>
              </Col>
            </>
          )}
        </Row>
      </Form>
    </Wrapper>
  )
}

export default AddPool
