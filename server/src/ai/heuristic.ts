import { Decimal } from "decimal.js";
import type { InvoiceResult, LineItem } from "../types.js";

function tidy(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractMoney(text: string): string | null {
  const match = text.match(/\$?\s*([0-9,]+\.?[0-9]{0,2})/);
  if (!match) return null;
  return match[1].replace(/,/g, "");
}

export function computeTotal(items: LineItem[]): { computed: string; match: boolean; stated: string } {
  let sum = new Decimal(0);
  for (const item of items) {
    try {
      sum = sum.plus(new Decimal(item.amount.replace(/,/g, "")));
    } catch {
      // skip invalid amounts
    }
  }
  const computed = sum.toFixed(2);
  return { computed, match: false, stated: "" }; // caller sets stated and match
}

export function heuristicInvoice(text: string): InvoiceResult {
  const lines = text
    .split(/\n+/)
    .map((line) => tidy(line))
    .filter((line) => line.length > 3);

  let vendor = "Unknown vendor";
  let invoiceNumber = "Unknown";
  let issueDate = "";
  let dueDate: string | undefined;
  let currency = "USD";
  const lineItems: LineItem[] = [];
  let statedTotal = "0.00";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/invoice\s*(#|no|number)/i.test(line) || lower.startsWith("inv-") || lower.startsWith("invoice ")) {
      const num = line.match(/(?:#|no\.?|number:?)\s*([A-Z0-9-]+)/i);
      if (num) invoiceNumber = num[1];
    }
    if (/date|issued|invoice date/i.test(lower) && !issueDate) {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
      if (dateMatch) issueDate = dateMatch[1];
    }
    if (/due/i.test(lower) && !dueDate) {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);
      if (dateMatch) dueDate = dateMatch[1];
    }
    if (/total|amount due|balance/i.test(lower)) {
      const money = extractMoney(line);
      if (money) statedTotal = money;
    }
    if (/vendor|from|bill to|company/i.test(lower) && vendor === "Unknown vendor") {
      vendor = tidy(line.replace(/vendor|from|bill to|company:?/gi, "")).slice(0, 100) || vendor;
    }
    // Simple line item heuristic: lines with a money amount that aren't totals
    if (/\d+\.\d{2}/.test(line) && !/total|subtotal|tax|due/i.test(lower)) {
      const amount = extractMoney(line);
      if (amount) {
        lineItems.push({
          description: tidy(line.replace(/\$?[0-9,]+\.?[0-9]{0,2}/g, "")).slice(0, 200) || "Item",
          amount,
        });
      }
    }
  }

  if (!issueDate) issueDate = new Date().toISOString().slice(0, 10);

  const { computed } = computeTotal(lineItems);
  let totalsMatch = false;
  try {
    const statedDec = new Decimal(statedTotal.replace(/,/g, ""));
    const computedDec = new Decimal(computed);
    totalsMatch = statedDec.equals(computedDec);
  } catch {
    totalsMatch = false;
  }

  const summary =
    lineItems.length > 0
      ? `Offline extraction: vendor ${vendor}, invoice ${invoiceNumber}, ${lineItems.length} line item${lineItems.length === 1 ? "" : "s"}. Totals ${totalsMatch ? "match" : "do not match"}.`
      : "Offline scan found limited structure. A model should read the full invoice.";

  return {
    vendor,
    invoiceNumber,
    issueDate,
    dueDate,
    currency,
    lineItems: lineItems.slice(0, 50),
    statedTotal,
    computedTotal: computed,
    totalsMatch,
    summary,
    source: "heuristic",
  };
}
