// 前端 AMM 数学库，用于本地预估

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

