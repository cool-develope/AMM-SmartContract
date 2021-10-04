const NestedAMMFactory = artifacts.require('NestedAMMFactory')
const NestedAMMPool = artifacts.require('NestedAMMPool')

const ERC20PresetMinterPauser = artifacts.require(
    '@openzeppelin/contracts/token/presets/ERC20PresetMinterPauser',
)

contract('AMM test', async (accounts) => {
    it('It should be success', async () => {
        let balance, price, result, Error
        const instance = await NestedAMMFactory.deployed()

        await instance.setFeeTo(accounts[6], { from: accounts[5]});

        let tokenA = await ERC20PresetMinterPauser.new("tokenA", "TKN"); 
        let tokenB = await ERC20PresetMinterPauser.new("tokenB", "TKN"); 
        let tokenY = await ERC20PresetMinterPauser.new("tokenY", "TKN"); 
        
        await instance.createPool(tokenA.address, tokenB.address, tokenY.address)

        const ammPool = await NestedAMMPool.at(
            await instance.getPool.call(tokenA.address, tokenB.address, tokenY.address)
        )

        const mintAmount = 1000000000000

        tokenA.mint(accounts[0], mintAmount)
        tokenB.mint(accounts[0], mintAmount)
        tokenY.mint(accounts[0], mintAmount)

        tokenA.mint(accounts[1], mintAmount)
        tokenB.mint(accounts[1], mintAmount)
        tokenY.mint(accounts[1], mintAmount)

        await tokenA.approve.sendTransaction(ammPool.address, mintAmount, {
            from: accounts[0],
        })
        await tokenB.approve.sendTransaction(ammPool.address, mintAmount, {
            from: accounts[0],
        })
        await tokenY.approve.sendTransaction(ammPool.address, mintAmount, {
            from: accounts[0],
        })

        const aDepositAmount = 100000000000
        const bDepositAmount = 200000000000
        const yDepositAmount = 300000000000

        await ammPool.addLiquidity.sendTransaction(
            aDepositAmount,
            bDepositAmount,
            yDepositAmount,
            { from: accounts[0] },
        )

        balance = await ammPool.reserves.call(tokenA.address)

        assert.equal(
            aDepositAmount,
            balance.toNumber(),
            "Deposit balance wasn't matched!",
        )

        const yAddAmount = 80000000000
        result = await ammPool.getAmountsAddToken(tokenY.address, yAddAmount)

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
            await ammPool.addLiquidity.sendTransaction(
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
            Error.message.search('transfer amount exceeds allowance'),
            -1,
            'Error revert INSUFFICIENT_APPROVE_AMOUNT_TOKEN_A',
        )

        await tokenA.approve.sendTransaction(ammPool.address, mintAmount, {
            from: accounts[1],
        })
        await tokenB.approve.sendTransaction(ammPool.address, mintAmount, {
            from: accounts[1],
        })
        await tokenY.approve.sendTransaction(ammPool.address, mintAmount, {
            from: accounts[1],
        })

        Error = undefined
        try {
            await ammPool.addLiquidity.sendTransaction(
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
        await ammPool.addLiquidity.sendTransaction(
            result.addAmountA,
            result.addAmountB,
            result.addAmountY,
            { from: accounts[1] },
        )

        balance = await ammPool.balanceOf(accounts[1]);
        
        console.log("Balance of LP topken after deposit: ", balance.toNumber());
        
        assert.equal(
            yAddAmount,
            balance.toNumber(),
            "Deposit balance wasn't matched!",
        )

        balance = await ammPool.reserves.call(tokenB.address)

        assert.equal(
            bDepositAmount + result.addAmountB.toNumber(),
            balance.toNumber(),
            "Deposit balance wasn't matched after addLiquidity!",
        )
        
        console.log("#######################################################################");

        balance = await ammPool.reserves.call(tokenA.address)
        console.log(`Balance of Token A: ${balance.toNumber()}`);

        balance = await ammPool.reserves.call(tokenB.address)
        console.log(`Balance of Token B: ${balance.toNumber()}`);

        balance = await ammPool.reserves.call(tokenY.address)
        console.log(`Balance of Token Y: ${balance.toNumber()}`);

        price = await ammPool.getPrice(tokenA.address, tokenB.address);
        console.log(`Price to A to B: ${parseFloat(price) / Math.pow(10, 18)}`);

        price = await ammPool.getPrice(tokenB.address, tokenA.address);
        console.log(`Price to B to A: ${parseFloat(price) / Math.pow(10, 18)}`);
        
        price = await ammPool.getPrice(tokenA.address, tokenY.address);
        console.log(`Price to A to Y: ${parseFloat(price) / Math.pow(10, 18)}`);
        
        price = await ammPool.getPrice(tokenY.address, tokenB.address);
        console.log(`Price to Y to B: ${parseFloat(price) / Math.pow(10, 18)}`);

        const bSwapAmount = 30000000
        result = await ammPool.getAmountOut(
            bSwapAmount,
            tokenB.address,
            tokenA.address,
        )

        let beforBalance = await tokenA.balanceOf.call(accounts[1])
        await ammPool.swapToken.sendTransaction(
            bSwapAmount,
            tokenB.address,
            tokenA.address,
            accounts[1],
            50,
            { from: accounts[1] },
        )
        let afterBalance = await tokenA.balanceOf.call(accounts[1])
        
        console.log("#######################################################################");
        console.log(`Blanace before swap: ${beforBalance} after: ${afterBalance}`);
        
        price = await ammPool.getPrice(tokenB.address, tokenA.address);

        console.log(`Provide B Token: ${bSwapAmount} Return A Token: ${afterBalance - beforBalance} Price of B to A : ${parseFloat(price) / Math.pow(10, 18)} Executed Price: ${(afterBalance - beforBalance) / bSwapAmount}`);
        
        assert.equal(
            result.toNumber() + beforBalance.toNumber(),
            afterBalance.toNumber(),
            "The token amount wasn't mismatched after swapToken!",
        )

        console.log("#######################################################################");
        const aSwapAmount = 20000000
        result = await ammPool.getAmountOut(
            aSwapAmount,
            tokenA.address,
            tokenY.address,
        )
        
        beforBalance = await tokenY.balanceOf.call(accounts[2])
        await ammPool.swapToken.sendTransaction(
            aSwapAmount,
            tokenA.address,
            tokenY.address,
            accounts[2],
            50,
            { from: accounts[1] },
        )
        afterBalance = await tokenY.balanceOf.call(accounts[2])
        
        
        console.log(`Blanace before swap: ${beforBalance} after: ${afterBalance}`);
        
        assert.equal(
            result.toNumber() + beforBalance.toNumber(),
            afterBalance.toNumber(),
            "The token amount wasn't mismatched after swapToken throught recipient!",
        )

        console.log("#######################################################################");
        const ySwapAmount = 5000000000
        result = await ammPool.getAmountOut(
            ySwapAmount,
            tokenY.address,
            tokenB.address,
        )
        
        price = await ammPool.getPrice(tokenY.address, tokenB.address);

        theory_price = parseFloat(price) / Math.pow(10, 18)
        real_price = parseFloat(result) / ySwapAmount
        slippage = (theory_price - real_price) / theory_price * 100

        console.log(`Price of Y to B : ${theory_price} Executed Price: ${real_price} Slippage: ${slippage} %`);
        
        
        Error = undefined
        try {
            await ammPool.swapToken.sendTransaction(
                ySwapAmount,
                tokenY.address,
                tokenB.address,
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

        const beforABalance = await tokenA.balanceOf.call(accounts[1]);
        const beforBBalance = await tokenB.balanceOf.call(accounts[1]);
        const beforYBalance = await tokenY.balanceOf.call(accounts[1]);
        
        let _balance = await ammPool.balanceOf(accounts[1]);
        
        await ammPool.approve.sendTransaction(accounts[1], yAddAmount, {
            from: accounts[1],
        });

        await ammPool.removeLiquidity.sendTransaction(
            yAddAmount,
            { from: accounts[1] },
        )
        
        afterBalance = await tokenA.balanceOf.call(accounts[1])
        console.log(`The amount change of A Token after removeLiquidity: ${afterBalance - beforABalance}`);

        afterBalance = await tokenB.balanceOf.call(accounts[1])
        console.log(`The amount change of B Token after removeLiquidity: ${afterBalance - beforBBalance}`);

        afterBalance = await tokenY.balanceOf.call(accounts[1])
        console.log(`The amount change of Y Token after removeLiquidity: ${afterBalance - beforYBalance}`);

        balance = await ammPool.balanceOf(accounts[1]);
        
        assert.equal(
            _balance - balance,
            yAddAmount,
            "Y Token balance wasn't matched with LP token balance after remove Liquidity!",
        )

    })
})
