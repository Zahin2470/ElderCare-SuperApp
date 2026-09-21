import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

export interface LlmRequest {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}
export interface LlmResult { text: string; model: string; inputTokens: number; outputTokens: number }
export interface Llm { complete(req: LlmRequest): Promise<LlmResult> }

class ClaudeLlm implements Llm {
  private client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, maxRetries: 1, timeout: config.AI_TIMEOUT_MS });
  async complete({ system, messages, maxTokens }: LlmRequest): Promise<LlmResult> {
    const r = await this.client.messages.create({ model: config.ANTHROPIC_MODEL, max_tokens: maxTokens, system, messages });
    const text = r.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
    return { text, model: r.model, inputTokens: r.usage.input_tokens, outputTokens: r.usage.output_tokens };
  }
}

// null = no API key configured → every AI feature transparently uses its rule-based fallback.
let current: Llm | null = config.aiEnabled ? new ClaudeLlm() : null;
export const getLlm = () => current;
/** Test seam: inject a fake model (or null to force the fallback path). */
export const setLlm = (l: Llm | null) => { current = l; };
