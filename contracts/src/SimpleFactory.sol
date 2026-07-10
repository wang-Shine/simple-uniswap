// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SimplePair} from "./SimplePair.sol";
import {SimpleLibrary} from "./libraries/SimpleLibrary.sol";

/**
 * @title SimpleFactory
 * @notice 创建和管理交易对
 */
contract SimpleFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "Identical tokens");
        (address token0, address token1) = SimpleLibrary.sortTokens(tokenA, tokenB);
        require(getPair[token0][token1] == address(0), "Pair exists");

        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        pair = address(new SimplePair{salt: salt}());
        SimplePair(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "Forbidden");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "Forbidden");
        feeToSetter = _feeToSetter;
    }
}
