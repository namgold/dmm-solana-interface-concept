import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import React from 'react'
import { Container, Navbar } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import LogoDark from '../../assets/logo-dark.svg'
import styled from 'styled-components'

const IconImage = styled.img`
  width: 140px;
  margin-top: 1px;
`
const Menu = () => {
  return (
    <Navbar bg='dark' variant='dark' fixed='top'>
      <Container>
        <Link to='/'>
          <IconImage src={LogoDark} alt='logo' />
        </Link>

        <NavLink to='/swap' className='nav-link'>
          Swap
        </NavLink>
        <NavLink to='/send' className='nav-link'>
          Send
        </NavLink>
        <WalletMultiButton />
      </Container>
    </Navbar>
  )
}

export default Menu
