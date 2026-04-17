import { BasePlatform } from './base.js';

/**
 * PromptPilot — Claude.ai Platform Adapter
 */
export class ClaudePlatform extends BasePlatform {
  constructor() {
    super();
    this.name = 'claude';
  }

  isActive() {
    return location.hostname === 'claude.ai';
  }

  getInputElement() {
    // Claude uses a contenteditable div (Lexical editor)
    return (
      document.querySelector('div[contenteditable="true"].ProseMirror') ||
      document.querySelector('div[contenteditable="true"][data-placeholder]') ||
      document.querySelector('div[contenteditable="true"]')
    );
  }

  getAnchorElement() {
    return (
      document.querySelector('fieldset') ||
      document.querySelector('form') ||
      this.getInputElement()
    );
  }

  getSendButton() {
    return (
      document.querySelector('button[aria-label="Send Message"]') ||
      document.querySelector('button[type="submit"]')
    );
  }
}
