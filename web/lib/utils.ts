import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddr(addr?: string, prefix = 6, suffix = 4) {
  if (!addr) return "";
  if (addr.length <= prefix + suffix) return addr;
  return `${addr.slice(0, prefix)}…${addr.slice(-suffix)}`;
}

// bigint 转字符串
export function formatUnits(value: bigint, decimals = 18, maxFrac = 6): string {
  const s = value.toString().padStart(decimals + 1, "0");
  const intPart = s.slice(0, -decimals);
  let fracPart = s.slice(-decimals);
  if (maxFrac < decimals) fracPart = fracPart.slice(0, maxFrac);
  fracPart = fracPart.replace(/0+$/, "");
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

// 字符串转 bigint
export function parseUnits(value: string, decimals = 18): bigint {
  if (!value || value === ".") return 0n;
  const [intPart = "0", fracRaw = ""] = value.split(".");
  const frac = (fracRaw + "0".repeat(decimals)).slice(0, decimals);
  const combined = (intPart + frac).replace(/^0+/, "") || "0";
  return BigInt(combined);
}

export function deadline(minutes = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
}

export function applySlippageMin(expected: bigint, slippagePct: number): bigint {
  const bps = Math.max(0, Math.min(10000, Math.round(slippagePct * 100)));
  return (expected * BigInt(10000 - bps)) / 10000n;
}

export function applySlippageMax(expected: bigint, slippagePct: number): bigint {
  const bps = Math.max(0, Math.min(10000, Math.round(slippagePct * 100)));
  return (expected * BigInt(10000 + bps)) / 10000n;
}
