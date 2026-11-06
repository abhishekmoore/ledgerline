import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createInvoice, deleteInvoice, fetchHealth, fetchInvoices } from "./api";
import { formatRelative, formatWhen, tryFormatDate } from "./dates";
import { SAMPLE } from "./sample";
import type { InvoiceRecord } from "./types";

export function App() {
  const queryClient = useQueryClient();
  const [invoiceText, setInvoiceText] = useState("");
  const [title, setTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const health = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  const invoices = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const create = useMutation({
    mutationFn: createInvoice,
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setSelectedId(invoice.id);
      setInvoiceText("");
      setTitle("");
    },
  });

  const remove = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setSelectedId(null);
    },
  });

  const selected = invoices.data?.find((n) => n.id === selectedId) ?? null;
  const aiLabel =
    health.data?.ai === "model" ? health.data.model ?? "model" : "offline extraction";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invoiceText.trim().length < 50) return;
    create.mutate({ invoiceText: invoiceText.trim(), title: title.trim() || undefined });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Ledgerline</h1>
            <p className="text-sm text-stone-500">Invoice reader</p>
          </div>
          <div className="text-right text-xs text-stone-500">
            <div>{health.isPending ? "checking…" : aiLabel}</div>
            <div>{health.data?.store === "mongo" ? "mongo" : "memory"}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-8 md:grid-cols-[1fr_280px]">
        <section>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="title">
                Title (optional)
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                placeholder="March invoice, Acme…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="invoice">
                Invoice text
              </label>
              <textarea
                id="invoice"
                value={invoiceText}
                onChange={(e) => setInvoiceText(e.target.value)}
                rows={14}
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                placeholder="Paste the invoice text here…"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={create.isPending || invoiceText.trim().length < 50}
                className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {create.isPending ? "Reading…" : "Extract and save"}
              </button>
              <button
                type="button"
                onClick={() => setInvoiceText(SAMPLE)}
                className="text-sm text-stone-600 underline"
              >
                Load sample
              </button>
            </div>
            {create.isError && (
              <p className="text-sm text-red-600">
                {create.error instanceof Error ? create.error.message : "Could not save the invoice."}
              </p>
            )}
          </form>

          {selected && (
            <InvoiceDetail invoice={selected} onDelete={() => remove.mutate(selected.id)} deleting={remove.isPending} />
          )}
        </section>

        <aside>
          <h2 className="mb-3 text-sm font-medium text-stone-700">Saved invoices</h2>
          {invoices.isPending && <p className="text-sm text-stone-500">Loading…</p>}
          {invoices.isError && <p className="text-sm text-red-600">Could not load invoices.</p>}
          <ul className="space-y-2">
            {invoices.data?.map((invoice) => (
              <li key={invoice.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(invoice.id)}
                  className={`w-full rounded border px-3 py-2 text-left text-sm ${
                    selectedId === invoice.id ? "border-stone-900 bg-stone-100" : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="font-medium">{invoice.title}</div>
                  <div className="text-xs text-stone-500">
                    {formatRelative(invoice.createdAt) || formatWhen(invoice.createdAt)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}

function InvoiceDetail({
  invoice,
  onDelete,
  deleting,
}: {
  invoice: InvoiceRecord;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { result } = invoice;
  const badge = result.source === "model" ? result.model ?? "model" : "offline extraction";
  const issuePretty = tryFormatDate(result.issueDate) ?? result.issueDate;
  const duePretty = result.dueDate ? tryFormatDate(result.dueDate) ?? result.dueDate : null;

  return (
    <article className="mt-10 border-t border-stone-200 pt-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{invoice.title}</h2>
          <p className="text-xs text-stone-500">
            {formatWhen(invoice.createdAt)} · {badge}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="text-sm text-stone-500 underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      <p className="mb-6 text-sm text-stone-700">{result.summary}</p>

      <div className="mb-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-stone-500">Vendor</div>
          <div>{result.vendor}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-stone-500">Invoice number</div>
          <div>{result.invoiceNumber}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-stone-500">Issue date</div>
          <div>{issuePretty}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-stone-500">Due date</div>
          <div>{duePretty ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-stone-500">Currency</div>
          <div>{result.currency}</div>
        </div>
      </div>

      <Section title="Line items">
        {result.lineItems.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-1 text-sm">
            {result.lineItems.map((item, i) => (
              <li key={i} className="flex justify-between rounded border border-stone-200 bg-white px-3 py-2">
                <span>{item.description}</span>
                <span className="font-mono">
                  {result.currency} {item.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="mt-4 rounded border border-stone-200 bg-white p-4 text-sm">
        <div className="flex justify-between">
          <span>Stated total</span>
          <span className="font-mono">
            {result.currency} {result.statedTotal}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Computed total (decimal.js)</span>
          <span className="font-mono">
            {result.currency} {result.computedTotal}
          </span>
        </div>
        <div className={`mt-2 text-sm font-medium ${result.totalsMatch ? "text-green-700" : "text-red-700"}`}>
          {result.totalsMatch ? "Totals match" : "Totals do not match — review the line items"}
        </div>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-sm font-medium text-stone-800">{title}</h3>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-stone-500">None found.</p>;
}
