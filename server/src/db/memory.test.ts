import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMemoryStore } from "./memory.js";

describe("memory store", () => {
  it("inserts, lists, and removes invoices", async () => {
    const store = createMemoryStore();
    const created = await store.insert({
      title: "Test",
      invoiceText: "sample",
      result: {
        vendor: "Acme",
        invoiceNumber: "INV-1",
        issueDate: "2026-01-15",
        currency: "USD",
        lineItems: [],
        statedTotal: "0.00",
        computedTotal: "0.00",
        totalsMatch: true,
        summary: "ok",
        source: "heuristic",
      },
    });
    assert.ok(created.id);
    const listed = await store.list(10);
    assert.equal(listed.length, 1);
    const removed = await store.remove(created.id);
    assert.equal(removed, true);
    const after = await store.list(10);
    assert.equal(after.length, 0);
  });
});
