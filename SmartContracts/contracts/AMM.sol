// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./ABDKMath64x64.sol";

contract AMM {
    address public constant aTokenAddress =
        address(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);
    address public constant bTokenAddress =
        address(0xf76D4a441E4ba86A923ce32B89AFF89dBccAA075);
    address public constant yTokenAddress =
        address(0xaD6D458402F60fD3Bd25163575031ACDce07538D);

    int256 public constant precision = 1000;

    int128 _sigma;
    int128 _eta;

    int128 _one_minus_sigma;
    int128 _one_minus_eta;
    int128 _reverse_sigma;
    int128 _reverse_eta;
    int128 _eta_to_sigma;
    int128 _sigma_to_eta;

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

    event Swap(
        uint256 amountIn,
        uint256 amountOut,
        address tokenIn,
        address tokenOut,
        address indexed sender
    );

    constructor(int256 sigma, int256 eta, int256 mme) {
        aToken = IERC20(aTokenAddress);
        bToken = IERC20(bTokenAddress);
        yToken = IERC20(yTokenAddress);

        aDecimals = IERC20Metadata(aTokenAddress).decimals();
        bDecimals = IERC20Metadata(bTokenAddress).decimals();
        yDecimals = IERC20Metadata(yTokenAddress).decimals();

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

        amounts[aTokenAddress] = 0;
        amounts[bTokenAddress] = 0;
        amounts[yTokenAddress] = 0;
        owner = msg.sender;
    }

    function getPow(int128 x, int128 p) internal pure returns (int128) {
        return
            ABDKMath64x64.exp_2(ABDKMath64x64.mul(ABDKMath64x64.log_2(x), p));
    }

    function getAplusB(int128 a, int128 b) internal view returns (int128) {
        int128 aexp = getPow(a, _one_minus_sigma);
        int128 bexp = getPow(b, _one_minus_sigma);

        return getPow(ABDKMath64x64.add(aexp, bexp), _eta_to_sigma);
    }

    function muFunction() internal view returns (int128) {
        int128 a = ABDKMath64x64.divi(amounts[aTokenAddress], int256(10**aDecimals));
        int128 b = ABDKMath64x64.divi(amounts[bTokenAddress], int256(10**bDecimals));
        int128 y = ABDKMath64x64.divi(amounts[yTokenAddress], int256(10**yDecimals));

        return ABDKMath64x64.add(getAplusB(a, b), getPow(y, _one_minus_eta));
    }

    function getAtoY(int256 _a, int256 _b)
        internal
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

    function getYtoA(
        int256 _y,
        int256 _a,
        int256 _b
    ) internal view returns (int128 amountOut) {
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

    function getAtoB(int256 _a, int256 _b)
        internal
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

    function getAmountOut(
        int256 amountIn,
        address tokenIn,
        address tokenOut
    ) internal view returns (uint256 amountOut) {
        int128 res = 0;
        uint8 decimal = 18;

        if (tokenIn == aTokenAddress) {
            if (tokenOut == bTokenAddress) {
                res = getAtoB(
                    amounts[aTokenAddress] + amountIn,
                    amounts[bTokenAddress]
                );
                decimal = bDecimals;
            } else if (tokenOut == yTokenAddress) {
                res = getAtoY(
                    amounts[aTokenAddress] + amountIn,
                    amounts[bTokenAddress]
                );
                decimal = yDecimals;
            }
        } else if (tokenIn == bTokenAddress) {
            if (tokenOut == aTokenAddress) {
                res = getAtoB(
                    amounts[bTokenAddress] + amountIn,
                    amounts[aTokenAddress]
                );
                decimal = aDecimals;
            } else if (tokenOut == yTokenAddress) {
                res = getAtoY(
                    amounts[bTokenAddress] + amountIn,
                    amounts[aTokenAddress]
                );
                decimal = yDecimals;
            }
        } else if (tokenIn == yTokenAddress) {
            if (tokenOut == aTokenAddress) {
                res = getYtoA(
                    amounts[yTokenAddress] + amountIn,
                    amounts[aTokenAddress],
                    amounts[bTokenAddress]
                );
                decimal = aDecimals;
            } else if (tokenOut == bTokenAddress) {
                res = getYtoA(
                    amounts[yTokenAddress] + amountIn,
                    amounts[bTokenAddress],
                    amounts[aTokenAddress]
                );
                decimal = bDecimals;
            }
        }

        amountOut = uint256(ABDKMath64x64.muli(res, int256(10**decimal)));
        require(amountOut > 0, "INSUFFICIENT_OUT_AMOUNT");

        return amountOut;
    }

    function getBalance(address token) public view returns (int256) {
        return amounts[token];
    }


    function checkLimit(int baseAmount, int realAmount) private view returns (bool) {
      int lowerLimit = ABDKMath64x64.muli(ABDKMath64x64.sub(ABDKMath64x64.fromInt(1), _mme), baseAmount);
      int upperLimit = ABDKMath64x64.muli(ABDKMath64x64.add(ABDKMath64x64.fromInt(1), _mme), baseAmount);

      return (lowerLimit < realAmount) && (realAmount < upperLimit);
    }

    function addLiquidity(uint256 aAmount, uint256 bAmount, uint256 yAmount) public returns (bool) {
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
            amounts[aTokenAddress] > 0 && amounts[bTokenAddress] > 0 && amounts[yTokenAddress] > 0,
            "INSUFFICIENT_LIQUIDITY_AMOUNT"
          );

          int128 b_to_a = ABDKMath64x64.divi(amounts[bTokenAddress], amounts[aTokenAddress]);
          int128 y_to_a = ABDKMath64x64.divi(amounts[yTokenAddress], amounts[aTokenAddress]);

          int delta_b = ABDKMath64x64.muli(b_to_a, int(aAmount));
          int delta_y = ABDKMath64x64.muli(y_to_a, int(aAmount));

          require(
            checkLimit(delta_b, int(bAmount)) && checkLimit(delta_y, int(yAmount)),
            "MISMATCH_RATIO"
          );
        }

        aToken.transferFrom(msg.sender, address(this), aAmount);
        bToken.transferFrom(msg.sender, address(this), bAmount);
        yToken.transferFrom(msg.sender, address(this), yAmount);

        amounts[aTokenAddress] = amounts[aTokenAddress] + int256(aAmount);
        amounts[bTokenAddress] = amounts[bTokenAddress] + int256(bAmount);
        amounts[yTokenAddress] = amounts[yTokenAddress] + int256(yAmount);

        _mu = muFunction();
        emit Deposit(aAmount, bAmount, yAmount, ABDKMath64x64.muli(_mu, 1000));
        
        return true;
    }

    function swap(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) public returns (uint256) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        IERC20 _tokenIn = IERC20(tokenIn);
        require(
            _tokenIn.allowance(msg.sender, address(this)) >= amountIn,
            "INSUFFICIENT_APPROVE_AMOUNT"
        );

        uint256 amountOut = getAmountOut(int256(amountIn), tokenIn, tokenOut);

        require(
            amounts[tokenOut] > int256(amountOut),
            "INSUFFICIENT_OUTPUT_AMOUNT"
        );

        _tokenIn.transferFrom(msg.sender, address(this), amountIn);

        amounts[tokenIn] += int256(amountIn);

        IERC20(tokenOut).transfer(msg.sender, amountOut);

        amounts[tokenOut] -= int256(amountOut);

        emit Swap(amountIn, amountOut, tokenIn, tokenOut, msg.sender);

        return amountOut;
    }
}
