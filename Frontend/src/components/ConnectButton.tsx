import { Button, Box, Text } from "@chakra-ui/react";
import { formatEther } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core"
import Identicon from "./Identicon";
import { useEffect, useState } from "react";

import { InjectedConnector } from '@web3-react/injected-connector'
import Web3 from "web3";

import { getEtherBalance } from '../connectors/connector'

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42],
})

type Props = {
  handleOpenModal: any;
  setAccount: any;
};

export default function ConnectButton({ handleOpenModal, setAccount }: Props) {
  const { active, account, library, connector, activate, deactivate } = useWeb3React()
  const web3 = new Web3(library?.provider);
  const [etherBalance, setEtherBalance] = useState("");

  useEffect(() => { setAccount(account); }, [account]);

  useEffect(() => {
    getEtherBalance(web3, account).then(val => setEtherBalance(val));
  }, [account])

  async function connect() {
    try {
      await activate(injected)
    } catch (ex) {
      console.log(ex)
    }
  }

  async function disconnect() {
    try {
      deactivate()
    } catch (ex) {
      console.log(ex)
    }
  }

  return account ? (
    <Box
      display="flex"
      alignItems="center"
      background="gray.700"
      borderRadius="xl"
      py="0"
    >
      <Box px="3">
        <Text color="white" fontSize="md">
          {etherBalance && parseFloat(formatEther(etherBalance)).toFixed(5)} ETH
        </Text>
      </Box>
      <Button
        onClick={handleOpenModal}
        bg="gray.800"
        border="1px solid transparent"
        _hover={{
          border: "1px",
          borderStyle: "solid",
          borderColor: "blue.400",
          backgroundColor: "gray.700",
        }}
        borderRadius="xl"
        m="1px"
        px={3}
        height="38px"
      >
        <Text color="white" fontSize="md" fontWeight="medium" mr="2">
          {account &&
            `${account.slice(0, 6)}...${account.slice(
              account.length - 4,
              account.length
            )}`}
        </Text>
        <Identicon />
      </Button>
    </Box>
  ): (
    <Button
      onClick={connect}
      bg="blue.800"
      color="blue.300"
      fontSize="lg"
      fontWeight="medium"
      borderRadius="xl"
      border="1px solid transparent"
      _hover={{
        borderColor: "blue.700",
        color: "blue.400",
      }}
      _active={{
        backgroundColor: "blue.800",
        borderColor: "blue.700",
      }}
    >
      Connect to a wallet
    </Button>
  );
}


