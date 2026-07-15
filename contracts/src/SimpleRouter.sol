// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SimpleFactory} from "./SimpleFactory.sol";
import {SimplePair} from "./SimplePair.sol";
import {SimpleLibrary} from "./libraries/SimpleLibrary.sol";

/**
 * @title SimpleRouter
 * @notice 用户交互的主入口：添加/移除流动性、swap。自身不持有任何资产，
 *         只负责「计算 + 转账 + 调用 Pair」的封装。
 */
contract SimpleRouter {
    using SafeERC20 for IERC20;

    address public immutable factory;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "Expired");
        _;
    }

    constructor(address _factory) {
        factory = _factory;
    }

    function _pairFor(address tokenA, address tokenB) internal view returns (address) {
        return SimpleFactory(factory).getPair(tokenA, tokenB);
    }

    function _getReserves(address tokenA, address tokenB, bool allowMissing)
        internal
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        address pair = _pairFor(tokenA, tokenB);
        if (pair == address(0)) {
            require(allowMissing, "Pair not exist");
            return (0, 0);
        }
        (address token0,) = SimpleLibrary.sortTokens(tokenA, tokenB);
        (uint112 reserve0, uint112 reserve1,) = SimplePair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function getReserves(address tokenA, address tokenB) public view returns (uint256 reserveA, uint256 reserveB) {
        return _getReserves(tokenA, tokenB, false);
    }

    /// @notice 沿路径计算多跳 swap 的每一跳输出（简化版通常只用 path.length == 2）
    function getAmountsOut(uint256 amountIn, address[] calldata path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i], path[i + 1]);
            amounts[i + 1] = SimpleLibrary.getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    /// @notice 沿路径反推多跳 swap 需要的每一跳输入
    function getAmountsIn(uint256 amountOut, address[] calldata path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Invalid path");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i - 1], path[i]);
            amounts[i - 1] = SimpleLibrary.getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }

    /// @notice 添加流动性：pair 不存在则先创建，再按当前比例（或用户期望值）转入两种代币铸 LP
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        if (_pairFor(tokenA, tokenB) == address(0)) {
            SimpleFactory(factory).createPair(tokenA, tokenB);
        }

        (uint256 reserveA, uint256 reserveB) = _getReserves(tokenA, tokenB, true);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = SimpleLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = SimpleLibrary.quote(amountBDesired, reserveB, reserveA);
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "Insufficient A");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }

        address pair = _pairFor(tokenA, tokenB);
        IERC20(tokenA).safeTransferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pair, amountB);
        liquidity = SimplePair(pair).mint(to);
    }

    /// @notice 移除流动性：把 LP token 转入 pair 自身销毁，换回按比例的两种代币
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = _pairFor(tokenA, tokenB);
        require(pair != address(0), "Pair not exist");

        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = SimplePair(pair).burn(to);

        (address token0,) = SimpleLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient output");
    }

    /// @notice Swap：精确输入换尽量多的输出
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output");
        IERC20(path[0]).safeTransferFrom(msg.sender, _pairFor(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    /// @notice Swap：精确输出，投入不超过 amountInMax
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Excessive input");
        IERC20(path[0]).safeTransferFrom(msg.sender, _pairFor(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function _swap(uint256[] memory amounts, address[] calldata path, address finalTo) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = SimpleLibrary.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) =
                input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to = i < path.length - 2 ? _pairFor(output, path[i + 2]) : finalTo;
            SimplePair(_pairFor(input, output)).swap(amount0Out, amount1Out, to);
        }
    }
}
