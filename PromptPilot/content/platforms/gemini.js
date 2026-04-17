import { BasePlatform } from './base.js';

/**
 * PromptPilot — Google Gemini Platform Adapter
 */
export class GeminiPlatform extends BasePlatform {
  constructor() {
    super();
    this.name = 'gemini';
  }

  isActive() {
    return location.hostname === 'gemini.google.com';
  }

  getInputElement() {
    return (
      document.querySelector('rich-textarea .ql-editor') ||
      document.querySelector('.input-area-container [contenteditable="true"]') ||
      document.querySelector('[contenteditable="true"]')
    );
  }

  getAnchorElement() {
    return (
      document.querySelector('.input-area') ||
      document.querySelector('rich-textarea') ||
      this.getInputElement()
    );
  }

  getSendButton() {
    return (
      document.querySelector('button[aria-label="Send message"]') ||
      document.querySelector('button.send-button') ||
      document.querySelector('button[mattooltip="Send message"]')
    );
  }
}
