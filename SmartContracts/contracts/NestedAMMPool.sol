// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ABDKMath64x64.sol";


contract NestedAMMPool is IERC20, ERC20 {
    uint public constant precision = 1000;
    uint public constant MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));

    address public factory;
    address public tokenA;
    address public tokenB;
    address public tokenY;

    int128 sigma;
    int128 eta;

    int128 one_minus_sigma;
    int128 one_minus_eta;
    int128 reverse_sigma;
    int128 reverse_eta;
    int128 eta_to_sigma;
    int128 sigma_to_eta;
    int128 eta_minus_sigma;

    int128 mu; // constant curve
    int128 mme; // maximum margin of error

    uint private unlocked = 1;

    mapping(address => uint) public reserves;

    modifier lock() {
        require(unlocked == 1, 'Nested AMM: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    function _safeTransfer(
        address token,
        address to,
        uint value
    ) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(SELECTOR, to, value)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "AMM: TRANSFER_FAILED"
        );
    }

    event Deposit(uint amountA, uint amountB, uint amountY, uint muLast);

    event Withdraw(
        uint amountA,
        uint amountB,
        uint amountY,
        uint muLast
    );

    event Swap(
        uint amountIn,
        uint amountOut,
        address tokenIn,
        address tokenOut,
        address indexed sender
    );

    constructor() ERC20("LP Token", "LPT") {
        sigma = ABDKMath64x64.divu(200, precision);
        eta = ABDKMath64x64.divu(800, precision);
        mme = ABDKMath64x64.divu(5, precision);

        one_minus_sigma = ABDKMath64x64.sub(ABDKMath64x64.fromInt(1), sigma);
        one_minus_eta = ABDKMath64x64.sub(ABDKMath64x64.fromInt(1), eta);

        reverse_sigma = ABDKMath64x64.div(
            ABDKMath64x64.fromInt(1),
            one_minus_sigma
        );
        reverse_eta = ABDKMath64x64.div(
            ABDKMath64x64.fromInt(1),
            one_minus_eta
        );

        eta_to_sigma = ABDKMath64x64.div(one_minus_eta, one_minus_sigma);
        sigma_to_eta = ABDKMath64x64.div(one_minus_sigma, one_minus_eta);

        eta_minus_sigma = ABDKMath64x64.div(
            ABDKMath64x64.sub(eta, sigma),
            one_minus_sigma
        );

        factory = msg.sender;
    }

    function initialize(address _tokenA, address _tokenB, address _tokenY) external {
        require(msg.sender == factory, 'Nested AMM: FORBIDDEN'); // sufficient check
        tokenA = _tokenA;
        tokenB = _tokenB;
        tokenY = _tokenY;

        reserves[_tokenA] = 0;
        reserves[_tokenB] = 0;
        reserves[_tokenY] = 0;
    }

    function getPow(int128 x, int128 p) private pure returns (int128) {
        return
            ABDKMath64x64.exp_2(ABDKMath64x64.mul(ABDKMath64x64.log_2(x), p));
    }

    function getAplusB(int128 a, int128 b) private view returns (int128) {
        int128 aexp = getPow(a, one_minus_sigma);
        int128 bexp = getPow(b, one_minus_sigma);

        return getPow(ABDKMath64x64.add(aexp, bexp), eta_to_sigma);
    }

    function muFunction() private view returns (int128) {
        int128 a = ABDKMath64x64.divu(
            reserves[tokenA],
            10**IERC20Metadata(tokenA).decimals()
        );
        int128 b = ABDKMath64x64.divu(
            reserves[tokenB],
            10**IERC20Metadata(tokenB).decimals()
        );
        int128 y = ABDKMath64x64.divu(
            reserves[tokenY],
            10**IERC20Metadata(tokenY).decimals()
        );

        return ABDKMath64x64.add(getAplusB(a, b), getPow(y, one_minus_eta));
    }

    function getAtoYAmount(uint _a, uint _b)
        private
        view
        returns (int128 amountOut)
    {
        int128 a = ABDKMath64x64.divu(_a, 10**IERC20Metadata(tokenA).decimals());
        int128 b = ABDKMath64x64.divu(_b, 10**IERC20Metadata(tokenB).decimals());
        int128 y = ABDKMath64x64.divu(
            reserves[tokenY],
            10**IERC20Metadata(tokenY).decimals()
        );

        return
            ABDKMath64x64.sub(
                y,
                getPow(ABDKMath64x64.sub(mu, getAplusB(a, b)), reverse_eta)
            );
    }

    function getYtoAAmount(
        uint _y,
        uint _a,
        uint _b
    ) private view returns (int128 amountOut) {
        int128 a = ABDKMath64x64.divu(_a, 10**IERC20Metadata(tokenA).decimals());
        int128 b = ABDKMath64x64.divu(_b, 10**IERC20Metadata(tokenB).decimals());
        int128 y = ABDKMath64x64.divu(_y, 10**IERC20Metadata(tokenY).decimals());

        int128 bexp = getPow(b, one_minus_sigma);
        int128 temp = getPow(
            ABDKMath64x64.sub(mu, getPow(y, one_minus_eta)),
            sigma_to_eta
        );

        return
            ABDKMath64x64.sub(
                a,
                getPow(ABDKMath64x64.sub(temp, bexp), reverse_sigma)
            );
    }

    function getAtoBAmount(uint _a, uint _b)
        private
        view
        returns (int128 amountOut)
    {
        int128 a = ABDKMath64x64.divu(_a, 10**IERC20Metadata(tokenA).decimals());
        int128 b = ABDKMath64x64.divu(_b, 10**IERC20Metadata(tokenB).decimals());
        int128 y = ABDKMath64x64.divu(
            reserves[tokenY],
            10**IERC20Metadata(tokenY).decimals()
        );
        int128 temp = getPow(
            ABDKMath64x64.sub(mu, getPow(y, one_minus_eta)),
            sigma_to_eta
        );
        return
            ABDKMath64x64.sub(
                b,
                getPow(
                    ABDKMath64x64.sub(temp, getPow(a, one_minus_sigma)),
                    reverse_sigma
                )
            );
    }

    function getAtoBPrice() private view returns (int128 price) {
        int128 a = ABDKMath64x64.divu(
            reserves[tokenA],
            10**IERC20Metadata(tokenA).decimals()
        );
        int128 b = ABDKMath64x64.divu(
            reserves[tokenB],
            10**IERC20Metadata(tokenB).decimals()
        );

        price = getPow(ABDKMath64x64.div(a, b), sigma);
    }

    function getAtoYPrice() private view returns (int128 price) {
        int128 a = ABDKMath64x64.divu(
            reserves[tokenA],
            10**IERC20Metadata(tokenA).decimals()
        );
        int128 b = ABDKMath64x64.divu(
            reserves[tokenB],
            10**IERC20Metadata(tokenB).decimals()
        );
        int128 y = ABDKMath64x64.divu(
            reserves[tokenY],
            10**IERC20Metadata(tokenY).decimals()
        );

        int128 r = ABDKMath64x64.div(b, a);
        int128 k = getPow(
            ABDKMath64x64.add(
                ABDKMath64x64.fromInt(1),
                getPow(r, one_minus_sigma)
            ),
            eta_minus_sigma
        );

        price = ABDKMath64x64.mul(getPow(ABDKMath64x64.div(a, y), eta), k);
    }

    function checkLimit(
        uint baseAmount,
        uint realAmount,
        int128 limit
    ) private pure returns (bool) {
        uint lowerLimit = ABDKMath64x64.mulu(
            ABDKMath64x64.sub(ABDKMath64x64.fromInt(1), limit),
            baseAmount
        );
        uint upperLimit = ABDKMath64x64.mulu(
            ABDKMath64x64.add(ABDKMath64x64.fromInt(1), limit),
            baseAmount
        );

        return (lowerLimit < realAmount) && (realAmount < upperLimit);
    }

    function getAmountsAddToken(address token, uint amount)
        public
        view
        returns (
            uint addAmountA,
            uint addAmountB,
            uint addAmountY
        )
    {
        addAmountA = ABDKMath64x64.mulu(
            ABDKMath64x64.divu(reserves[tokenA], reserves[token]),
            amount
        );
        addAmountB = ABDKMath64x64.mulu(
            ABDKMath64x64.divu(reserves[tokenB], reserves[token]),
            amount
        );
        addAmountY = ABDKMath64x64.mulu(
            ABDKMath64x64.divu(reserves[tokenY], reserves[token]),
            amount
        );
    }

    function getPrice(address tokenIn, address tokenOut)
        public
        view
        returns (uint256 price)
    {
        int128 _price;
        if (tokenOut == tokenA) {
            if (tokenIn == tokenB) {
                _price = getAtoBPrice();
            } else if (tokenIn == tokenY) {
                _price = getAtoYPrice();
            }
        } else if (tokenOut == tokenB) {
            if (tokenIn == tokenA) {
                _price = ABDKMath64x64.div(
                    ABDKMath64x64.fromInt(1),
                    getAtoBPrice()
                );
            } else if (tokenIn == tokenY) {
                _price = ABDKMath64x64.div(getAtoYPrice(), getAtoBPrice());
            }
        } else if (tokenOut == tokenY) {
            if (tokenIn == tokenA) {
                _price = ABDKMath64x64.div(
                    ABDKMath64x64.fromInt(1),
                    getAtoYPrice()
                );
            } else if (tokenIn == tokenB) {
                _price = ABDKMath64x64.div(getAtoBPrice(), getAtoYPrice());
            }
        }

        price = ABDKMath64x64.mulu(_price, 10**18);
    }

    function getAmountOut(
        uint amountIn,
        address tokenIn,
        address tokenOut
    ) public view returns (uint256 amountOut) {
        int128 res = 0;
        uint8 decimal = 18;

        if (tokenIn == tokenA) {
            if (tokenOut == tokenB) {
                res = getAtoBAmount(
                    reserves[tokenA] + amountIn,
                    reserves[tokenB]
                );
                decimal = IERC20Metadata(tokenB).decimals();
            } else if (tokenOut == tokenY) {
                res = getAtoYAmount(
                    reserves[tokenA] + amountIn,
                    reserves[tokenB]
                );
                decimal = IERC20Metadata(tokenY).decimals();
            }
        } else if (tokenIn == tokenB) {
            if (tokenOut == tokenA) {
                res = getAtoBAmount(
                    reserves[tokenB] + amountIn,
                    reserves[tokenA]
                );
                decimal = IERC20Metadata(tokenA).decimals();
            } else if (tokenOut == tokenY) {
                res = getAtoYAmount(
                    reserves[tokenB] + amountIn,
                    reserves[tokenA]
                );
                decimal = IERC20Metadata(tokenY).decimals();
            }
        } else if (tokenIn == tokenY) {
            if (tokenOut == tokenA) {
                res = getYtoAAmount(
                    reserves[tokenY] + amountIn,
                    reserves[tokenA],
                    reserves[tokenB]
                );
                decimal = IERC20Metadata(tokenA).decimals();
            } else if (tokenOut == tokenB) {
                res = getYtoAAmount(
                    reserves[tokenY] + amountIn,
                    reserves[tokenB],
                    reserves[tokenA]
                );
                decimal = IERC20Metadata(tokenB).decimals();
            }
        }

        // Swap fee: 0.3%
        if (decimal >= 3) {
            amountOut = ABDKMath64x64.mulu(res, 997 * 10**(decimal - 3));
        } else {
            amountOut = ABDKMath64x64.mulu(
                    ABDKMath64x64.div(
                        res,
                        ABDKMath64x64.fromUInt(10**(3 - decimal))
                    ),
                    997
                );
        }

        require(amountOut > 0, "INSUFFICIENT_OUT_AMOUNT");

        return amountOut;
    }

    function addLiquidity(
        uint amountA,
        uint amountB,
        uint amountY
    ) external lock returns (uint liquidity) {
        require(amountA > 0 && amountB > 0 && amountY > 0, "INSUFFICIENT_INPUT_AMOUNT");

        if (totalSupply() == 0) {
           _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            require(
                reserves[tokenA] > 0 &&
                    reserves[tokenB] > 0 &&
                    reserves[tokenY] > 0,
                "INSUFFICIENT_LIQUIDITY_AMOUNT"
            );

            (uint delta_a, uint delta_b, ) = getAmountsAddToken(
                tokenY,
                amountY
            );

            require(
                checkLimit(delta_a, amountA, mme) &&
                    checkLimit(delta_b, amountB, mme),
                "MISMATCH_RATIO"
            );
        }

        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        IERC20(tokenY).transferFrom(msg.sender, address(this), amountY);

        reserves[tokenA] = reserves[tokenA] + amountA;
        reserves[tokenB] = reserves[tokenB] + amountB;
        reserves[tokenY] = reserves[tokenY] + amountY;

        _mint(msg.sender, amountY);

        mu = muFunction();

        emit Deposit(amountA, amountB, amountY, ABDKMath64x64.mulu(mu, 10**10));

        liquidity = amountY;
    }

    function removeLiquidity(uint amount) external lock returns (uint delta_a, uint delta_b, uint delta_y) {
        require(amount > 0, "INSUFFICIENT_WITHDRAW_AMOUNT");

        delta_y = ABDKMath64x64.mulu(
            ABDKMath64x64.divu(amount, totalSupply()),
            reserves[tokenY]
        );

        (delta_a, delta_b, ) = getAmountsAddToken(
            tokenY,
            delta_y
        );

        transferFrom(msg.sender, address(this), amount);
        _burn(address(this), amount);

        _safeTransfer(tokenA, msg.sender, delta_a);
        _safeTransfer(tokenB, msg.sender, delta_b);
        _safeTransfer(tokenY, msg.sender, delta_y);

        reserves[tokenA] = reserves[tokenA] - delta_a;
        reserves[tokenB] = reserves[tokenB] - delta_b;
        reserves[tokenY] = reserves[tokenY] - delta_y;

        mu = muFunction();

        emit Withdraw(
            delta_a,
            delta_b,
            delta_y,
            ABDKMath64x64.mulu(mu, 10**10)
        );
    }

    function swapToken(
        uint amountIn,
        address tokenIn,
        address tokenOut,
        address recipient,
        uint slippage // define enum in the production
    ) external lock returns (uint amountOut) {
        uint price = getPrice(tokenIn, tokenOut);

        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");

        amountOut = getAmountOut(amountIn, tokenIn, tokenOut);

        uint realPrice = (amountOut * (10**18)) / amountIn;

        require(
            checkLimit(
                price,
                realPrice,
                ABDKMath64x64.divu(slippage, precision)
            ),
            "NOT_ENOUGH_SLIPPAGE_LEVEL"
        );

        require(
            reserves[tokenOut] > amountOut,
            "INSUFFICIENT_OUTPUT_AMOUNT"
        );

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        reserves[tokenIn] = reserves[tokenIn] + amountIn;
        reserves[tokenOut] = reserves[tokenOut] - amountOut;

        IERC20(tokenOut).transfer(recipient, amountOut);

        emit Swap(amountIn, amountOut, tokenIn, tokenOut, msg.sender);

        return amountOut;
    }
}