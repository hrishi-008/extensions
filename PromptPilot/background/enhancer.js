import { formatMemoryBlock } from './memory.js';

// ─── Domain Profiles ──────────────────────────────────────────────────────────
// Each niche has a label, emoji, and a set of enhancement instructions.

const DOMAIN_PROFILES = {
  'Software Engineering': {
    emoji: '💻',
    instructions: `
- Specify the programming language, framework, and relevant version numbers
- Mention the environment (OS, runtime, dependencies) when relevant
- Ask for edge cases, error handling, and performance considerations
- Request code comments and explanation of key decisions
- Specify whether you want a snippet, a full module, or a step-by-step guide`,
  },
  'Data Science & ML': {
    emoji: '🤖',
    instructions: `
- Specify the dataset characteristics (size, format, features)
- Mention the ML framework (scikit-learn, PyTorch, TensorFlow, etc.)
- Ask for evaluation metrics and validation strategy
- Request explanation of model choices and hyperparameters
- Specify whether you need theory, code, or both`,
  },
  'Creative Writing': {
    emoji: '✍️',
    instructions: `
- Define the genre, tone, and target audience
- Specify word/paragraph count and desired style (formal, casual, literary)
- Mention any narrative perspective (first-person, third-person omniscient, etc.)
- Include any themes, motifs, or structural requirements
- State whether you want a draft, outline, or polished piece`,
  },
  'Research & Analysis': {
    emoji: '🔬',
    instructions: `
- Specify the academic field and depth (undergraduate, graduate, expert)
- Mention preferred citation style (APA, MLA, Chicago)
- Ask for a balanced analysis with counterarguments
- Request primary sources, recent papers, or specific databases to search
- Define the output format (essay, bullet points, annotated bibliography)`,
  },
  'Marketing & Growth': {
    emoji: '📈',
    instructions: `
- Specify the target audience (demographics, psychographics, pain points)
- Mention the channel (email, social media, landing page, ad copy)
- State the desired action (click, sign up, purchase) and conversion goal
- Include brand voice, tone, and any constraints (character limits, brand guidelines)
- Request A/B variants if relevant`,
  },
  'Business & Strategy': {
    emoji: '💼',
    instructions: `
- Define the business context (stage, industry, company size)
- Specify the stakeholder audience (C-suite, investors, team)
- Request SWOT analysis, frameworks (OKRs, JTBD, Porter's Five Forces) if applicable
- Mention any constraints (budget, timeline, team size)
- Specify the output format (executive summary, slide deck outline, report)`,
  },
  'Legal & Compliance': {
    emoji: '⚖️',
    instructions: `
- Specify the jurisdiction and governing law
- Mention the document type (contract, policy, legal memo, compliance checklist)
- State the parties involved and their roles
- Request plain-language explanations alongside legal language
- Identify any deadlines, penalties, or enforcement mechanisms to address`,
  },
  'Education & Learning': {
    emoji: '📚',
    instructions: `
- Specify the learner's level (beginner, intermediate, advanced)
- Mention the subject and any prerequisite knowledge
- Request multiple explanation styles (analogy, example, diagram description)
- Ask for exercises, quizzes, or flashcard-style summaries
- Specify the desired learning outcome`,
  },
  'General': {
    emoji: '✨',
    instructions: `
- Clarify the desired output format (list, paragraph, table, code, etc.)
- Specify the target audience and their level of expertise
- Mention any constraints (length, style, language)
- Ask for examples where relevant
- State whether you want a concise answer or a comprehensive explanation`,
  },
};

// ─── Master Enhancement System Prompt ─────────────────────────────────────────

function buildSystemPrompt(domainProfile, memoryBlock = '') {
  const { emoji, instructions } = domainProfile;
  const memorySection = memoryBlock ? `${memoryBlock}
---
` : '';
  return `${memorySection}You are PromptPilot, a world-class AI prompt engineer.

Your task is to transform a rough, initial user prompt into a richly detailed, expert-level prompt that will elicit a much higher-quality response from any AI assistant.

${memoryBlock ? 'Use the User Memory Context above to personalise the enhanced prompt where relevant — weave in the user\'s known tools, role, preferences, and goals naturally.\n\n' : ''}Domain context ${emoji}:
${instructions}

Rules:
1. PRESERVE the user's original intent exactly — never change what they are asking for
2. ADD specificity, constraints, context, and format instructions
3. Make the prompt 2–4× more detailed and actionable than the original
4. Write ONLY the enhanced prompt — no preamble, no explanation, no quotes
5. Use clear, direct language
6. If the original prompt is already excellent, make only minor improvements
7. Output the enhanced prompt as plain text, ready to paste into a chat`;
}

// ─── Domain Classifier System Prompt ──────────────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT = `You are a domain classifier. Given a user's prompt, identify which single domain it belongs to.

Respond with ONLY one of these exact labels (no other text):
Software Engineering
Data Science & ML
Creative Writing
Research & Analysis
Marketing & Growth
Business & Strategy
Legal & Compliance
Education & Learning
General`;

// ─── Main Enhancer ────────────────────────────────────────────────────────────

/**
 * Detect the niche/domain of a prompt using a quick LLM call.
 * @param {string} rawPrompt
 * @param {import('./providers/base.js').BaseProvider} provider
 * @returns {Promise<string>} domain label
 */
export async function detectDomain(rawPrompt, provider) {
  try {
    const domain = await provider.enhance(rawPrompt, CLASSIFIER_SYSTEM_PROMPT);
    const trimmed = domain.trim();
    return DOMAIN_PROFILES[trimmed] ? trimmed : 'General';
  } catch {
    return 'General';
  }
}

/**
 * Enhance a prompt. Handles domain detection + enhancement in sequence.
 * @param {string}   rawPrompt
 * @param {import('./providers/base.js').BaseProvider} provider
 * @param {string}   [forceDomain]    - Optional: skip detection and use this domain
 * @param {string[]} [memorySnippets] - Optional: pre-selected relevant memory entries
 * @returns {Promise<{enhanced: string, domain: string, emoji: string, memoryUsed: number}>}
 */
export async function enhancePrompt(rawPrompt, provider, forceDomain = null, memorySnippets = []) {
  if (!rawPrompt || rawPrompt.trim().length < 3) {
    throw new Error('Prompt is too short to enhance. Please write something first!');
  }

  // Step 1: Detect Domain
  const domain = forceDomain || await detectDomain(rawPrompt, provider);
  const profile = DOMAIN_PROFILES[domain] || DOMAIN_PROFILES['General'];

  // Step 2: Format memory block (empty string if no snippets)
  const memoryBlock = formatMemoryBlock(memorySnippets);

  // Step 3: Build system prompt — with optional memory context prepended
  const systemPrompt = buildSystemPrompt(profile, memoryBlock);

  // Step 4: Enhance
  const enhanced = await provider.enhance(rawPrompt, systemPrompt);

  return {
    enhanced,
    domain,
    emoji: profile.emoji,
    memoryUsed: memorySnippets.length,
  };
}

export { DOMAIN_PROFILES };
