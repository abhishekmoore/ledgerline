export type ResultSource = "model" | "heuristic";

export interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: string;
  amount: string;
}

export interface InvoiceResult {
  vendor: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  lineItems: LineItem[];
  statedTotal: string;
  computedTotal: string;
  totalsMatch: boolean;
  summary: string;
  source: ResultSource;
  model?: string;
}

export interface InvoiceRecord {
  id: string;
  title: string;
  invoiceText: string;
  result: InvoiceResult;
  createdAt: string;
}

export interface HealthInfo {
  ok: true;
  store: "memory" | "mongo";
  ai: "model" | "heuristic";
  model: string | null;
}
