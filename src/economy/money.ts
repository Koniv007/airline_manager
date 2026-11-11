/** Sandbox cash is Infinity, so normal maths (cash - price) keeps working. */
export function formatMoney(cash: number): string {
  return Number.isFinite(cash) ? `$${cash.toLocaleString("en-US")}` : "∞";
}
