import { OpenAIProvider }    from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { GeminiProvider }    from './providers/gemini.js';
import { GroqProvider }      from './providers/groq.js';
import { enhancePrompt }     from './enhancer.js';
import { parseMemory, selectRelevantMemory } from './memory.js';
import * as api from './api.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_DAILY_LIMIT = 3;
const STORAGE_KEYS = {
  PROVIDER:     'pp_provider',
  API_KEY:      'pp_api_key',
  MODEL:        'pp_model',
  USAGE_COUNT:  'pp_usage_count',
  USAGE_DATE:   'pp_usage_date',
  TIER:         'pp_tier',
  MEMORY_RAW:   'pp_memory_raw',   // Raw pasted memory text
  MEMORY_ON:    'pp_memory_on',    // Boolean toggle
};

// ─── Provider Factory ──────────────────────────────────────────────────────────

function createProvider(providerName, apiKey, model) {
  const config = { apiKey, model };
  switch (providerName) {
    case 'openai':    return new OpenAIProvider(config);
    case 'anthropic': return new AnthropicProvider(config);
    case 'gemini':    return new GeminiProvider(config);
    case 'groq':      return new GroqProvider(config);
    default:          return new OpenAIProvider(config);
  }
}

// ─── Usage Tracking ────────────────────────────────────────────────────────────

async function getUsage() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.USAGE_COUNT,
    STORAGE_KEYS.USAGE_DATE,
    STORAGE_KEYS.TIER,
  ]);

  const today = new Date().toDateString();
  const storedDate = data[STORAGE_KEYS.USAGE_DATE];

  // Reset counter if it's a new day
  if (storedDate !== today) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.USAGE_COUNT]: 0,
      [STORAGE_KEYS.USAGE_DATE]: today,
    });
    return { count: 0, date: today, tier: data[STORAGE_KEYS.TIER] || 'byok' };
  }

  return {
    count: data[STORAGE_KEYS.USAGE_COUNT] || 0,
    date: storedDate,
    tier: data[STORAGE_KEYS.TIER] || 'byok',
  };
}

async function incrementUsage() {
  const usage = await getUsage();
  await chrome.storage.local.set({
    [STORAGE_KEYS.USAGE_COUNT]: usage.count + 1,
    [STORAGE_KEYS.USAGE_DATE]: new Date().toDateString(),
  });
  return usage.count + 1;
}

// ─── Core Handler ──────────────────────────────────────────────────────────────

async function handleEnhanceRequest(rawPrompt) {
  // 1. Load settings
  const settings = await chrome.storage.local.get([
    STORAGE_KEYS.PROVIDER,
    STORAGE_KEYS.API_KEY,
    STORAGE_KEYS.MODEL,
    STORAGE_KEYS.TIER,
    STORAGE_KEYS.MEMORY_RAW,
    STORAGE_KEYS.MEMORY_ON,
  ]);

  const providerName = settings[STORAGE_KEYS.PROVIDER] || 'openai';
  const apiKey       = settings[STORAGE_KEYS.API_KEY]   || '';
  const model        = settings[STORAGE_KEYS.MODEL]      || '';
  const tier         = settings[STORAGE_KEYS.TIER]       || 'byok';
  const memoryRaw    = settings[STORAGE_KEYS.MEMORY_RAW] || '';
  const memoryOn     = settings[STORAGE_KEYS.MEMORY_ON]  !== false; // default true

  // 2. Check usage limits for free tier
  if (tier === 'free') {
    const usage = await getUsage();
    if (usage.count >= FREE_DAILY_LIMIT) {
      return {
        success: false,
        error: `You've used all ${FREE_DAILY_LIMIT} free enhancements today. Upgrade to BYOK or Pro for unlimited usage.`,
        limitReached: true,
      };
    }
  }

  // 3. Validate API key
  if (!apiKey) {
    return {
      success: false,
      error: 'No API key configured. Open the PromptPilot popup to add your API key.',
      needsSetup: true,
    };
  }

  // 4. Load relevant memory snippets (Gated by Tier)
  let memorySnippets = [];
  const isMemoryTier = tier === 'byok_memory' || tier === 'pro_memory';
  
  if (memoryOn && memoryRaw && isMemoryTier) {
    const allEntries = parseMemory(memoryRaw);
    memorySnippets = selectRelevantMemory(allEntries, rawPrompt, 'General', 6);
  } else if (memoryOn && memoryRaw && !isMemoryTier) {
    console.warn('[PromptPilot] Memory enabled but tier does not support it.');
  }

  // 5. Enhance
  try {
    const provider = createProvider(providerName, apiKey, model);
    const result   = await enhancePrompt(rawPrompt, provider, null, memorySnippets);
    const newCount = await incrementUsage();
    
    // Sync to Supabase in background
    api.syncUsage(newCount);
    
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── Message Router ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  if (type === 'ENHANCE_PROMPT') {
    handleEnhanceRequest(payload.prompt)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep the message channel open for async response
  }

  if (type === 'GET_USAGE') {
    getUsage()
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (type === 'GET_SETTINGS') {
    chrome.storage.local
      .get([
        STORAGE_KEYS.PROVIDER,
        STORAGE_KEYS.API_KEY,
        STORAGE_KEYS.MODEL,
        STORAGE_KEYS.TIER,
      ])
      .then((data) =>
        sendResponse({
          provider: data[STORAGE_KEYS.PROVIDER] || 'openai',
          apiKey:   data[STORAGE_KEYS.API_KEY]   || '',
          model:    data[STORAGE_KEYS.MODEL]      || '',
          tier:     data[STORAGE_KEYS.TIER]       || 'byok',
        })
      )
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (type === 'SAVE_SETTINGS') {
    const { provider, apiKey, model } = payload;
    chrome.storage.local
      .set({
        [STORAGE_KEYS.PROVIDER]: provider,
        [STORAGE_KEYS.API_KEY]:  apiKey,
        [STORAGE_KEYS.MODEL]:    model,
        [STORAGE_KEYS.TIER]:     apiKey ? 'byok' : 'free',
      })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (type === 'TEST_CONNECTION') {
    const { providerName, apiKey, model } = payload;
    const provider = createProvider(providerName, apiKey, model);
    provider
      .testConnection()
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (type === 'SAVE_MEMORY') {
    const { rawText, enabled } = payload;
    const entries = parseMemory(rawText || '');
    chrome.storage.local
      .set({
        [STORAGE_KEYS.MEMORY_RAW]: rawText || '',
        [STORAGE_KEYS.MEMORY_ON]:  enabled !== false,
      })
      .then(() => sendResponse({ success: true, entryCount: entries.length }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (type === 'GET_MEMORY_STATS') {
    chrome.storage.local
      .get([STORAGE_KEYS.MEMORY_RAW, STORAGE_KEYS.MEMORY_ON])
      .then(data => {
        const raw     = data[STORAGE_KEYS.MEMORY_RAW] || '';
        const enabled = data[STORAGE_KEYS.MEMORY_ON] !== false;
        const entries = parseMemory(raw);
        sendResponse({ entryCount: entries.length, charCount: raw.length, enabled });
      })
      .catch(err => sendResponse({ entryCount: 0, charCount: 0, enabled: true }));
    return true;
  }
});

// ─── Alarm: Reset daily usage at midnight ─────────────────────────────────────

chrome.alarms.create('daily-reset', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-reset') {
    const today = new Date().toDateString();
    const stored = await chrome.storage.local.get(STORAGE_KEYS.USAGE_DATE);
    if (stored[STORAGE_KEYS.USAGE_DATE] !== today) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.USAGE_COUNT]: 0,
        [STORAGE_KEYS.USAGE_DATE]: today,
      });
    }
  }
});

console.log('[PromptPilot] Service worker initialized ✈️');
