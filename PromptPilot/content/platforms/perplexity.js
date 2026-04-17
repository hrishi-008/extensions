import { BasePlatform } from './base.js';

/**
 * PromptPilot — Perplexity.ai Platform Adapter
 */
export class PerplexityPlatform extends BasePlatform {
  constructor() {
    super();
    this.name = 'perplexity';
  }

  isActive() {
    return (
      location.hostname === 'perplexity.ai' ||
      location.hostname === 'www.perplexity.ai'
    );
  }

  getInputElement() {
    return (
      document.querySelector('textarea[placeholder*="Ask"]') ||
      document.querySelector('textarea') ||
      document.querySelector('[contenteditable="true"]')
    );
  }

  getAnchorElement() {
    return (
      document.querySelector('form') ||
      this.getInputElement()
    );
  }

  getSendButton() {
    return (
      document.querySelector('button[aria-label="Submit"]') ||
      document.querySelector('button[type="submit"]')
    );
  }
}
