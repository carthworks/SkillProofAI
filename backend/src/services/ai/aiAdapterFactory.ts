import { AIAdapter } from './aiAdapter.interface';
import { OllamaAdapter } from './adapters/ollamaAdapter';
import { ClaudeAdapter } from './adapters/claudeAdapter';
import { GeminiAdapter } from './adapters/geminiAdapter';
import { MockAdapter } from './adapters/mockAdapter';

export class AIAdapterFactory {
  private static instance: AIAdapter | null = null;
  private static currentProviderName: string = '';

  public static getAdapter(): AIAdapter {
    const provider = (process.env.AI_PROVIDER || 'ollama').toLowerCase().trim();

    // Return cached instance if provider hasn't changed
    if (this.instance && this.currentProviderName === provider) {
      return this.instance;
    }

    console.log(`[AIAdapterFactory] Initializing AI Provider: "${provider}"`);

    try {
      switch (provider) {
        case 'ollama':
          this.instance = new OllamaAdapter();
          break;
        case 'claude':
        case 'anthropic':
          if (!process.env.ANTHROPIC_API_KEY) {
            console.warn('[AIAdapterFactory] ANTHROPIC_API_KEY missing, using MockAdapter');
            this.instance = new MockAdapter();
          } else {
            this.instance = new ClaudeAdapter();
          }
          break;
        case 'gemini':
        case 'google':
          if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
            console.warn('[AIAdapterFactory] GEMINI_API_KEY missing, using MockAdapter');
            this.instance = new MockAdapter();
          } else {
            this.instance = new GeminiAdapter();
          }
          break;
        case 'mock':
          this.instance = new MockAdapter();
          break;
        default:
          console.warn(`[AIAdapterFactory] Provider "${provider}" unconfigured, defaulting to MockAdapter`);
          this.instance = new MockAdapter();
          break;
      }
    } catch (err: any) {
      console.warn(`[AIAdapterFactory] Failed to initialize provider "${provider}" (${err.message}). Defaulting to MockAdapter.`);
      this.instance = new MockAdapter();
    }

    this.currentProviderName = provider;
    return this.instance;
  }

  public static setProvider(providerName: string): AIAdapter {
    process.env.AI_PROVIDER = providerName;
    this.instance = null;
    return this.getAdapter();
  }
}

export function getAIAdapter(): AIAdapter {
  return AIAdapterFactory.getAdapter();
}
