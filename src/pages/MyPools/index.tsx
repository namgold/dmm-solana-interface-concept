import React, { FC } from 'react'
import styled from 'styled-components'
import { CenterText } from '../../components/Text'

const Wrapper = styled.div`
  border: 1px solid white;
  padding: 2rem;
  border-radius: 1rem;
  display: grid;
  gap: 2rem;
  width: 550px;
`

const MyPools: FC = () => {
  return (
    <Wrapper>
      <CenterText>
        <h5>MY POOLS</h5>
      </CenterText>
      <CenterText>🚧 Under construction</CenterText>
    </Wrapper>
  )
}

export default MyPools
