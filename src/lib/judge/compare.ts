/** Serialize a value for display ("Got"/"Expected" lines). */
export function formatValue(value: unknown): string {
  if (typeof value === "undefined") return "undefined";
  try {
    const json = JSON.stringify(value);
    return typeof json === "string" ? json : String(value);
  } catch {
    return String(value);
  }
}

/** Deep equality via JSON. Handles arrays/objects/primitives. NaN-safe. */
export function outputsEqual(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "number" && typeof expected === "number") {
    if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
  }
  try {
    return JSON.stringify(actual) === JSON.stringify(expected);
  } catch {
    return actual === expected;
  }
}
