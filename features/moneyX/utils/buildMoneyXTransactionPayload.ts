import type { CreateMoneyXTransactionPayload } from "../types";
import { getMoneyXProviderId } from "@/features/express/utils/moneyXPaymentMethodUtils";

function resolveRecipientBankCode(provider: any): string | undefined {
  const code =
    provider?.bank_code ??
    provider?.provider_bank_code ??
    provider?.short_name ??
    provider?.bank_reference_code;
  const trimmed = String(code ?? "").trim();
  return trimmed || undefined;
}

export function buildMoneyXTransactionPayload(input: {
  amount: number;
  senderProvider: any;
  receiverProvider: any;
  recipientName: string;
  recipientAccountNumber: string;
  currency?: string;
}): CreateMoneyXTransactionPayload {
  const senderProviderId = getMoneyXProviderId(input.senderProvider);
  const receiverProviderId = getMoneyXProviderId(input.receiverProvider);

  if (!senderProviderId || !receiverProviderId) {
    throw new Error("Provider IDs not found in payment methods");
  }

  const payload: CreateMoneyXTransactionPayload = {
    amount: input.amount.toFixed(2),
    currency: input.currency ?? "USD",
    sender_provider: senderProviderId,
    receiver_provider: receiverProviderId,
    recipient_name: input.recipientName,
    recipient_account_number: input.recipientAccountNumber.trim(),
  };

  const bankCode = resolveRecipientBankCode(input.receiverProvider);
  if (bankCode) {
    payload.recipient_bank_code = bankCode;
  }

  return payload;
}
