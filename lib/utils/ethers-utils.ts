/**
 * Parse token amounts from human-readable to wei
 * Supports up to 18 decimals
 */
export function parseUnits(value: string, decimals = 18): bigint {
  const [whole, fraction = ""] = value.split(".")
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals)
  return BigInt(whole + paddedFraction)
}

/**
 * Format token amounts from wei to human-readable
 * Supports up to 18 decimals
 */
export function formatUnits(value: bigint, decimals = 18): string {
  const valueStr = value.toString().padStart(decimals + 1, "0")
  const whole = valueStr.slice(0, -decimals) || "0"
  const fraction = valueStr.slice(-decimals).replace(/0+$/, "")
  return fraction ? `${whole}.${fraction}` : whole
}
