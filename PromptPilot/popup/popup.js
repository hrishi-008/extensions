/**
 * PromptPilot — Popup Script
 * Handles settings, usage display, API key saving & connection testing.
 * Supports: OpenAI, Anthropic, Gemini, Groq — with custom model override for all.
 */

// ─── Model Definitions ─────────────────────────────────────────────────────────

const MODELS = {
  openai: [
    { id: 'gpt-4o-mini',        label: 'GPT-4o Mini  (fast · recommended)' },
    { id: 'gpt-4o',             label: 'GPT-4o  (best quality)' },
    { id: 'gpt-4-turbo',        label: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo',      label: 'GPT-3.5 Turbo  (fastest)' },
    { id: 'o1-mini',            label: 'o1 Mini  (reasoning)' },
    { id: 'o3-mini',            label: 'o3 Mini  (reasoning)' },
  ],
  anthropic: [
    { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku  (fast · recommended)' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet  (best quality)' },
    { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet  (extended thinking)' },
    { id: 'claude-3-opus-20240229',     label: 'Claude 3 Opus  (most powerful)' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash',          label: 'Gemini 2.0 Flash  (fast · recommended)' },
    { id: 'gemini-2.5-pro-preview-03-25', label: 'Gemini 2.5 Pro Preview  (best quality)' },
    { id: 'gemini-1.5-flash',          label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro',            label: 'Gemini 1.5 Pro' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile',        label: 'Llama 3.3 70B  (fast · recommended)' },
    { id: 'llama-3.1-8b-instant',           label: 'Llama 3.1 8B Instant  (fastest)' },
    { id: 'llama3-70b-8192',               label: 'Llama 3 70B' },
    { id: 'mixtral-8x7b-32768',            label: 'Mixtral 8x7B 32K' },
    { id: 'gemma2-9b-it',                  label: 'Gemma 2 9B' },
    { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill 70B' },
    { id: 'openai/gpt-oss-120b',           label: 'OpenAI GPT OSS 120B' },
  ],
};

const KEY_HINTS = {
  openai:    { prefix: 'sk-',      docs: 'platform.openai.com/api-keys' },
  anthropic: { prefix: 'sk-ant-',  docs: 'console.anthropic.com' },
  gemini:    { prefix: 'AIza',     docs: 'aistudio.google.com/apikey' },
  groq:      { prefix: 'gsk_',     docs: 'console.groq.com/keys' },
};

const FREE_LIMIT = 5;

// ─── DOM Refs ─────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const els = {
  tierBadge:       $('tier-badge'),
  usageCount:      $('usage-count'),
  usageBar:        $('usage-bar'),
  setupAlert:      $('setup-alert'),
  providerSel:     $('provider-select'),
  modelSel:        $('model-select'),
  customModelInput:$('custom-model-input'),
  customModelHint: $('custom-model-hint'),
  apiKeyInput:     $('api-key-input'),
  toggleKeyBtn:    $('toggle-key-btn'),
  eyeIcon:         $('eye-icon'),
  statusDot:       $('status-dot'),
  statusText:      $('status-text'),
  keyHint:         $('key-hint'),
  saveBtn:         $('save-btn'),
  notifyBtn:       $('notify-btn'),

  // Tabs
  tabs:            document.querySelectorAll('.tab'),
  tabPanels:       document.querySelectorAll('.tab-panel'),

  // Memory
  memoryStatsText: $('memory-stats-text'),
  memoryToggle:    $('memory-toggle'),
  memoryTabBadge:  $('memory-tab-badge'),
  copyPromptBtn:   $('copy-prompt-btn'),
  exportPromptBox: $('export-prompt-box'),
  memoryTextarea:  $('memory-textarea'),
  memoryCharCount: $('memory-char-count'),
  saveMemoryBtn:   $('save-memory-btn'),
  clearMemoryBtn:  $('clear-memory-btn'),
};

// ─── Tab Logic ────────────────────────────────────────────────────────────────

function initTabs() {
  els.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Update buttons
      els.tabs.forEach(t => t.classList.toggle('active', t === tab));

      // Update panels
      els.tabPanels.forEach(p => {
        p.classList.toggle('active', p.id === `tab-${target}`);
      });
    });
  });
}

// ─── Model Logic ─────────────────────────────────────────────────────────────

function populateModels(provider, selectedModel = '') {
  const models = MODELS[provider] || MODELS.openai;
  els.modelSel.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— select a preset model —';
  els.modelSel.appendChild(placeholder);

  for (const m of models) {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.label;
    if (m.id === selectedModel) opt.selected = true;
    els.modelSel.appendChild(opt);
  }

  if (selectedModel && !models.find(m => m.id === selectedModel)) {
    els.customModelInput.value = selectedModel;
  } else if (selectedModel) {
    els.modelSel.value = selectedModel;
  } else {
    els.modelSel.selectedIndex = 1;
  }

  updateCustomModelHint();
}

function updateCustomModelHint() {
  const provider = els.providerSel.value;
  const custom = els.customModelInput.value.trim();
  if (custom) {
    els.customModelHint.textContent = `✓ Will use "${custom}" instead of the dropdown selection`;
    els.customModelHint.style.color = '#a78bfa';
  } else {
    const examples = {
      openai:    'gpt-4.1, o4-mini',
      anthropic: 'claude-3-7-sonnet-latest',
      gemini:    'gemini-2.0-flash',
      groq:      'meta-llama/llama-4-scout-17b',
    };
    els.customModelHint.textContent = `Optional. Example: ${examples[provider] || 'your-model-id'}`;
    els.customModelHint.style.color = 'rgba(255,255,255,0.28)';
  }
}

function updateKeyHint(provider) {
  const hint = KEY_HINTS[provider];
  if (!hint) return;
  els.keyHint.innerHTML = `
    <span style="color:rgba(255,255,255,0.28)">
      Starts with <code style="color:#a78bfa;background:rgba(124,58,237,0.15);padding:1px 5px;border-radius:4px;">${hint.prefix}…</code>
      &nbsp;·&nbsp;
      <a href="https://${hint.docs}" target="_blank" style="color:#7c8cf8;text-decoration:none;">${hint.docs}</a>
    </span>
  `;
}

function resolveModel() {
  const custom = els.customModelInput.value.trim();
  if (custom) return custom;
  const dropdown = els.modelSel.value;
  if (!dropdown) return MODELS[els.providerSel.value]?.[0]?.id || '';
  return dropdown;
}

// ─── Status & Usage ──────────────────────────────────────────────────────────

function setStatus(type, message) {
  els.statusDot.className = 'status-dot';
  const colors = { success: 'green', error: 'red', warn: 'yellow', idle: 'grey' };
  els.statusDot.classList.add(colors[type] || 'grey');
  els.statusText.textContent = message;
  els.statusText.style.color =
    type === 'success' ? '#34d399' :
    type === 'error'   ? '#f87171' :
    type === 'warn'    ? '#fbbf24' :
    'rgba(255,255,255,0.4)';
}

function updateUsageDisplay(count, tier) {
  const isUnlimited = tier === 'byok' || tier === 'pro';
  const displayLimit = isUnlimited ? '∞' : FREE_LIMIT;
  els.usageCount.innerHTML = `${count} <span>/ ${displayLimit} enhancements</span>`;

  const pct = isUnlimited ? Math.min((count / 50) * 100, 100) : Math.min((count / FREE_LIMIT) * 100, 100);
  els.usageBar.style.width = `${pct}%`;

  const badge = els.tierBadge;
  badge.textContent = tier === 'byok' ? 'BYOK' : tier === 'pro' ? 'PRO' : 'FREE';
  badge.className = `tier-badge tier-${tier}`;
}

// ─── Memory Logic ────────────────────────────────────────────────────────────

async function loadMemoryStats() {
  try {
    const stats = await sendMsg({ type: 'GET_MEMORY_STATS' });
    if (stats) {
      const { entryCount, charCount, enabled } = stats;
      els.memoryToggle.checked = enabled;
      els.memoryStatsText.textContent = entryCount > 0
        ? `${entryCount} memories loaded (${(charCount / 1024).toFixed(1)} KB)`
        : 'No memory loaded';

      if (entryCount > 0) {
        els.memoryTabBadge.textContent = entryCount;
        els.memoryTabBadge.style.display = 'block';
      } else {
        els.memoryTabBadge.style.display = 'none';
      }

      // Load raw text into textarea if empty (first load)
      if (!els.memoryTextarea.value) {
        // Fetch raw text via background
        const settings = await chrome.storage.local.get(['pp_memory_raw']);
        els.memoryTextarea.value = settings.pp_memory_raw || '';
        updateCharCount();
      }
    }
  } catch (err) {
    console.error('[PromptPilot popup] loadMemoryStats:', err);
  }
}

async function saveMemory() {
  const rawText = els.memoryTextarea.value.trim();
  const enabled = els.memoryToggle.checked;

  els.saveMemoryBtn.disabled = true;
  els.saveMemoryBtn.innerHTML = '<div class="spinner"></div> Saving…';

  try {
    const result = await sendMsg({
      type: 'SAVE_MEMORY',
      payload: { rawText, enabled }
    });

    if (result.success) {
      loadMemoryStats();
      // Visual feedback
      els.saveMemoryBtn.innerHTML = '✓ Memory Saved';
      els.saveMemoryBtn.classList.remove('btn-primary');
      els.saveMemoryBtn.style.background = '#059669';
      setTimeout(() => {
        els.saveMemoryBtn.disabled = false;
        els.saveMemoryBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Memory';
        els.saveMemoryBtn.style.background = '';
        els.saveMemoryBtn.classList.add('btn-primary');
      }, 1500);
    }
  } catch (err) {
    console.error('[PromptPilot popup] saveMemory:', err);
  } finally {
    els.saveMemoryBtn.disabled = false;
  }
}

function updateCharCount() {
  const len = els.memoryTextarea.value.length;
  els.memoryCharCount.textContent = `${len.toLocaleString()} chars`;
  els.memoryCharCount.style.color = len > 50000 ? '#ef4444' : 'rgba(255,255,255,0.25)';
}

// ─── Settings Logic ──────────────────────────────────────────────────────────

async function loadSettings() {
  try {
    const [settings, usage] = await Promise.all([
      sendMsg({ type: 'GET_SETTINGS' }),
      sendMsg({ type: 'GET_USAGE' }),
    ]);

    if (settings) {
      const provider = settings.provider || 'openai';
      els.providerSel.value = provider;
      updateKeyHint(provider);
      populateModels(provider, settings.model);

      if (settings.apiKey) {
        els.apiKeyInput.value = settings.apiKey;
        setStatus('success', 'API key saved');
        els.setupAlert.style.display = 'none';
      } else {
        setStatus('idle', 'No API key configured');
        els.setupAlert.style.display = 'flex';
      }
    }

    if (usage) {
      updateUsageDisplay(usage.count || 0, usage.tier || 'byok');
    }
  } catch (err) {
    console.error('[PromptPilot popup] loadSettings:', err);
    setStatus('error', `Load error: ${err.message}`);
  }
}

async function saveAndTest() {
  const provider = els.providerSel.value;
  const model    = resolveModel();
  const apiKey   = els.apiKeyInput.value.trim();

  if (!apiKey) { setStatus('warn', 'Enter an API key first'); return; }

  els.saveBtn.disabled = true;
  els.saveBtn.innerHTML = '<div class="spinner"></div> Testing…';
  setStatus('idle', 'Testing connection…');

  try {
    await sendMsg({ type: 'SAVE_SETTINGS', payload: { provider, model, apiKey } });

    const result = await sendMsg({
      type: 'TEST_CONNECTION',
      payload: { providerName: provider, apiKey, model },
    });

    if (result?.success) {
      setStatus('success', `✓ Connected via ${providerLabel(provider)}!`);
      els.setupAlert.style.display = 'none';
      const usage = await sendMsg({ type: 'GET_USAGE' });
      if (usage) updateUsageDisplay(usage.count || 0, 'byok');
    } else {
      setStatus('error', result?.error || 'Connection failed');
    }
  } catch (err) {
    setStatus('error', `Error: ${err.message}`);
  } finally {
    els.saveBtn.disabled = false;
    els.saveBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Save &amp; Test Connection`;
  }
}

function providerLabel(p) {
  return { openai: 'OpenAI', anthropic: 'Anthropic', gemini: 'Gemini', groq: 'Groq' }[p] || p;
}

// ─── Messaging ────────────────────────────────────────────────────────────────

function sendMsg(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, res => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(res);
    });
  });
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

function initEventListeners() {
  els.providerSel.addEventListener('change', () => {
    const provider = els.providerSel.value;
    populateModels(provider);
    updateKeyHint(provider);
    els.customModelInput.value = '';
    updateCustomModelHint();
    setStatus('idle', 'Provider changed — save to apply');
  });

  els.modelSel.addEventListener('change', () => {
    if (els.modelSel.value) {
      els.customModelInput.value = '';
      updateCustomModelHint();
    }
  });

  els.customModelInput.addEventListener('input', () => {
    if (els.customModelInput.value.trim()) {
      els.modelSel.selectedIndex = 0;
    }
    updateCustomModelHint();
  });

  let keyVisible = false;
  els.toggleKeyBtn.addEventListener('click', () => {
    keyVisible = !keyVisible;
    els.apiKeyInput.type = keyVisible ? 'text' : 'password';
    els.eyeIcon.innerHTML = keyVisible
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
  });

  els.saveBtn.addEventListener('click', saveAndTest);
  els.apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveAndTest(); });
  els.customModelInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveAndTest(); });

  els.notifyBtn.addEventListener('click', () => {
    els.notifyBtn.textContent = "✓ We'll let you know!";
    els.notifyBtn.disabled = true;
  });

  // Memory listeners
  els.memoryToggle.addEventListener('change', () => {
    sendMsg({
      type: 'SAVE_MEMORY',
      payload: { rawText: els.memoryTextarea.value, enabled: els.memoryToggle.checked }
    });
  });

  els.copyPromptBtn.addEventListener('click', () => {
    const text = els.exportPromptBox.innerText;
    navigator.clipboard.writeText(text).then(() => {
      els.copyPromptBtn.innerHTML = '✓ Copied!';
      setTimeout(() => {
        els.copyPromptBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy prompt';
      }, 1500);
    });
  });

  els.memoryTextarea.addEventListener('input', updateCharCount);

  els.saveMemoryBtn.addEventListener('click', saveMemory);

  els.clearMemoryBtn.addEventListener('click', () => {
    if (confirm('Clear all stored memory? This cannot be undone.')) {
      els.memoryTextarea.value = '';
      updateCharCount();
      saveMemory();
    }
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

initTabs();
initEventListeners();
loadSettings();
loadMemoryStats();
