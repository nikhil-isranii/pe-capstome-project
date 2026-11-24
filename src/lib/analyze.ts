export interface AnalysisResult {
  matchScore: number;
  strengths: string[];
  improvements: string[];
  atsKeywords: string[];
  headline: string;
  summary: string;
}

const COMMON_ATS_KEYWORDS = [
  'leadership', 'project management', 'team', 'collaboration', 'communication',
  'analysis', 'data', 'research', 'strategy', 'planning', 'optimization',
  'stakeholder', 'cross-functional', 'agile', 'problem-solving', 'innovation',
  'presentation', 'reporting', 'budget', 'coordination', 'development',
  'implementation', 'process improvement', 'customer', 'sales', 'marketing',
  'python', 'javascript', 'sql', 'excel', 'tableau', 'analytics',
  'design', 'testing', 'deployment', 'documentation', 'training',
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function findMatches(resumeTokens: string[], keyword: string): boolean {
  const kwTokens = keyword.toLowerCase().split(/\s+/);
  if (kwTokens.length === 1) {
    return resumeTokens.includes(kwTokens[0]);
  }
  return kwTokens.every((t) => resumeTokens.includes(t));
}

/**
 * Local fallback analysis used only when the server endpoint is unreachable.
 * Produces the same shape the UI expects.
 */
export function analyzeResume(
  targetRole: string,
  resumeText: string,
  jobDescription: string
): AnalysisResult {
  const resumeTokens = tokenize(resumeText);
  const role = targetRole.trim() || 'the target role';
  const roleTokens = tokenize(role);

  const presentKeywords = COMMON_ATS_KEYWORDS.filter((kw) =>
    findMatches(resumeTokens, kw)
  );
  const keywordRatio = presentKeywords.length / COMMON_ATS_KEYWORDS.length;

  const roleWordsFound = roleTokens.filter((t) => resumeTokens.includes(t));
  const roleRatio = roleTokens.length > 0 ? roleWordsFound.length / roleTokens.length : 0.3;

  const wordCount = resumeTokens.length;
  const lengthFactor = wordCount < 80 ? 0.5 : wordCount < 200 ? 0.8 : 1;

  let baseScore = Math.round((keywordRatio * 0.45 + roleRatio * 0.35 + lengthFactor * 0.2) * 100);

  if (jobDescription.trim()) {
    const jdTokens = tokenize(jobDescription);
    const jdKeywords = COMMON_ATS_KEYWORDS.filter((kw) => findMatches(jdTokens, kw));
    const overlap = jdKeywords.filter((kw) => presentKeywords.includes(kw)).length;
    const jdRatio = jdKeywords.length > 0 ? overlap / jdKeywords.length : 0;
    baseScore = Math.round(baseScore * 0.6 + jdRatio * 100 * 0.4);
  }

  baseScore = Math.max(28, Math.min(94, baseScore));

  const strengths: string[] = [];
  if (presentKeywords.includes('leadership') || presentKeywords.includes('team')) {
    strengths.push('Shows evidence of leadership and teamwork experience.');
  } else if (presentKeywords.includes('communication')) {
    strengths.push('Highlights communication skills valued by employers.');
  } else {
    strengths.push('Presents a clear career objective relevant to the role.');
  }

  if (presentKeywords.includes('data') || presentKeywords.includes('analysis') || presentKeywords.includes('analytics')) {
    strengths.push('Demonstrates analytical and data-driven thinking.');
  } else if (presentKeywords.includes('project management') || presentKeywords.includes('planning')) {
    strengths.push('References project management and planning experience.');
  } else {
    strengths.push('Includes concrete responsibilities that map to the target role.');
  }

  if (wordCount >= 200) {
    strengths.push('Resume length is appropriate with enough detail to assess fit.');
  } else {
    strengths.push('Concise format that recruiters can scan quickly.');
  }

  const improvements: string[] = [];
  const missing = COMMON_ATS_KEYWORDS.filter((kw) => !presentKeywords.includes(kw));
  const topMissing = missing.slice(0, 3).map((k) => `"${k}"`);

  if (roleWordsFound.length < roleTokens.length * 0.5) {
    improvements.push(
      `Tailor your resume to the target role — mirror language from "${role}" job postings.`
    );
  } else {
    improvements.push(
      'Quantify achievements with metrics (e.g., "increased X by 30%") to make impact measurable.'
    );
  }

  if (topMissing.length > 0) {
    improvements.push(
      `Add missing ATS keywords: ${topMissing.join(', ')} — where they honestly apply to your experience.`
    );
  } else {
    improvements.push(
      'Reorder content so the most role-relevant experience appears in the top half of page one.'
    );
  }

  if (wordCount < 200) {
    improvements.push(
      'Expand bullet points with context: the problem you solved, the action you took, and the result.'
    );
  } else {
    improvements.push(
      'Trim older or unrelated roles to one line each so recent, relevant work stands out.'
    );
  }

  const atsKeywords = [
    ...presentKeywords.slice(0, 8),
    ...missing.slice(0, 6),
  ].slice(0, 12);

  const headline = `${capitalizeWords(role)} | Driven Professional Ready to Contribute`;
  const summary = buildSummary(role, presentKeywords);

  return {
    matchScore: baseScore,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    atsKeywords,
    headline,
    summary,
  };
}

function buildSummary(role: string, present: string[]): string {
  const traits: string[] = [];
  if (present.includes('leadership') || present.includes('team')) traits.push('collaborative');
  if (present.includes('data') || present.includes('analysis')) traits.push('analytical');
  if (present.includes('communication')) traits.push('strong communicator');
  if (present.includes('project management') || present.includes('planning')) traits.push('organized');
  if (present.includes('innovation')) traits.push('innovative');
  if (traits.length === 0) traits.push('dedicated', 'detail-oriented');

  const traitStr = traits.slice(0, 3).join(', ');
  return `Results-oriented ${role.toLowerCase()} with a ${traitStr} approach to delivering value. Proven ability to apply practical skills to real-world challenges, adapt quickly, and contribute to team goals from day one. Seeking an opportunity to grow in ${role.toLowerCase()} while making a measurable impact for the organization.`;
}

function capitalizeWords(s: string): string {
  return s
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
