export function formatPrice(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function dollarsToCents(dollars: string | number): number {
  const n = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsToDollarString(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

import { categories } from "@/lib/mock/data";

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.slug, c.name]),
);

export const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  vintage: "Vintage",
};
