// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {TestToken} from "../src/TestToken.sol";
import {SimpleFactory} from "../src/SimpleFactory.sol";
import {SimpleRouter} from "../src/SimpleRouter.sol";
import {SimplePair} from "../src/SimplePair.sol";

/**
 * @title DeployBase
 * @notice 部署脚本的公共基类。DeployLocal 和 DeploySepolia 都继承它,只在选参上不同。
 *
 * 部署产物:
 *   - TKA / TKB 两个测试代币(带 faucet)
 *   - Factory / Router
 *   - TKA/TKB 交易对 + 初始流动性(1000:1000)
 *   - 一笔示例 swap
 *   - deployments/<chainId>.json  给前端消费
 */
abstract contract DeployBase is Script {
    struct DeployResult {
        address tka;
        address tkb;
        address factory;
        address router;
        address pair;
        address deployer;
        uint256 chainId;
    }

    /// @notice 子类实现,决定是否做示例 swap、初始 mint 数量等
    function _config()
        internal
        view
        virtual
        returns (uint256 tokenInitialSupply, uint256 initialLiquidity, uint256 swapAmount, bool doExampleSwap);

    function run() external returns (DeployResult memory result) {
        (uint256 tokenInitialSupply, uint256 initialLiquidity, uint256 swapAmount, bool doExampleSwap) = _config();

        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        console2.log("==============================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("Balance :", deployer.balance);
        console2.log("==============================");

        vm.startBroadcast(pk);

        // 1. 部署测试代币
        console2.log("[1/5] Deploying TestTokens...");
        TestToken tka = new TestToken("Token A", "TKA", tokenInitialSupply);
        TestToken tkb = new TestToken("Token B", "TKB", tokenInitialSupply);
        console2.log("      TKA:", address(tka));
        console2.log("      TKB:", address(tkb));

        // 2. Factory
        console2.log("[2/5] Deploying SimpleFactory...");
        SimpleFactory factory = new SimpleFactory(deployer);
        console2.log("      Factory:", address(factory));

        // 3. Router
        console2.log("[3/5] Deploying SimpleRouter...");
        SimpleRouter router = new SimpleRouter(address(factory));
        console2.log("      Router :", address(router));

        // 4. 建 pair + 初始流动性
        console2.log("[4/5] Adding initial liquidity...");
        tka.approve(address(router), type(uint256).max);
        tkb.approve(address(router), type(uint256).max);

        uint256 deadline = block.timestamp + 3600;
        router.addLiquidity(
            address(tka), address(tkb), initialLiquidity, initialLiquidity, 0, 0, deployer, deadline
        );
        address pairAddr = factory.getPair(address(tka), address(tkb));
        console2.log("      Pair   :", pairAddr);

        // 5. 示例 swap
        if (doExampleSwap && swapAmount > 0) {
            console2.log("[5/5] Example swap...");
            address[] memory path = new address[](2);
            path[0] = address(tka);
            path[1] = address(tkb);
            uint256[] memory expected = router.getAmountsOut(swapAmount, path);
            console2.log("      Expect out:", expected[1]);
            router.swapExactTokensForTokens(swapAmount, 0, path, deployer, deadline);
        }

        vm.stopBroadcast();

        result = DeployResult({
            tka: address(tka),
            tkb: address(tkb),
            factory: address(factory),
            router: address(router),
            pair: pairAddr,
            deployer: deployer,
            chainId: block.chainid
        });

        _writeDeployments(result);
    }

    /// @notice 把关键地址落盘到 deployments/<chainId>.json,前端 addresses.ts 直接 import
    function _writeDeployments(DeployResult memory r) internal {
        string memory json = "deployment";
        vm.serializeUint(json, "chainId", r.chainId);
        vm.serializeAddress(json, "deployer", r.deployer);
        vm.serializeAddress(json, "tka", r.tka);
        vm.serializeAddress(json, "tkb", r.tkb);
        vm.serializeAddress(json, "factory", r.factory);
        vm.serializeAddress(json, "router", r.router);
        string memory finalJson = vm.serializeAddress(json, "pair", r.pair);

        string memory path = string.concat("./deployments/", vm.toString(r.chainId), ".json");
        vm.writeJson(finalJson, path);
        console2.log("Deployment written to", path);
    }
}
