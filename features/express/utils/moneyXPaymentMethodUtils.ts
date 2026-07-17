export function getMoneyXProviderId(method: any): string | null {
  if (!method) return null;
  const providerId = String(
    method?.provider_id ?? method?.providerId ?? method?.id ?? ""
  ).trim();
  return providerId || null;
}

export function matchMoneyXMethodById(
  methods: any[],
  id: string | null | undefined
): any | null {
  if (!id || !Array.isArray(methods)) return null;
  return methods.find((m) => getMoneyXProviderId(m) === id) ?? null;
}

export function pickOtherMoneyXMethod(
  methods: any[],
  excludeId: string | null | undefined
): any | null {
  if (!Array.isArray(methods) || methods.length === 0) return null;
  const other = methods.find((m) => getMoneyXProviderId(m) !== excludeId);
  return other ?? methods[0] ?? null;
}
