type ScoreDetails = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  reasoning: string;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "your",
  "have",
  "will",
  "are",
  "you",
  "our",
  "about",
  "into",
  "been",
  "their",
  "they",
  "them",
  "what",
  "when",
  "where",
  "which",
  "while",
  "using",
  "use",
  "across",
  "must",
  "should",
  "preferred",
  "required",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function frequency(tokens: string[]) {
  const table = new Map<string, number>();

  for (const token of tokens) {
    table.set(token, (table.get(token) ?? 0) + 1);
  }

  return table;
}

function cosineSimilarity(aText: string, bText: string) {
  const aFreq = frequency(tokenize(aText));
  const bFreq = frequency(tokenize(bText));

  const vocabulary = new Set([...aFreq.keys(), ...bFreq.keys()]);
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (const key of vocabulary) {
    const a = aFreq.get(key) ?? 0;
    const b = bFreq.get(key) ?? 0;
    dot += a * b;
    aNorm += a * a;
    bNorm += b * b;
  }

  if (!aNorm || !bNorm) {
    return 0;
  }

  return dot / Math.sqrt(aNorm * bNorm);
}

function extractKeywords(requirements: string) {
  const freq = frequency(tokenize(requirements));

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([keyword]) => keyword);
}

export function scoreResumeAgainstRequirements(
  resumeText: string,
  requirementsText: string
): ScoreDetails {
  const semanticMatch = cosineSimilarity(resumeText, requirementsText);
  const requirementKeywords = extractKeywords(requirementsText);
  const resumeTokens = new Set(tokenize(resumeText));

  const matchedKeywords = requirementKeywords.filter((word) => resumeTokens.has(word));
  const missingKeywords = requirementKeywords.filter((word) => !resumeTokens.has(word));

  const keywordCoverage =
    requirementKeywords.length > 0
      ? matchedKeywords.length / requirementKeywords.length
      : 0;

  const structureBonus =
    resumeText.length > 350 && /experience|project|education|skill/i.test(resumeText)
      ? 0.12
      : 0.02;

  const weightedScore = semanticMatch * 0.58 + keywordCoverage * 0.34 + structureBonus * 0.08;
  const score = Math.min(100, Math.max(0, Math.round(weightedScore * 10000) / 100));

  const reasoning =
    `AI match evaluated semantic overlap and requirement keyword coverage. ` +
    `Matched ${matchedKeywords.length} of ${requirementKeywords.length} major keywords.`;

  return {
    score,
    matchedKeywords,
    missingKeywords,
    reasoning,
  };
}
