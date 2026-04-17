/**
 * PromptPilot — Base LLM Provider
 * All providers extend this class and implement the enhance() method.
 */
export class BaseProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * Validate that required config (e.g. API key) is present.
   * @throws Error if configuration is invalid
   */
  validate() {
    throw new Error(`${this.name}: validate() must be implemented`);
  }

  /**
   * Enhance a prompt using the LLM.
   * @param {string} rawPrompt - The user's original prompt text
   * @param {string} systemPrompt - The enhancement system prompt
   * @returns {Promise<string>} The enhanced prompt text
   */
  async enhance(rawPrompt, systemPrompt) {
    throw new Error(`${this.name}: enhance() must be implemented`);
  }

  /**
   * Test connectivity with a minimal API call.
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async testConnection() {
    try {
      await this.enhance('Hello', 'Reply with only the word: ok');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
