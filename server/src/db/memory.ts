import { randomUUID } from "node:crypto";
import type { NewInvoice, InvoiceRecord, InvoiceStore } from "../types.js";

export function createMemoryStore(): InvoiceStore {
  const rows: InvoiceRecord[] = [];

  return {
    async insert(invoice: NewInvoice): Promise<InvoiceRecord> {
      const record: InvoiceRecord = {
        id: randomUUID(),
        ...invoice,
        createdAt: new Date().toISOString(),
      };
      rows.unshift(record);
      return record;
    },
    async list(limit: number): Promise<InvoiceRecord[]> {
      return rows.slice(0, limit);
    },
    async get(id: string): Promise<InvoiceRecord | null> {
      return rows.find((row) => row.id === id) ?? null;
    },
    async remove(id: string): Promise<boolean> {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}
