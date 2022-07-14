import React, { FC, useState } from 'react'
import { Form } from 'react-bootstrap'
import styled from 'styled-components'

import { SendLamport } from '../../components/SendLamport'

const SendWrapper = styled.div`
  border: 1px solid white;
  padding: 2rem;
  border-radius: 1rem;
  display: grid;
  gap: 2rem;
  width: 550px;
`

const Send: FC = () => {
  const [toAddress, setToAddress] = useState<string>('HdTPmcFS3GTT2LqyRf1VRVoAKxhBiiiXWy11P3gnP5zr')
  const [value, setValue] = useState<number>(1)

  return (
    <SendWrapper>
      <h5>SEND SOL THROUGH CONNECTED WALLET</h5>
      <Form>
        <Form.Group className='mb-3'>
          <Form.Label>To address</Form.Label>
          <Form.Control
            type='text'
            placeholder='To address'
            value={toAddress}
            onChange={(event) => setToAddress(event.target.value)}
          />
          <Form.Text className='text-muted'>Address you gonna send SOL to</Form.Text>
        </Form.Group>

        <Form.Group className='mb-3' controlId='formBasicPassword'>
          <Form.Label>Lamport Value</Form.Label>
          <Form.Control
            type='number'
            placeholder='To address'
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
          />
          {value ? <Form.Text className='text-muted'>= {value / 10 ** 9} SOL</Form.Text> : null}
          <br />
          <Form.Text className='text-muted'>1 SOL = 1.000.000.000 Lamports</Form.Text>
        </Form.Group>
        <SendLamport address={toAddress} value={value} />
      </Form>
    </SendWrapper>
  )
}

export default Send
