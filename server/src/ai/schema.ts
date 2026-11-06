import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.number().positive().optional(),
  unitPrice: z.string().trim().max(50).optional(),
  amount: z.string().trim().min(1).max(50),
});

export const modelResultSchema = z.object({
  vendor: z.string().trim().min(1).max(200),
  invoiceNumber: z.string().trim().min(1).max(100),
  issueDate: z.string().trim().min(1).max(50),
  dueDate: z.string().trim().max(50).optional(),
  currency: z.string().trim().min(1).max(10),
  lineItems: z.array(lineItemSchema).max(50),
  statedTotal: z.string().trim().min(1).max(50),
  summary: z.string().trim().min(1).max(700),
});

export type ModelResult = z.infer<typeof modelResultSchema>;

export const invoiceRequestSchema = z.object({
  invoiceText: z.string().trim().min(50).max(20000),
  title: z.string().trim().max(120).optional(),
});
