import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  Input,
} from '@chakra-ui/react'
import {
  getBestPrice,
  getParamValue,
  getExPrice,
  getTokenAmount,
  convert,
  getContractAddress,
} from '../connectors/connector'
import { thisExpression } from '@babel/types'
import { useWeb3React } from '@web3-react/core'
import Web3 from 'web3'
import tokens from '../constants/tokens'

type Props = {
  account: string
  tokens: any[]
  params: any[]
  pairs: any[]
}

export default function AMMPage(props: Props) {
  const { library } = useWeb3React()
  const web3 = new Web3(library?.provider)

  const [activePair, setActivePair] = useState(['', ''])
  const [buyAmount, setBuyAmount] = useState('0')

  const onClickConvert = async () => {
    await convert(
      web3,
      props.account,
      getTokenAddress(activePair[0]),
      getTokenAddress(activePair[1]),
      parseFloat(buyAmount),
    )
  }

  const getTokenAddress = (tokenName: string) => {
    for (let i = 0; i < props.tokens.length; i++) {
      if (props.tokens[i].name === tokenName) return props.tokens[i].address
    }
    return null
  }

  const handleChangeAmount = (event: any) => {
    setBuyAmount(event.target.value)
  }

  const TokenAmount = (prop: any) => {
    const [balance, setBalance] = useState(0)
    useEffect(() => {
      getTokenAmount(web3, prop.tokenInfo.address).then((val) =>
        setBalance(val),
      )
    }, [])

    return (
      <Text color="gray.500">
        {prop.tokenInfo.name} {balance.toFixed(5)}
      </Text>
    )
  }

  const ParamBox = (prop: any) => {
    return (
      <Text color="gray.500">
        {prop.paramInfo.display} {getParamValue(web3, prop.paramInfo.name)}
      </Text>
    )
  }

  const PairBtn = (prop: any) => {
    return (
      <Box float="right" marginLeft="10px">
        <Button
          onClick={() => setActivePair([prop.token1, prop.token2])}
          bgColor={
            activePair[0] === prop.token1 && activePair[1] === prop.token2
              ? 'red'
              : 'white'
          }
        >
          {prop.token1} {'->'} {prop.token2}
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Text color="gray.500">contract address: {getContractAddress()}</Text>
      <Box float="inherit">
        {props.tokens.map((tokenInfo) => (
          <TokenAmount tokenInfo={tokenInfo} />
        ))}
      </Box>
      <Box float="inherit">
        {props.params.map((paramInfo) => (
          <ParamBox paramInfo={paramInfo} />
        ))}
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        marginTop="4"
        marginBottom="4"
      >
        <Button onClick={onClickConvert}>Swap</Button>
        <Box>
          {props.pairs.map((pair) => (
            <PairBtn token1={pair[0]} token2={pair[1]} />
          ))}
        </Box>
      </Box>
      <Input
        placeholder="0"
        value={buyAmount}
        onChange={handleChangeAmount}
        color="white"
        type="number"
      />
    </Box>
  )
}
