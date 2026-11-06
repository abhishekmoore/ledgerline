import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { connectStore } from "./db/connect.js";
import { readEnv } from "./env.js";

const env = readEnv();
const { store, kind } = await connectStore(env.mongoUri);
const app = createApp(store, env, kind);

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (fs.existsSync(path.join(clientDist, "index.html"))) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(env.port, () => {
  const ai = env.openAiKey ? `model:${env.model}` : "heuristic";
  console.log(`ledgerline api on :${env.port} store=${kind} ai=${ai}`);
});
