import {
    Approval as ApprovalEvent,
    Deposit as DepositEvent,
    Swap as SwapEvent,
    Transfer as TransferEvent,
    Withdraw as WithdrawEvent
  } from "../generated/templates/NestedAMMPool/NestedAMMPool"
  import {
    Approval,
    Deposit,
    Swap,
    Transfer,
    Withdraw
  } from "../generated/schema"
  
  export function handleApproval(event: ApprovalEvent): void {
    let entity = new Approval(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    entity.owner = event.params.owner
    entity.spender = event.params.spender
    entity.value = event.params.value
    entity.pool = event.address
    entity.timestamp = event.block.timestamp
    entity.save()
  }
  
  export function handleDeposit(event: DepositEvent): void {
    let entity = new Deposit(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    entity.amountA = event.params.amountA
    entity.amountB = event.params.amountB
    entity.amountY = event.params.amountY
    entity.muLast = event.params.muLast
    entity.pool = event.address
    entity.timestamp = event.block.timestamp
    entity.sender = event.transaction.from
    entity.save()
  }
  
  export function handleSwap(event: SwapEvent): void {
    let entity = new Swap(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    entity.amountIn = event.params.amountIn
    entity.amountOut = event.params.amountOut
    entity.tokenIn = event.params.tokenIn
    entity.tokenOut = event.params.tokenOut
    entity.sender = event.params.sender
    entity.pool = event.address
    entity.timestamp = event.block.timestamp
    entity.save()
  }
  
  export function handleTransfer(event: TransferEvent): void {
    let entity = new Transfer(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    entity.from = event.params.from
    entity.to = event.params.to
    entity.value = event.params.value
    entity.pool = event.address
    entity.timestamp = event.block.timestamp
    entity.gasUsed = event.transaction.gasUsed
    entity.gasPrice = event.transaction.gasPrice
    entity.save()
  }
  
  export function handleWithdraw(event: WithdrawEvent): void {
    let entity = new Withdraw(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    )
    entity.amountA = event.params.amountA
    entity.amountB = event.params.amountB
    entity.amountY = event.params.amountY
    entity.muLast = event.params.muLast
    entity.pool = event.address
    entity.timestamp = event.block.timestamp
    entity.sender = event.transaction.from
    entity.save()
  }
  