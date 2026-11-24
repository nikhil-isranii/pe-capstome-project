# ResumeReady

ResumeReady is an AI Resume Improver for students and job seekers. It compares a resume with a target role and optional job description, then provides practical, ATS-aware suggestions.

## Features

- Target-role resume analysis
- Match score
- Strengths and improvement suggestions
- ATS keyword recommendations
- Suggested professional headline
- Rewritten professional summary
- Clear reminder to verify AI suggestions

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Bolt.new for the initial app build
- Google Gemini API (Gemini 2.5 Flash) for live AI analysis, called securely from a serverless Vercel endpoint

## AI Analysis Setup (required for live results)

The resume analysis runs through a serverless endpoint at `/api/analyze`
(`api/analyze.ts`). The endpoint reads the Gemini API key from the server
environment only — the key is never sent to, stored in, or read by the browser.

You must configure the Gemini API key as a Vercel environment variable:

1. Get a Gemini API key from Google AI Studio.
2. In your Vercel project, go to **Settings → Environment Variables** and add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
3. Redeploy so the new variable is available to the serverless function.

> Do not use a `VITE_`-prefixed variable for the API key. `VITE_` variables are
> bundled into the browser and would expose the key to every visitor.
> `GEMINI_API_KEY` is only ever read inside the serverless endpoint.

If the key is missing or the endpoint is unreachable, the app falls back to a
built-in local analysis so it stays usable, and shows a notice that live AI is
not connected.

## Run Locally

```bash
npm install
npm run dev
```

## Live App

https://resumeready-ai-impro-wb27.bolt.host

## Security

Never commit API keys, passwords, tokens, or `.env` files. Gemini API keys will be stored as environment variables when the live AI integration is added.
## Live Deployment

- Live app: https://resumeready-seven.vercel.app
- Repository: https://github.com/nikhil-isranii/pe-capstome-project
- Pull request: https://github.com/nikhil-isranii/pe-capstome-project/pull/1

## AI Integration and Security

Resume analysis is powered by the Google Gemini API through a server-side endpoint.

The Gemini key is stored only as the `GEMINI_API_KEY` Production environment variable in Vercel. It is not included in the repository, browser code, screenshots, or documentation.
