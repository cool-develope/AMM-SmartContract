import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useEtherBalance } from '@usedapp/core'
import { formatEther } from '@ethersproject/units'
import { Button, Input } from '@chakra-ui/react'
import { approve, getBalance, deposit } from '../connectors/connector'
import { useWeb3React } from '@web3-react/core'
import Web3 from 'web3'

const Text = styled.div({
  boxSizing: 'border-box',
  minWidth: 0,
  color: 'white',
})

const Box = styled.div({
  boxSizing: 'border-box',
  minWidth: 0,
  color: 'white',
  float: 'left',
  margin: '10px',
})

type Props = {
  account: any
  tokens: any[]
}

export default function AccountPage2({ account, tokens }: Props) {
  const { library } = useWeb3React()
  const web3 = new Web3(library?.provider)

  const [approveAmount, setApproveAmount] = useState('0')
  const etherBalance = useEtherBalance(account)

  const handleChangeAmount = (event: any) =>
    setApproveAmount(event.target.value)

  const TokenBalance = (prop: any) => {
    const [balance, setBalance] = useState<any>()

    useEffect(() => {
      getBalance(web3, prop.token.address, account).then((val) =>
        setBalance(parseFloat(val).toFixed(5)),
      )
    }, [])

    const onClickApprove = () => {
      approve(web3, account, prop.token.address, parseFloat(approveAmount))
    }

    const onClickDeposit = () => {
      deposit(web3, account, prop.token.address, parseFloat(approveAmount))
    }

    return (
      <Box>
        <Text>
          {prop.token.name} {balance}
        </Text>
        <Button color="blue.200" onClick={onClickApprove} marginLeft="10px">
          Approve
        </Button>
        <Button color="blue.200" onClick={onClickDeposit} marginLeft="10px">
          Deposit
        </Button>
      </Box>
    )
  }
  return (
    <Box>
      <Text>address = {account}</Text>
      Amount:{' '}
      <Input
        placeholder="0"
        value={approveAmount}
        onChange={handleChangeAmount}
        type="number"
      />
      {tokens.map((token) => (
        <TokenBalance token={token} />
      ))}
    </Box>
  )
}
