import { createMemoryStore } from "./memory.js";
import { createMongoStore } from "./mongo.js";
import type { InvoiceStore } from "../types.js";

export async function connectStore(mongoUri: string): Promise<{ store: InvoiceStore; kind: "memory" | "mongo" }> {
  if (!mongoUri) {
    return { store: createMemoryStore(), kind: "memory" };
  }
  const store = await createMongoStore(mongoUri);
  return { store, kind: "mongo" };
}
