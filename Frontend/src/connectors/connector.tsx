import { disconnect } from 'process'
import { isConstructorDeclaration } from 'typescript'
import Web3 from 'web3'
import abis from '../abis/abis'
import AMMmetadata from '../abis/AMMmetadata'

const sigma = 0.2
const eta = 0.8

export async function getBalance(
  web3: Web3,
  tokenAddress: string,
  walletAddress: string,
) {
  if (!walletAddress || !(tokenAddress in abis)) return '0'

  let minABI: any = abis[tokenAddress]
  const contract = new web3.eth.Contract(minABI, tokenAddress)
  const result = await contract.methods.balanceOf(walletAddress).call() // 29803630997051883414242659
  const decimals = await contract.methods.decimals().call()
  const format = result / Math.pow(10, decimals)
  return format.toString()
}

export async function approve(
  web3: Web3,
  account: string,
  tokenAddress: string,
  amount: number,
) {
  if (!(tokenAddress in abis)) {
    console.log('Invalid address', tokenAddress)
    return false
  }

  let minABI: any = abis[tokenAddress]
  const contract = new web3.eth.Contract(minABI, tokenAddress)
  const decimals = await contract.methods.decimals().call()

  console.log(
    'contract.methods.approve(',
    AMMmetadata.address,
    BigInt(amount * Math.pow(10, decimals)),
    ') {from: ',
    account,
  )
  const approveResult = await contract.methods
    .approve(AMMmetadata.address, BigInt(amount * Math.pow(10, decimals)))
    .send({ from: account })
  console.log('approveResult = ', approveResult)

  console.log(
    'contract.methods.allowance(',
    account,
    ', ',
    AMMmetadata.address,
    ') = ',
    await contract.methods.allowance(account, AMMmetadata.address).call(),
  )

  return true
}

export function getBestPrice(web3: Web3, token1: string, token2: string) {
  const AMMcontract = new web3.eth.Contract(
    AMMmetadata.abi,
    AMMmetadata.address,
  )
  return 1
}

export function getExPrice(
  web3: Web3,
  token1: string,
  token2: string,
  amount: number,
) {
  const AMMcontract = new web3.eth.Contract(
    AMMmetadata.abi,
    AMMmetadata.address,
  )
  return [1, '9.2%']
}

export async function getTokenAmount(web3: Web3, token: string) {
  console.log('AMMcontract.methods.getBalance(', token, ').call()')
  const AMMcontract = new web3.eth.Contract(
    AMMmetadata.abi,
    AMMmetadata.address,
  )
  const balance = await AMMcontract.methods.getBalance(token).call()
  let minABI: any = abis[token]
  const contract = new web3.eth.Contract(minABI, token)
  const decimals = await contract.methods.decimals().call()
  console.log('after getBalance ', balance, decimals)
  return parseFloat(balance) / Math.pow(10, decimals)
}

export function getParamValue(web3: Web3, paramName: string) {
  if (paramName === 'sigma') return 0.2
  if (paramName === 'eta') return 0.8
  return 0
}

export async function deposit(
  web3: Web3,
  account: string,
  token: string,
  amount: number,
) {
  const AMMcontract = new web3.eth.Contract(
    AMMmetadata.abi,
    AMMmetadata.address,
  )

  let minABI: any = abis[token]
  const contract = new web3.eth.Contract(minABI, token)
  const decimals = await contract.methods.decimals().call()
  console.log(
    'AMMcontract.methods.deposit(',
    token,
    BigInt(amount * Math.pow(10, decimals)),
    ') {from: ',
    account,
  )
  await AMMcontract.methods
    .deposit(token, BigInt(amount * Math.pow(10, decimals)))
    .send({ from: account })
}

export async function convert(
  web3: Web3,
  account: string,
  token1: string,
  token2: string,
  amount: number,
) {
  const AMMcontract = new web3.eth.Contract(
    AMMmetadata.abi,
    AMMmetadata.address,
  )
  let minABI: any = abis[token2]
  const contract2 = new web3.eth.Contract(minABI, token2)
  const decimals = await contract2.methods.decimals().call()
  console.log(
    'AMMcontract.methods.swap(',
    BigInt(amount * Math.pow(10, decimals)),
    token1,
    token2,
    ') {from: ',
    account,
  )
  const executeAmount = await AMMcontract.methods
    .swap(BigInt(amount * Math.pow(10, decimals)), token1, token2)
    .send({ from: account })
  console.log('executeAmount = ', executeAmount)
  return executeAmount / Math.pow(10, decimals)
}

export function getContractAddress() {
  return AMMmetadata.address
}

export async function getEtherBalance(web3: Web3, address: any) {
  if (address) return await web3.eth.getBalance(address)
  return '0'
}
