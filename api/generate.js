// Vercel Serverless Function для генерации документов

// API ключи загружаются из environment variables в Vercel
const API_KEYS = (process.env.GEMINI_API_KEY || '').split(',').filter(k => k.trim());

if (API_KEYS.length === 0) {
    console.error('⚠️ No API keys found! Set GEMINI_API_KEY in Vercel environment variables');
}

let currentKeyIndex = 0;

function getNextApiKey() {
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

async function callGemini(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const apiKey = getNextApiKey();
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 4096
                        }
                    })
                }
            );

            if (!response.ok) {
                console.error(`API error: ${response.status}`);
                continue;
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
        }
    }
    throw new Error('All API attempts failed');
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if API keys are available
    if (API_KEYS.length === 0) {
        return res.status(500).json({ 
            error: 'No API keys configured',
            details: 'Set GEMINI_API_KEY environment variable in Vercel'
        });
    }

    try {
        const { masterCV, jobDescription } = req.body;

        if (!masterCV || !jobDescription) {
            return res.status(400).json({ error: 'Missing masterCV or jobDescription' });
        }

        const prompt = `### ROLE
Ты — экспертный HR-инженер и архитектор документов для немецкого рынка труда. Твоя задача: на основе Master-CV пользователя и конкретной вакансии сгенерировать два адаптивных документа (Anschreiben и Lebenslauf).

### DATA CONTEXT
Master-CV:
${JSON.stringify(masterCV, null, 2)}

Job Description:
${jobDescription}

User Constraints: Уровень немецкого B1, проживание в Кройцтале, цель — работа разработчиком.

### PRINCIPLES OF ADAPTATION (CRITICAL)
1. **Anti-Overqualified:** Смягчай управленческий бэкграунд. Вместо "Director/Head of" используй "Projektleiter" или "Senior Specialist". В тексте письма объясни, что опыт руководства дает тебе дисциплину и понимание бизнес-целей, но твоя страсть и фокус сейчас — hands-on разработка.

2. **Entity Extraction:** Найди в вакансии название компании, адрес и контактное лицо. Если имя не найдено, используй "Sehr geehrte Damen und Herren".

3. **No AI Patterns:** Запрещено использовать фразы-клише: "Ich hoffe, diese E-Mail findet Sie gut", "Ich bin der ideale Kandidat", "In der heutigen digitalen Welt". Пиши сухим, деловым, "немецким" стилем.

4. **Language Match:** Текст должен быть на идеальном немецком, но синтаксически доступным для уровня B1-B2 (профессионально, но без избыточной сложности).

### OUTPUT FORMAT (JSON ONLY)
Верни строго валидный JSON объект без markdown блоков, без лишнего текста:

{
  "contact_person": "Имя найденного контакта или null",
  "company_name": "Название компании",
  "anschreiben_text": "Текст Anschreiben БЕЗ HTML (чистый текст)",
  "lebenslauf_summary": "Краткое профессиональное резюме (2-3 предложения на немецком)",
  "check_translation_ru": {
    "summary": "Краткий смысл письма на русском",
    "tone_check": "Описание тона письма на русском"
  }
}`;

        const result = await callGemini(prompt);
        
        // Очистка от markdown блоков
        let cleanResult = result.trim();
        if (cleanResult.startsWith('```json')) {
            cleanResult = cleanResult.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanResult.startsWith('```')) {
            cleanResult = cleanResult.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(cleanResult);
        
        return res.status(200).json(parsed);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Generation failed', 
            details: error.message 
        });
    }
}
