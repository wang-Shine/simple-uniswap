// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SimpleLibrary
 * @notice DEX 核心数学库：排序、报价、swap 输入输出互算
 */
library SimpleLibrary {
    uint256 internal constant FEE_NUMERATOR = 3; // 0.3% 手续费
    uint256 internal constant FEE_DENOMINATOR = 1000;

    /// @notice 排序两个代币地址，保证同一对代币始终得到同一个顺序
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB && tokenA != address(0), "Invalid tokens");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    /// @notice 添加流动性时的等比报价（无手续费）：amountB = amountA * reserveB / reserveA
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) internal pure returns (uint256 amountB) {
        require(amountA > 0 && reserveA > 0 && reserveB > 0, "Invalid amounts");
        amountB = (amountA * reserveB) / reserveA;
    }

    /// @notice 精确输入换出多少：amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256 amountOut)
    {
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid amounts");
        uint256 amountInAfterFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = amountInAfterFee * reserveOut;
        uint256 denominator = reserveIn * FEE_DENOMINATOR + amountInAfterFee;
        amountOut = numerator / denominator;
    }

    /// @notice 反向计算：要换出 amountOut 需要投入多少
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256 amountIn)
    {
        require(amountOut > 0 && reserveIn > 0 && reserveOut > 0, "Invalid amounts");
        require(amountOut < reserveOut, "Insufficient liquidity");
        uint256 numerator = reserveIn * amountOut * FEE_DENOMINATOR;
        uint256 denominator = (reserveOut - amountOut) * (FEE_DENOMINATOR - FEE_NUMERATOR);
        amountIn = (numerator / denominator) + 1;
    }
}
