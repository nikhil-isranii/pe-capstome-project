# ResumeReady - Capstone Submission Evidence

## Project Objective

ResumeReady helps students and job seekers improve a pasted resume for a target role. It provides a match score, strengths, improvement suggestions, ATS keywords, a suggested headline, and a rewritten professional summary.

## Live App

https://resumeready-ai-impro-wb27.bolt.host

## GitHub Repository

https://github.com/nikhil-isranii/pe-capstome-project

## Tools Used

- Bolt.new - initial app creation
- Cursor - documentation and code workflow
- GitHub - source repository and pull request
- Google Gemini API - planned live AI integration
- Vercel - planned production deployment

## System Workflow

User -> ResumeReady web app -> secure backend/API -> Gemini analysis -> resume feedback shown in the app.

## Security

The Gemini key will be stored as `GEMINI_API_KEY` in deployment environment variables. It must never appear in browser code, GitHub, screenshots, or this file.

## Setup

1. Run `npm install`
2. Run `npm run dev`
3. Add `GEMINI_API_KEY` only as a secure environment variable after backend integration.

## Evidence Still To Add

- Pull Request link
- Vercel deployment URL
- Screenshot of the running app
- Screenshot of this GitHub repository
- Screenshot of the Pull Request
- Screenshot of Vercel deployment with the secret value hidden
## Final Submission Links

- Live app: https://resumeready-seven.vercel.app
- GitHub repository: https://github.com/nikhil-isranii/pe-capstome-project
- Documentation pull request: https://github.com/nikhil-isranii/pe-capstome-project/pull/1

## Final Technical Details

- Application: ResumeReady — AI Resume Improver
- AI provider: Google Gemini API
- Deployment: Vercel Production
- Frontend: React, TypeScript, Vite, and Tailwind CSS
- Security: `GEMINI_API_KEY` is stored securely in Vercel Production environment variables and is never exposed in frontend code.

## Final Testing

The deployed app was tested by entering a target role and resume text, running the analysis, and verifying that AI-generated feedback is returned.
