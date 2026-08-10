export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
}

export interface AIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseMimeType?: string;
}

export interface AIAdapter {
  /**
   * Return the identifier name of the AI provider (e.g., 'ollama', 'claude', 'gemini', 'mock')
   */
  getProviderName(): string;

  /**
   * Generate raw text response for a given prompt
   */
  generateText(prompt: string, options?: AIRequestOptions): Promise<string>;

  /**
   * Generate structured JSON object matching expected type T
   */
  generateJSON<T>(prompt: string, schema?: any, options?: AIRequestOptions): Promise<T>;

  /**
   * Generate an embedding vector for a given text
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Stream LLM response chunks for real-time SSE chat
   */
  streamText(
    messages: AIMessage[],
    context?: any,
    options?: AIRequestOptions
  ): AsyncGenerator<string, void, unknown>;
}
