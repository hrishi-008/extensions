import { BaseProvider } from './base.js';

/**
 * PromptPilot — Groq Provider
 * Groq uses an OpenAI-compatible REST API.
 * Supports: llama-3.3-70b, mixtral, gemma, deepseek, and any custom model.
 * API keys start with "gsk_"
 */
export class GroqProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'groq';
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'llama-3.3-70b-versatile';
    this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  validate() {
    if (!this.apiKey || !this.apiKey.startsWith('gsk_')) {
      throw new Error('Invalid Groq API key. It should start with "gsk_".');
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
          { role: 'user',   content: rawPrompt },
        ],
        temperature: 0.7,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || rawPrompt;
  }

  static get availableModels() {
    return [
      { id: 'llama-3.3-70b-versatile',        label: 'Llama 3.3 70B  (fast · recommended)' },
      { id: 'llama-3.1-8b-instant',            label: 'Llama 3.1 8B Instant  (fastest)' },
      { id: 'llama3-70b-8192',                 label: 'Llama 3 70B' },
      { id: 'mixtral-8x7b-32768',              label: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it',                    label: 'Gemma 2 9B' },
      { id: 'deepseek-r1-distill-llama-70b',   label: 'DeepSeek R1 Distill 70B' },
      { id: 'openai/gpt-oss-120b',             label: 'OpenAI GPT OSS 120B (via Groq)' },
    ];
  }
}
