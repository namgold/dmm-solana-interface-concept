import React, { useMemo } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { AMPLIFICATION_FACTOR_BPS, FEE_BPS, Pool } from '@namgold/dmm-solana-sdk'
import { shortenAddress } from '../../utils/address'
import { scanAddress } from '../../utils/solscan'

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.border};
`

const DashGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 0.5fr 1fr 1fr 1fr 1.5fr 1.5fr;
  grid-template-areas: 'name amp address fees balance0 balance1';
  padding: 0;

  > * {
    justify-content: flex-end;

    :first-child {
      justify-content: flex-start;
      text-align: left;
    }

    &:nth-child(2) {
      justify-content: center;
    }
  }
`

const TableHeader = styled(DashGrid)`
  background: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  padding: 20px;
  line-height: 20px;
`

const ListWrapper = styled.div``

const DataText = styled(Flex)`
  align-items: center;
  text-align: center;
  color: ${({ theme }) => theme.text1};

  & > * {
    font-size: 14px;
  }
`

const FIELDS = {
  NAME: 'name',
  FEES: 'fees',
  ADDRESS: 'address',
  AMP: 'amp',
  BALANCE_0: 'balance_0',
  BALANCE_1: 'balance_1',
}

const MAP_SHOW_DATA = (pool: Pool) => {
  return {
    [FIELDS.NAME]: 'name',
    [FIELDS.AMP]: pool.amp.toNumber() / AMPLIFICATION_FACTOR_BPS,
    [FIELDS.ADDRESS]: shortenAddress(pool.address.toBase58()),
    [FIELDS.FEES]: pool.fee.toNumber() / FEE_BPS,
    [FIELDS.BALANCE_0]: pool.reserve0.toFixed(2) + ' ' + pool.token0.symbol,
    [FIELDS.BALANCE_1]: pool.reserve1.toFixed(2) + ' ' + pool.token1.symbol,
  }
}

const ListItem = ({ pool, index }: { pool: Pool; index: number }) => {
  const showData = MAP_SHOW_DATA(pool)
  return (
    <DashGrid style={{ height: '56px' }}>
      <DataText grid-area='name' fontWeight='500'>
        {index + 1}
      </DataText>
      <DataText grid-area='address'>
        <a target='_blank' rel='noopener noreferrer' href={scanAddress(pool.address.toBase58())}>
          {showData[FIELDS.ADDRESS]} ↗
        </a>
      </DataText>
      <DataText grid-area='amp'>{showData[FIELDS.AMP]}</DataText>
      <DataText grid-area='fees'>{showData[FIELDS.FEES]}</DataText>
      <DataText grid-area='balance0'>{showData[FIELDS.BALANCE_0]}</DataText>
      <DataText grid-area='balance1'>{showData[FIELDS.BALANCE_1]}</DataText>
    </DashGrid>
  )
}
function PoolsList({ pools }: { pools: Pool[] | null | undefined }) {
  const pairList = useMemo(
    () =>
      pools?.map((pool, index) => {
        return (
          <div key={pool.address.toBase58()} style={{ padding: '0 20px' }}>
            <ListItem pool={pool} index={index} />
            <Divider />
          </div>
        )
      }),
    [pools],
  )

  return (
    <ListWrapper>
      <TableHeader style={{ height: 'fit-content' }}>
        <Flex alignItems='center' justifyContent='flexStart'>
          <Text grid-area='name'>No.</Text>
        </Flex>
        <Flex alignItems='center'>
          <Text grid-area='address'>ADDRESS</Text>
        </Flex>
        <Flex alignItems='center' justifyContent='flexEnd'>
          <Text grid-area='amp'>AMP</Text>
        </Flex>
        <Flex alignItems='center'>
          <Text grid-area='fees'>FEES</Text>
        </Flex>
        <Flex alignItems='center'>
          <Text grid-area='balance0'>BALANCE</Text>
        </Flex>
        <Flex alignItems='center'>
          <Text grid-area='balance1'>BALANCE</Text>
        </Flex>
      </TableHeader>
      <Divider />
      {pairList?.length ? <List p={0}>{pairList}</List> : null}
    </ListWrapper>
  )
}

export default PoolsList
