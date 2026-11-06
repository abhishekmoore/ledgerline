export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("empty model response");
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  return JSON.parse(body) as unknown;
}
