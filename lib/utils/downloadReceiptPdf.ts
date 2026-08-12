import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateTimeEastAfrica } from "@/lib/globalFormatter";

const OMAYA_LOGO_URL =
  "/assets/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png";

const OMAYA_GREEN: [number, number, number] = [29, 135, 81];

type DownloadReceiptPdfOptions = {
  fileName: string;
  isDark?: boolean;
};

export type ReceiptPdfOptions = {
  title?: string;
  subtitle?: string;
  status?: string;
};

const DATE_FIELD_LABEL =
  /date|time|when|created|exported|generated|timestamp|completed/i;

function formatPdfFieldValue(label: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !DATE_FIELD_LABEL.test(label.trim())) return value;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return value;

  if (
    /^\d{4}-\d{2}-\d{2}/.test(trimmed) ||
    trimmed.includes("T") ||
    /GMT|UTC|Z$/.test(trimmed)
  ) {
    return formatDateTimeEastAfrica(parsed);
  }

  return value;
}

const cleanText = (value: string | null | undefined): string =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeLabel = (label: string): string =>
  cleanText(label).replace(/:$/, "");

const isSkippable = (el: Element): boolean =>
  el.matches(
    "button, svg, img, hr, script, style, [aria-hidden='true'], [data-receipt-exclude]"
  );

function valueText(el: Element): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("button, [data-receipt-exclude]")
    .forEach((node) => node.remove());
  return cleanText(clone.textContent);
}

function isLabelValuePair(div: HTMLElement): boolean {
  const direct = Array.from(div.children).filter((c) => !isSkippable(c));
  if (direct.length !== 2) return false;
  const label = normalizeLabel(direct[0].textContent);
  const value = valueText(direct[1]);
  return (
    label.length > 0 &&
    label.length <= 80 &&
    value.length > 0 &&
    value.length <= 600 &&
    label !== value
  );
}

function hasPairContainerAncestor(el: HTMLElement): boolean {
  let parent = el.parentElement;
  while (parent && parent !== el) {
    if (isLabelValuePair(parent)) return true;
    parent = parent.parentElement;
  }
  return false;
}

function getSanitizedReceiptText(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("button, svg, img, [data-receipt-exclude]")
    .forEach((node) => node.remove());
  return cleanText(clone.innerText);
}

/** Extract label/value rows from receipt DOM (no html2canvas — avoids oklch CSS parse errors). */
export function extractReceiptRowsFromElement(
  root: HTMLElement
): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const seen = new Set<string>();

  const push = (label: string, value: string) => {
    const l = normalizeLabel(label);
    const v = cleanText(value);
    if (!l || !v || l === v) return;
    const key = `${l.toLowerCase()}\0${v}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push([l, v]);
  };

  root.querySelectorAll("h1, h2, h3").forEach((heading) => {
    const title = cleanText(heading.textContent);
    if (title && !/transaction complete/i.test(title)) {
      push("Section", title);
    }
  });

  root.querySelectorAll("div").forEach((div) => {
    if (div.closest("[data-receipt-exclude]")) return;
    if (!isLabelValuePair(div) || hasPairContainerAncestor(div)) return;
    const [labelEl, valueEl] = Array.from(div.children).filter(
      (c) => !isSkippable(c)
    );
    push(cleanText(labelEl.textContent), valueText(valueEl));
  });

  root.querySelectorAll("div").forEach((flex) => {
    if (flex.closest("[data-receipt-exclude]")) return;
    const className = flex.className?.toString() || "";
    if (!className.includes("flex") || !className.includes("justify-between")) {
      return;
    }
    if (isLabelValuePair(flex) && !hasPairContainerAncestor(flex)) {
      return;
    }

    const cols = Array.from(flex.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && !isSkippable(c)
    );
    if (cols.length !== 2) return;

    const label = normalizeLabel(cols[0].textContent);
    const value = valueText(cols[1]);
    if (label && value && label !== value) {
      push(label, value);
      return;
    }

    cols.forEach((col) => {
      const lines = Array.from(col.children)
        .filter((c) => !isSkippable(c))
        .map((c) => cleanText(c.textContent))
        .filter(Boolean);
      if (lines.length >= 2) {
        push(lines[0], lines.slice(1).join(" · "));
      }
    });
  });

  if (rows.length === 0) {
    const fallback = getSanitizedReceiptText(root);
    if (fallback) push("Details", fallback.slice(0, 2000));
  }

  return rows;
}

async function drawOmayaPdfHeader(
  doc: jsPDF,
  title: string,
  subtitle?: string
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const centerX = pageWidth / 2;
  let currentY = 12;

  doc.setFillColor(245, 250, 247);
  doc.rect(0, 0, pageWidth, 36, "F");

  try {
    const imgResponse = await fetch(OMAYA_LOGO_URL);
    const imgBlob = await imgResponse.blob();
    const imgDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imgBlob);
    });
    const natural = await new Promise<{ w: number; h: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () =>
          resolve({
            w: img.naturalWidth || 1,
            h: img.naturalHeight || 1,
          });
        img.onerror = reject;
        img.src = imgDataUrl;
      }
    );
    const maxLogoW = 48;
    const maxLogoH = 18;
    const aspect = natural.w / natural.h;
    let logoW = maxLogoW;
    let logoH = logoW / aspect;
    if (logoH > maxLogoH) {
      logoH = maxLogoH;
      logoW = logoH * aspect;
    }
    doc.addImage(imgDataUrl, "PNG", centerX - logoW / 2, currentY, logoW, logoH);
    currentY += logoH + 8;
  } catch {
    doc.setFontSize(16);
    doc.setTextColor(...OMAYA_GREEN);
    doc.text("OMAYA", centerX, currentY + 6, { align: "center" });
    currentY += 14;
  }

  currentY = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(title, centerX, currentY, { align: "center" });
  currentY += 7;

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(subtitle, centerX, currentY, { align: "center" });
    currentY += 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generated ${formatDateTimeEastAfrica(new Date())}`,
    centerX,
    currentY,
    { align: "center" }
  );

  doc.setDrawColor(...OMAYA_GREEN);
  doc.setLineWidth(0.6);
  doc.line(margin, currentY + 4, pageWidth - margin, currentY + 4);

  return currentY + 12;
}

function drawStatusBadge(doc: jsPDF, status: string, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const badgeW = 36;
  const badgeH = 8;
  const x = pageWidth / 2 - badgeW / 2;

  doc.setFillColor(...OMAYA_GREEN);
  doc.roundedRect(x, startY, badgeW, badgeH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(status.toUpperCase(), pageWidth / 2, startY + 5.5, { align: "center" });

  return startY + badgeH + 8;
}

function drawPdfFooter(doc: jsPDF): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text("Thank you for using OMAYA.io", pageWidth / 2, pageHeight - 11, {
    align: "center",
  });
  doc.text("support@omayaexchange.com", pageWidth / 2, pageHeight - 6, {
    align: "center",
  });
}

export async function downloadReceiptPdfFromRows(
  rows: Array<[string, string]>,
  fileName: string,
  title = "Transaction receipt",
  options: ReceiptPdfOptions = {}
): Promise<void> {
  if (rows.length === 0) {
    throw new Error("No receipt data to export");
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let startY = await drawOmayaPdfHeader(
    doc,
    options.title ?? title,
    options.subtitle
  );

  if (options.status) {
    startY = drawStatusBadge(doc, options.status, startY);
  }

  const formattedRows = rows.map(([label, value]) => [
    label,
    formatPdfFieldValue(label, value),
  ]) as Array<[string, string]>;

  autoTable(doc, {
    startY,
    body: formattedRows,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      overflow: "linebreak",
      lineColor: [235, 235, 235],
      lineWidth: 0.2,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: {
        cellWidth: 52,
        fontStyle: "bold",
        textColor: [70, 70, 70],
      },
      1: { cellWidth: pageWidth - margin * 2 - 52 },
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => drawPdfFooter(doc),
  });

  drawPdfFooter(doc);

  const safeName = fileName.replace(/\.pdf$/i, "");
  doc.save(`${safeName}.pdf`);
}

/**
 * Builds a receipt PDF from the DOM element (text only — no html2canvas / oklch).
 */
export async function downloadElementAsReceiptPdf(
  element: HTMLElement,
  { fileName, isDark: _isDark = false }: DownloadReceiptPdfOptions,
  pdfOptions: ReceiptPdfOptions = {}
): Promise<void> {
  const rows = extractReceiptRowsFromElement(element);
  const title =
    element.querySelector("h1")?.textContent?.trim() ||
    element.querySelector("h2")?.textContent?.trim() ||
    element.querySelector("h3")?.textContent?.trim() ||
    "Transaction receipt";

  await downloadReceiptPdfFromRows(rows, fileName, title, {
    ...pdfOptions,
    title: pdfOptions.title ?? title,
    status: pdfOptions.status ?? "Completed",
    subtitle:
      pdfOptions.subtitle ??
      element.querySelector("p")?.textContent?.trim()?.slice(0, 120),
  });
}
