/** Flatten public payment-methods API payloads into a deduped provider list. */

const isActivePayment = (payment: any) => {
  if (!String(payment?.provider_name || payment?.provider?.provider_name || "").trim()) {
    return false;
  }
  if (payment.is_active === undefined || payment.is_active === null) return true;
  return (
    payment.is_active === true ||
    payment.is_active === "true" ||
    payment.is_active === 1 ||
    payment.is_active === "1"
  );
};

export function normalizePublicPaymentMethods(payload: unknown): any[] {
  if (!payload) return [];

  const root = payload as any;
  const data = root?.data ?? root;

  const sourceLists = [
    data?.providers,
    data?.payment_providers,
    data?.payment_methods,
    data?.results,
    root?.providers,
    root?.payment_providers,
    root?.payment_methods,
    root?.results,
    Array.isArray(data) ? data : null,
    Array.isArray(root) ? root : null,
  ].filter(Array.isArray) as any[][];

  const flattenedMethods: any[] = [];

  sourceLists.forEach((list) =>
    list.forEach((item: any) => {
      if (Array.isArray(item?.providers)) {
        const methodType =
          item?.method_name ||
          item?.method_display ||
          item?.payment_method_type ||
          item?.method?.method_name ||
          item?.method?.method_display ||
          item?.method ||
          "";

        item.providers.forEach((provider: any) => {
          flattenedMethods.push({
            ...provider,
            provider_name:
              provider?.provider_name ||
              provider?.provider ||
              provider?.name ||
              "",
            short_name: provider?.short_name || "",
            payment_method:
              provider?.method_display ||
              provider?.method ||
              provider?.payment_method ||
              provider?.payment_method_type ||
              methodType ||
              "",
            payment_method_type:
              provider?.method ||
              provider?.payment_method_type ||
              methodType ||
              "",
            logo:
              provider?.logo || provider?.provider_logo || provider?.logo_url,
            provider_logo:
              provider?.provider_logo || provider?.logo || provider?.logo_url,
            is_active: provider?.is_active ?? item?.is_active ?? true,
          });
        });
        return;
      }

      flattenedMethods.push({
        ...item,
        provider_name:
          item?.provider_name || item?.provider || item?.name || "",
        short_name: item?.short_name || "",
        payment_method:
          item?.method_display ||
          item?.method ||
          item?.payment_method ||
          item?.payment_method_type ||
          item?.method?.method_display ||
          item?.method?.method_name ||
          item?.method_name ||
          "",
        payment_method_type:
          item?.method ||
          item?.payment_method_type ||
          item?.method?.method_name ||
          item?.method_name ||
          "",
        logo: item?.logo || item?.provider_logo || item?.logo_url,
        provider_logo: item?.provider_logo || item?.logo || item?.logo_url,
      });
    })
  );

  const activeMethods = flattenedMethods.filter(isActivePayment);

  return Array.from(
    new Map(
      activeMethods.map((payment: any) => [
        String(
          payment?.id ??
            payment?.provider_id ??
            payment?.providerId ??
            `${payment?.provider_name || ""}::${payment?.method_display || payment?.method || payment?.payment_method || payment?.payment_method_type || ""}`
        ),
        payment,
      ])
    ).values()
  );
}
