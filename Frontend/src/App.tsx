import { ChakraProvider, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import theme from "./theme";
import Layout from "./components/Layout";
import ConnectButton from "./components/ConnectButton";
import AccountModal from "./components/AccountModal";
import AccountPage2 from "./components/AccountPage2";
import AMMPage from "./components/AMMPage";
import tokens from "./constants/tokens";
import { Web3ReactProvider } from "@web3-react/core";
import "@fontsource/inter";

import { Web3Provider } from "@ethersproject/providers";
// @ts-ignore
const getLibrary = (provider: any, connector): Web3Provider => {  
  const library = new Web3Provider(provider, "any");
  library.pollingInterval = 15000;
  return library;
};

function App() {
  const [account, setAccount] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const accInfo = [
    {
      name: "Contract",
      address: "0x786d6b31860Da1589d60F2E5A1A4Fa72A5cCb627",
      tokens: [
        { name: "DAI", address: "0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD" },
        { name: "aDAI", address: "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8" }
      ]
    },
    {
      name: "User Wallet",
      address: "0xdf4DedE67d9A086ad7EDeC69886101bE8D2CEa35",
      tokens: [
        { name: "DAI", address: "0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD" },
        { name: "aDAI", address: "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8" },
        //{ name: "ETH" }
      ]
    }
  ]

  const pairs = [
    ["UNI", "COMP"],
    ["COMP", "UNI"],
    ["UNI", "DAI"],
    ["DAI", "UNI"],
    ["DAI", "COMP"],
    ["COMP", "DAI"],
  ]

  const params = [
    {
      name: "sigma",
      display: "σ"
    },
    {
      name: "eta",
      display: "η"
    }
  ]

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
    <ChakraProvider theme={theme}>
      <Layout>
        <ConnectButton handleOpenModal={onOpen} setAccount={setAccount} />
        <AccountModal isOpen={isOpen} onClose={onClose} />
        {/* <AccountPage accInfo={accInfo}/> */}
        {
          account ? (
            <div>
              <AccountPage2 account={account} tokens = {tokens} />
              <AMMPage account={account} tokens = {tokens} params = {params} pairs = {pairs}/>
            </div>
          ) : (<div />)
        }
        
      </Layout>
    </ChakraProvider>
    </Web3ReactProvider>
  );
}

export default App;
