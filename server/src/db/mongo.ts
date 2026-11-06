import mongoose, { Schema } from "mongoose";
import type { NewInvoice, InvoiceRecord, InvoiceResult, InvoiceStore } from "../types.js";

interface InvoiceDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  invoiceText: string;
  result: InvoiceResult;
  createdAt: Date;
}

const invoiceSchema = new Schema<InvoiceDoc>(
  {
    title: { type: String, default: "" },
    invoiceText: { type: String, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);

const InvoiceModel = mongoose.models.Invoice ?? mongoose.model<InvoiceDoc>("Invoice", invoiceSchema);

function toRecord(doc: InvoiceDoc): InvoiceRecord {
  return {
    id: doc._id.toString(),
    title: doc.title,
    invoiceText: doc.invoiceText,
    result: doc.result,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createMongoStore(uri: string): Promise<InvoiceStore> {
  await mongoose.connect(uri);
  return {
    async insert(invoice: NewInvoice): Promise<InvoiceRecord> {
      const doc = await InvoiceModel.create(invoice);
      return toRecord(doc);
    },
    async list(limit: number): Promise<InvoiceRecord[]> {
      const docs = await InvoiceModel.find().sort({ createdAt: -1 }).limit(limit).exec();
      return docs.map((doc) => toRecord(doc));
    },
    async get(id: string): Promise<InvoiceRecord | null> {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await InvoiceModel.findById(id).exec();
      return doc ? toRecord(doc) : null;
    },
    async remove(id: string): Promise<boolean> {
      if (!mongoose.isValidObjectId(id)) return false;
      const result = await InvoiceModel.findByIdAndDelete(id).exec();
      return result !== null;
    },
  };
}
