import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

export const DEFAULT_MODEL = "google/gemini-3.6-flash";

/** Keeps prompts inside the model's context window. */
export function clampContent(content: string, max = 60000) {
  if (content.length <= max) return content;
  return `${content.slice(0, max)}\n\n[Document truncated for length]`;
}
