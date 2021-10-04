// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./NestedAMMPool.sol";

contract NestedAMMFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => mapping(address => address)))
        public getPool;
    address[] public allPools;

    event PoolCreated(
        address indexed tokenA,
        address indexed tokenB,
        address indexed tokenY,
        address pool,
        uint256
    );

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    function createPool(
        address tokenA,
        address tokenB,
        address tokenY
    ) external returns (address pool) {
        require(
            tokenA != tokenB || tokenA != tokenY || tokenB != tokenY,
            "Nested AMM: IDENTICAL_ADDRESSES"
        );
        require(
            tokenA != address(0) ||
                tokenB != address(0) ||
                tokenY != address(0),
            "Nested AMM: ZERO_ADDRESS"
        );
        require(
            getPool[tokenA][tokenB][tokenY] == address(0),
            "Nested AMM: POOL_EXISTS"
        ); // single check is sufficient

        bytes memory bytecode = type(NestedAMMPool).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(tokenA, tokenB, tokenY));

        assembly {
            pool := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        NestedAMMPool(pool).initialize(tokenA, tokenB, tokenY);
        getPool[tokenA][tokenB][tokenY] = pool;
        getPool[tokenB][tokenA][tokenY] = pool; // populate mapping in the reverse direction
        allPools.push(pool);

        emit PoolCreated(tokenA, tokenB, tokenY, pool, allPools.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "Nested AMM: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "Nested AMM: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }
}
