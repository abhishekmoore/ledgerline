import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { heuristicInvoice, computeTotal } from "./heuristic.js";
import { extractJson } from "./parse.js";
import { modelResultSchema } from "./schema.js";
import { formatWhen } from "../dates.js";
import { Decimal } from "decimal.js";

const sample = `Acme Corp
Invoice # INV-2026-042
Date: 2026-03-15
Due: 2026-04-15

Widget A    2    $10.00    $20.00
Widget B    1    $15.50    $15.50

Total: $35.50
Currency: USD`;

describe("heuristicInvoice", () => {
  it("extracts basic fields and checks total with decimal.js", () => {
    const result = heuristicInvoice(sample);
    assert.equal(result.source, "heuristic");
    assert.ok(result.vendor.toLowerCase().includes("acme") || result.invoiceNumber.includes("INV"));
    assert.ok(result.lineItems.length >= 1);
    assert.ok(result.statedTotal.includes("35"));
    // decimal comparison
    const computed = new Decimal(result.computedTotal);
    assert.ok(computed.greaterThan(0));
  });

  it("flags mismatch when line items do not add up", () => {
    const mismatch = `Vendor: Test
Total: 100.00
Item one 40.00
Item two 50.00`;
    const result = heuristicInvoice(mismatch);
    assert.equal(result.totalsMatch, false);
  });
});

describe("computeTotal", () => {
  it("sums line items with decimal.js without floating point error", () => {
    const items = [
      { description: "a", amount: "0.1" },
      { description: "b", amount: "0.2" },
    ];
    const { computed } = computeTotal(items);
    assert.equal(computed, "0.30");
  });
});

describe("extractJson", () => {
  it("reads a fenced JSON object", () => {
    const value = extractJson('```json\n{"vendor":"Acme"}\n```');
    assert.deepEqual(value, { vendor: "Acme" });
  });
});

describe("modelResultSchema", () => {
  it("rejects a missing required field", () => {
    const parsed = modelResultSchema.safeParse({
      vendor: "x",
      invoiceNumber: "1",
    });
    assert.equal(parsed.success, false);
  });
});

describe("formatWhen", () => {
  it("formats an ISO timestamp with date-fns", () => {
    const out = formatWhen("2026-03-15T14:30:00.000Z");
    assert.ok(out.includes("2026") || out.includes("Mar") || out.includes("March"));
  });
});
