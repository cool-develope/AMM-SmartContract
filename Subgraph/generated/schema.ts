// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class PoolCreated extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save PoolCreated entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save PoolCreated entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("PoolCreated", id.toString(), this);
  }

  static load(id: string): PoolCreated | null {
    return store.get("PoolCreated", id) as PoolCreated | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get tokenA(): Bytes {
    let value = this.get("tokenA");
    return value.toBytes();
  }

  set tokenA(value: Bytes) {
    this.set("tokenA", Value.fromBytes(value));
  }

  get tokenB(): Bytes {
    let value = this.get("tokenB");
    return value.toBytes();
  }

  set tokenB(value: Bytes) {
    this.set("tokenB", Value.fromBytes(value));
  }

  get tokenY(): Bytes {
    let value = this.get("tokenY");
    return value.toBytes();
  }

  set tokenY(value: Bytes) {
    this.set("tokenY", Value.fromBytes(value));
  }

  get pool(): Bytes {
    let value = this.get("pool");
    return value.toBytes();
  }

  set pool(value: Bytes) {
    this.set("pool", Value.fromBytes(value));
  }

  get param4(): BigInt {
    let value = this.get("param4");
    return value.toBigInt();
  }

  set param4(value: BigInt) {
    this.set("param4", Value.fromBigInt(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get sender(): Bytes {
    let value = this.get("sender");
    return value.toBytes();
  }

  set sender(value: Bytes) {
    this.set("sender", Value.fromBytes(value));
  }
}

export class Approval extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Approval entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Approval entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Approval", id.toString(), this);
  }

  static load(id: string): Approval | null {
    return store.get("Approval", id) as Approval | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get owner(): Bytes {
    let value = this.get("owner");
    return value.toBytes();
  }

  set owner(value: Bytes) {
    this.set("owner", Value.fromBytes(value));
  }

  get spender(): Bytes {
    let value = this.get("spender");
    return value.toBytes();
  }

  set spender(value: Bytes) {
    this.set("spender", Value.fromBytes(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }

  get pool(): Bytes {
    let value = this.get("pool");
    return value.toBytes();
  }

  set pool(value: Bytes) {
    this.set("pool", Value.fromBytes(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }
}

export class Deposit extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Deposit entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Deposit entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Deposit", id.toString(), this);
  }

  static load(id: string): Deposit | null {
    return store.get("Deposit", id) as Deposit | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get amountA(): BigInt {
    let value = this.get("amountA");
    return value.toBigInt();
  }

  set amountA(value: BigInt) {
    this.set("amountA", Value.fromBigInt(value));
  }

  get amountB(): BigInt {
    let value = this.get("amountB");
    return value.toBigInt();
  }

  set amountB(value: BigInt) {
    this.set("amountB", Value.fromBigInt(value));
  }

  get amountY(): BigInt {
    let value = this.get("amountY");
    return value.toBigInt();
  }

  set amountY(value: BigInt) {
    this.set("amountY", Value.fromBigInt(value));
  }

  get muLast(): BigInt {
    let value = this.get("muLast");
    return value.toBigInt();
  }

  set muLast(value: BigInt) {
    this.set("muLast", Value.fromBigInt(value));
  }

  get pool(): Bytes {
    let value = this.get("pool");
    return value.toBytes();
  }

  set pool(value: Bytes) {
    this.set("pool", Value.fromBytes(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get sender(): Bytes {
    let value = this.get("sender");
    return value.toBytes();
  }

  set sender(value: Bytes) {
    this.set("sender", Value.fromBytes(value));
  }
}

export class Swap extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Swap entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Swap entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Swap", id.toString(), this);
  }

  static load(id: string): Swap | null {
    return store.get("Swap", id) as Swap | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get amountIn(): BigInt {
    let value = this.get("amountIn");
    return value.toBigInt();
  }

  set amountIn(value: BigInt) {
    this.set("amountIn", Value.fromBigInt(value));
  }

  get amountOut(): BigInt {
    let value = this.get("amountOut");
    return value.toBigInt();
  }

  set amountOut(value: BigInt) {
    this.set("amountOut", Value.fromBigInt(value));
  }

  get tokenIn(): Bytes {
    let value = this.get("tokenIn");
    return value.toBytes();
  }

  set tokenIn(value: Bytes) {
    this.set("tokenIn", Value.fromBytes(value));
  }

  get tokenOut(): Bytes {
    let value = this.get("tokenOut");
    return value.toBytes();
  }

  set tokenOut(value: Bytes) {
    this.set("tokenOut", Value.fromBytes(value));
  }

  get sender(): Bytes {
    let value = this.get("sender");
    return value.toBytes();
  }

  set sender(value: Bytes) {
    this.set("sender", Value.fromBytes(value));
  }

  get pool(): Bytes {
    let value = this.get("pool");
    return value.toBytes();
  }

  set pool(value: Bytes) {
    this.set("pool", Value.fromBytes(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }
}

export class Transfer extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Transfer entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Transfer entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Transfer", id.toString(), this);
  }

  static load(id: string): Transfer | null {
    return store.get("Transfer", id) as Transfer | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get from(): Bytes {
    let value = this.get("from");
    return value.toBytes();
  }

  set from(value: Bytes) {
    this.set("from", Value.fromBytes(value));
  }

  get to(): Bytes {
    let value = this.get("to");
    return value.toBytes();
  }

  set to(value: Bytes) {
    this.set("to", Value.fromBytes(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    return value.toBigInt();
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }

  get pool(): Bytes {
    let value = this.get("pool");
    return value.toBytes();
  }

  set pool(value: Bytes) {
    this.set("pool", Value.fromBytes(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get gasUsed(): BigInt {
    let value = this.get("gasUsed");
    return value.toBigInt();
  }

  set gasUsed(value: BigInt) {
    this.set("gasUsed", Value.fromBigInt(value));
  }

  get gasPrice(): BigInt {
    let value = this.get("gasPrice");
    return value.toBigInt();
  }

  set gasPrice(value: BigInt) {
    this.set("gasPrice", Value.fromBigInt(value));
  }
}

export class Withdraw extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save Withdraw entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save Withdraw entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("Withdraw", id.toString(), this);
  }

  static load(id: string): Withdraw | null {
    return store.get("Withdraw", id) as Withdraw | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get amountA(): BigInt {
    let value = this.get("amountA");
    return value.toBigInt();
  }

  set amountA(value: BigInt) {
    this.set("amountA", Value.fromBigInt(value));
  }

  get amountB(): BigInt {
    let value = this.get("amountB");
    return value.toBigInt();
  }

  set amountB(value: BigInt) {
    this.set("amountB", Value.fromBigInt(value));
  }

  get amountY(): BigInt {
    let value = this.get("amountY");
    return value.toBigInt();
  }

  set amountY(value: BigInt) {
    this.set("amountY", Value.fromBigInt(value));
  }

  get muLast(): BigInt {
    let value = this.get("muLast");
    return value.toBigInt();
  }

  set muLast(value: BigInt) {
    this.set("muLast", Value.fromBigInt(value));
  }

  get pool(): Bytes {
    let value = this.get("pool");
    return value.toBytes();
  }

  set pool(value: Bytes) {
    this.set("pool", Value.fromBytes(value));
  }

  get timestamp(): BigInt {
    let value = this.get("timestamp");
    return value.toBigInt();
  }

  set timestamp(value: BigInt) {
    this.set("timestamp", Value.fromBigInt(value));
  }

  get sender(): Bytes {
    let value = this.get("sender");
    return value.toBytes();
  }

  set sender(value: Bytes) {
    this.set("sender", Value.fromBytes(value));
  }
}
