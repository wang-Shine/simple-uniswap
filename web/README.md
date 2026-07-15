# web

SimpleDEX 前端。项目根 README 见 [../README.md](../README.md)。

## 快速开始

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

打开 http://localhost:3000。

## 目录

```
web/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx         # 顶层布局,挂 Providers + Navbar
│   ├── page.tsx           # 首页
│   ├── swap/              # 交换
│   ├── pool/              # 添加/移除流动性
│   ├── pairs/             # 所有 pair 列表
│   └── faucet/            # 领测试币
├── components/
│   ├── providers.tsx      # wagmi + react-query + Reown AppKit
│   ├── navbar.tsx         # 顶栏
│   ├── connect-guard.tsx  # 未连接钱包 / 未部署时的占位
│   ├── token-amount-input.tsx  # 金额 + token 下拉
│   └── ui/                # shadcn 风格原子组件(手写,无 radix)
├── hooks/
│   ├── useGuardedChain.ts # 统一守卫:钱包 + 链 + 部署地址
│   ├── useTokenBalance.ts # 读 ERC20 余额
│   ├── useAllowance.ts    # 读 allowance
│   ├── useApproveIfNeeded.ts  # 不够就 approve max
│   ├── usePairReserves.ts # 读池子储备
│   └── useTx.ts           # 统一写交易(带 toast)
└── lib/
    ├── abi/               # 合约 ABI(手写最小可用集)
    ├── addresses.ts       # 部署地址(合约部署完手动填进去)
    ├── amm.ts             # 前端 AMM 数学(和 SimpleLibrary.sol 一致)
    ├── utils.ts           # cn / formatUnits / parseUnits / deadline / 滑点
    └── wagmi.ts           # wagmi + chains 配置
```

## 常用命令

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 起开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 起生产服务 |
| `pnpm lint` | Next.js lint |

## 环境变量

`.env.local`:

```
NEXT_PUBLIC_REOWN_PROJECT_ID=YOUR_PROJECT_ID   # https://cloud.reown.com
NEXT_PUBLIC_SEPOLIA_RPC=                       # 可选,覆盖默认公共节点
```

不填 projectId 也能跑,但不推荐(AppKit 会警告)。

## 交互流程速查

Swap:

```
输入 amountIn
  → lib/amm.getAmountOut(amountIn, reserveIn, reserveOut)  # 前端本地预估
  → 用滑点算 amountOutMin
  → approve tokenIn -> router(如 allowance 不足)
  → router.swapExactTokensForTokens(...)
```

Add liquidity:

```
输入 amountA
  → 池子已存在则 quote(a, rA, rB) 反推 amountB;否则用户手填
  → approve(A) + approve(B)
  → router.addLiquidity(...)
```

Remove liquidity:

```
输入要 burn 的 LP 数量
  → 按 liquidity/totalSupply 预估能取回的两种代币
  → approve LP -> router
  → router.removeLiquidity(...)
```
