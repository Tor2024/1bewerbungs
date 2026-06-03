# Bewerbungsunterlagen Generator

Web app for generating German application documents from a Master-CV and a concrete job description.

## Features

- Gemini API generation for tailored `Anschreiben` and `Lebenslauf`
- Master-CV, photo and last result stored in browser `localStorage`
- `master_cv`, `user_photo` and `last_application` keys match the app workflow
- DIN-style cover letter and two-column CV returned as print-ready HTML
- Russian quality check before sending documents
- Print dialog can save the generated document as PDF

## Local Development

For the static UI, open `index.html` through a local server:

```bash
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

The `/api/generate` endpoint is a Vercel serverless function. To test generation locally, use Vercel:

```bash
vercel dev
```

Set the API key before running Vercel:

```bash
GEMINI_API_KEY=your_key_here
```

Optional model override:

```bash
GEMINI_MODEL=gemini-2.0-flash,gemini-2.0-flash-lite,gemini-2.5-flash
```

## Deployment

Set this environment variable in Vercel:

```text
GEMINI_API_KEY=your_key_here
```

Multiple keys can be comma-separated.

## Security Notes

- Never put a Gemini API key into frontend files or committed scripts.
- The generated HTML is sanitized before preview and download.
- The API key must stay on the server side in environment variables.
