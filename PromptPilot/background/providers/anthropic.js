import { BaseProvider } from './base.js';

/**
 * PromptPilot — Anthropic Claude Provider
 * Supports: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus
 */
export class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'anthropic';
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'claude-3-5-haiku-20241022';
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
  }

  validate() {
    if (!this.apiKey || !this.apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Anthropic API key. It should start with "sk-ant-".');
    }
  }

  async enhance(rawPrompt, systemPrompt) {
    this.validate();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: rawPrompt },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text?.trim() || rawPrompt;
  }

  static get availableModels() {
    return [
      { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku (fast, cheap)' },
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (best quality)' },
      { id: 'claude-3-opus-20240229',     label: 'Claude 3 Opus (most powerful)' },
    ];
  }
}
