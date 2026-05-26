import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardTransactionDetailView } from "@/components/dashboard/ui/DashboardTransactionDetailsModal";
import { getDashboardTransactionAmounts } from "@/lib/utils/dashboardTransactionAmounts";

const OMAYA_LOGO_URL =
  "/assets/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png";

function row(label: string, value: string | null | undefined): [string, string] | null {
  const v = String(value ?? "").trim();
  if (!v || v === "—") return null;
  return [label, v];
}

export function buildDashboardTransactionShareText(
  detail: DashboardTransactionDetailView
): string {
  const { tx, from, to, assetTitle, typeLabel } = detail;
  const amounts = getDashboardTransactionAmounts(tx);
  const id = String(tx.referral_withdrawal_id || tx.withdrawal_id || tx.id || "").trim();
  const lines = [
    "OMAYA Exchange — Transaction",
    "",
    `Type: ${typeLabel}`,
    `Status: ${tx.status}`,
    `Asset: ${assetTitle}`,
    id ? `Transaction ID: ${id}` : null,
    amounts.assetAmount ? `Asset amount: ${amounts.assetAmount}` : null,
    amounts.usdValue ? `USD value: ${amounts.usdValue}` : null,
    tx.net_amount ? `Net amount: ${tx.net_amount}` : null,
    tx.commission ? `Fees: ${tx.commission}` : null,
    `From: ${from.label}${from.subLabel ? ` (${from.subLabel})` : ""}`,
    `To: ${to.label}${to.subLabel ? ` (${to.subLabel})` : ""}`,
    tx.created_at ? `Date: ${tx.created_at}` : null,
  ].filter(Boolean) as string[];

  return lines.join("\n");
}

export async function downloadDashboardTransactionPdf(
  detail: DashboardTransactionDetailView
): Promise<void> {
  const { tx, from, to, assetTitle, assetSubtitle, typeLabel } = detail;
  const amounts = getDashboardTransactionAmounts(tx);
  const transactionId = String(
    tx.referral_withdrawal_id || tx.withdrawal_id || tx.id || ""
  ).trim();

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let currentY = 12;

  try {
    const imgResponse = await fetch(OMAYA_LOGO_URL);
    const imgBlob = await imgResponse.blob();
    const imgDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imgBlob);
    });
    const natural = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () =>
        resolve({
          w: img.naturalWidth || 1,
          h: img.naturalHeight || 1,
        });
      img.onerror = reject;
      img.src = imgDataUrl;
    });
    const maxLogoW = 52;
    const maxLogoH = 20;
    const aspect = natural.w / natural.h;
    let logoW = maxLogoW;
    let logoH = logoW / aspect;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = logoH * aspect;
    }
    doc.addImage(imgDataUrl, "PNG", centerX - logoW / 2, currentY, logoW, logoH);
    currentY += logoH + 10;
  } catch {
    doc.setFontSize(16);
    doc.setTextColor(29, 135, 81);
    doc.text("OMAYA", centerX, currentY + 6, { align: "center" });
    currentY += 16;
  }

  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text("Transaction details", centerX, currentY, { align: "center" });
  currentY += 8;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, centerX, currentY, {
    align: "center",
  });
  currentY += 10;

  const payment = tx.payment_method;
  const tableBody: [string, string][] = [
    row("Type", typeLabel),
    row("Status", String(tx.status)),
    row("Asset", assetTitle),
    row("Network", assetSubtitle),
    row("Transaction ID", transactionId),
    row("Date", tx.created_at),
    amounts.assetAmount ? row("Asset amount", amounts.assetAmount) : null,
    amounts.usdValue ? row("USD value", amounts.usdValue) : null,
    row("Amount", tx.amount),
    row("Net amount", tx.net_amount),
    row("Commission / fees", tx.commission),
    row("Received amount", tx.to_amount),
    row("Blockchain network", tx.network ? String(tx.network).toUpperCase() : null),
    row("From", from.label),
    row("From detail", from.subLabel || from.copyValue),
    row("To", to.label),
    row("To detail", to.subLabel || to.copyValue),
    row("Payment provider", payment?.provider),
    row("Account name", payment?.account_name),
    row("Account number", payment?.account_number),
    row("Deposit address", tx.deposit_address),
    row("Withdrawal address", tx.withdrawal_address),
    row("From address", tx.from_address),
    row("To address", tx.to_address),
    row("Transaction hash", tx.transaction_hash || tx.payout_hash),
    row("Reason", tx.reason),
  ].filter((r): r is [string, string] => r != null);

  autoTable(doc, {
    startY: currentY,
    head: [["Field", "Value"]],
    body: tableBody,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [29, 135, 81], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
  });

  const safeId = (transactionId || "transaction").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`OMAYA_Transaction_${safeId}_${dateStr}.pdf`);
}

export async function shareDashboardTransaction(
  detail: DashboardTransactionDetailView
): Promise<"shared" | "copied"> {
  const text = buildDashboardTransactionShareText(detail);
  const title = "OMAYA Transaction";

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") throw err;
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return "copied";
  }

  throw new Error("Share is not supported on this device");
}
