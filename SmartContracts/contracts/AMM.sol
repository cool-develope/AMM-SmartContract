// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ABDKMath64x64.sol";


contract AMM is IERC20, ERC20 {
    address public aTokenAddress; // address(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);
    address public bTokenAddress; // address(0xf76D4a441E4ba86A923ce32B89AFF89dBccAA075);
    address public yTokenAddress; // address(0xaD6D458402F60fD3Bd25163575031ACDce07538D);

    int256 public constant precision = 1000;
    bytes4 private constant SELECTOR =
        bytes4(keccak256(bytes("transfer(address,uint256)")));

    int128 _sigma;
    int128 _eta;

    int128 _one_minus_sigma;
    int128 _one_minus_eta;
    int128 _reverse_sigma;
    int128 _reverse_eta;
    int128 _eta_to_sigma;
    int128 _sigma_to_eta;
    int128 _eta_minus_sigma;

    int128 _mu; // constant curve
    int128 _mme; // maximum margin of error

    uint8 aDecimals;
    uint8 bDecimals;
    uint8 yDecimals;

    IERC20 immutable aToken;
    IERC20 immutable bToken;
    IERC20 immutable yToken;

    mapping(address => int256) public amounts;

    address owner;

    event Deposit(uint256 aAmount, uint256 bAmount, uint256 yAmount, int256 mu);

    event Withdraw(
        uint256 aAmount,
        uint256 bAmount,
        uint256 yAmount,
        int256 mu
    );

    event Swap(
        uint256 amountIn,
        uint256 amountOut,
        address tokenIn,
        address tokenOut,
        address indexed sender
    );

    constructor(
        address _aToken,
        address _bToken,
        address _yToken,
        int256 sigma,
        int256 eta,
        int256 mme
    ) ERC20("LP Token", "LPC") {
        aTokenAddress = _aToken;
        bTokenAddress = _bToken;
        yTokenAddress = _yToken;

        aToken = IERC20(_aToken);
        bToken = IERC20(_bToken);
        yToken = IERC20(_yToken);

        aDecimals = IERC20Metadata(_aToken).decimals();
        bDecimals = IERC20Metadata(_bToken).decimals();
        yDecimals = IERC20Metadata(_yToken).decimals();

        _sigma = ABDKMath64x64.divi(sigma, precision);
        _eta = ABDKMath64x64.divi(eta, precision);
        _mme = ABDKMath64x64.divi(mme, precision);

        _one_minus_sigma = ABDKMath64x64.sub(ABDKMath64x64.fromInt(1), _sigma);
        _one_minus_eta = ABDKMath64x64.sub(ABDKMath64x64.fromInt(1), _eta);

        _reverse_sigma = ABDKMath64x64.div(
            ABDKMath64x64.fromInt(1),
            _one_minus_sigma
        );
        _reverse_eta = ABDKMath64x64.div(
            ABDKMath64x64.fromInt(1),
            _one_minus_eta
        );

        _eta_to_sigma = ABDKMath64x64.div(_one_minus_eta, _one_minus_sigma);
        _sigma_to_eta = ABDKMath64x64.div(_one_minus_sigma, _one_minus_eta);

        _eta_minus_sigma = ABDKMath64x64.div(
            ABDKMath64x64.sub(_eta, _sigma),
            _one_minus_sigma
        );

        amounts[_aToken] = 0;
        amounts[_bToken] = 0;
        amounts[_yToken] = 0;
        owner = msg.sender;
    }

    function _safeTransfer(
        address token,
        address to,
        uint256 value
    ) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(SELECTOR, to, value)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "AMM: TRANSFER_FAILED"
        );
    }

    function getPow(int128 x, int128 p) private pure returns (int128) {
        return
            ABDKMath64x64.exp_2(ABDKMath64x64.mul(ABDKMath64x64.log_2(x), p));
    }

    function getAplusB(int128 a, int128 b) private view returns (int128) {
        int128 aexp = getPow(a, _one_minus_sigma);
        int128 bexp = getPow(b, _one_minus_sigma);

        return getPow(ABDKMath64x64.add(aexp, bexp), _eta_to_sigma);
    }

    function muFunction() private view returns (int128) {
        int128 a = ABDKMath64x64.divi(
            amounts[aTokenAddress],
            int256(10**aDecimals)
        );
        int128 b = ABDKMath64x64.divi(
            amounts[bTokenAddress],
            int256(10**bDecimals)
        );
        int128 y = ABDKMath64x64.divi(
            amounts[yTokenAddress],
            int256(10**yDecimals)
        );

        return ABDKMath64x64.add(getAplusB(a, b), getPow(y, _one_minus_eta));
    }

    function getAtoYAmount(int256 _a, int256 _b)
        private
        view
        returns (int128 amountOut)
    {
        int128 a = ABDKMath64x64.divi(_a, int256(10**aDecimals));
        int128 b = ABDKMath64x64.divi(_b, int256(10**bDecimals));
        int128 y = ABDKMath64x64.divi(
            amounts[yTokenAddress],
            int256(10**yDecimals)
        );

        return
            ABDKMath64x64.sub(
                y,
                getPow(ABDKMath64x64.sub(_mu, getAplusB(a, b)), _reverse_eta)
            );
    }

    function getYtoAAmount(
        int256 _y,
        int256 _a,
        int256 _b
    ) private view returns (int128 amountOut) {
        int128 a = ABDKMath64x64.divi(_a, int256(10**aDecimals));
        int128 b = ABDKMath64x64.divi(_b, int256(10**bDecimals));
        int128 y = ABDKMath64x64.divi(_y, int256(10**yDecimals));

        int128 bexp = getPow(b, _one_minus_sigma);
        int128 temp = getPow(
            ABDKMath64x64.sub(_mu, getPow(y, _one_minus_eta)),
            _sigma_to_eta
        );

        return
            ABDKMath64x64.sub(
                a,
                getPow(ABDKMath64x64.sub(temp, bexp), _reverse_sigma)
            );
    }

    function getAtoBAmount(int256 _a, int256 _b)
        private
        view
        returns (int128 amountOut)
    {
        int128 a = ABDKMath64x64.divi(_a, int256(10**aDecimals));
        int128 b = ABDKMath64x64.divi(_b, int256(10**bDecimals));
        int128 y = ABDKMath64x64.divi(
            amounts[yTokenAddress],
            int256(10**yDecimals)
        );
        int128 temp = getPow(
            ABDKMath64x64.sub(_mu, getPow(y, _one_minus_eta)),
            _sigma_to_eta
        );
        return
            ABDKMath64x64.sub(
                b,
                getPow(
                    ABDKMath64x64.sub(temp, getPow(a, _one_minus_sigma)),
                    _reverse_sigma
                )
            );
    }

    function getAtoBPrice() private view returns (int128 price) {
        int128 a = ABDKMath64x64.divi(
            amounts[aTokenAddress],
            int256(10**aDecimals)
        );
        int128 b = ABDKMath64x64.divi(
            amounts[bTokenAddress],
            int256(10**bDecimals)
        );

        price = getPow(ABDKMath64x64.div(a, b), _sigma);
    }

    function getAtoYPrice() private view returns (int128 price) {
        int128 a = ABDKMath64x64.divi(
            amounts[aTokenAddress],
            int256(10**aDecimals)
        );
        int128 b = ABDKMath64x64.divi(
            amounts[bTokenAddress],
            int256(10**bDecimals)
        );
        int128 y = ABDKMath64x64.divi(
            amounts[yTokenAddress],
            int256(10**yDecimals)
        );

        int128 r = ABDKMath64x64.div(b, a);
        int128 k = getPow(
            ABDKMath64x64.add(
                ABDKMath64x64.fromInt(1),
                getPow(r, _one_minus_sigma)
            ),
            _eta_minus_sigma
        );

        price = ABDKMath64x64.mul(getPow(ABDKMath64x64.sub(a, y), _eta), k);
    }

    function checkLimit(
        int256 baseAmount,
        int256 realAmount,
        int128 limit
    ) private pure returns (bool) {
        int256 lowerLimit = ABDKMath64x64.muli(
            ABDKMath64x64.sub(ABDKMath64x64.fromInt(1), limit),
            baseAmount
        );
        int256 upperLimit = ABDKMath64x64.muli(
            ABDKMath64x64.add(ABDKMath64x64.fromInt(1), limit),
            baseAmount
        );

        return (lowerLimit < realAmount) && (realAmount < upperLimit);
    }

    function getAmountsAddToken(address token, uint256 amount)
        public
        view
        returns (
            int256 addAmountA,
            int256 addAmountB,
            int256 addAmountY
        )
    {
        addAmountA = ABDKMath64x64.muli(
            ABDKMath64x64.divi(amounts[aTokenAddress], amounts[token]),
            int256(amount)
        );
        addAmountB = ABDKMath64x64.muli(
            ABDKMath64x64.divi(amounts[bTokenAddress], amounts[token]),
            int256(amount)
        );
        addAmountY = ABDKMath64x64.muli(
            ABDKMath64x64.divi(amounts[yTokenAddress], amounts[token]),
            int256(amount)
        );
    }

    function getPrice(address tokenIn, address tokenOut)
        public
        view
        returns (uint256 price)
    {
        int128 _price;
        if (tokenOut == aTokenAddress) {
            if (tokenIn == bTokenAddress) {
                _price = getAtoBPrice();
            } else if (tokenIn == yTokenAddress) {
                _price = getAtoYPrice();
            }
        } else if (tokenOut == bTokenAddress) {
            if (tokenIn == aTokenAddress) {
                _price = ABDKMath64x64.div(
                    ABDKMath64x64.fromInt(1),
                    getAtoBPrice()
                );
            } else if (tokenIn == yTokenAddress) {
                _price = ABDKMath64x64.div(getAtoYPrice(), getAtoBPrice());
            }
        } else if (tokenOut == yTokenAddress) {
            if (tokenIn == aTokenAddress) {
                _price = ABDKMath64x64.div(
                    ABDKMath64x64.fromInt(1),
                    getAtoYPrice()
                );
            } else if (tokenIn == bTokenAddress) {
                _price = ABDKMath64x64.div(getAtoBPrice(), getAtoYPrice());
            }
        }

        price = ABDKMath64x64.mulu(_price, 10**18);
    }

    function getAmountOut(
        int256 amountIn,
        address tokenIn,
        address tokenOut
    ) public view returns (uint256 amountOut) {
        int128 res = 0;
        uint8 decimal = 18;

        if (tokenIn == aTokenAddress) {
            if (tokenOut == bTokenAddress) {
                res = getAtoBAmount(
                    amounts[aTokenAddress] + amountIn,
                    amounts[bTokenAddress]
                );
                decimal = bDecimals;
            } else if (tokenOut == yTokenAddress) {
                res = getAtoYAmount(
                    amounts[aTokenAddress] + amountIn,
                    amounts[bTokenAddress]
                );
                decimal = yDecimals;
            }
        } else if (tokenIn == bTokenAddress) {
            if (tokenOut == aTokenAddress) {
                res = getAtoBAmount(
                    amounts[bTokenAddress] + amountIn,
                    amounts[aTokenAddress]
                );
                decimal = aDecimals;
            } else if (tokenOut == yTokenAddress) {
                res = getAtoYAmount(
                    amounts[bTokenAddress] + amountIn,
                    amounts[aTokenAddress]
                );
                decimal = yDecimals;
            }
        } else if (tokenIn == yTokenAddress) {
            if (tokenOut == aTokenAddress) {
                res = getYtoAAmount(
                    amounts[yTokenAddress] + amountIn,
                    amounts[aTokenAddress],
                    amounts[bTokenAddress]
                );
                decimal = aDecimals;
            } else if (tokenOut == bTokenAddress) {
                res = getYtoAAmount(
                    amounts[yTokenAddress] + amountIn,
                    amounts[bTokenAddress],
                    amounts[aTokenAddress]
                );
                decimal = bDecimals;
            }
        }

        // Swap fee: 0.3%
        if (decimal >= 3) {
            amountOut = uint256(
                ABDKMath64x64.muli(res, 997 * int256(10**(decimal - 3)))
            );
        } else {
            amountOut = uint256(
                ABDKMath64x64.muli(
                    ABDKMath64x64.div(
                        res,
                        ABDKMath64x64.fromUInt(10**(3 - decimal))
                    ),
                    997
                )
            );
        }

        require(amountOut > 0, "INSUFFICIENT_OUT_AMOUNT");

        return amountOut;
    }

    function getBalance(address token) public view returns (int256) {
        return amounts[token];
    }

    function addLiquidity(
        uint256 aAmount,
        uint256 bAmount,
        uint256 yAmount
    ) external {
        require(aAmount > 0, "INSUFFICIENT_INPUT_AMOUNT_TOKEN_A");
        require(bAmount > 0, "INSUFFICIENT_INPUT_AMOUNT_TOKEN_B");
        require(yAmount > 0, "INSUFFICIENT_INPUT_AMOUNT_TOKEN_Y");

        require(
            aToken.allowance(msg.sender, address(this)) >= aAmount,
            "INSUFFICIENT_APPROVE_AMOUNT_TOKEN_A"
        );

        require(
            bToken.allowance(msg.sender, address(this)) >= bAmount,
            "INSUFFICIENT_APPROVE_AMOUNT_TOKEN_B"
        );

        require(
            yToken.allowance(msg.sender, address(this)) >= yAmount,
            "INSUFFICIENT_APPROVE_AMOUNT_TOKEN_Y"
        );

        if (msg.sender != owner) {
            require(
                amounts[aTokenAddress] > 0 &&
                    amounts[bTokenAddress] > 0 &&
                    amounts[yTokenAddress] > 0,
                "INSUFFICIENT_LIQUIDITY_AMOUNT"
            );

            (int256 delta_a, int256 delta_b, ) = getAmountsAddToken(
                yTokenAddress,
                yAmount
            );

            require(
                checkLimit(delta_a, int256(aAmount), _mme) &&
                    checkLimit(delta_b, int256(bAmount), _mme),
                "MISMATCH_RATIO"
            );
        }

        aToken.transferFrom(msg.sender, address(this), aAmount);
        bToken.transferFrom(msg.sender, address(this), bAmount);
        yToken.transferFrom(msg.sender, address(this), yAmount);

        amounts[aTokenAddress] = amounts[aTokenAddress] + int256(aAmount);
        amounts[bTokenAddress] = amounts[bTokenAddress] + int256(bAmount);
        amounts[yTokenAddress] = amounts[yTokenAddress] + int256(yAmount);

        _mint(msg.sender, yAmount);

        _mu = muFunction();

        emit Deposit(aAmount, bAmount, yAmount, ABDKMath64x64.muli(_mu, 1000));
    }

    function removeLiquidity(uint256 amount) external {
        require(amount > 0, "INSUFFICIENT_WITHDRAW_AMOUNT");

        transferFrom(msg.sender, address(this), amount);
        _burn(address(this), amount);

        (int256 delta_a, int256 delta_b, ) = getAmountsAddToken(
            yTokenAddress,
            amount
        );

        _safeTransfer(aTokenAddress, msg.sender, uint256(delta_a));
        _safeTransfer(bTokenAddress, msg.sender, uint256(delta_b));
        _safeTransfer(yTokenAddress, msg.sender, uint256(amount));

        amounts[aTokenAddress] = amounts[aTokenAddress] - delta_a;
        amounts[bTokenAddress] = amounts[bTokenAddress] - delta_b;
        amounts[yTokenAddress] = amounts[yTokenAddress] - int256(amount);

        _mu = muFunction();

        emit Withdraw(
            uint256(delta_a),
            uint256(delta_b),
            amount,
            ABDKMath64x64.muli(_mu, 1000)
        );
    }

    function swapToken(
        uint256 amountIn,
        address tokenIn,
        address tokenOut,
        address recipient,
        uint256 slippage // define enum in the production
    ) external returns (uint256) {
        uint256 price = getPrice(tokenIn, tokenOut);

        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        IERC20 _tokenIn = IERC20(tokenIn);
        require(
            _tokenIn.allowance(msg.sender, address(this)) >= amountIn,
            "INSUFFICIENT_APPROVE_AMOUNT"
        );

        uint256 amountOut = getAmountOut(int256(amountIn), tokenIn, tokenOut);

        uint256 realPrice = (amountOut * (10**18)) / amountIn;

        require(
            checkLimit(
                int256(price),
                int256(realPrice),
                ABDKMath64x64.divu(slippage, uint256(precision))
            ),
            "NOT_ENOUGH_SLIPPAGE_LEVEL"
        );

        require(
            amounts[tokenOut] > int256(amountOut),
            "INSUFFICIENT_OUTPUT_AMOUNT"
        );

        _tokenIn.transferFrom(msg.sender, address(this), amountIn);

        amounts[tokenIn] += int256(amountIn);

        if (recipient == address(0))
            IERC20(tokenOut).transfer(msg.sender, amountOut);
        else IERC20(tokenOut).transfer(recipient, amountOut);

        amounts[tokenOut] -= int256(amountOut);

        emit Swap(amountIn, amountOut, tokenIn, tokenOut, msg.sender);

        return amountOut;
    }
}
