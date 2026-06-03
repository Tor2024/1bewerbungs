// Vercel Serverless Function - CV Generator
const API_KEYS = (process.env.GEMINI_API_KEY || '').split(',').filter(k => k.trim());
let keyIdx = 0;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (API_KEYS.length === 0) return res.status(500).json({ error: 'No API keys configured' });

    try {
        const { masterCV, jobDescription } = req.body || {};
        if (!masterCV) return res.status(400).json({ error: 'masterCV required' });
        if (!jobDescription || jobDescription.length < 30) return res.status(400).json({ error: 'jobDescription required' });

        const apiKey = API_KEYS[keyIdx++ % API_KEYS.length];
        const prompt = `You are an expert HR engineer for German job market. Create job application documents.

Master CV: ${JSON.stringify(masterCV)}
Job Description: ${jobDescription}

Task: Generate Anschreiben (cover letter) and Lebenslauf (CV) in German.
- Extract company name and contact person
- Adapt experience from logistics director to developer role
- Use professional German (B1-B2 level)
- NO AI cliches

Return ONLY this JSON structure with complete HTML documents:
{
  "company_name": "extracted company name",
  "contact_person": "extracted name or null",
  "anschreiben_html": "complete HTML with DIN 5008 letter",
  "lebenslauf_html": "complete HTML with 2-column CV, use [PHOTO_PATH] for photo",
  "check_translation_ru": {
    "summary": "brief summary in Russian",
    "tone_check": "tone description in Russian"
  }
}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 8000,
                        responseMimeType: 'application/json'
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            return res.status(500).json({ error: 'Gemini API failed', details: err });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
            return res.status(500).json({ error: 'Empty Gemini response' });
        }

        const clean = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
        const result = JSON.parse(clean);
        
        return res.status(200).json({ ...result, model_used: 'gemini-2.5-flash' });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Generation failed', 
            details: error.message,
            stack: error.stack?.substring(0, 500)
        });
    }
};
