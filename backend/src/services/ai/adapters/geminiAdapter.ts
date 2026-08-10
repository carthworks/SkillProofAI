import { AIAdapter, AIMessage, AIRequestOptions } from '../aiAdapter.interface';
import { MockAdapter } from './mockAdapter';

export class GeminiAdapter implements AIAdapter {
  private ai: any = null;
  private model: string;
  private fallbackMock: MockAdapter;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.fallbackMock = new MockAdapter();

    if (apiKey) {
      try {
        const { GoogleGenAI } = require('@google/genai');
        this.ai = new GoogleGenAI({ apiKey });
      } catch (err: any) {
        console.warn(`[GeminiAdapter] Could not load @google/genai SDK package: ${err.message}. Falling back to MockAdapter.`);
      }
    }
  }

  getProviderName(): string {
    return `gemini (${this.model})`;
  }

  async generateText(prompt: string, options?: AIRequestOptions): Promise<string> {
    if (!this.ai) {
      console.warn('[GeminiAdapter] GEMINI_API_KEY missing. Falling back to MockAdapter.');
      return this.fallbackMock.generateText(prompt, options);
    }

    try {
      const contents = options?.systemPrompt
        ? `${options.systemPrompt}\n\nUser Request: ${prompt}`
        : prompt;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents,
      });

      return response.text || '';
    } catch (err: any) {
      console.error('[GeminiAdapter] API error:', err.message);
      return this.fallbackMock.generateText(prompt, options);
    }
  }

  async generateJSON<T>(prompt: string, schema?: any, options?: AIRequestOptions): Promise<T> {
    if (!this.ai) {
      console.warn('[GeminiAdapter] GEMINI_API_KEY missing. Falling back to MockAdapter.');
      return this.fallbackMock.generateJSON<T>(prompt, schema, options);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const data = JSON.parse(response.text || '{}');
      return data as T;
    } catch (err: any) {
      console.error('[GeminiAdapter] JSON error:', err.message);
      return this.fallbackMock.generateJSON<T>(prompt, schema, options);
    }
  }

  async *streamText(
    messages: AIMessage[],
    context?: any,
    options?: AIRequestOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.ai) {
      console.warn('[GeminiAdapter] GEMINI_API_KEY missing. Falling back to MockAdapter.');
      yield* this.fallbackMock.streamText(messages, context, options);
      return;
    }

    try {
      const formattedMessages = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const contents: any[] = [];
      if (options?.systemPrompt) {
        contents.push({ role: 'user', parts: [{ text: options.systemPrompt }] });
        contents.push({ role: 'model', parts: [{ text: 'Understood. Ready.' }] });
      }
      contents.push(...formattedMessages);

      const config: any = {};
      if (options?.maxTokens) {
        config.maxOutputTokens = options.maxTokens;
      }

      const responseStream = await this.ai.models.generateContentStream({
        model: this.model,
        contents,
        config,
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (err: any) {
      console.error('[GeminiAdapter] Streaming error:', err.message);
      yield* this.fallbackMock.streamText(messages, context, options);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.ai) {
      console.warn('[GeminiAdapter] GEMINI_API_KEY missing. Falling back to MockAdapter.');
      return this.fallbackMock.generateEmbedding(text);
    }
    try {
      const response = await this.ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      });
      if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
        return response.embeddings[0].values as number[];
      }
      // If the SDK returns embedding directly on response
      if ((response as any).embedding && (response as any).embedding.values) {
        return (response as any).embedding.values as number[];
      }
      return this.fallbackMock.generateEmbedding(text);
    } catch (err: any) {
      console.error('[GeminiAdapter] Embedding error:', err.message);
      return this.fallbackMock.generateEmbedding(text);
    }
  }
}
