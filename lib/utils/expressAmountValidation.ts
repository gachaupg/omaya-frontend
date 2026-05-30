import {
  enforceMoneyXAmountDigitLimit,
  MONEYX_MAX_AMOUNT_INPUT_DIGITS,
} from "@/lib/utils/moneyXAmountInput";
import {
  EXPRESS_CHANGE_NOW_TOO_SMALL_MESSAGE,
  isChangeNowTransactionTooSmallError,
} from "@/lib/utils/expressMinAmount";

/** Max digit characters (0–9) in one express amount field, including fractional part. */
export const EXPRESS_MAX_AMOUNT_INPUT_DIGITS = MONEYX_MAX_AMOUNT_INPUT_DIGITS;

export const EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE =
  "Amount can't be more than 12 characters";

export const EXPRESS_AMOUNT_POSITIVE_MESSAGE =
  "Please enter a valid amount greater than 0";

export const EXPRESS_WITHDRAWAL_AMOUNT_TOO_BIG_MESSAGE =
  "Amount too big to process";

export const enforceExpressAmountDigitLimit = enforceMoneyXAmountDigitLimit;

const WITHDRAWAL_DECIMAL_INVALID_PATTERNS = [
  /decimal\.invalidoperation/i,
  /\[<class\s+'decimal\.invalidoperation'>\]/i,
  /error processing withdrawal/i,
];

export function isExpressWithdrawalDecimalInvalidOperationError(
  message: string
): boolean {
  const m = String(message || "").trim();
  if (!m) return false;
  if (!WITHDRAWAL_DECIMAL_INVALID_PATTERNS.some((re) => re.test(m))) {
    return false;
  }
  return (
    /invalidoperation/i.test(m) ||
    /decimal\.invalidoperation/i.test(m)
  );
}

const DIGIT_LIMIT_PATTERNS = [
  /requested_amount/i,
  /20\s*digits/i,
  /12\s*digits/i,
  /no more than\s*12/i,
  /validation errors:.*requested_amount/i,
];

const POSITIVE_AMOUNT_PATTERNS = [
  /must be a positive number/i,
  /invalid amount/i,
  /^exchange\b/i,
];

export function isExpressAmountDigitLimitMessage(message: string): boolean {
  const m = String(message || "").trim();
  if (!m) return false;
  if (m === EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE) return true;
  return DIGIT_LIMIT_PATTERNS.some((re) => re.test(m));
}

export function isExpressAmountPositiveMessage(message: string): boolean {
  const m = String(message || "").trim();
  if (!m) return false;
  if (m === EXPRESS_AMOUNT_POSITIVE_MESSAGE) return true;
  return POSITIVE_AMOUNT_PATTERNS.some((re) => re.test(m));
}

export function isExpressAmountValidationMessage(message: string): boolean {
  return (
    isExpressAmountDigitLimitMessage(message) ||
    isExpressAmountPositiveMessage(message)
  );
}

export function mapExpressAmountApiMessages(messages: string[]): string | null {
  const texts = messages.map((m) => String(m || "").trim()).filter(Boolean);
  if (!texts.length) return null;
  if (texts.some((t) => isExpressAmountDigitLimitMessage(t))) {
    return EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE;
  }
  if (texts.some((t) => isExpressAmountPositiveMessage(t))) {
    return EXPRESS_AMOUNT_POSITIVE_MESSAGE;
  }
  return null;
}

export function getExpressAmountFieldErrorsFromResponse(
  data: unknown
): string[] | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const fromRequested = d.requested_amount;
  if (Array.isArray(fromRequested)) return fromRequested.map(String);

  const exchange = d.exchange;
  if (typeof exchange === "string") return [exchange];
  if (Array.isArray(exchange)) return exchange.map(String);

  const err = d.error;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (Array.isArray(e.requested_amount)) return e.requested_amount.map(String);
    if (Array.isArray(e.amount)) return e.amount.map(String);
  }

  return null;
}

export function resolveExpressAmountInlineError(error: unknown): string | null {
  if (typeof error === "string") {
    if (isChangeNowTransactionTooSmallError(error)) {
      return EXPRESS_CHANGE_NOW_TOO_SMALL_MESSAGE;
    }
    if (isExpressWithdrawalDecimalInvalidOperationError(error)) {
      return EXPRESS_WITHDRAWAL_AMOUNT_TOO_BIG_MESSAGE;
    }
    if (isExpressAmountDigitLimitMessage(error)) {
      return EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE;
    }
    if (isExpressAmountPositiveMessage(error)) {
      return EXPRESS_AMOUNT_POSITIVE_MESSAGE;
    }
    return null;
  }

  const responseData =
    (error as { response?: { data?: unknown } })?.response?.data ?? error;

  if (responseData && typeof responseData === "object") {
    const d = responseData as Record<string, unknown>;
    const apiError = [d.error, d.message, d.detail, d.details]
      .filter((v) => typeof v === "string")
      .map(String);
    if (apiError.some(isChangeNowTransactionTooSmallError)) {
      return EXPRESS_CHANGE_NOW_TOO_SMALL_MESSAGE;
    }
    if (apiError.some(isExpressWithdrawalDecimalInvalidOperationError)) {
      return EXPRESS_WITHDRAWAL_AMOUNT_TOO_BIG_MESSAGE;
    }
  }

  const fieldErrors = getExpressAmountFieldErrorsFromResponse(responseData);
  if (fieldErrors) {
    const mapped = mapExpressAmountApiMessages(fieldErrors);
    if (mapped) return mapped;
  }

  const msg = String(
    (error as { message?: string })?.message ??
      (typeof error === "object" && error !== null ? "" : error) ??
      ""
  ).trim();

  if (!msg) return null;

  if (isChangeNowTransactionTooSmallError(msg)) {
    return EXPRESS_CHANGE_NOW_TOO_SMALL_MESSAGE;
  }
  if (isExpressWithdrawalDecimalInvalidOperationError(msg)) {
    return EXPRESS_WITHDRAWAL_AMOUNT_TOO_BIG_MESSAGE;
  }
  if (isExpressAmountDigitLimitMessage(msg)) {
    return EXPRESS_AMOUNT_DIGIT_LIMIT_MESSAGE;
  }
  if (isExpressAmountPositiveMessage(msg)) {
    return EXPRESS_AMOUNT_POSITIVE_MESSAGE;
  }

  return null;
}

export function applyExpressAmountSubmitError(
  error: unknown,
  setApiValidationError: (message: string | null) => void,
  setValidationErrors: (errors: string[]) => void
): boolean {
  const inline = resolveExpressAmountInlineError(error);
  if (inline) {
    setApiValidationError(inline);
    setValidationErrors([]);
    return true;
  }
  return false;
}
