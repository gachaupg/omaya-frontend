/**
 * FX Primus deposit: resolve `admin_payment_detail_id` from public/admin payment rows.
 * Shared by express `deposit.tsx` and rates calculator.
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asPaymentDetailId = (v: unknown): string | null => {
  if (v == null) return null;
  const value = String(v).trim();
  if (!value) return null;
  return UUID_REGEX.test(value) ? value : null;
};

/** Resolve backend admin row id from a payment-method object (public + admin APIs use different shapes). */
export const getAdminPaymentDetailId = (payment: any): string | null => {
  if (!payment) return null;
  const p = payment as any;

  const fromNestedAdmin = (d: any): string | null => {
    if (!d || typeof d !== "object") return null;
    const nested = d.admin_payment_detail;
    if (nested && typeof nested === "object") {
      return (
        asPaymentDetailId(nested.admin_payment_detail_id) ||
        asPaymentDetailId(nested.id) ||
        null
      );
    }
    if (typeof nested === "string" || typeof nested === "number") {
      return asPaymentDetailId(nested);
    }
    return null;
  };

  /** Root provider row: never use generic `id` here — it is often provider_id, which backend rejects as admin_payment_detail_id */
  const pickFromRootRecord = (o: any): string | null => {
    if (!o || typeof o !== "object") return null;
    const keys = [
      "admin_payment_detail_id",
      "payment_detail_id",
      "detail_id",
      "bank_account_id",
      "admin_bank_id",
    ];
    for (const k of keys) {
      const id = asPaymentDetailId(o[k]);
      if (id && id !== "0") return id;
    }
    return null;
  };

  /** Nested payment_detail row: `id` is usually the admin payment detail PK */
  const pickFromDetailRecord = (o: any): string | null => {
    if (!o || typeof o !== "object") return null;
    const keys = [
      "admin_payment_detail_id",
      "payment_detail_id",
      "detail_id",
      "bank_account_id",
      "admin_bank_id",
      "id",
    ];
    for (const k of keys) {
      const id = asPaymentDetailId(o[k]);
      if (id && id !== "0") return id;
    }
    return null;
  };

  const fromDetail = (d: any): string | null => {
    if (!d || typeof d !== "object") return null;
    return (
      pickFromDetailRecord(d) ||
      fromNestedAdmin(d) ||
      (d.payment_detail && typeof d.payment_detail === "object"
        ? pickFromDetailRecord(d.payment_detail)
        : null) ||
      (d.detail && typeof d.detail === "object" ? pickFromDetailRecord(d.detail) : null)
    );
  };

  const direct =
    pickFromRootRecord(p) ||
    (p.admin_payment_detail && typeof p.admin_payment_detail === "object"
      ? pickFromDetailRecord(p.admin_payment_detail)
      : null);

  if (direct) return direct;

  const allDetails = [
    ...(Array.isArray(p.payment_details) ? p.payment_details : []),
    ...(Array.isArray(p.admin_payment_details) ? p.admin_payment_details : []),
  ];
  for (const d of allDetails) {
    const id = fromDetail(d);
    if (id) return id;
  }

  return null;
};

const normalizeProviderMatchName = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Public vs admin APIs often use slightly different provider labels. */
const providerNamesLooselyMatch = (a: string, b: string): boolean => {
  const na = normalizeProviderMatchName(a);
  const nb = normalizeProviderMatchName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 5 && nb.length >= 5 && (na.includes(nb) || nb.includes(na)))
    return true;
  return false;
};

const accountDigitsForMatch = (row: any): string => {
  const raw =
    row?.account_number ??
    row?.payment_details?.[0]?.account_number ??
    row?.payment_details?.[0]?.mobile_number ??
    "";
  return String(raw).replace(/\D/g, "");
};

/**
 * Public payment-methods API often omits admin UUIDs; admin wallet list has the canonical row.
 * Match by provider_name or provider_id, then read id from the admin-shaped object.
 */
const matchAdminPaymentDetailIdFromAdminList = (
  selectedPublicRow: any,
  adminMethods: any[] | undefined
): string | null => {
  if (!selectedPublicRow || !adminMethods?.length) return null;
  const name = String(
    selectedPublicRow.provider_name ||
      selectedPublicRow.payment_provider_name ||
      ""
  )
    .toLowerCase()
    .trim();
  const pid =
    selectedPublicRow.provider_id != null
      ? String(selectedPublicRow.provider_id)
      : "";

  const acct = accountDigitsForMatch(selectedPublicRow);
  if (acct.length >= 4) {
    for (const admin of adminMethods) {
      const aAcct = accountDigitsForMatch(admin);
      if (aAcct && aAcct === acct) {
        const id = getAdminPaymentDetailId(admin);
        if (id) return id;
      }
    }
  }

  for (const admin of adminMethods) {
    const an = String(admin?.provider_name || "")
      .toLowerCase()
      .trim();
    const pubName =
      selectedPublicRow.provider_name ||
      selectedPublicRow.payment_provider_name ||
      "";
    const matchName =
      name &&
      an &&
      (an === name || providerNamesLooselyMatch(pubName, admin?.provider_name));
    const matchPid =
      pid &&
      admin?.provider_id != null &&
      String(admin.provider_id) === pid;
    if (matchName || matchPid) {
      const id = getAdminPaymentDetailId(admin);
      if (id) return id;
    }
  }
  return null;
};

/**
 * Same source as `ForexDeposit.tsx` / ADMIN_PAYMENT_DETAILS â€” canonical UUIDs for forex API.
 */
const matchAdminPaymentDetailIdFromExchangeDetails = (
  selectedRow: any,
  details: any[] | undefined
): string | null => {
  if (!selectedRow || !details?.length) return null;
  const name =
    selectedRow.provider_name ||
    selectedRow.payment_provider_name ||
    selectedRow.linked_bank_provider?.provider_name ||
    "";
  const normName = normalizeProviderMatchName(name);
  if (!normName) return null;

  const acct = accountDigitsForMatch(selectedRow);
  if (acct.length >= 4) {
    for (const d of details) {
      const dAcct = String(d?.account_number ?? "")
        .replace(/\D/g, "");
      if (dAcct && dAcct === acct) {
        const id = asPaymentDetailId(d.admin_payment_detail_id);
        if (id) return id;
      }
    }
  }

  for (const d of details) {
    const dn = d?.provider_name ?? "";
    if (providerNamesLooselyMatch(name, dn)) {
      const id = asPaymentDetailId(d.admin_payment_detail_id);
      if (id) return id;
    }
  }
  return null;
};

const directNormalizedAdminPaymentDetailId = (p: any): string | null => {
  if (!p) return null;
  return asPaymentDetailId(p.admin_payment_detail_id);
};

/** Forex deposit: same id as normalized bank row + exchange ADMIN_PAYMENT_DETAILS (ForexDeposit pattern). */
export const resolveForexDepositAdminPaymentDetailId = (args: {
  effective: any;
  selected: any;
  payBank: string;
  methods: any[];
  adminMethods?: any[];
  /** From fetchAdminPaymentDetails â€” same IDs the standalone Forex deposit uses */
  exchangeAdminPaymentDetails?: any[];
}): string | null => {
  const fromList = findPaymentMethodInList(args.methods, args.payBank);
  const directChain = [
    directNormalizedAdminPaymentDetailId(args.effective),
    directNormalizedAdminPaymentDetailId(args.selected),
    directNormalizedAdminPaymentDetailId(fromList),
  ];
  for (const id of directChain) {
    if (id) return id;
  }
  const chain = [
    getAdminPaymentDetailId(args.effective),
    getAdminPaymentDetailId(args.selected),
    getAdminPaymentDetailId(fromList),
  ];
  for (const id of chain) {
    if (id) return id;
  }
  if (args.methods?.length === 1) {
    const one =
      directNormalizedAdminPaymentDetailId(args.methods[0]) ||
      getAdminPaymentDetailId(args.methods[0]);
    if (one) return one;
  }
  const candidates = [args.effective, args.selected, fromList].filter(Boolean);
  for (const row of candidates) {
    const fromExchange = matchAdminPaymentDetailIdFromExchangeDetails(
      row,
      args.exchangeAdminPaymentDetails
    );
    if (fromExchange) return fromExchange;
    const fromAdmin = matchAdminPaymentDetailIdFromAdminList(
      row,
      args.adminMethods
    );
    if (fromAdmin) return fromAdmin;
  }
  // Selected row can differ from list copy; scan all methods against exchange + admin APIs
  if (args.exchangeAdminPaymentDetails?.length && args.methods?.length) {
    for (const m of args.methods) {
      const id = matchAdminPaymentDetailIdFromExchangeDetails(
        m,
        args.exchangeAdminPaymentDetails
      );
      if (id) return id;
    }
  }
  if (args.adminMethods?.length && args.methods?.length) {
    for (const m of args.methods) {
      const id = matchAdminPaymentDetailIdFromAdminList(m, args.adminMethods);
      if (id) return id;
    }
  }
  return null;
};

/** APIs may send provider_name, payment_provider_name, nested bank, or only provider_id */
export const getPaymentMethodKey = (payment: any): string => {
  if (!payment) return "";
  const name = String(
    payment.provider_name ||
      payment.payment_provider_name ||
      payment.provider?.name ||
      payment.linked_bank_provider?.provider_name ||
      ""
  ).trim();
  if (name) return name;
  if (payment.provider_id != null && payment.provider_id !== "")
    return String(payment.provider_id);
  return "";
};

export const paymentMethodMatchesPayBank = (method: any, payBankName: string): boolean => {
  if (!method || payBankName == null) return false;
  const n = String(payBankName).toLowerCase().trim();
  if (!n) return false;
  const pn = String(method.provider_name || "").toLowerCase().trim();
  const ppn = String(method.payment_provider_name || "").toLowerCase().trim();
  if (pn && pn === n) return true;
  if (ppn && ppn === n) return true;
  if (method.provider_id != null && String(method.provider_id) === n) return true;
  return false;
};

export const findPaymentMethodInList = (
  methods: any[] | undefined,
  payBankName: string
): any | undefined => {
  if (!methods?.length || payBankName == null) return undefined;
  const trimmed = String(payBankName).trim();
  if (!trimmed) return undefined;
  const byName = methods.find((m) => paymentMethodMatchesPayBank(m, trimmed));
  if (byName) return byName;
  return methods.find(
    (m) => m?.provider_id != null && String(m.provider_id) === trimmed
  );
};

// Helper function to normalize payment details and ensure account_name/account_number are extracted
export const normalizePaymentDetails = (payment: any): any => {
  if (!payment) return null;

  // Get payment details from either payment_details or admin_payment_details
  const rawDetails =
    (payment as any).payment_details && (payment as any).payment_details.length > 0
      ? (payment as any).payment_details
      : (payment as any).admin_payment_details &&
        (payment as any).admin_payment_details.length > 0
        ? (payment as any).admin_payment_details
        : [];

  const firstDetail = rawDetails.length > 0 ? rawDetails[0] : null;

  // Ensure account_name and account_number are set (prefer root level, fallback to first detail)
  const account_name =
    (payment as any).account_name ||
    (firstDetail && firstDetail.account_name) ||
    "";

  const account_number =
    (payment as any).account_number ||
    (firstDetail && (firstDetail.account_number || firstDetail.mobile_number)) ||
    "";

  const mobile_number =
    (payment as any).mobile_number ||
    (firstDetail && firstDetail.mobile_number) ||
    null;

  const wallet_address =
    (payment as any).wallet_address ||
    (firstDetail && firstDetail.wallet_address) ||
    null;

  // Resolve admin_payment_detail_id (API may use id or nest in payment_details - e.g. FXPRIMUS)
  const admin_payment_detail_id = getAdminPaymentDetailId(payment);

  const providerName =
    (payment as any).provider_name ||
    (payment as any).payment_provider_name ||
    "";
  const methodType =
    (payment as any).payment_method_type ||
    (payment as any).payment_method ||
    "";

  // Return normalized payment object
  return {
    ...payment,
    provider_name: providerName,
    payment_method_type: methodType || (payment as any).payment_method_type,
    payment_details: rawDetails,
    account_name,
    account_number,
    mobile_number,
    wallet_address,
    ...(admin_payment_detail_id != null && { admin_payment_detail_id }),
  };
};
