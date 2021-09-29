const AMM = artifacts.require('AMM')
const ERC20PresetMinterPauser = artifacts.require(
    '@openzeppelin/contracts/token/presets/ERC20PresetMinterPauser',
)

contract('AMM test', async (accounts) => {
    it('It should be success', async () => {
        let balance, result, Error

        const instance = await AMM.deployed()

        const aToken = await ERC20PresetMinterPauser.at(
            await instance.aTokenAddress.call(),
        )
        const bToken = await ERC20PresetMinterPauser.at(
            await instance.bTokenAddress.call(),
        )
        const yToken = await ERC20PresetMinterPauser.at(
            await instance.yTokenAddress.call(),
        )

        const mintAmount = 1000

        aToken.mint(accounts[0], mintAmount)
        bToken.mint(accounts[0], mintAmount)
        yToken.mint(accounts[0], mintAmount)

        aToken.mint(accounts[1], mintAmount)
        bToken.mint(accounts[1], mintAmount)
        yToken.mint(accounts[1], mintAmount)

        await aToken.approve.sendTransaction(instance.address, mintAmount, {
            from: accounts[0],
        })
        await bToken.approve.sendTransaction(instance.address, mintAmount, {
            from: accounts[0],
        })
        await yToken.approve.sendTransaction(instance.address, mintAmount, {
            from: accounts[0],
        })

        const aDepositAmount = 100
        const bDepositAmount = 200
        const yDepositAmount = 300

        await instance.addLiquidity.sendTransaction(
            aDepositAmount,
            bDepositAmount,
            yDepositAmount,
            { from: accounts[0] },
        )
        balance = await instance.getBalance.call(aToken.address)

        assert.equal(
            aDepositAmount,
            balance.toNumber(),
            "Deposit balance wasn't matched!",
        )

        const yAddAmount = 80
        result = await instance.getAmountsAddToken(yToken.address, yAddAmount)

        assert.equal(
            parseInt((aDepositAmount / yDepositAmount) * yAddAmount),
            result.addAmountA,
            "Add Liquidity amount wasn't matched in Token A!",
        )
        assert.equal(
            parseInt((bDepositAmount / yDepositAmount) * yAddAmount),
            result.addAmountB,
            "Add Liquidity amount wasn't matched in Token B!",
        )
        assert.equal(
            parseInt((yDepositAmount / yDepositAmount) * yAddAmount),
            result.addAmountY,
            "Add Liquidity amount wasn't matched in Token Y!",
        )

        await instance.addLiquidity.sendTransaction(
            result.addAmountA,
            result.addAmountB,
            result.addAmountY,
            { from: accounts[0] },
        )

        Error = undefined
        try {
            await instance.addLiquidity.sendTransaction(
                result.addAmountA,
                result.addAmountB,
                result.addAmountY,
                { from: accounts[1] },
            )
        } catch (error) {
            Error = error
        }

        assert.notEqual(Error, undefined, 'Error must be thrown')
        assert.isAbove(
            Error.message.search('INSUFFICIENT_APPROVE_AMOUNT_TOKEN_A'),
            -1,
            'Error revert INSUFFICIENT_APPROVE_AMOUNT_TOKEN_A',
        )

        await aToken.approve.sendTransaction(instance.address, mintAmount, {
            from: accounts[1],
        })
        await bToken.approve.sendTransaction(instance.address, mintAmount, {
            from: accounts[1],
        })
        await yToken.approve.sendTransaction(instance.address, mintAmount, {
            from: accounts[1],
        })

        Error = undefined
        try {
            await instance.addLiquidity.sendTransaction(
                parseInt(result.addAmountA.toNumber() * 1.1 + 1),
                result.addAmountB,
                result.addAmountY,
                { from: accounts[1] },
            )
        } catch (error) {
            Error = error
        }

        assert.notEqual(Error, undefined, 'Error must be thrown')
        assert.isAbove(
            Error.message.search('MISMATCH_RATIO'),
            -1,
            'Error revert MISMATCH_RATIO',
        )

        balance = await instance.getBalance.call(bToken.address)

        assert.equal(
            bDepositAmount + result.addAmountB.toNumber(),
            balance.toNumber(),
            "Deposit balance wasn't matched after addLiquidity!",
        )

        const bSwapAmount = 30
        result = await instance.getAmountOut(
            bSwapAmount,
            bToken.address,
            aToken.address,
        )

        const beforBalance = await aToken.balanceOf.call(accounts[1])
        await instance.swapToken.sendTransaction(
            bSwapAmount,
            bToken.address,
            aToken.address,
            "0x0000000000000000000000000000000000000000",
            50,
            { from: accounts[1] },
        )
        const afterBalance = await aToken.balanceOf.call(accounts[1])

        assert.equal(
            result.toNumber() + beforBalance.toNumber(),
            afterBalance.toNumber(),
            "The token amount wasn't mismatched after swapToken!",
        )
    })
})
