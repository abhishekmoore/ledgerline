export interface AppEnv {
  port: number;
  mongoUri: string;
  openAiKey: string;
  baseURL: string;
  model: string;
}

export function readEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsedPort = Number(source.PORT ?? 4000);
  return {
    port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 4000,
    mongoUri: source.MONGO_URI?.trim() ?? "",
    openAiKey: source.OPENAI_API_KEY?.trim() ?? "",
    baseURL: source.OPENAI_BASE_URL?.trim() ?? "",
    model: source.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}
