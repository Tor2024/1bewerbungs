const API_KEYS = (process.env.GEMINI_API_KEY || '').split(',').filter(k => k.trim());
let keyIndex = 0;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    console.log('=== API CALL START ===');
    console.log('Environment check: API_KEYS count =', API_KEYS.length);
    
    if (API_KEYS.length === 0) {
        console.error('❌ NO API KEYS CONFIGURED!');
        return res.status(500).json({ error: 'No API keys configured', hint: 'Set GEMINI_API_KEY in Vercel environment variables' });
    }

    try {
        const { masterCV, jobDescription } = req.body || {};
        console.log('Request received. Has masterCV:', !!masterCV, 'Has jobDescription:', !!jobDescription);
        
        if (!masterCV) {
            console.error('❌ masterCV missing');
            return res.status(400).json({ error: 'masterCV required' });
        }
        if (!jobDescription) {
            console.error('❌ jobDescription missing');
            return res.status(400).json({ error: 'jobDescription required' });
        }
        
        console.log('Job description length:', jobDescription.length, 'chars');

        const apiKey = API_KEYS[keyIndex++ % API_KEYS.length];
        console.log('Using API key index:', (keyIndex - 1) % API_KEYS.length);
        
        const prompt = buildPrompt(masterCV, jobDescription);
        console.log('Prompt built. Length:', prompt.length, 'chars');

        let lastError = null;
        let attempts = 0;
        const maxAttempts = Math.min(API_KEYS.length, 5); // Try up to 5 keys

        while (attempts < maxAttempts) {
            const currentKeyIndex = (keyIndex - 1 + attempts) % API_KEYS.length;
            const currentKey = API_KEYS[currentKeyIndex];
            console.log(`Attempt ${attempts + 1}/${maxAttempts}, using key index: ${currentKeyIndex}`);

            try {
                console.log('Calling Gemini API...');
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { 
                                temperature: 0.3,
                                maxOutputTokens: 8000
                            }
                        })
                    }
                );

                console.log('Gemini response status:', response.status, response.statusText);

                if (response.status === 403 || response.status === 429) {
                    const err = await response.text();
                    console.error(`❌ Key ${currentKeyIndex} failed with ${response.status}:`, err.substring(0, 200));
                    lastError = { status: response.status, details: err };
                    attempts++;
                    continue; // Try next key
                }

                if (!response.ok) {
                    const err = await response.text();
                    console.error('❌ Gemini API error:', err.substring(0, 500));
                    return res.status(500).json({ 
                        error: 'Gemini API failed', 
                        status: response.status,
                        details: err.substring(0, 200),
                        hint: 'Check Vercel logs for full error'
                    });
                }

                const data = await response.json();
                console.log('Gemini response parsed. Has candidates:', !!data.candidates);
                
                let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
                if (!text) {
                    console.error('❌ Gemini returned empty text!');
                    console.error('Full response:', JSON.stringify(data, null, 2));
                    return res.status(500).json({
                        error: 'Gemini returned empty response',
                        fullResponse: data,
                        hint: 'API may have blocked the request, check for safety filters or quota limits'
                    });
                }
                
                console.log('✓ Got response from Gemini. Length:', text.length, 'chars');
                console.log('✓ Success with key index:', currentKeyIndex);
                
                console.log('=== RAW GEMINI RESPONSE (first 2000 chars) ===');
                console.log(text.substring(0, 2000));
                console.log('=== END RAW RESPONSE ===');
                
                // Clean up response
                text = text.trim();
                
                // Remove markdown code blocks
                if (text.startsWith('```')) {
                    text = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
                    text = text.trim();
                }
                
                // Remove common prefixes
                const prefixes = [
                    /^json\s*/i,
                    /^here is the json:?\s*/i,
                    /^here's the json:?\s*/i,
                    /^output:?\s*/i,
                    /^result:?\s*/i
                ];
                
                for (const prefix of prefixes) {
                    if (prefix.test(text)) {
                        text = text.replace(prefix, '').trim();
                    }
                }
                
                // Find first { and last }
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');
                
                if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
                    text = text.substring(firstBrace, lastBrace + 1);
                }
                
                console.log('Cleaned text starts with:', text.substring(0, 100));
                
                // Success! Process the response
                if (!text.trim().startsWith('{')) {
                    console.error('Response does not start with JSON!');
                    console.error('Response starts with:', text.substring(0, 200));
                    return res.status(500).json({
                        error: 'Gemini did not return JSON',
                        responsePreview: text.substring(0, 500),
                        hint: 'AI returned text instead of JSON. Possible safety block or refusal.'
                    });
                }
                
                // Don't trim again, already cleaned above
                try {
                    const result = JSON.parse(text);
                    console.log('✓ JSON parsed successfully');
                    
                    return res.status(200).json(result);
                } catch (parseError) {
                    console.error('✗ JSON Parse Error:', parseError.message);
                    
                    const errorMatch = parseError.message.match(/position (\d+)/);
                    const errorPos = errorMatch ? parseInt(errorMatch[1]) : 0;
                    
                    if (errorPos > 0) {
                        const start = Math.max(0, errorPos - 100);
                        const end = Math.min(text.length, errorPos + 100);
                        console.error('Context around error position', errorPos, ':');
                        console.error(text.substring(start, errorPos) + ' <<<ERROR>>> ' + text.substring(errorPos, end));
                    }
                    
                    return res.status(500).json({
                        error: 'JSON parsing failed',
                        originalError: parseError.message,
                        errorPosition: errorPos,
                        rawPreview: text.substring(0, 2000),
                        errorContext: errorPos > 0 ? text.substring(Math.max(0, errorPos - 100), Math.min(text.length, errorPos + 100)) : null,
                        hint: 'AI returned invalid JSON. Check server logs for full response. Error at position ' + errorPos
                    });
                }
            } catch (fetchError) {
                console.error('❌ Fetch error:', fetchError.message);
                lastError = { error: fetchError.message };
                attempts++;
                continue; // Try next key
            }
        }

        // All attempts failed
        console.error('❌ All API key attempts failed');
        return res.status(500).json({ 
            error: 'All API keys failed', 
            attempts: attempts,
            lastError: lastError,
            hint: 'Tried multiple keys, all failed. Check quota or key validity.'
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed', details: error.message });
    }
};

function buildPrompt(masterCV, jobDescription) {
    const cv = masterCV;
    const pi = cv.personalInfo || {};
    
    return `Create German job application documents (Anschreiben + Lebenslauf) as JSON with HTML.

OUTPUT FORMAT - Start with {:
{
  "company_name": "extracted from job",
  "contact_person": "name or null",
  "contact_email": "email or null",
  "anschreiben_html": "complete HTML",
  "lebenslauf_html": "complete HTML",
  "check_translation_ru": {
    "summary": "detailed Russian summary 3-4 sentences",
    "tone_check": "tone description",
    "lebenslauf_summary": "CV summary 2-3 sentences",
    "key_adaptations": "strategy used"
  }
}

CRITICAL HTML RULES:
1. Use ONLY single quotes in ALL HTML attributes: <div class='header' id='main'>
2. NEVER use double quotes in HTML: <div class="wrong"> ← THIS BREAKS JSON!
3. Example CORRECT: <html lang='de'><body class='document'>
4. Example WRONG: <html lang="de"> ← NO!

CANDIDATE:
${pi.name}, born ${pi.birthDate}
${pi.address}
${pi.phone}, ${pi.email}
Portfolio: ${pi.portfolio}
GitHub: ${pi.github} (34 repos, 1643+ commits)

EXPERIENCE:
${(cv.experience || []).slice(0,2).map(e => `${e.position} at ${e.company}, ${e.period}`).join('\n')}

EDUCATION:
${cv.education?.[0]?.degree}, ${cv.education?.[0]?.institution}, ${cv.education?.[0]?.period}
B2 German course completed

SKILLS:
${(cv.skills?.webDevelopment || []).slice(0,8).join(', ')}

PROJECTS:
${(cv.projects || []).slice(0,2).map(p => `${p.title}: ${p.description?.substring(0,100)}`).join('\n')}

JOB POSTING:
${jobDescription}

TASKS:
1. Analyze job type (Developer/Logistics/Admin/IT/General)
2. Create Anschreiben (DIN 5008, date: "Kreuztal, den 3. Juni 2026", include ${pi.phone} and full address)
3. Create Lebenslauf (modern, photo [PHOTO_PATH], university as "Studium")
4. For Developer positions: emphasize GitHub, Portfolio, AI projects
5. Match job requirements - use their exact keywords
6. Present facts favorably but honestly
7. Complete HTML with inline CSS, print-ready A4`;
}
