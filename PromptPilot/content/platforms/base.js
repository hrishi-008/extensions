/**
 * PromptPilot — Base Platform Adapter
 * Each AI chatbot platform extends this to handle its unique DOM structure.
 */
export class BasePlatform {
  constructor() {
    this.name = 'base';
    this.inputElement = null;
  }

  /**
   * Detect if this platform is active on the current page.
   * @returns {boolean}
   */
  isActive() {
    return false;
  }

  /**
   * Find and return the primary text input element.
   * @returns {Element|null}
   */
  getInputElement() {
    return null;
  }

  /**
   * Read the current text from the input field.
   * @returns {string}
   */
  getText() {
    const el = this.getInputElement();
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value || '';
    }
    return el.innerText || el.textContent || '';
  }

  /**
   * Write text into the input field, properly triggering framework events.
   * @param {string} text
   */
  setText(text) {
    const el = this.getInputElement();
    if (!el) return;

    el.focus();

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      // Standard textarea approach
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, text);
      } else {
        el.value = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // contenteditable div (React/ProseMirror)
      // Select all existing content and replace
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('insertText', false, text);

      // Fallback if execCommand doesn't work
      if (!el.innerText.trim()) {
        el.innerText = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
      }
    }
  }

  /**
   * Get preferred anchor element to position the PromptPilot button near.
   * By default, returns the input element itself.
   * @returns {Element|null}
   */
  getAnchorElement() {
    return this.getInputElement();
  }

  /**
   * Optional: return the send/submit button element.
   * @returns {Element|null}
   */
  getSendButton() {
    return null;
  }
}
