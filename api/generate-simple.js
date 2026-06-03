// Простая версия без сложной логики
const API_KEYS = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);

let keyIndex = 0;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (API_KEYS.length === 0) {
        return res.status(500).json({ 
            error: 'No API keys', 
            details: 'Set GEMINI_API_KEY in Vercel' 
        });
    }

    try {
        const { masterCV, jobDescription } = req.body;
        
        if (!masterCV) return res.status(400).json({ error: 'masterCV required' });
        if (!jobDescription) return res.status(400).json({ error: 'jobDescription required' });

        const apiKey = API_KEYS[keyIndex++ % API_KEYS.length];
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Return JSON: {"company_name":"test","contact_person":null,"anschreiben_html":"<html>test</html>","lebenslauf_html":"<html>test</html>","check_translation_ru":{"summary":"test","tone_check":"test"}}` }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return res.status(500).json({ error: 'Gemini API failed', details: error });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        return res.status(200).json({ 
            test: true, 
            gemini_response: text.substring(0, 200),
            api_keys_count: API_KEYS.length
        });
        
    } catch (error) {
        return res.status(500).json({ 
            error: 'Server error', 
            details: error.message 
        });
    }
};
