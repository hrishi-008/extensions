/**
 * PromptPilot — Memory Engine
 *
 * Parses the Claude/ChatGPT memory export (plain text, one entry per line)
 * and finds snippets most relevant to the current prompt using keyword overlap
 * + domain affinity scoring. No LLM call needed — fast and local.
 */

// ─── Parse raw memory text into clean entries ──────────────────────────────────

/**
 * Accepts the raw exported memory block and returns an array of entry strings.
 * Handles the formats:
 *   - "[date] - memory text"       (Claude import/export standard)
 *   - "- memory text"              (plain bullet list)
 *   - "memory text"                (bare lines)
 *   - Numbered:  "1. memory text"
 */
export function parseMemory(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 4); // skip blank / too-short lines

  const entries = [];

  for (const line of lines) {
    // Strip leading bullet / number / date prefix, keep the content
    const cleaned = line
      .replace(/^\[\d{4}[^\]]*\]\s*[-–]\s*/, '')   // [2024-01-15] - ...
      .replace(/^[-•*]\s+/, '')                       // - bullet
      .replace(/^\d+\.\s+/, '')                       // 1. numbered
      .trim();

    if (cleaned.length > 6) entries.push(cleaned);
  }

  return entries;
}

// ─── Domain keyword maps ───────────────────────────────────────────────────────
// These help score memory snippets for relevance to each detected domain.

const DOMAIN_KEYWORDS = {
  'Software Engineering': [
    'code', 'programm', 'develop', 'engineer', 'software', 'frontend', 'backend',
    'javascript', 'python', 'typescript', 'react', 'node', 'api', 'database',
    'git', 'deploy', 'framework', 'library', 'function', 'debug', 'testing',
    'architecture', 'language', 'stack', 'fullstack', 'devops', 'cloud',
  ],
  'Data Science & ML': [
    'data', 'ml', 'machine learning', 'model', 'dataset', 'analysis', 'statistics',
    'python', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'sklearn', 'notebook',
    'visualization', 'feature', 'training', 'prediction', 'neural', 'ai',
  ],
  'Creative Writing': [
    'writ', 'story', 'fiction', 'blog', 'content', 'essay', 'novel', 'script',
    'tone', 'voice', 'audience', 'genre', 'creative', 'narrative', 'character',
  ],
  'Research & Analysis': [
    'research', 'paper', 'study', 'academic', 'analysis', 'report', 'citation',
    'thesis', 'journal', 'findings', 'methodology', 'sources', 'literature',
  ],
  'Marketing & Growth': [
    'marketing', 'seo', 'growth', 'campaign', 'brand', 'audience', 'conversion',
    'social media', 'email', 'ads', 'copy', 'funnel', 'analytics', 'startup',
  ],
  'Business & Strategy': [
    'business', 'strategy', 'product', 'startup', 'company', 'revenue', 'market',
    'investor', 'roadmap', 'okr', 'kpi', 'management', 'team', 'ceo', 'founder',
  ],
  'Legal & Compliance': [
    'legal', 'law', 'contract', 'compliance', 'regulation', 'gdpr', 'policy',
    'attorney', 'jurisdiction', 'clause', 'agreement', 'liability',
  ],
  'Education & Learning': [
    'learn', 'teach', 'student', 'course', 'curriculum', 'tutor', 'education',
    'explain', 'beginner', 'concept', 'understand', 'study', 'lesson',
  ],
  'General': [],
};

// ─── Score a single memory snippet against the prompt + domain ─────────────────

/**
 * Score how relevant a memory snippet is to:
 * 1. The detected domain (domain keyword overlap)
 * 2. The raw prompt (word overlap)
 * Returns a score 0–100.
 */
function scoreSnippet(snippet, promptWords, domain) {
  const snipLower = snippet.toLowerCase();
  const snipWords = snipLower.split(/\s+/);

  let score = 0;

  // Domain keyword overlap (weight: 2 per match)
  const domainKeys = DOMAIN_KEYWORDS[domain] || [];
  for (const kw of domainKeys) {
    if (snipLower.includes(kw)) score += 2;
  }

  // Prompt word overlap (weight: 3 per match — high signal)
  for (const pw of promptWords) {
    if (pw.length > 3 && snipLower.includes(pw)) score += 3;
  }

  // Preference / instruction markers get a baseline boost
  const instructionMarkers = [
    'always', 'never', 'prefer', 'prefer', 'i like', 'i use', 'i am', 'i work',
    'my name', 'i\'m', "i'm a", 'my role', 'my company', 'my project',
  ];
  for (const m of instructionMarkers) {
    if (snipLower.includes(m)) { score += 1; break; }
  }

  return score;
}

// ─── Select top-N most relevant snippets ──────────────────────────────────────

/**
 * Given all stored memory entries and the current prompt context,
 * return the most relevant snippets (up to maxSnippets).
 *
 * @param {string[]} entries   - Parsed memory entries
 * @param {string}   rawPrompt - The user's raw prompt text
 * @param {string}   domain    - Detected domain label
 * @param {number}   maxSnippets - Max snippets to return (default 6)
 * @returns {string[]} Relevant snippets sorted by relevance score desc
 */
export function selectRelevantMemory(entries, rawPrompt, domain, maxSnippets = 6) {
  if (!entries || entries.length === 0) return [];

  const promptWords = rawPrompt.toLowerCase().split(/\W+/).filter(w => w.length > 3);

  const scored = entries.map(entry => ({
    entry,
    score: scoreSnippet(entry, promptWords, domain),
  }));

  // Sort by score descending, take top N with score > 0
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSnippets)
    .map(s => s.entry);
}

// ─── Format selected snippets for inclusion in system prompt ──────────────────

/**
 * Format memory snippets into a block ready to be prepended to the system prompt.
 */
export function formatMemoryBlock(snippets) {
  if (!snippets || snippets.length === 0) return '';
  return [
    '## User Memory Context',
    'The following entries are known about this user from their personal memory. Use them to personalise the enhanced prompt where relevant:',
    '',
    ...snippets.map((s, i) => `${i + 1}. ${s}`),
    '',
  ].join('\n');
}
