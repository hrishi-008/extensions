/**
 * PromptPilot — Content Script (self-contained IIFE)
 * Injected as a plain content script (no ESM imports).
 * All logic is inlined — Shadow DOM isolated.
 */
(function () {
  'use strict';

  // Prevent double-injection
  if (document.getElementById('promptpilot-host')) return;

  // ─── Platform Configs ──────────────────────────────────────────────────────

  const PLATFORMS = {
    chatgpt: {
      hostnames: ['chatgpt.com', 'chat.openai.com'],
      inputSelectors: [
        '#prompt-textarea',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"]',
      ],
      anchorSelectors: ['form.stretch', 'form', '[data-testid="composer-footer"]'],
      setText(el, text) {
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        if (!el.innerText.trim()) {
          el.innerHTML = '';
          const p = document.createElement('p');
          p.textContent = text;
          el.appendChild(p);
          el.dispatchEvent(new InputEvent('input', { bubbles: true }));
        }
      },
    },
    claude: {
      hostnames: ['claude.ai'],
      inputSelectors: [
        'div[contenteditable="true"].ProseMirror',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"]',
      ],
      anchorSelectors: ['fieldset', 'form', '.composer-input'],
      setText(el, text) {
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      },
    },
    gemini: {
      hostnames: ['gemini.google.com'],
      inputSelectors: [
        'rich-textarea .ql-editor',
        '.input-area-container [contenteditable="true"]',
        '[contenteditable="true"]',
      ],
      anchorSelectors: ['.input-area', 'rich-textarea', 'form'],
      setText(el, text) {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('insertText', false, text);
      },
    },
    perplexity: {
      hostnames: ['perplexity.ai', 'www.perplexity.ai'],
      inputSelectors: ['textarea[placeholder]', 'textarea', '[contenteditable="true"]'],
      anchorSelectors: ['form', '.grow'],
      setText(el, text) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;
        if (setter) setter.call(el, text);
        else el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
    },
    copilot: {
      hostnames: ['copilot.microsoft.com'],
      inputSelectors: ['textarea', '[contenteditable="true"]'],
      anchorSelectors: ['form', 'cib-action-bar'],
      setText(el, text) {
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      },
    },
    poe: {
      hostnames: ['poe.com'],
      inputSelectors: ['textarea[class*="GrowingTextArea"]', 'textarea', '[contenteditable="true"]'],
      anchorSelectors: ['footer', 'form'],
      setText(el, text) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;
        if (setter) setter.call(el, text);
        else el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
    },
  };

  // ─── Detect Platform ────────────────────────────────────────────────────────

  function detectPlatform() {
    const h = location.hostname;
    for (const [name, cfg] of Object.entries(PLATFORMS)) {
      if (cfg.hostnames.some(host => h === host || h.endsWith('.' + host))) {
        return { name, config: cfg };
      }
    }
    return null;
  }

  function findEl(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch (_) {}
    }
    return null;
  }

  // ─── Shadow DOM ─────────────────────────────────────────────────────────────

  const host = document.createElement('div');
  host.id = 'promptpilot-host';
  host.style.cssText = 'all:unset;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // ─── Inject Styles ──────────────────────────────────────────────────────────

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap');

    * { box-sizing: border-box; }

    #pp-btn {
      position: fixed;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px 7px 10px;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap;
      user-select: none;
      pointer-events: all;
      background: linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(79,70,229,0.97) 100%);
      box-shadow: 0 4px 16px rgba(124,58,237,0.45), 0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
      color: #fff;
      backdrop-filter: blur(8px);
      transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, opacity 0.15s;
      z-index: 2147483647;
    }
    #pp-btn:hover { transform: scale(1.06); box-shadow: 0 6px 24px rgba(124,58,237,0.6), 0 2px 8px rgba(0,0,0,0.35); }
    #pp-btn:active { transform: scale(0.97); }
    #pp-btn.loading { opacity: 0.8; pointer-events: none; }

    .pp-spinner {
      width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    #pp-panel {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 380px;
      max-width: calc(100vw - 32px);
      border-radius: 16px;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      pointer-events: all;
      background: rgba(13,10,28,0.96);
      border: 1px solid rgba(124,58,237,0.35);
      box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.06);
      backdrop-filter: blur(20px);
      z-index: 2147483646;
      transform: translateY(16px) scale(0.97);
      opacity: 0;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
    }
    #pp-panel.show { transform: translateY(0) scale(1); opacity: 1; }

    .ph {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 15px 11px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .pt { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: #e0d7ff; }
    .pd {
      font-size: 10.5px; font-weight: 600; color: #a78bfa;
      padding: 2px 8px; border-radius: 10px; background: rgba(124,58,237,0.18);
    }
    .px {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.35); font-size: 17px; line-height: 1; padding: 0;
      transition: color 0.15s;
    }
    .px:hover { color: rgba(255,255,255,0.85); }

    .pb {
      padding: 13px 15px;
      display: flex; flex-direction: column; gap: 11px;
      max-height: 300px; overflow-y: auto;
    }
    .pb::-webkit-scrollbar { width: 3px; }
    .pb::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 4px; }

    .lbl { font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 5px; }
    .orig { font-size: 12px; color: rgba(255,255,255,0.42); line-height: 1.6; font-style: italic; padding: 9px 11px; background: rgba(255,255,255,0.04); border-radius: 8px; border-left: 2px solid rgba(255,255,255,0.1); }
    .enha { font-size: 12.5px; color: #e2e0ff; line-height: 1.65; padding: 11px 12px; background: rgba(124,58,237,0.1); border-radius: 8px; border-left: 2px solid rgba(124,58,237,0.55); }
    .err  { font-size: 12px; color: #fca5a5; line-height: 1.5; padding: 11px 12px; background: rgba(239,68,68,0.1); border-radius: 8px; border: 1px solid rgba(239,68,68,0.25); }
    .cta  { text-align: center; padding: 6px 0 4px; }
    .cta strong { display: block; color: #fff; margin-bottom: 4px; }
    .cta small  { color: rgba(255,255,255,0.45); font-size: 11.5px; }

    .pf { display: flex; gap: 8px; padding: 11px 15px 13px; border-top: 1px solid rgba(255,255,255,0.06); }
    .pb1, .pb2 {
      flex: 1; padding: 8px 10px; border-radius: 9px; border: none;
      cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600;
      transition: transform 0.12s, opacity 0.12s;
    }
    .pb1:hover, .pb2:hover { transform: translateY(-1px); }
    .pb1:active, .pb2:active { transform: translateY(0); opacity: 0.85; }
    .pb1 { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; box-shadow: 0 2px 8px rgba(124,58,237,0.4); }
    .pb2 { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.1); }
    .pb2:hover { color: #fff; }

    #pp-toast {
      position: fixed;
      bottom: 24px; left: 50%;
      transform: translateX(-50%) translateY(10px);
      z-index: 2147483647;
      padding: 9px 17px; border-radius: 11px;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12.5px; font-weight: 500;
      color: #fff; pointer-events: none; white-space: nowrap;
      opacity: 0; transition: opacity 0.2s, transform 0.2s;
    }
    #pp-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    #pp-toast.ok   { background: linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95)); box-shadow: 0 4px 16px rgba(16,185,129,0.4); }
    #pp-toast.bad  { background: linear-gradient(135deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95)); box-shadow: 0 4px 16px rgba(239,68,68,0.4); }
    #pp-toast.warn { background: linear-gradient(135deg, rgba(245,158,11,0.95), rgba(180,83,9,0.95)); box-shadow: 0 4px 16px rgba(245,158,11,0.4); }
  `;
  shadow.appendChild(style);

  // ─── Floating Button ────────────────────────────────────────────────────────

  const btn = document.createElement('button');
  btn.id = 'pp-btn';
  btn.title = 'PromptPilot: Enhance this prompt';
  btn.style.display = 'none';
  btn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
    <span id="pp-btn-label">Enhance</span>
  `;
  shadow.appendChild(btn);

  // ─── Panel ──────────────────────────────────────────────────────────────────

  const panel = document.createElement('div');
  panel.id = 'pp-panel';
  panel.innerHTML = `
    <div class="ph">
      <div class="pt">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        PromptPilot
        <span class="pd" id="pp-domain">✨ General</span>
      </div>
      <button class="px" id="pp-close">✕</button>
    </div>
    <div class="pb" id="pp-body"></div>
    <div class="pf" id="pp-footer" style="display:none"></div>
  `;
  shadow.appendChild(panel);

  // ─── Toast ──────────────────────────────────────────────────────────────────

  const toast = document.createElement('div');
  toast.id = 'pp-toast';
  shadow.appendChild(toast);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/\n/g,'<br>');
  }

  let toastTimer;
  function showToast(msg, type = 'ok', ms = 2800) {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = `show ${type}`;
    toastTimer = setTimeout(() => { toast.className = ''; }, ms);
  }

  function showPanel() {
    panel.style.display = 'block';
    requestAnimationFrame(() => panel.classList.add('show'));
  }

  function hidePanel() {
    panel.classList.remove('show');
    setTimeout(() => { panel.style.display = 'none'; }, 260);
  }

  function setLoading(on) {
    const label = shadow.getElementById('pp-btn-label');
    const svgEl = btn.querySelector('svg');
    const spinner = btn.querySelector('.pp-spinner');
    if (on) {
      btn.classList.add('loading');
      svgEl.style.display = 'none';
      if (!spinner) {
        const s = document.createElement('div');
        s.className = 'pp-spinner';
        btn.insertBefore(s, label);
      }
      label.textContent = 'Enhancing…';
    } else {
      btn.classList.remove('loading');
      svgEl.style.display = '';
      const sp = btn.querySelector('.pp-spinner');
      if (sp) sp.remove();
      label.textContent = 'Enhance';
    }
  }

  // ─── Position button ────────────────────────────────────────────────────────

  let activePlatform = null;

  function positionBtn() {
    if (!activePlatform) return;
    const anchor = findEl(activePlatform.config.anchorSelectors)
                || findEl(activePlatform.config.inputSelectors);
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    btn.style.top  = `${Math.max(8, r.bottom - 46)}px`;
    btn.style.left = `${Math.max(8, r.right - 132)}px`;
    btn.style.display = 'flex';
  }

  // ─── Read prompt text ───────────────────────────────────────────────────────

  function readText() {
    if (!activePlatform) return '';
    const el = findEl(activePlatform.config.inputSelectors);
    if (!el) return '';
    return (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')
      ? (el.value || '')
      : (el.innerText || el.textContent || '');
  }

  // ─── Apply enhanced text ────────────────────────────────────────────────────

  function applyText(text) {
    if (!activePlatform) return false;
    const el = findEl(activePlatform.config.inputSelectors);
    if (!el) return false;
    try {
      activePlatform.config.setText(el, text);
      return true;
    } catch (e) {
      console.error('[PromptPilot] setText error:', e);
      return false;
    }
  }

  // ─── Show result panel ──────────────────────────────────────────────────────

  function renderResult(original, enhanced, domain, emoji) {
    shadow.getElementById('pp-domain').textContent = `${emoji} ${domain}`;
    shadow.getElementById('pp-body').innerHTML = `
      <div><div class="lbl">Original</div><div class="orig">${esc(original)}</div></div>
      <div><div class="lbl">Enhanced ✦</div><div class="enha">${esc(enhanced)}</div></div>
    `;
    const footer = shadow.getElementById('pp-footer');
    footer.innerHTML = `
      <button class="pb1" id="pp-apply">Apply Enhanced</button>
      <button class="pb2" id="pp-copy">Copy</button>
    `;
    footer.style.display = 'flex';
    shadow.getElementById('pp-apply').onclick = () => {
      if (applyText(enhanced)) { hidePanel(); showToast('✓ Prompt applied!', 'ok'); }
      else showToast('Paste failed — try copying', 'warn');
    };
    shadow.getElementById('pp-copy').onclick = () => {
      navigator.clipboard.writeText(enhanced).then(() => showToast('✓ Copied!', 'ok'));
    };
    showPanel();
  }

  function renderError(msg, needsSetup) {
    shadow.getElementById('pp-domain').textContent = '⚠ Error';
    if (needsSetup) {
      shadow.getElementById('pp-body').innerHTML = `
        <div class="cta">
          <strong>Setup Required ✈️</strong>
          <small>Open the PromptPilot popup (extension icon) to add your API key.</small>
        </div>`;
    } else {
      shadow.getElementById('pp-body').innerHTML = `<div class="err">${esc(msg)}</div>`;
    }
    shadow.getElementById('pp-footer').style.display = 'none';
    showPanel();
  }

  // ─── Main enhance handler ───────────────────────────────────────────────────

  let enhancing = false;

  async function enhance() {
    if (enhancing) return;
    const raw = readText().trim();
    if (!raw) { showToast('Type something first!', 'warn'); return; }

    enhancing = true;
    setLoading(true);
    hidePanel();

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'ENHANCE_PROMPT',
        payload: { prompt: raw },
      });

      setLoading(false);
      enhancing = false;

      if (!res) { showToast('Extension error — reload the page', 'bad'); return; }

      if (res.success) {
        renderResult(raw, res.enhanced, res.domain, res.emoji);
      } else if (res.needsSetup) {
        renderError(res.error, true);
      } else {
        renderError(res.error || 'Something went wrong.', false);
        if (res.limitReached) showToast('Daily limit reached', 'warn');
      }
    } catch (err) {
      setLoading(false);
      enhancing = false;
      showToast('Connection error', 'bad');
      console.error('[PromptPilot]', err);
    }
  }

  // ─── Events ─────────────────────────────────────────────────────────────────

  btn.addEventListener('click', enhance);
  shadow.getElementById('pp-close').addEventListener('click', hidePanel);

  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') &&
        !shadow.contains(e.target) && e.target !== host) {
      hidePanel();
    }
  }, true);

  // ─── Observe DOM & position ─────────────────────────────────────────────────

  function tryInit() {
    const p = detectPlatform();
    if (!p) return false;
    activePlatform = p;
    const el = findEl(p.config.inputSelectors);
    if (el) { positionBtn(); return true; }
    return false;
  }

  const observer = new MutationObserver(() => {
    if (activePlatform) { positionBtn(); }
    else { tryInit(); }
  });

  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: false,
  });

  window.addEventListener('resize', positionBtn, { passive: true });
  window.addEventListener('scroll', positionBtn, { passive: true });

  // Initial attempts for SPA mount delay
  if (!tryInit()) {
    setTimeout(tryInit, 1000);
    setTimeout(tryInit, 2500);
    setTimeout(tryInit, 5000);
  }

  console.log('[PromptPilot] ✈️ Loaded on', location.hostname);
})();
