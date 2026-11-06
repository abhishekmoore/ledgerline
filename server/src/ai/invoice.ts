import OpenAI from "openai";
import { Decimal } from "decimal.js";
import { heuristicInvoice, computeTotal } from "./heuristic.js";
import { extractJson } from "./parse.js";
import { modelResultSchema } from "./schema.js";
import type { InvoiceResult, LineItem } from "../types.js";

const SYSTEM = `You extract structured data from an invoice.
Return JSON only with keys: vendor (string), invoiceNumber (string), issueDate (string, prefer YYYY-MM-DD), dueDate (string optional), currency (string, e.g. USD), lineItems (array of {description, quantity?, unitPrice?, amount}), statedTotal (string), summary (string, one sentence).
Rules:
- Only extract what is written in the invoice text. Never invent vendors, numbers, dates, line items, or totals.
- Amounts must be numeric strings without currency symbols.
- If a field is missing, use a short placeholder like "not stated".
- Do not calculate or correct totals; report the stated total only.`;

export async function extractInvoice(input: {
  invoiceText: string;
  apiKey: string;
  baseURL: string;
  model: string;
}): Promise<InvoiceResult> {
  if (!input.apiKey) {
    return heuristicInvoice(input.invoiceText);
  }
  try {
    return await fromModel(input);
  } catch (error) {
    const fallback = heuristicInvoice(input.invoiceText);
    const message = error instanceof Error ? error.message : "model request failed";
    return {
      ...fallback,
      summary: `Model request failed (${clip(message)}). Showing the offline extraction instead. ${fallback.summary}`,
    };
  }
}

async function fromModel(input: {
  invoiceText: string;
  apiKey: string;
  baseURL: string;
  model: string;
}): Promise<InvoiceResult> {
  const client = new OpenAI({
    apiKey: input.apiKey,
    baseURL: input.baseURL || undefined,
  });
  const user = `INVOICE TEXT:\n${input.invoiceText}`;
  let raw = await complete(client, input.model, user, true);
  let parsed = readModel(raw);
  if (!parsed.ok) {
    raw = await complete(
      client,
      input.model,
      `${user}\n\nThe previous reply was invalid (${parsed.reason}). Reply with one JSON object only.`,
      false,
    );
    parsed = readModel(raw);
  }
  if (!parsed.ok) {
    throw new Error(parsed.reason);
  }

  const modelValue = parsed.value;
  const lineItems: LineItem[] = modelValue.lineItems.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: item.amount,
  }));

  const { computed } = computeTotal(lineItems);
  let totalsMatch = false;
  try {
    const statedDec = new Decimal(modelValue.statedTotal.replace(/,/g, ""));
    const computedDec = new Decimal(computed);
    totalsMatch = statedDec.equals(computedDec);
  } catch {
    totalsMatch = false;
  }

  return {
    vendor: modelValue.vendor,
    invoiceNumber: modelValue.invoiceNumber,
    issueDate: modelValue.issueDate,
    dueDate: modelValue.dueDate,
    currency: modelValue.currency,
    lineItems,
    statedTotal: modelValue.statedTotal,
    computedTotal: computed,
    totalsMatch,
    summary: modelValue.summary,
    source: "model",
    model: input.model,
  };
}

function readModel(raw: string): { ok: true; value: ReturnType<typeof modelResultSchema.parse> } | { ok: false; reason: string } {
  try {
    const json = extractJson(raw);
    const value = modelResultSchema.parse(json);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? clip(error.message) : "invalid model JSON" };
  }
}

async function complete(client: OpenAI, model: string, user: string, jsonMode: boolean): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (error) {
    if (!jsonMode) throw error;
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }
}

function clip(message: string): string {
  return message.replace(/\s+/g, " ").slice(0, 180);
}
