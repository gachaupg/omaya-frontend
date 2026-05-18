/**
 * Normalizes decimal amount strings while the user types.
 * Strips redundant leading zeros (e.g. "000004102" → "4102") but preserves
 * "0", "0.", and "0.5" while entering decimals.
 */
export function stripLeadingZerosFromDecimalInput(value: string): string {
  if (!value) return "";

  let sign = "";
  let body = value;
  if (body.startsWith("-")) {
    sign = "-";
    body = body.slice(1);
  }

  const hasTrailingDot = body.endsWith(".");
  const dotIndex = body.indexOf(".");

  let intPart: string;
  let fracPart: string | undefined;

  if (dotIndex === -1) {
    intPart = body;
    fracPart = undefined;
  } else {
    intPart = body.slice(0, dotIndex);
    fracPart = body.slice(dotIndex + 1);
  }

  if (intPart === "" && (fracPart !== undefined || hasTrailingDot)) {
    intPart = "0";
  } else if (intPart !== "") {
    intPart = intPart.replace(/^0+/, "") || "0";
  }

  let result = sign + intPart;
  if (fracPart !== undefined) {
    result += "." + fracPart;
  } else if (hasTrailingDot) {
    result += ".";
  }

  return result;
}
