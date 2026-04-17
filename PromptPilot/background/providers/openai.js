import { BaseProvider } from './base.js';

/**
 * PromptPilot — OpenAI Provider
 * Supports: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
 */
export class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'openai';
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gpt-4o-mini';
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  validate() {
    if (!this.apiKey || !this.apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key. It should start with "sk-".');
    }
  }

  async enhance(rawPrompt, systemPrompt) {
    this.validate();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || rawPrompt;
  }

  static get availableModels() {
    return [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (fast, cheap)' },
      { id: 'gpt-4o',      label: 'GPT-4o (best quality)' },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (fastest)' },
    ];
  }
}
