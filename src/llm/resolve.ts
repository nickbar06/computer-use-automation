import type { LlmProvider } from "../domain/llm.ts";
import { AnthropicProvider } from "./anthropic/provider.ts";
import { OpenAiProvider } from "./openai/provider.ts";

const MISSING_KEY = "set OPENAI_API_KEY or ANTHROPIC_API_KEY";

export function resolveLlmProvider(env: NodeJS.ProcessEnv = process.env): LlmProvider {
  const provider = (env.LLM_PROVIDER ?? "").trim().toLowerCase();
  const openaiKey = env.OPENAI_API_KEY?.trim();
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();

  if (provider === "openai") {
    if (!openaiKey) throw new Error(`${MISSING_KEY} (LLM_PROVIDER=openai)`);
    return new OpenAiProvider({
      apiKey: openaiKey,
      baseURL: env.OPENAI_BASE_URL?.trim() || undefined,
      model: env.OPENAI_MODEL,
    });
  }

  if (provider === "anthropic") {
    if (!anthropicKey) throw new Error(`${MISSING_KEY} (LLM_PROVIDER=anthropic)`);
    return new AnthropicProvider({ apiKey: anthropicKey, model: env.ANTHROPIC_MODEL });
  }

  if (provider && provider !== "openai" && provider !== "anthropic") {
    throw new Error(`LLM_PROVIDER mismatch: ${provider}. ${MISSING_KEY}`);
  }

  if (openaiKey) {
    return new OpenAiProvider({
      apiKey: openaiKey,
      baseURL: env.OPENAI_BASE_URL?.trim() || undefined,
      model: env.OPENAI_MODEL,
    });
  }

  if (anthropicKey) {
    return new AnthropicProvider({ apiKey: anthropicKey, model: env.ANTHROPIC_MODEL });
  }

  throw new Error(MISSING_KEY);
}
