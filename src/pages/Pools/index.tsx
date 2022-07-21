import { Currency, SOL } from '@namgold/dmm-solana-sdk'
import React, { FC, useEffect, useState } from 'react'
import { Col, Form, FormLabel, Row } from 'react-bootstrap'
import styled from 'styled-components'

import { useCurrencyList, useTokenList } from '../../hooks/useTokenlist'
import { getAddress } from '../../utils'
import PoolsList from '../../components/PoolsList'
import usePools from '../../hooks/usePools'

const SendWrapper = styled.div`
  border: 1px solid white;
  padding: 2rem;
  border-radius: 1rem;
  display: grid;
  gap: 2rem;
  // width: 550px;
`

const Pools: FC = () => {
  const [fromToken, setFromToken] = useState<Currency | null>(null)
  const [toToken, setToToken] = useState<Currency | null>(null)

  const tokenList = useTokenList()
  const currencyList = useCurrencyList()
  const pools = usePools(fromToken, toToken)

  useEffect(() => {
    if (!fromToken && !toToken && currencyList.length >= 2) {
      setFromToken(currencyList[0])
      setToToken(currencyList[1])
    }
  }, [currencyList, fromToken, toToken])

  return (
    <SendWrapper>
      <h5>Pools</h5>
      <Row>
        <Col sm={{ span: 10, offset: 2 }}>
          <FormLabel>Select Pair</FormLabel>
        </Col>
        <Col sm={{ span: 4, offset: 2 }}>
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
      <Row>
        <PoolsList pools={pools} />
      </Row>
    </SendWrapper>
  )
}

export default Pools
