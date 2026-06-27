export function uiAmountToBaseUnits(value: string, decimals: number): string {
  const normalized = value.trim();
  if (!/^\d*(?:\.\d*)?$/.test(normalized) || normalized === "" || normalized === ".") {
    throw new Error("Enter a valid token amount.");
  }

  const [wholePart = "0", fractionPart = ""] = normalized.split(".");
  const whole = wholePart || "0";
  const fraction = fractionPart.slice(0, decimals).padEnd(decimals, "0");
  const scale = BigInt(10) ** BigInt(decimals);
  const baseUnits = BigInt(whole) * scale + BigInt(fraction || "0");

  if (baseUnits <= BigInt(0)) {
    throw new Error("Amount must be greater than zero.");
  }

  return baseUnits.toString();
}

export function baseUnitsToUiAmount(value: string | number, decimals: number): number {
  const amount = typeof value === "number" ? String(value) : value;
  if (!/^\d+$/.test(amount)) return 0;

  const scale = 10 ** decimals;
  return Number(amount) / scale;
}
