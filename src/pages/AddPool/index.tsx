import React, { FC } from 'react'
import styled from 'styled-components'
import { CenterText } from '../../components/Text/index'

const Wrapper = styled.div`
  border: 1px solid white;
  padding: 2rem;
  border-radius: 1rem;
  display: grid;
  gap: 2rem;
  width: 550px;
`

const AddPool: FC = () => {
  return (
    <Wrapper>
      <CenterText>
        <h5>ADD POOL</h5>
      </CenterText>
      <CenterText>🚧 Under construction</CenterText>
    </Wrapper>
  )
}

export default AddPool
