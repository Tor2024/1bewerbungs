# CV & Anschreiben Generator

AI-powered adaptive German CV and cover letter generator for job applications.

## Features

- 🤖 AI-powered content generation using Gemini 2.5 Flash
- 📄 Generate professional Anschreiben (cover letter) in DIN 5008 format
- 📋 Create modern 2-column Lebenslauf (CV)
- 🎯 Automatic company and contact person extraction from job description
- 🔄 Anti-overqualified strategy for career transitions
- 🌐 Fully client-side processing (except AI API calls)

## Deploy to Vercel

1. Click the button below to deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Tor2024/1bewerbungs.git)

2. Set environment variable in Vercel dashboard:
   - `GEMINI_API_KEY` = your comma-separated Gemini API keys

Example:
```
GEMINI_API_KEY=AIzaSyABC123...,AIzaSyDEF456...,AIzaSyGHI789...
```

## Local Development

1. Clone the repository
2. Create `.env` file with your API keys:
   ```
   GEMINI_API_KEY=your_key_1,your_key_2,your_key_3
   ```
3. Open `index.html` in your browser

For local API testing with Vercel CLI:
```bash
npm i -g vercel
vercel dev
```

## How It Works

1. **Upload Master-CV** (JSON format with your complete work history)
2. **Paste Job Description** (full text of the job posting)
3. **Upload Photo** (optional, for CV)
4. **Click Generate** - AI analyzes the job requirements and adapts your documents
5. **Download/Print** - Get professionally formatted PDF-ready documents

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: Google Gemini 2.5 Flash API
- **Deployment**: Vercel

## Security

- API keys are stored as environment variables in Vercel
- Never exposed to client-side code
- Load balancing across multiple keys for reliability

## License

MIT
