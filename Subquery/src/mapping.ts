import { PoolCreated as PoolCreatedEvent } from "../generated/NestedAMMFactory/NestedAMMFactory"
import { PoolCreated } from "../generated/schema"
import { NestedAMMPool } from "../generated/templates"

export function handlePoolCreated(event: PoolCreatedEvent): void {
  let entity = new PoolCreated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenA = event.params.tokenA
  entity.tokenB = event.params.tokenB
  entity.tokenY = event.params.tokenY
  entity.pool = event.params.pool
  entity.param4 = event.params.param4
  entity.timestamp = event.block.timestamp
  entity.sender = event.transaction.from

  NestedAMMPool.create(event.params.pool)

  entity.save()
}
