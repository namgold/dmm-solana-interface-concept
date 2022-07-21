import React, { FC } from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'
import { Navigate, Route, Routes } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import Menu from '../components/Menu'
import styled from 'styled-components'
import Swap from './Swap'
import Pools from './Pools'
import AddPool from './AddPool'
import MyPools from './MyPools'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 2rem;
`

const App: FC = () => {
  return (
    <BrowserRouter>
      <AppWrapper>
        <Menu />
        <BodyWrapper>
          <Routes>
            <Route path='/swap' element={<Swap />}></Route>
            <Route path='/pools' element={<Pools />}></Route>
            <Route path='/pools/my' element={<MyPools />}></Route>
            <Route path='/pools/add' element={<AddPool />}></Route>
            <Route path='*' element={<Navigate to='swap' replace />} />
          </Routes>
        </BodyWrapper>
      </AppWrapper>
    </BrowserRouter>
  )
}

export default App
