// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {TestToken} from "../src/TestToken.sol";
import {SimpleFactory} from "../src/SimpleFactory.sol";
import {SimpleRouter} from "../src/SimpleRouter.sol";
import {SimplePair} from "../src/SimplePair.sol";

/**
 * @title Deploy
 * @notice 一键部署：两个测试代币 + Factory + Router + 初始流动性（1000:1000）
 *
 * 用法：
 *   forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify -vvvv
 *
 * 部署完把打印出的地址填到 web/lib/addresses.ts
 */
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(pk);

        // 1. 部署测试代币，给部署者铸一些初始供应用于建池
        TestToken tka = new TestToken("Token A", "TKA", 10_000 ether);
        TestToken tkb = new TestToken("Token B", "TKB", 10_000 ether);

        // 2. Factory + Router
        SimpleFactory factory = new SimpleFactory(deployer);
        SimpleRouter router = new SimpleRouter(address(factory));

        // 3. 建 pair + 初始流动性
        tka.approve(address(router), type(uint256).max);
        tkb.approve(address(router), type(uint256).max);
        router.addLiquidity(
            address(tka), address(tkb), 1_000 ether, 1_000 ether, 0, 0, deployer, block.timestamp + 3600
        );
        address pair = factory.getPair(address(tka), address(tkb));

        vm.stopBroadcast();

        console2.log("");
        console2.log("=== Deployment Summary ===");
        console2.log("TKA:     ", address(tka));
        console2.log("TKB:     ", address(tkb));
        console2.log("Factory: ", address(factory));
        console2.log("Router:  ", address(router));
        console2.log("Pair:    ", pair);
    }
}
