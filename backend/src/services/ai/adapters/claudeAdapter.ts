import axios from 'axios';
import { AIAdapter, AIMessage, AIRequestOptions } from '../aiAdapter.interface';
import { MockAdapter } from './mockAdapter';

export class ClaudeAdapter implements AIAdapter {
  private apiKey: string;
  private model: string;
  private fallbackMock: MockAdapter;

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.fallbackMock = new MockAdapter();
  }

  getProviderName(): string {
    return `claude (${this.model})`;
  }

  async generateText(prompt: string, options?: AIRequestOptions): Promise<string> {
    if (!this.apiKey) {
      console.warn('[ClaudeAdapter] CLAUDE_API_KEY missing. Falling back to MockAdapter.');
      return this.fallbackMock.generateText(prompt, options);
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: options?.maxTokens ?? 1024,
          system: options?.systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );

      const contentBlock = response.data?.content?.[0];
      return contentBlock?.text || '';
    } catch (err: any) {
      console.error('[ClaudeAdapter] Anthropic API error:', err.response?.data || err.message);
      return this.fallbackMock.generateText(prompt, options);
    }
  }

  async generateJSON<T>(prompt: string, schema?: any, options?: AIRequestOptions): Promise<T> {
    if (!this.apiKey) {
      console.warn('[ClaudeAdapter] CLAUDE_API_KEY missing. Falling back to MockAdapter.');
      return this.fallbackMock.generateJSON<T>(prompt, schema, options);
    }

    try {
      const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not surround with markdown codeblocks or text.`;
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: options?.maxTokens ?? 1024,
          system: options?.systemPrompt || 'You are an AI data generator that outputs strictly structured JSON.',
          messages: [{ role: 'user', content: jsonPrompt }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );

      const rawText = response.data?.content?.[0]?.text || '{}';
      const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText) as T;
    } catch (err: any) {
      console.error('[ClaudeAdapter] JSON error:', err.response?.data || err.message);
      return this.fallbackMock.generateJSON<T>(prompt, schema, options);
    }
  }

  async *streamText(
    messages: AIMessage[],
    context?: any,
    options?: AIRequestOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      console.warn('[ClaudeAdapter] CLAUDE_API_KEY missing. Falling back to MockAdapter.');
      yield* this.fallbackMock.streamText(messages, context, options);
      return;
    }

    try {
      const formattedMessages = messages.map((m) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: options?.maxTokens ?? 1024,
          system: options?.systemPrompt,
          messages: formattedMessages,
          stream: true,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          responseType: 'stream',
        }
      );

      let buffer = '';
      for await (const chunk of response.data) {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                yield parsed.delta.text;
              }
            } catch (e) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[ClaudeAdapter] Streaming error:', err.message);
      yield* this.fallbackMock.streamText(messages, context, options);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.fallbackMock.generateEmbedding(text);
  }
}
