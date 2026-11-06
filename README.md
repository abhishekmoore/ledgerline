# Ledgerline

Ledgerline reads invoice text and extracts the vendor, invoice number, dates, currency, line items, and total. It flags when the line items do not add up to the stated total.

It is a small TypeScript MERN app: React, Express, MongoDB, and an OpenAI-compatible model. If you do not set a model key, it still runs. The screen is labeled as an offline extraction, not as a model judgment.

Money is never handled with binary floats. All sums use decimal.js.

This is an extraction **aid**. It does not file taxes or approve payments.

## What you can do

- Paste invoice text, or load the built-in sample.
- Get structured fields and a clear match/mismatch flag on the total.
- Save each invoice and reopen it later.
- Delete an invoice you do not want to keep.

The model prompt forbids invented vendors, numbers, or dates. The offline checker only reports what its simple scan finds.

## Stack

| Piece | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite, Tailwind CSS |
| API | Express 4, TypeScript, Zod, helmet |
| Data | MongoDB via Mongoose, or an in-memory store |
| Model | `openai` SDK against any compatible base URL |
| Client data | axios, TanStack Query |
| Dates | date-fns |
| Money | decimal.js |
| Tests | `node:test` through `tsx` |

## Run it

Node 20 or newer.

```bash
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL printed in the terminal (port 5173). The API is on port 4000. Vite proxies `/api` to it.

Production-style, one process:

```bash
npm run build
npm start
```

Then open port 4000. Express serves the built React app.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port. Default `4000`. |
| `MONGO_URI` | No | Example: `mongodb://127.0.0.1:27017/ledgerline`. If empty, invoices live in memory and vanish when the process stops. |
| `OPENAI_API_KEY` | No | If empty, Ledgerline uses the offline extraction. |
| `OPENAI_BASE_URL` | No | Use this for xAI, Groq, OpenRouter, or a local server. |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini`. |

Do not commit `.env`.

## API

`GET /api/health` — `{ ok, store: "memory" \| "mongo", ai: "model" \| "heuristic", model }`

`GET /api/invoices?limit=20` — newest first, limit 1–50.

`POST /api/invoices` — body `{ invoiceText, title? }`. Text must be 50–20,000 characters. Returns the saved invoice.

`GET /api/invoices/:id`

`DELETE /api/invoices/:id` — `204` when removed.

## Scripts

```bash
npm test
npm run typecheck
npm run build
```

GitHub Actions runs those three on every push.

## Limits

- The offline extraction is a simple pattern scan. It misses unusual layouts and cannot judge authenticity.
- The model can still be wrong. Read the invoice yourself before you trust a number.
- There is no login. Anyone who can reach the server can read saved invoices. Do not point this at the public internet with real financial data.

Design notes for someone changing the code are in [DEVELOPER.md](DEVELOPER.md).
