import React, { FC } from 'react'
import styled from 'styled-components'

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
      <h5>ADD POOL</h5>
      🚧 Under construction
    </Wrapper>
  )
}

export default AddPool