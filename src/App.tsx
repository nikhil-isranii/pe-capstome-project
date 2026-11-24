import { useState } from 'react';
import {
  FileText,
  Target,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Hash,
  PenLine,
  AlignLeft,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { analyzeResume, type AnalysisResult } from '@/lib/analyze';

interface ApiResponse {
  error?: string;
  matchScore?: number;
  strengths?: string[];
  gaps?: string[];
  atsKeywords?: string[];
  suggestedHeadline?: string;
  rewrittenSummary?: string;
}

function App() {
  const [targetRole, setTargetRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);

  const handleAnalyze = async () => {
    setError('');
    setUsedFallback(false);
    if (!targetRole.trim()) {
      setError('Please enter your target role.');
      return;
    }
    if (!resumeText.trim()) {
      setError('Please paste your resume text.');
      return;
    }
    if (resumeText.trim().length < 20) {
      setError('Please paste a bit more of your resume so the analysis is useful.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
        }),
      });

      const data: ApiResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          data?.error ||
          (res.status === 429
            ? 'The AI service is busy right now. Please wait a moment and try again.'
            : res.status >= 500
            ? 'The AI service is unavailable. Please try again shortly.'
            : 'We could not analyze your resume. Please check your entries and try again.');
        setError(message);
        setLoading(false);
        return;
      }

      // Map Gemini response shape -> UI shape
      const mapped: AnalysisResult = {
        matchScore: Math.max(0, Math.min(100, Math.round(Number(data.matchScore) || 0))),
        strengths: Array.isArray(data.strengths) ? data.strengths.slice(0, 3) : [],
        improvements: Array.isArray(data.gaps) ? data.gaps.slice(0, 3) : [],
        atsKeywords: Array.isArray(data.atsKeywords) ? data.atsKeywords : [],
        headline: typeof data.suggestedHeadline === 'string' ? data.suggestedHeadline : '',
        summary: typeof data.rewrittenSummary === 'string' ? data.rewrittenSummary : '',
      };

      // Guard against a structurally empty response
      if (
        mapped.strengths.length === 0 &&
        mapped.improvements.length === 0 &&
        !mapped.headline &&
        !mapped.summary
      ) {
        setError('The AI service returned an incomplete response. Please try again.');
        setLoading(false);
        return;
      }

      setResult(mapped);
      setLoading(false);
    } catch (err) {
      // Network/endpoint failure: fall back to local sample analysis so the
      // app remains usable, and flag it so the user knows it is not live AI.
      const fallback = analyzeResume(targetRole, resumeText, jobDescription);
      setResult(fallback);
      setUsedFallback(true);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setUsedFallback(false);
  };

  return (
    <div className="min-h-screen bg-navy-50 text-navy-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-navy-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-navy-800 text-teal-300">
            <FileText size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight text-navy-800">
            Resume<span className="text-teal-500">Ready</span>
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-navy-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-700 text-teal-300 text-xs font-medium mb-5">
            <Sparkles size={14} />
            AI Resume Improver
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight">
            Improve your resume for the role you want.
          </h1>
          <p className="mt-4 text-navy-200 text-base sm:text-lg max-w-xl mx-auto">
            Get an instant match score, targeted improvements, and ATS-ready
            keywords — no sign-up required.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-5 sm:p-8">
          <h2 className="text-xl font-bold text-navy-800 mb-5">Resume Analysis</h2>

          <div className="space-y-5">
            {/* Target Role */}
            <Field
              label="Target Role"
              icon={<Target size={16} />}
              required
            >
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Junior Data Analyst"
                className="input-base"
              />
            </Field>

            {/* Resume Text */}
            <Field
              label="Resume Text"
              icon={<FileText size={16} />}
              required
            >
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here..."
                rows={7}
                className="input-base resize-y"
              />
            </Field>

            {/* Job Description (optional) */}
            <Field
              label="Job Description (optional)"
              icon={<Briefcase size={16} />}
            >
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job posting for a more tailored analysis..."
                rows={5}
                className="input-base resize-y"
              />
            </Field>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyze Resume
                </>
              )}
            </button>
            {result && (
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-navy-100 text-navy-700 font-semibold hover:bg-navy-200 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          <p className="mt-3 text-xs text-navy-400">
            Your resume is analyzed securely on the server and is never stored.
          </p>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {usedFallback && (
              <div className="flex items-start gap-2 text-sm text-navy-700 bg-navy-100 border border-navy-200 rounded-lg px-3 py-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-navy-500" />
                <span>
                  The live AI service could not be reached, so this is an
                  estimated analysis from the built-in engine. Connect the
                  Gemini API key on the server for full AI results.
                </span>
              </div>
            )}

            {/* Match Score */}
            <ScoreCard score={result.matchScore} />

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListCard
                title="Strengths"
                icon={<CheckCircle2 size={18} className="text-teal-500" />}
                items={result.strengths}
                accent="teal"
              />
              <ListCard
                title="Improvements"
                icon={<AlertCircle size={18} className="text-amber-500" />}
                items={result.improvements}
                accent="amber"
              />
            </div>

            {/* ATS Keywords */}
            <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-5 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound size={18} className="text-navy-600" />
                <h3 className="text-lg font-bold text-navy-800">ATS Keywords</h3>
              </div>
              {result.atsKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.atsKeywords.map((kw, i) => (
                    <span
                      key={kw + i}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-navy-50 border border-navy-200 text-sm text-navy-700 font-medium"
                    >
                      <Hash size={12} className="text-teal-500" />
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-navy-400">No keywords returned.</p>
              )}
            </div>

            {/* Headline */}
            <Card title="Suggested Professional Headline" icon={<PenLine size={18} className="text-navy-600" />}>
              <p className="text-navy-800 font-semibold text-lg">{result.headline}</p>
            </Card>

            {/* Summary */}
            <Card title="Rewritten Professional Summary" icon={<AlignLeft size={18} className="text-navy-600" />}>
              <p className="text-navy-700 leading-relaxed">{result.summary}</p>
            </Card>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <ShieldAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">
                Verify all AI suggestions. Do not add false experience.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-navy-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-navy-400">
          ResumeReady — AI Resume Improver. Suggestions are guidance, not guarantees.
        </div>
      </footer>
    </div>
  );
}

/* ---------- Small presentational helpers ---------- */

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-navy-700 mb-1.5">
        <span className="text-teal-500">{icon}</span>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-5 sm:p-8">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-lg font-bold text-navy-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ScoreCard({ score }: { score: number }) {
  const tone = score >= 70 ? 'teal' : score >= 50 ? 'navy' : 'amber';
  const ring =
    tone === 'teal'
      ? 'text-teal-500'
      : tone === 'navy'
      ? 'text-navy-600'
      : 'text-amber-500';
  const label =
    score >= 70 ? 'Strong match' : score >= 50 ? 'Moderate match' : 'Needs work';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-5 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <ScoreRing score={score} className={ring} />
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-bold text-navy-800">Resume Match Score</h3>
          <p className={`text-sm font-semibold ${ring}`}>{label}</p>
          <p className="text-sm text-navy-500 mt-1 max-w-sm">
            Based on keyword coverage, role alignment, and resume detail. This
            is an estimate, not an official score.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ score, className }: { score: number; className: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-navy-100"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${className} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${className}`}>{score}</span>
        <span className="text-xs text-navy-400">/ 100</span>
      </div>
    </div>
  );
}

function ListCard({
  title,
  icon,
  items,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  accent: 'teal' | 'amber';
}) {
  const bullet =
    accent === 'teal'
      ? 'bg-teal-100 text-teal-600'
      : 'bg-amber-100 text-amber-600';
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-5 sm:p-8">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-lg font-bold text-navy-800">{title}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full ${bullet} flex items-center justify-center text-xs font-bold`}
              >
                {i + 1}
              </span>
              <span className="text-sm text-navy-700 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-navy-400">No items returned.</p>
      )}
    </div>
  );
}

export default App;
