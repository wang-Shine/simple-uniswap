"use client";

import Link from "next/link";
import { useAccount, useChainId } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDeployment, isDeployed } from "@/lib/addresses";
import { shortAddr } from "@/lib/utils";

const FEATURES = [
  {
    href: "/swap",
    title: "Swap",
    desc: "按 x·y=k 恒定乘积公式交换代币，内含 0.3% 手续费与滑点保护。",
  },
  {
    href: "/pool",
    title: "Pool",
    desc: "添加或移除流动性，拿到 LP token，分享池子里的手续费收入。",
  },
  {
    href: "/pairs",
    title: "Pairs",
    desc: "查看已通过 Factory 创建的交易对与它们的储备量。",
  },
  {
    href: "/faucet",
    title: "Faucet",
    desc: "领取测试用 TKA / TKB，每个地址每种代币 1000 枚，只能领一次。",
  },
];

export default function Home() {
  const { address } = useAccount();
  const chainId = useChainId();
  const d = getDeployment(chainId);
  const deployed = isDeployed(d);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Simple<span className="text-[var(--color-primary)]">DEX</span>
        </h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/swap">
            <Button size="lg">开始交易</Button>
          </Link>
          <Link href="/faucet">
            <Button size="lg" variant="outline">
              先领点测试币
            </Button>
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 text-xs md:grid-cols-4">
          <div>
            <dt className="text-[var(--color-muted-foreground)]">网络</dt>
            <dd className="font-medium tabular-nums">chainId {chainId ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Factory</dt>
            <dd className="font-medium tabular-nums">{deployed && d ? shortAddr(d.factory) : "未部署"}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Router</dt>
            <dd className="font-medium tabular-nums">{deployed && d ? shortAddr(d.router) : "未部署"}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">你的账户</dt>
            <dd className="font-medium tabular-nums">{address ? shortAddr(address) : "未连接"}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="block">
            <Card className="h-full cursor-pointer transition-colors duration-150 hover:border-[var(--color-primary)]/50">
              <CardHeader>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-[var(--color-primary)]">
                {f.href} →
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
