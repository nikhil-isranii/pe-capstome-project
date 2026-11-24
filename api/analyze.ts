import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface AnalyzeBody {
  targetRole?: string;
  resumeText?: string;
  jobDescription?: string;
}

interface GeminiAnalysis {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  atsKeywords: string[];
  suggestedHeadline: string;
  rewrittenSummary: string;
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    matchScore: { type: 'NUMBER', description: 'Resume-to-role fit score from 0 to 100' },
    strengths: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Exactly 3 specific strengths of the resume',
    },
    gaps: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Exactly 3 specific, actionable improvements to close gaps',
    },
    atsKeywords: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: '10-12 ATS-friendly keywords relevant to the target role, including present and missing ones',
    },
    suggestedHeadline: {
      type: 'STRING',
      description: 'A concise professional headline tailored to the target role',
    },
    rewrittenSummary: {
      type: 'STRING',
      description: 'A rewritten professional summary (2-4 sentences) tailored to the target role, using only experience evidenced in the resume',
    },
  },
  required: [
    'matchScore',
    'strengths',
    'gaps',
    'atsKeywords',
    'suggestedHeadline',
    'rewrittenSummary',
  ],
} as const;

const SYSTEM_INSTRUCTION = `You are an expert career coach and resume strategist for students and job seekers.
You analyze resumes against a target role and an optional job description.
You are honest and constructive. You NEVER invent experience, skills, or achievements that are not present in the resume text.
Your suggestions help the candidate surface and reframe real experience, not fabricate it.
Always return structured JSON matching the provided schema.`;

function buildUserPrompt(targetRole: string, resumeText: string, jobDescription: string): string {
  const jdSection = jobDescription.trim()
    ? `\n\nJOB DESCRIPTION:\n"""\n${jobDescription.trim()}\n"""`
    : '\n\nJOB DESCRIPTION: (not provided)';

  return `Analyze the resume below for fit with the target role of "${targetRole}".
Return a JSON object with:
- matchScore: integer 0-100 estimating how well the resume matches the role
- strengths: exactly 3 specific strengths evidenced in the resume
- gaps: exactly 3 specific, actionable improvements (do not suggest adding fake experience)
- atsKeywords: 10-12 ATS keywords relevant to the role (present and missing)
- suggestedHeadline: a professional LinkedIn-style headline for this role
- rewrittenSummary: a rewritten 2-4 sentence professional summary that reframes ONLY real experience from the resume${jdSection}

RESUME:
"""
${resumeText.trim()}
"""`;
}

function jsonResponse(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse(res, 500, {
      error: 'The Gemini API key is not configured on the server. An administrator must add GEMINI_API_KEY to the Vercel environment variables.',
    });
  }

  const { targetRole, resumeText, jobDescription } = (req.body || {}) as AnalyzeBody;

  if (!targetRole || typeof targetRole !== 'string' || !targetRole.trim()) {
    return jsonResponse(res, 400, { error: 'A target role is required.' });
  }
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 20) {
    return jsonResponse(res, 400, { error: 'Please provide your resume text (at least a few sentences).' });
  }

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [
      {
        role: 'user',
        parts: [{ text: buildUserPrompt(targetRole, resumeText, jobDescription || '') }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  try {
    const geminiRes = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      let message = `Gemini API request failed (status ${geminiRes.status}).`;
      if (geminiRes.status === 429) {
        message = 'The AI service is busy right now. Please wait a moment and try again.';
      } else if (geminiRes.status === 400 || geminiRes.status === 403) {
        message = 'The AI service rejected the request. The API key may be invalid or the request too large.';
      }
      // Log only the status server-side; never log the key or user content
      console.error(`Gemini API error: status=${geminiRes.status}`);
      return jsonResponse(res, 502, { error: message });
    }

    let geminiData: Record<string, unknown>;
  try {
    geminiData = (await geminiRes.json()) as Record<string, unknown>;
  } catch {
    geminiData = {};
    }

    const candidates = Array.isArray(geminiData.candidates)
    ? (geminiData.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>)
    : [];
    const text: string | undefined = candidates[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const promptFeedback = geminiData.promptFeedback as { blockReason?: string } | undefined;
    const blockReason = promptFeedback?.blockReason;
    if (blockReason) {
      return jsonResponse(res, 422, {
        error: `The AI service blocked the request (${blockReason}). Please revise your resume text and try again.`,
      });
    }
    return jsonResponse(res, 502, { error: 'The AI service returned an empty response. Please try again.' });
    }

    let parsed: GeminiAnalysis;
  try {
    parsed = JSON.parse(text) as GeminiAnalysis;
  } catch {
    return jsonResponse(res, 502, { error: 'The AI service returned malformed data. Please try again.' });
    }

    // Basic validation / coercion
  const clamp = (n: unknown) => {
    const num = Number(n);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  };
  const asStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 15) : [];

  const result: GeminiAnalysis = {
    matchScore: clamp(parsed.matchScore),
    strengths: asStringArray(parsed.strengths).slice(0, 3),
    gaps: asStringArray(parsed.gaps).slice(0, 3),
    atsKeywords: asStringArray(parsed.atsKeywords),
    suggestedHeadline:
      typeof parsed.suggestedHeadline === 'string' ? parsed.suggestedHeadline : '',
    rewrittenSummary:
      typeof parsed.rewrittenSummary === 'string' ? parsed.rewrittenSummary : '',
  };

  return jsonResponse(res, 200, result as unknown as Record<string, unknown>);
} catch (err) {
    console.error('Analyze endpoint unexpected error');
    return jsonResponse(res, 500, {
      error: 'Something went wrong while contacting the AI service. Please try again.',
    });
  }
}
