import { BaseProvider } from './base.js';

/**
 * PromptPilot — Google Gemini Provider
 * Supports: gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro
 */
export class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'gemini';
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gemini-2.0-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  validate() {
    if (!this.apiKey || this.apiKey.length < 20) {
      throw new Error('Invalid Google Gemini API key.');
    }
  }

  async enhance(rawPrompt, systemPrompt) {
    this.validate();

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: rawPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err?.error?.message || `Gemini API error: ${response.status}`
      );
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || rawPrompt
    );
  }

  static get availableModels() {
    return [
      { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash (fast, cheap)' },
      { id: 'gemini-1.5-flash',   label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro',     label: 'Gemini 1.5 Pro (best quality)' },
    ];
  }
}
