// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DeployBase} from "./DeployBase.sol";

/**
 * @notice 部署到 Sepolia 测试网。
 *
 * 用法:
 *   .env 里配好 SEPOLIA_RPC_URL / PRIVATE_KEY / ETHERSCAN_API_KEY
 *   forge script script/DeploySepolia.s.sol \
 *       --rpc-url sepolia \
 *       --broadcast \
 *       --verify \
 *       -vvvv
 *
 * 注意:测试网 Gas 有限,初始流动性设成 100:100 就够演示。
 */
contract DeploySepolia is DeployBase {
    function _config()
        internal
        pure
        override
        returns (uint256 tokenInitialSupply, uint256 initialLiquidity, uint256 swapAmount, bool doExampleSwap)
    {
        tokenInitialSupply = 10_000 ether;
        initialLiquidity = 100 ether;
        swapAmount = 0;
        doExampleSwap = false;
    }
}
