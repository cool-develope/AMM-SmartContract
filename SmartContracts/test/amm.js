const AMM = artifacts.require('AMM')
const ERC20PresetMinterPauser = artifacts.require(
    '@openzeppelin/contracts/token/presets/ERC20PresetMinterPauser',
)

contract('AMM test', async (accounts) => {
    it('It should be success', async () => {
        let balance, price, result, Error

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

        const mintAmount = 1000000000000

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

        const aDepositAmount = 100000000000
        const bDepositAmount = 200000000000
        const yDepositAmount = 300000000000

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

        const yAddAmount = 80000000000
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
        
        console.log("#######################################################################");
        await instance.addLiquidity.sendTransaction(
            result.addAmountA,
            result.addAmountB,
            result.addAmountY,
            { from: accounts[1] },
        )

        balance = await instance.balanceOf(accounts[1]);
        
        console.log("Balance of LP topken after deposit: ", balance.toNumber());
        
        assert.equal(
            yAddAmount,
            balance.toNumber(),
            "Deposit balance wasn't matched!",
        )

        balance = await instance.getBalance.call(bToken.address)

        assert.equal(
            bDepositAmount + result.addAmountB.toNumber(),
            balance.toNumber(),
            "Deposit balance wasn't matched after addLiquidity!",
        )
        
        console.log("#######################################################################");

        balance = await instance.getBalance.call(aToken.address)
        console.log(`Balance of Token A: ${balance.toNumber()}`);

        balance = await instance.getBalance.call(bToken.address)
        console.log(`Balance of Token B: ${balance.toNumber()}`);

        balance = await instance.getBalance.call(yToken.address)
        console.log(`Balance of Token Y: ${balance.toNumber()}`);

        price = await instance.getPrice(aToken.address, bToken.address);
        console.log(`Price to A to B: ${parseFloat(price) / Math.pow(10, 18)}`);

        price = await instance.getPrice(bToken.address, aToken.address);
        console.log(`Price to B to A: ${parseFloat(price) / Math.pow(10, 18)}`);
        
        price = await instance.getPrice(aToken.address, yToken.address);
        console.log(`Price to A to Y: ${parseFloat(price) / Math.pow(10, 18)}`);
        
        price = await instance.getPrice(yToken.address, bToken.address);
        console.log(`Price to Y to B: ${parseFloat(price) / Math.pow(10, 18)}`);

        const bSwapAmount = 30000000
        result = await instance.getAmountOut(
            bSwapAmount,
            bToken.address,
            aToken.address,
        )

        let beforBalance = await aToken.balanceOf.call(accounts[1])
        await instance.swapToken.sendTransaction(
            bSwapAmount,
            bToken.address,
            aToken.address,
            "0x0000000000000000000000000000000000000000",
            50,
            { from: accounts[1] },
        )
        let afterBalance = await aToken.balanceOf.call(accounts[1])
        
        console.log("#######################################################################");
        console.log(`Blanace before swap: ${beforBalance} after: ${afterBalance}`);
        
        price = await instance.getPrice(bToken.address, aToken.address);

        console.log(`Provide B Token: ${bSwapAmount} Return A Token: ${afterBalance - beforBalance} Price of B to A : ${parseFloat(price) / Math.pow(10, 18)} Executed Price: ${(afterBalance - beforBalance) / bSwapAmount}`);
        
        assert.equal(
            result.toNumber() + beforBalance.toNumber(),
            afterBalance.toNumber(),
            "The token amount wasn't mismatched after swapToken!",
        )

        console.log("#######################################################################");
        const aSwapAmount = 20000000
        result = await instance.getAmountOut(
            aSwapAmount,
            aToken.address,
            yToken.address,
        )
        
        beforBalance = await yToken.balanceOf.call(accounts[2])
        await instance.swapToken.sendTransaction(
            aSwapAmount,
            aToken.address,
            yToken.address,
            accounts[2],
            50,
            { from: accounts[1] },
        )
        afterBalance = await yToken.balanceOf.call(accounts[2])
        
        
        console.log(`Blanace before swap: ${beforBalance} after: ${afterBalance}`);
        
        assert.equal(
            result.toNumber() + beforBalance.toNumber(),
            afterBalance.toNumber(),
            "The token amount wasn't mismatched after swapToken throught recipient!",
        )

        console.log("#######################################################################");
        const ySwapAmount = 5000000000
        result = await instance.getAmountOut(
            ySwapAmount,
            yToken.address,
            bToken.address,
        )
        
        price = await instance.getPrice(yToken.address, bToken.address);

        theory_price = parseFloat(price) / Math.pow(10, 18)
        real_price = parseFloat(result) / ySwapAmount
        slippage = (theory_price - real_price) / theory_price * 100

        console.log(`Price of Y to B : ${theory_price} Executed Price: ${real_price} Slippage: ${slippage} %`);
        
        
        Error = undefined
        try {
            await instance.swapToken.sendTransaction(
                ySwapAmount,
                yToken.address,
                bToken.address,
                accounts[1],
                13,
                { from: accounts[1] },
            )
        } catch (error) {
            Error = error
        }

        assert.notEqual(Error, undefined, `Error must be thrown, the slippage level 0.5% but got ${slippage}`)
        assert.isAbove(
            Error.message.search('NOT_ENOUGH_SLIPPAGE_LEVEL'),
            -1,
            'Error revert NOT_ENOUGH_SLIPPAGE_LEVEL',
        )


        console.log("#######################################################################");

        const beforABalance = await aToken.balanceOf.call(accounts[1]);
        const beforBBalance = await bToken.balanceOf.call(accounts[1]);
        const beforYBalance = await yToken.balanceOf.call(accounts[1]);
        
        let _balance = await instance.balanceOf(accounts[1]);
        
        await instance.approve.sendTransaction(accounts[1], yAddAmount, {
            from: accounts[1],
        });

        await instance.removeLiquidity.sendTransaction(
            yAddAmount,
            { from: accounts[1] },
        )
        
        afterBalance = await aToken.balanceOf.call(accounts[1])
        console.log(`The amount change of A Token after removeLiquidity: ${afterBalance - beforABalance}`);

        afterBalance = await bToken.balanceOf.call(accounts[1])
        console.log(`The amount change of B Token after removeLiquidity: ${afterBalance - beforBBalance}`);

        afterBalance = await yToken.balanceOf.call(accounts[1])
        console.log(`The amount change of Y Token after removeLiquidity: ${afterBalance - beforYBalance}`);

        balance = await instance.balanceOf(accounts[1]);
        
        assert.equal(
            _balance - balance,
            yAddAmount,
            "Y Token balance wasn't matched with LP token balance after remove Liquidity!",
        )

    })
})
