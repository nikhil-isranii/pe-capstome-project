# Project memory

## Product intent & audience

- **ResumeReady**: a resume improvement/analysis tool for job seekers.
- Users submit a target role, resume text, and optional job description to get AI-powered feedback (match score, strengths, gaps, ATS keywords, headline/summary suggestions).

## Brand personality & voice

- Professional, practical, encouraging; positions AI suggestions as aids while emphasizing user verification ("Verify all AI suggestions" disclaimer).

## Visual design & UX direction

- Navy / white / teal palette with result cards layout.
- UI structure: input form → Analyze Resume button → result cards (Strengths, Improvements/gaps, Headline, Summary).
- Loading state with spinner on analyze button; plain-language error messages for failures.
- Graceful fallback to local analysis engine when API is unreachable, shown with a notice.

## Decisions, constraints & rationale

- **Framework**: Vite + React + Tailwind + Lucide React icons; `@/` path alias to `src/`. Global UI/icon rules live in `.bolt/prompt`.
- **Gemini model**: `gemini-2.5-flash` via REST API with structured JSON output schema.
- **API contract**: `POST /api/analyze` accepts `{ targetRole, resumeText, jobDescription? }`; returns `{ matchScore, strengths, gaps, atsKeywords, suggestedHeadline, rewrittenSummary }`.
- **Security**: `GEMINI_API_KEY` read only server-side via `process.env`; sent to Google via `x-goog-api-key` header. Never exposed, stored, logged, or bundled in frontend. No `VITE_`-prefixed variable for the key.
- **Serverless**: `api/analyze.ts` using `@vercel/node` types; deployed on Vercel.
- **Field mapping**: Gemini `gaps` → UI "Improvements" card; `suggestedHeadline` → headline card; `rewrittenSummary` → summary card.
- **Fallback**: built-in local analysis (`@/lib/analyze`) runs when network/endpoint unavailable so app never appears broken.
- **System instruction**: tells Gemini not to invent experience not present in the resume.
- `.gitignore` updated to exclude env files.

## Open questions & assumptions

- Assumes `GEMINI_API_KEY` is configured in Vercel Settings → Environment Variables and redeployed.
- Gemini model name may need updating over time as Google releases newer Flash versions.
- No rate-limiting or auth on the endpoint beyond Vercel's defaults.