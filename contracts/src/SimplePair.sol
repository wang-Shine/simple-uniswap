// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SimpleLibrary} from "./libraries/SimpleLibrary.sol";

/**
 * @title SimplePair
 * @notice 单个交易对的资金池，自身即为该池份额的 LP ERC20 Token
 * @dev reserve0/reserve1/blockTimestampLast 打包进一个 slot 省 gas（V2 原版做法）
 */
contract SimplePair is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    address public immutable factory;
    address public token0;
    address public token1;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    // TWAP 价格累积器：不做完整预言机合约，保留字段和累积逻辑用于理解 V2 相对 V1 的改进（抗单笔交易价格操纵）
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    constructor() ERC20("SimpleDEX LP", "SLP") {
        factory = msg.sender;
    }

    function initialize(address _token0, address _token1) external {
        require(msg.sender == factory && token0 == address(0), "Invalid init");
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /// @dev 每次 mint/burn/swap 之后都要调用，刷新 reserve 并累积 TWAP 价格
    function _update(uint256 balance0, uint256 balance1, uint112 _reserve0, uint112 _reserve1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "Overflow");

        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            price0CumulativeLast += (uint256(_reserve1) * 1e18 / _reserve0) * timeElapsed;
            price1CumulativeLast += (uint256(_reserve0) * 1e18 / _reserve1) * timeElapsed;
        }

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    /// @notice 添加流动性，铸造 LP。前置条件：token0/token1 已由调用方（Router）转入本合约
    function mint(address to) external nonReentrant returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            // 永久锁死最小流动性，防止首个 LP 用极端比例攻击后续 LP 的份额计算
            _mint(address(0xdead), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min((amount0 * _totalSupply) / _reserve0, (amount1 * _totalSupply) / _reserve1);
        }
        require(liquidity > 0, "Insufficient liquidity minted");
        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Mint(msg.sender, amount0, amount1);
    }

    /// @notice 移除流动性，销毁 LP。前置条件：要销毁的 LP token 已转入本合约自身
    function burn(address to) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        uint256 _totalSupply = totalSupply();
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;
        require(amount0 > 0 && amount1 > 0, "Insufficient liquidity burned");

        _burn(address(this), liquidity);
        IERC20(token0).safeTransfer(to, amount0);
        IERC20(token1).safeTransfer(to, amount1);

        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));
        _update(balance0, balance1, _reserve0, _reserve1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /// @notice 交易核心，乐观转账模式：先转出再校验输入，是 V2 支持 flash swap 的基础
    function swap(uint256 amount0Out, uint256 amount1Out, address to) external nonReentrant {
        require(amount0Out > 0 || amount1Out > 0, "Insufficient output");
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "Insufficient liquidity");
        require(to != token0 && to != token1, "Invalid to");

        if (amount0Out > 0) IERC20(token0).safeTransfer(to, amount0Out);
        if (amount1Out > 0) IERC20(token1).safeTransfer(to, amount1Out);

        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "Insufficient input");

        // K 值不变式：扣除 0.3% 手续费后 K 只能增不能减，是 x*y=k 在代码里的落地
        uint256 balance0Adjusted = balance0 * 1000 - amount0In * 3;
        uint256 balance1Adjusted = balance1 * 1000 - amount1In * 3;
        require(
            balance0Adjusted * balance1Adjusted >= uint256(_reserve0) * uint256(_reserve1) * 1_000_000, "K violated"
        );

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    /// @notice 应急工具：把多转入但未计入 reserve 的余额转给指定地址
    function skim(address to) external nonReentrant {
        IERC20(token0).safeTransfer(to, IERC20(token0).balanceOf(address(this)) - reserve0);
        IERC20(token1).safeTransfer(to, IERC20(token1).balanceOf(address(this)) - reserve1);
    }

    /// @notice 强制让 reserve 与实际余额同步
    function sync() external nonReentrant {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        _update(IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)), _reserve0, _reserve1);
    }
}
