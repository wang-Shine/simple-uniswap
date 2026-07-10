# deployments

这个目录存的是各链的合约地址(前端读取的唯一入口)。

- `31337.json` — 本地 Anvil
- `11155111.json` — Sepolia 测试网

## 部署后如何同步

Foundry 部署脚本(`contracts/script/Deploy*.s.sol`)会把地址写到
`contracts/deployments/<chainId>.json`。部署完直接拷贝过来:

```bash
# 从 SimpleDEX-foundry/ 项目根:
cp contracts/deployments/31337.json web/lib/deployments/31337.json
cp contracts/deployments/11155111.json web/lib/deployments/11155111.json
```

之后重启 `pnpm dev` 让 Next.js 重新读入这些 JSON。
