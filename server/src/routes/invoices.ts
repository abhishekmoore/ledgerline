import { Router } from "express";
import { invoiceRequestSchema } from "../ai/schema.js";
import { extractInvoice } from "../ai/invoice.js";
import type { AppEnv } from "../env.js";
import type { InvoiceStore } from "../types.js";

export function invoicesRouter(store: InvoiceStore, env: AppEnv): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const requested = Number(req.query.limit ?? 20);
      const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 50) : 20;
      res.json({ invoices: await store.list(limit) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const invoice = await store.get(req.params.id);
      if (!invoice) {
        res.status(404).json({ error: "Invoice not found." });
        return;
      }
      res.json({ invoice });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const parsed = invoiceRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invoice text must be between 50 and 20,000 characters." });
        return;
      }
      const { invoiceText, title } = parsed.data;
      const result = await extractInvoice({
        invoiceText,
        apiKey: env.openAiKey,
        baseURL: env.baseURL,
        model: env.model,
      });
      const invoice = await store.insert({
        title: title?.trim() || "Untitled invoice",
        invoiceText,
        result,
      });
      res.status(201).json({ invoice });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const removed = await store.remove(req.params.id);
      if (!removed) {
        res.status(404).json({ error: "Invoice not found." });
        return;
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
