import { BasePlatform } from './base.js';

/**
 * PromptPilot — ChatGPT Platform Adapter
 * Handles chat.openai.com and chatgpt.com
 */
export class ChatGPTPlatform extends BasePlatform {
  constructor() {
    super();
    this.name = 'chatgpt';
  }

  isActive() {
    return (
      location.hostname === 'chatgpt.com' ||
      location.hostname === 'chat.openai.com'
    );
  }

  getInputElement() {
    // ChatGPT uses a contenteditable div (ProseMirror-based)
    return (
      document.querySelector('#prompt-textarea') ||
      document.querySelector('[data-id="root"] [contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"][data-placeholder]') ||
      document.querySelector('div[contenteditable="true"]')
    );
  }

  getAnchorElement() {
    // Use the outer form/container for better positioning
    return (
      document.querySelector('form.stretch') ||
      document.querySelector('form') ||
      this.getInputElement()
    );
  }

  getSendButton() {
    return (
      document.querySelector('[data-testid="send-button"]') ||
      document.querySelector('button[aria-label="Send prompt"]') ||
      document.querySelector('button[aria-label="Send message"]')
    );
  }

  setText(text) {
    const el = this.getInputElement();
    if (!el) return;
    el.focus();
    // Select all and replace — works with ProseMirror
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, text);
    // Fallback
    if (!el.innerText.trim()) {
      el.innerHTML = '';
      const p = document.createElement('p');
      p.textContent = text;
      el.appendChild(p);
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  }
}
