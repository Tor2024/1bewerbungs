# 🚀 Adaptive Bewerbungsgenerator

**Schnelle, AI-gestützte Bewerbungsunterlagen für den deutschen Arbeitsmarkt**

[![Vercel](https://img.shields.io/badge/vercel-deployed-black?logo=vercel)](https://1bewerbungs.vercel.app)
[![GitHub](https://img.shields.io/badge/github-source-blue?logo=github)](https://github.com/Tor2024/1bewerbungs)

Ihre Daten (CV + Foto) sind bereits geladen - einfach Stellenanzeige einfügen und perfekte Dokumente in Sekunden generieren!

---

## ⚡ Schnellstart (3 Schritte)

1. **Website öffnen:** https://1bewerbungs.vercel.app
2. **Stellenanzeige einfügen** in das große Textfeld
3. **"Dokumente generieren"** klicken → Als PDF speichern

✅ **Fertig!** Anschreiben (DIN 5008) + Lebenslauf mit Foto bereit zum Versenden.

👉 Ausführliche Anleitung: [SCHNELLSTART.md](SCHNELLSTART.md)

---

## 🎯 Features

### 🤖 Intelligente Anpassung
- **Automatische Jobtyp-Erkennung:** Web Developer, Lager, Verwaltung, IT Support, etc.
- **5 verschiedene Strategien:** Passt Dokumente optimal an Jobtyp an
- **Kontakt-Extraktion:** Findet automatisch Firma, Ansprechpartner, E-Mail aus Stellenanzeige
- **Anti-Überqualifiziert:** Softens management titles for entry-level positions

### 📄 Professionelle Dokumente
- **Anschreiben:** DIN 5008 compliant, business German, no AI clichés
- **Lebenslauf:** Modern 2-column design mit Foto (35mm x 45mm)
- **PDF-Export:** Print-optimized, A4-ready, one-click save
- **Adaptive Layouts:** Different emphasis for different job types

### 💾 Sofort einsatzbereit
- **Auto-Load:** CV und Foto automatisch beim Start geladen
- **LocalStorage:** Daten bleiben gespeichert zwischen Sessions
- **Schnell:** 10-30 Sekunden von Stellenanzeige zu fertigen PDFs
- **Kein Login nötig:** Komplett clientseitig (außer AI-API)

### 🎨 Design & UX
- **Modern UI:** Clean, professional, responsive
- **Live-Preview:** See documents before downloading
- **Quality Check:** Russian summary for quick verification
- **Mobile-friendly:** Works on tablets and phones

---

## 📊 What's Included

**Für Oleh Kalchenko vorgeladen:**
- ✅ Master-CV mit 20+ Jahren Berufserfahrung
- ✅ Portfolio: [ok-studio-umber.vercel.app](https://ok-studio-umber.vercel.app)
- ✅ GitHub: [Tor2024](https://github.com/Tor2024) (34 Repos, 1643+ Commits)
- ✅ Bewerbungsfoto
- ✅ Skills: React, Next.js, Logistik, Projektmanagement
- ✅ Sprachen: Deutsch B2, Ukrainisch, Russisch, Englisch
- ✅ Work Permit: § 24 AufenthG

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Vercel Serverless Functions (Node.js)
- **AI:** Google Gemini 2.5 Flash (JSON mode, 8K tokens)
- **Hosting:** Vercel (automatic deployments from GitHub)
- **Storage:** Browser LocalStorage + bundled masterCV.json + photo.jpg

---

## 🚀 Features

- Gemini API generation for tailored `Anschreiben` and `Lebenslauf`
- Master-CV, photo and last result stored in browser `localStorage`
- `master_cv`, `user_photo` and `last_application` keys match the app workflow
- DIN-style cover letter and two-column CV returned as print-ready HTML
- Russian quality check before sending documents
- Print dialog can save the generated document as PDF

---

## 📚 Documentation

- **[SCHNELLSTART.md](SCHNELLSTART.md)** - Quick start guide (German)
- **[PDF-ANLEITUNG.md](PDF-ANLEITUNG.md)** - PDF export instructions
- **[example-anschreiben.html](example-anschreiben.html)** - Sample cover letter
- **[example-lebenslauf.html](example-lebenslauf.html)** - Sample CV

---

## 💻 Local Development

### Quick Start (Static Files)
```bash
# No installation needed! Just open in browser
open index.html

# Or use any HTTP server
python -m http.server 5173
# Then: http://localhost:5173
```

### Test with Vercel Dev (for API)
```bash
# Install Vercel CLI
npm i -g vercel

# Set API key
export GEMINI_API_KEY=your_key_here

# Run dev server
vercel dev
# Then: http://localhost:3000
```

### Test Scripts
```bash
# Test prompt building
node test-prompt.js

# Test API endpoint
node test-api.js

# Test model compatibility
node test-models.js
```

---

## 🚀 Deployment

### Vercel (Automatic)
1. Push to GitHub (this repo)
2. Vercel auto-deploys from `main` branch
3. Set environment variable in Vercel dashboard:

```bash
GEMINI_API_KEY=key1,key2,key3,...
```

Multiple keys for load balancing recommended.

### Manual Deploy
```bash
vercel --prod
```

---

## 🔒 Security Notes

- ✅ API keys stored in Vercel environment variables (never in code)
- ✅ HTML sanitization before preview (XSS protection)
- ✅ No data sent to third parties (only Gemini API)
- ✅ LocalStorage used for caching (stays in browser)
- ✅ CORS enabled for frontend-backend communication
- ⚠️ Don't commit `GEMINI_API_KEY` to GitHub

---

## 📝 Project Structure

```
├── api/
│   └── generate.js           # Serverless function (Gemini API)
├── index.html                # Main UI
├── app.js                    # Frontend logic
├── styles.css                # Styling
├── masterCV.json             # Pre-loaded CV (Oleh Kalchenko)
├── photo.jpg                 # Pre-loaded photo
├── example-anschreiben.html  # Sample cover letter
├── example-lebenslauf.html   # Sample CV
├── SCHNELLSTART.md           # Quick start guide
├── PDF-ANLEITUNG.md          # PDF instructions
└── README.md                 # This file
```

---

## 🤝 Contributing

This is a personal project for job applications. Feel free to fork and adapt for your own use!

### Adapting for Yourself

1. **Replace CV data:** Edit `masterCV.json`
2. **Replace photo:** Replace `photo.jpg` (35mm x 45mm recommended)
3. **Customize prompt:** Edit `api/generate.js` → `buildPrompt()` function
4. **Adjust design:** Modify CSS templates in prompt

---

## 📄 License

MIT License - Feel free to use and modify

---

## 🙏 Credits

- **AI:** Google Gemini 2.5 Flash
- **Hosting:** Vercel
- **Author:** Oleh Kalchenko
- **Portfolio:** [ok-studio-umber.vercel.app](https://ok-studio-umber.vercel.app)
- **GitHub:** [Tor2024](https://github.com/Tor2024)

---

**Viel Erfolg bei der Jobsuche!** 🚀
