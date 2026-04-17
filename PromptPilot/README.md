# ✈️ PromptPilot — AI Prompt Enhancer

> One click turns a vague request into an expert-level prompt. PromptPilot detects your topic, enriches context, and rewrites your prompt — right inside ChatGPT, Claude, Gemini, and more.

---

## 🚀 Installation (Developer Mode)

1. **Clone / download** this repo to your machine
2. Open Chrome and go to `chrome://extensions/`
3. Toggle **Developer mode** ON (top-right corner)
4. Click **"Load unpacked"**
5. Select the `PromptPilot/` folder
6. The PromptPilot icon will appear in your Chrome toolbar

---

## ⚙️ Setup (Required)

Before enhancing prompts, add your API key:

1. Click the **PromptPilot icon** in the Chrome toolbar
2. Select your **AI Provider** (OpenAI, Anthropic, or Google Gemini)
3. Choose your preferred **Model**
4. Paste your **API Key**
5. Click **"Save & Test Connection"**

### Getting API Keys

| Provider | Key Format | Get Key At |
|----------|-----------|------------|
| OpenAI   | `sk-...`  | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Anthropic | `sk-ant-...` | [console.anthropic.com](https://console.anthropic.com) |
| Google Gemini | `AIza...` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

---

## 🎯 How to Use

1. Go to any supported AI chatbot
2. Type your prompt in the input box
3. Click the **purple "Enhance" button** that appears near the input
4. Review the **Before / After** panel
5. Click **"Apply Enhanced"** to replace your prompt, or **"Copy"** to copy it

---

## 🌐 Supported Platforms

| Platform | URL |
|----------|-----|
| ChatGPT  | chatgpt.com |
| Claude   | claude.ai |
| Gemini   | gemini.google.com |
| Perplexity | perplexity.ai |
| Microsoft Copilot | copilot.microsoft.com |
| Poe | poe.com |

---

## 💡 How It Works

1. **Domain Detection** — PromptPilot sends your prompt to the LLM to classify it (Software Engineering, Creative Writing, Research, etc.)
2. **Context Enrichment** — It loads a domain-specific enhancement profile with best practices for that topic
3. **Prompt Rewriting** — Your prompt is rewritten to be 2–4× more detailed, specific, and actionable
4. **One-Click Apply** — The enhanced prompt is injected back into the chatbot input, ready to send

---

## 📦 Project Structure

```
PromptPilot/
├── manifest.json               # Chrome Extension Manifest V3
├── background/
│   ├── service-worker.js       # Background worker (API calls, usage tracking)
│   ├── enhancer.js             # Domain detection + prompt enhancement engine
│   └── providers/
│       ├── base.js             # Base LLM provider interface
│       ├── openai.js           # OpenAI GPT provider
│       ├── anthropic.js        # Anthropic Claude provider
│       └── gemini.js           # Google Gemini provider
├── content/
│   ├── content.js              # Floating button + enhancement UI (Shadow DOM)
│   └── content.css             # Supplementary styles
├── popup/
│   ├── popup.html              # Extension popup dashboard
│   ├── popup.js                # Popup logic
│   └── popup.css               # Popup styles
└── assets/
    └── icons/                  # Extension icons (16, 32, 48, 128px)
```

---

## 💰 Pricing Tiers

| Tier | Price | Limit | Notes |
|------|-------|-------|-------|
| **BYOK** | Free | Unlimited | Bring your own API key |
| **Pro** | $15/mo | 200/day | Managed API — coming soon |

---

## 🔒 Privacy

- Your API key is stored **locally** in Chrome's storage — never sent to our servers
- Prompts are sent **directly** from your browser to the LLM provider's API
- We do not log, store, or transmit your prompts

---

## 🛠 Development

Built with:
- Chrome Extension **Manifest V3**
- Vanilla JS (no framework)
- **Shadow DOM** for CSS isolation
- ES Modules in service worker

To modify and reload:
1. Make your changes
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on the PromptPilot card

---

## 📬 Contact

- Email: hello@promptpilot.ai
- Issues: GitHub Issues

---

*PromptPilot v1.0.0 — Made with ✈️*
