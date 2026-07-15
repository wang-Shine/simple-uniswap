// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestToken
 * @notice 测试用 ERC20 代币，仅用于本地和测试网，主网部署绝对不要这么做！
 *
 * @dev 两种铸币方式：
 *      1. faucet() —— 任何地址都能领 FAUCET_AMOUNT 个代币，但每个地址每种代币只能领一次
 *      2. mint()   —— 只有 owner 能调，方便部署脚本 / 测试搭初始场景
 */
contract TestToken is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 1000 * 1e18;

    mapping(address => bool) public hasClaimed;

    event FaucetClaimed(address indexed user, uint256 amount);

    constructor(string memory name_, string memory symbol_, uint256 initialSupply)
        ERC20(name_, symbol_)
        Ownable(msg.sender)
    {
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    /// @notice owner 给指定地址铸造任意数量代币
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice 领取水龙头奖励：每个地址每种代币只能调用一次
    function faucet() external {
        require(!hasClaimed[msg.sender], "TestToken: ALREADY_CLAIMED");
        hasClaimed[msg.sender] = true;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }
}
