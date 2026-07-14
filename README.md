# Simple Uniswap

> ⚠️ 这是一个学习用的 Demo 项目，仅用于理解 Uniswap V2 的核心机制。

基于 Foundry + Next.js 实现的简化版 DEX，包含 swap 和流动性管理功能。

```
simple-uniswap/
├── contracts/    # Foundry 智能合约项目
└── web/          # Next.js 前端
```

## 快速开始

### 1. 合约部署

需要先安装 [Foundry](https://book.getfoundry.sh/getting-started/installation)。

```bash
# 安装依赖
cd contracts
forge install
forge build

# 配置环境变量(RPC、私钥等)
cp .env.example .env
# 编辑 .env,填入你自己的 Sepolia RPC 和测试网空钱包私钥

# 部署到 Sepolia
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify -vvvv

# 把打印出的地址填到 ../web/lib/addresses.ts 的 11155111 条目
```

### 2. 启动前端

```bash
cd web
pnpm install
pnpm dev
```

访问 http://localhost:3000，在 MetaMask 中连接 Sepolia 或 Mainnet 即可使用。

## 功能

- **Swap**: 代币兑换
- **Pool**: 添加/移除流动性
- **Pairs**: 查看所有交易对
- **Faucet**: 领取测试代币
