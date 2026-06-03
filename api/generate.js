const API_KEYS = (process.env.GEMINI_API_KEY || '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean);

const GEMINI_MODEL = 'gemini-2.5-flash';

let currentKeyIndex = 0;

function getNextApiKey() {
    if (API_KEYS.length === 0) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    const apiKey = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return apiKey;
}

function buildPrompt(masterCV, jobDescription) {
    return JSON.stringify({
        role: "You are an expert HR engineer for the German job market.",
        task: "Generate two adaptive documents (Anschreiben and Lebenslauf) based on Master-CV and job description.",
        masterCV: masterCV,
        jobDescription: jobDescription,
        constraints: "German level B1, location Kreuztal, goal - developer position",
        principles: {
            antiOverqualified: "Soften management background. Use 'Projektleiter' instead of 'Director'. Explain that management experience provides discipline, but passion is hands-on development.",
            entityExtraction: "Find company name, address and contact person from job description.",
            noAIPatterns: "Avoid cliches. Write in dry, business German style.",
            languageMatch: "Perfect German, syntactically accessible for B1-B2 level."
        },
        outputFormat: {
            contact_person: "Found contact name or null",
            company_name: "Company name",
            anschreiben_html: "HTML string (A4, DIN 5008 standard). Clean CSS in style tags.",
            lebenslauf_html: "HTML string (A4, modern 2-column design). Use [PHOTO_PATH] placeholder for photo.",
            check_translation_ru: {
                summary: "Brief meaning in Russian",
                tone_check: "Tone description in Russian"
            }
        },
        htmlRequirements: {
            fonts: "Inter, Roboto or Arial",
            colors: "Dark blue #1e3a8a or graphite #374151",
            printFriendly: true,
            noScripts: true,
            anschreibenFormat: "DIN 5008: sender, recipient, date, subject, greeting, text, signature",
            lebenslaufFormat: "Modern two-column document",
            noInventedFacts: true
        }
    });
}

async function callGemini(prompt) {
    const apiKey = getNextApiKey();
    
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: `Generate German job application documents based on this data. Return ONLY valid JSON without markdown:\n\n${prompt}` }]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 8000,
                    responseMimeType: 'application/json'
                }
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('Empty response from Gemini');
    }

    const cleanText = text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '');

    return JSON.parse(cleanText);
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (API_KEYS.length === 0) {
        return res.status(500).json({
            error: 'No API keys configured',
            details: 'Set GEMINI_API_KEY environment variable in Vercel'
        });
    }

    try {
        const { masterCV, jobDescription } = req.body || {};

        if (!masterCV || typeof masterCV !== 'object') {
            return res.status(400).json({ error: 'masterCV must be an object' });
        }

        if (typeof jobDescription !== 'string' || jobDescription.trim().length < 30) {
            return res.status(400).json({ error: 'jobDescription must contain the full job text' });
        }

        const prompt = buildPrompt(masterCV, jobDescription.trim());
        const result = await callGemini(prompt);

        return res.status(200).json({
            ...result,
            model_used: GEMINI_MODEL
        });
    } catch (error) {
        console.error('Generation error:', error);
        return res.status(500).json({
            error: 'Generation failed',
            details: error.message
        });
    }
};
