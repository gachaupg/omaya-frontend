/** Shared min-amount copy for Express withdrawal/deposit and Rates. */

/** ChangeNOW create-transaction 400 (amount below provider minimum). */
export const EXPRESS_CHANGE_NOW_TOO_SMALL_MESSAGE =
  "Amount is too small to complete the transaction.";

export function isChangeNowTransactionTooSmallError(text: unknown): boolean {
  const s = String(text ?? "").toLowerCase();
  if (!s) return false;
  if (isExpressBelowMinAmountError(s)) return true;

  const mentionsChangeNow =
    s.includes("changenow") || s.includes("changenow.io");
  const mentionsCreateFailure =
    s.includes("failed to create transaction") ||
    s.includes("error processing withdrawal");
  const mentionsBadRequest =
    s.includes("400") ||
    s.includes("bad request") ||
    s.includes("client error");

  if (
    mentionsCreateFailure &&
    mentionsBadRequest &&
    (mentionsChangeNow || s.includes("/v2/exchange"))
  ) {
    return true;
  }

  return false;
}

export function resolveExpressChangeNowTooSmallMessage(
  ...sources: unknown[]
): string | null {
  const texts = collectErrorTextCandidates(...sources);
  if (texts.some(isChangeNowTransactionTooSmallError)) {
    return EXPRESS_CHANGE_NOW_TOO_SMALL_MESSAGE;
  }
  return null;
}

export function isExpressBelowMinAmountError(text: unknown): boolean {
  return /deposit_too_small|too_small|below minimum|out of min amount/i.test(
    String(text ?? "")
  );
}

export function formatExpressMinAmountMessage(min: unknown): string {
  const raw = String(min ?? "").trim();
  if (!raw) return "Minimum amount required for this transaction.";
  const n = Number(raw);
  let display = raw;
  if (Number.isFinite(n) && !Number.isNaN(n)) {
    display = String(n);
    if (display.includes(".")) {
      display = display.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    }
  }
  return `Minimum amount required is ${display}.`;
}

export function extractMinAmountFromErrorPayload(
  ...sources: unknown[]
): number | string | null {
  for (const source of sources) {
    if (source == null) continue;
    if (typeof source === "number" || typeof source === "string") {
      const s = String(source).trim();
      if (s && !isExpressBelowMinAmountError(s) && !Number.isNaN(Number(s))) {
        return source as number | string;
      }
      continue;
    }
    if (typeof source !== "object") continue;

    const obj = source as Record<string, unknown>;
    const responseData =
      obj.response_data && typeof obj.response_data === "object"
        ? (obj.response_data as Record<string, unknown>)
        : obj;

    const payload =
      responseData.payload && typeof responseData.payload === "object"
        ? (responseData.payload as Record<string, unknown>)
        : null;
    const range =
      payload?.range && typeof payload.range === "object"
        ? (payload.range as Record<string, unknown>)
        : responseData.range && typeof responseData.range === "object"
          ? (responseData.range as Record<string, unknown>)
          : null;

    const min = range?.minAmount ?? range?.min_amount;
    if (min != null && String(min).trim() !== "" && !Number.isNaN(Number(min))) {
      return min as number | string;
    }
  }
  return null;
}

export function buildExpressMinAmountErrorText(
  payloads: unknown[],
  fallbackMin?: unknown
): string {
  const fromApi = extractMinAmountFromErrorPayload(...payloads);
  return formatExpressMinAmountMessage(fromApi ?? fallbackMin);
}

function collectErrorPayloads(...sources: unknown[]): unknown[] {
  const payloads: unknown[] = [];
  for (const source of sources) {
    if (source == null) continue;
    if (typeof source === "object") {
      const obj = source as Record<string, unknown>;
      payloads.push(source);
      if (obj.payload) payloads.push(obj.payload);
      if (obj.response_data) payloads.push(obj.response_data);
      const response = obj.response as Record<string, unknown> | undefined;
      if (response?.data) payloads.push(response.data);
    }
  }
  return payloads;
}

function collectErrorTextCandidates(...sources: unknown[]): string[] {
  const texts: string[] = [];
  const push = (value: unknown) => {
    const s = String(value ?? "").trim();
    if (s) texts.push(s);
  };

  for (const source of sources) {
    if (source == null) continue;
    if (typeof source === "string") {
      push(source);
      continue;
    }
    if (typeof source !== "object") continue;
    const obj = source as Record<string, unknown>;
    push(obj.message);
    push(obj.error);
    if (obj.payload && typeof obj.payload === "object") {
      const p = obj.payload as Record<string, unknown>;
      push(p.message);
      push(p.error);
    }
    const responseData = obj.response_data;
    if (responseData && typeof responseData === "object") {
      const rd = responseData as Record<string, unknown>;
      push(rd.message);
      push(rd.error);
      if (rd.payload && typeof rd.payload === "object") {
        const p = rd.payload as Record<string, unknown>;
        push(p.message);
        push(p.error);
      }
    }
    const response = obj.response as Record<string, unknown> | undefined;
    const data = response?.data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      push(d.message);
      push(d.error);
      if (d.response_data && typeof d.response_data === "object") {
        const rd = d.response_data as Record<string, unknown>;
        push(rd.message);
        push(rd.error);
      }
    }
  }

  return texts;
}

/** Map API / ChangeNOW estimate errors (e.g. "Out of min amount") to user-facing copy. */
export function resolveExpressMinAmountDisplayError(
  ...sources: unknown[]
): string | null {
  const changeNowMsg = resolveExpressChangeNowTooSmallMessage(...sources);
  if (changeNowMsg) return changeNowMsg;

  const texts = collectErrorTextCandidates(...sources);
  if (!texts.some(isExpressBelowMinAmountError)) return null;
  const payloads = collectErrorPayloads(...sources);
  return buildExpressMinAmountErrorText(payloads);
}

/** Normalize any backend error line; rewrites min-amount failures. */
export function normalizeExpressApiErrorMessage(
  message: unknown,
  ...payloadSources: unknown[]
): string {
  const minMsg = resolveExpressMinAmountDisplayError(message, ...payloadSources);
  if (minMsg) return minMsg;
  const text = String(message ?? "").trim();
  return text || buildExpressMinAmountErrorText(collectErrorPayloads(...payloadSources));
}

/** Parse estimate API body (object or JSON string). */
export function normalizeExpressErrorBody(body: unknown): Record<string, unknown> | null {
  if (body == null) return null;
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof body === "object") return body as Record<string, unknown>;
  return null;
}
