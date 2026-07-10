// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DeployBase} from "./DeployBase.sol";

/**
 * @notice 部署到本地 Anvil。
 *
 * 用法:
 *   1. 启动本地节点:      anvil
 *   2. 复制 anvil 打印出的第一个 private key(默认是 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
 *      到 .env 里的 PRIVATE_KEY
 *   3. 部署:              forge script script/DeployLocal.s.sol --rpc-url localhost --broadcast
 */
contract DeployLocal is DeployBase {
    function _config()
        internal
        pure
        override
        returns (uint256 tokenInitialSupply, uint256 initialLiquidity, uint256 swapAmount, bool doExampleSwap)
    {
        tokenInitialSupply = 1_000_000 ether;
        initialLiquidity = 1_000 ether;
        swapAmount = 10 ether;
        doExampleSwap = true;
    }
}
