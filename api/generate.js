// Only working model
const GEMINI_MODEL = 'gemini-2.5-flash';

const API_KEYS = (process.env.GEMINI_API_KEY || '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean);

const GEMINI_MODELS = ['gemini-2.5-flash'];

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
    return `### ROLE
Ты — экспертный HR-инженер и архитектор документов для немецкого рынка труда. Твоя задача: на основе Master-CV пользователя и конкретной вакансии сгенерировать два адаптивных документа (Anschreiben и Lebenslauf).

### DATA CONTEXT
- Master-CV (из LocalStorage): Содержит полный опыт пользователя, включая руководство в логистике и навыки Web Development (React, Next.js).
- Job Description (Input): Текст вакансии со всеми деталями.
- User Constraints: Уровень немецкого B1, проживание в Кройцтале, цель — работа разработчиком.

### MASTER-CV
${JSON.stringify(masterCV, null, 2)}

### JOB DESCRIPTION
${jobDescription}

### PRINCIPLES OF ADAPTATION (CRITICAL)
1. Anti-Overqualified: Смягчай управленческий бэкграунд. Вместо "Director/Head of" используй "Projektleiter" или "Senior Specialist". В тексте письма объясни, что опыт руководства дает дисциплину и понимание бизнес-целей, но страсть и фокус пользователя сейчас — hands-on разработка.
2. Entity Extraction: Найди в вакансии название компании, адрес и контактное лицо. Если имя не найдено, используй "Sehr geehrte Damen und Herren".
3. No AI Patterns: Запрещено использовать фразы-клише: "Ich hoffe, diese E-Mail findet Sie gut", "Ich bin der ideale Kandidat", "In der heutigen digitalen Welt". Пиши сухим, деловым, немецким стилем.
4. Language Match: Текст должен быть на идеальном немецком, но синтаксически доступным для уровня B1-B2.

### OUTPUT FORMAT (JSON ONLY)
Верни строго валидный JSON объект. Не добавляй markdown, комментарии или текст вне JSON.

{
  "contact_person": "Имя найденного контакта или null",
  "company_name": "Название компании",
  "anschreiben_html": "HTML-строка (A4, DIN 5008 стандарт). Чистый CSS в тегах <style>.",
  "lebenslauf_html": "HTML-строка (A4, современный 2-колоночный дизайн). Используй плейсхолдер [PHOTO_PATH] для фото из LocalStorage.",
  "check_translation_ru": {
    "summary": "Краткий смысл письма (о чем мы просим и как оправдываем опыт начальника).",
    "tone_check": "Описание тона письма на русском."
  }
}

### HTML/CSS REQUIREMENTS
- Используй Inter, Roboto или Arial.
- Цветовая гамма: сдержанный темно-синий #1e3a8a или графитовый #374151 для акцентов.
- Верстка должна быть print-friendly и помещаться на A4.
- Не добавляй script, внешние ресурсы, формы или интерактивный код.
- Anschreiben должен быть по DIN 5008 насколько возможно: отправитель, получатель, дата, тема, обращение, текст, подпись.
- Lebenslauf должен быть современным двухколоночным документом, но без чрезмерных украшений.
- Не выдумывай факты, которых нет в Master-CV или вакансии.`;
}

function parseJsonResponse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Gemini returned an empty response');
    }

    const cleanText = text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '');

    return JSON.parse(cleanText);
}

function validateGeneratedResult(result) {
    const requiredStringFields = ['company_name', 'anschreiben_html', 'lebenslauf_html'];

    for (const field of requiredStringFields) {
        if (typeof result[field] !== 'string' || result[field].trim() === '') {
            throw new Error(`Gemini response is missing ${field}`);
        }
    }

    if (!result.check_translation_ru || typeof result.check_translation_ru !== 'object') {
        throw new Error('Gemini response is missing check_translation_ru');
    }

    if (typeof result.check_translation_ru.summary !== 'string') {
        throw new Error('Gemini response is missing check_translation_ru.summary');
    }

    if (typeof result.check_translation_ru.tone_check !== 'string') {
        throw new Error('Gemini response is missing check_translation_ru.tone_check');
    }
}

async function callGemini(prompt) {
    const errors = [];

    for (const model of GEMINI_MODELS) {
        try {
            const apiKey = getNextApiKey();
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{
                                text: 'Return only valid JSON. Never include markdown fences or explanatory text.'
                            }]
                        },
                        contents: [{
                            role: 'user',
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.35,
                            maxOutputTokens: 12000,
                            responseMimeType: 'application/json'
                        }
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                errors.push(`${model}: ${data.error?.message || response.statusText}`);
                continue;
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = parseJsonResponse(text);
            validateGeneratedResult(parsed);

            return {
                ...parsed,
                model_used: model
            };
        } catch (error) {
            errors.push(`${model}: ${error.message}`);
        }
    }

    throw new Error(`All Gemini models failed. ${errors.join(' | ')}`);
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

        return res.status(200).json(result);
    } catch (error) {
        console.error('Generation error:', error);
        return res.status(500).json({
            error: 'Generation failed',
            details: error.message
        });
    }
};
