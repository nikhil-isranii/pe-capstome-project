# ResumeReady Audit

## Testing Checklist

- [x] Target role field is shown
- [x] Resume text field is shown
- [x] Optional job description field is shown
- [x] Analyze Resume button works with demo data
- [x] Results show match score, strengths, improvements, keywords, headline, and summary
- [x] The design works on desktop and mobile layouts
- [ ] Gemini API is connected securely through an environment variable
- [ ] Live Vercel deployment is tested

## Known Limitations

- Current analysis uses demo logic until Gemini API integration is added.
- Users must paste resume text; PDF/DOCX upload is not included.
- AI suggestions are guidance only and must be checked for accuracy.

## Security

Never commit API keys, passwords, tokens, or `.env` files. Store `GEMINI_API_KEY` only in secure environment variables.
