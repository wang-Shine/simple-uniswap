// 前端 AMM 数学库，用于本地预估

export function sortTokens(a: `0x${string}`, b: `0x${string}`): [`0x${string}`, `0x${string}`] {
  if (a.toLowerCase() === b.toLowerCase()) {
    throw new Error("SimpleLibrary: IDENTICAL_ADDRESSES");
  }
  return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
}

export function quote(amountA: bigint, reserveA: bigint, reserveB: bigint): bigint {
  if (amountA <= 0n) throw new Error("INSUFFICIENT_AMOUNT");
  if (reserveA <= 0n || reserveB <= 0n) throw new Error("INSUFFICIENT_LIQUIDITY");
  return (amountA * reserveB) / reserveA;
}

// dy = (y * dx * 997) / (x * 1000 + dx * 997)
export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n) return 0n;
  if (reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

export function getAmountIn(amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountOut <= 0n) return 0n;
  if (reserveIn <= 0n || reserveOut <= 0n) return 0n;
  if (amountOut >= reserveOut) return 0n;
  const numerator = reserveIn * amountOut * 1000n;
  const denominator = (reserveOut - amountOut) * 997n;
  return numerator / denominator + 1n;
}

// 价格影响百分比
export function priceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): number {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0;
  const PRECISION = 10_000n;
  const before = (reserveOut * PRECISION) / reserveIn;
  const afterIn = reserveIn + amountIn;
  const afterOut = reserveOut - amountOut;
  if (afterIn <= 0n || afterOut <= 0n) return 0;
  const after = (afterOut * PRECISION) / afterIn;
  const impact = ((before - after) * 10_000n) / before;
  return Number(impact) / 100;
}
