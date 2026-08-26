import {
  CHATWOOT_DEFAULT_PHONE_COUNTRY_CODE,
  CHATWOOT_DEFAULT_PHONE_DIAL_CODE,
} from "./defaultPhoneCountry";

type StoredChatwootUser = {
  id?: number | string;
  user_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
};

function readStoredUser(): StoredChatwootUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredChatwootUser;
  } catch {
    return null;
  }
}

function formatSomaliaPhoneNumber(raw?: string): string | undefined {
  const value = String(raw ?? "").trim();
  if (!value) {
    return undefined;
  }

  if (value.startsWith("+")) {
    return value;
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }

  if (digits.startsWith("252")) {
    return `+${digits}`;
  }

  return `${CHATWOOT_DEFAULT_PHONE_DIAL_CODE}${digits.replace(/^0+/, "")}`;
}

function buildDisplayName(user: StoredChatwootUser): string | undefined {
  const name = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || user.email || undefined;
}

/** Attach logged-in OMAYA user details so Chatwoot pre-chat can default to Somalia (+252). */
export function identifyChatwootUser(): void {
  if (typeof window === "undefined" || !window.$chatwoot?.setUser) {
    return;
  }

  const user = readStoredUser();
  if (!user) {
    return;
  }

  const identifier = user.user_id || user.id || user.email;
  if (!identifier) {
    return;
  }

  const name = buildDisplayName(user);
  if (!name && !user.email) {
    return;
  }

  try {
    window.$chatwoot.setUser(String(identifier), {
      email: user.email,
      name,
      phone_number: formatSomaliaPhoneNumber(user.phone_number),
      country_code: CHATWOOT_DEFAULT_PHONE_COUNTRY_CODE,
    });
  } catch {
    // Non-blocking — widget still opens without identified user.
  }
}
