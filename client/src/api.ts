import axios from "axios";
import type { HealthInfo, InvoiceRecord } from "./types";

const client = axios.create({ baseURL: "/api" });

export async function fetchHealth(): Promise<HealthInfo> {
  const { data } = await client.get<HealthInfo>("/health");
  return data;
}

export async function fetchInvoices(): Promise<InvoiceRecord[]> {
  const { data } = await client.get<{ invoices: InvoiceRecord[] }>("/invoices");
  return data.invoices;
}

export async function createInvoice(body: { invoiceText: string; title?: string }): Promise<InvoiceRecord> {
  const { data } = await client.post<{ invoice: InvoiceRecord }>("/invoices", body);
  return data.invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  await client.delete(`/invoices/${id}`);
}
