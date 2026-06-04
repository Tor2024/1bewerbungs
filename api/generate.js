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
        const maxAttempts = Math.min(API_KEYS.length, 10); // Try up to 10 keys

        while (attempts < maxAttempts) {
            const currentKeyIndex = (keyIndex - 1 + attempts) % API_KEYS.length;
            const currentKey = API_KEYS[currentKeyIndex];
            console.log(`Attempt ${attempts + 1}/${maxAttempts}, using key index: ${currentKeyIndex}`);

            // Add delay between attempts to avoid overwhelming API
            if (attempts > 0) {
                const delayMs = attempts <= 3 ? 1000 : 2000; // 1s for first retries, 2s for later
                console.log(`Waiting ${delayMs}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }

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
                                maxOutputTokens: 16000  // Increased from 8000 to allow complete response
                            }
                        })
                    }
                );

                console.log('Gemini response status:', response.status, response.statusText);

                if (response.status === 403 || response.status === 429 || response.status === 503 || response.status === 400) {
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
                
                // Check if response was blocked or incomplete
                const candidate = data.candidates?.[0];
                if (!candidate) {
                    console.error('❌ No candidates in response');
                    return res.status(500).json({
                        error: 'No candidates in Gemini response',
                        fullResponse: data,
                        hint: 'Response may have been blocked by safety filters'
                    });
                }
                
                const finishReason = candidate.finishReason;
                console.log('Finish reason:', finishReason);
                
                // Check if response was blocked by safety filters
                if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
                    console.error('❌ Response blocked:', finishReason);
                    lastError = { status: 'BLOCKED', details: finishReason };
                    attempts++;
                    continue; // Try next key
                }
                
                let text = candidate.content?.parts?.[0]?.text || '';
                
                if (!text) {
                    console.error('❌ Gemini returned empty text!');
                    lastError = { status: 'EMPTY', details: 'No text in response' };
                    attempts++;
                    continue; // Try next key
                }
                
                console.log('✓ Got response from Gemini. Length:', text.length, 'chars');
                
                // CHECK FOR INCOMPLETE RESPONSE - if too short, retry with next key
                if (text.length < 3000) {
                    console.error('⚠️ Response too short! Only', text.length, 'chars - likely incomplete');
                    console.error('Response preview:', text.substring(0, 500));
                    lastError = { status: 'TOO_SHORT', details: `Only ${text.length} chars` };
                    attempts++;
                    continue; // Try next key
                }
                
                console.log('✓ Response length check passed');
                console.log('✓ Success with key index:', currentKeyIndex);
                
                console.log('=== RAW GEMINI RESPONSE (first 2000 chars) ===');
                console.log(text.substring(0, 2000));
                console.log('=== END RAW RESPONSE ===');
                
                // Clean up response - AGGRESSIVE cleaning to handle Gemini's markdown
                text = text.trim();
                
                // Remove markdown code blocks from START
                if (text.startsWith('```')) {
                    text = text.replace(/^```json?\s*/i, '');
                    text = text.trim();
                }
                
                // Remove markdown code blocks from END (the problem!)
                if (text.endsWith('```')) {
                    text = text.replace(/\s*```\s*$/g, '');
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
                console.log('Cleaned text ends with:', text.substring(text.length - 100));
                
                // Success! Process the response
                if (!text.trim().startsWith('{')) {
                    console.error('Response does not start with JSON!');
                    console.error('Response starts with:', text.substring(0, 200));
                    lastError = { status: 'NOT_JSON', details: 'Response is not JSON format' };
                    attempts++;
                    continue; // Try next key
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
                    
                    // If JSON parse fails, this response is incomplete - try next key
                    console.error('⚠️ Incomplete or invalid JSON, trying next key...');
                    lastError = { 
                        status: 'PARSE_ERROR', 
                        details: parseError.message,
                        length: text.length 
                    };
                    attempts++;
                    continue; // Try next key
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
    
    // Get current date in German format
    const today = new Date();
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const currentDate = `${today.getDate()}. ${months[today.getMonth()]} ${today.getFullYear()}`;
    
    return `Create German job application documents (Anschreiben + Lebenslauf) as JSON with HTML.

CRITICAL CONTEXT ABOUT CANDIDATE:
- Lives in GERMANY since 2022 after war relocation from Ukraine
- German level: B1 certificate, studying towards B2 (NOT native!)
- Situation: Seeking ANY available work - from warehouse to IT
- Strategy: Adapt to EACH job - don't always mention portfolio/GitHub if not relevant
- Since 2022: Learning German + various courses + self-taught web development
- Work permit: §24 AufenthG, available immediately
- Education: "Ingenieur-Systemtechniker" (NOT Spezialist!) - specialty "Computersysteme der Datenverarbeitung und Informationssteuerung"

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
5. Use proper CSS to avoid text overlap - proper margins, padding, positioning

CANDIDATE:
${pi.name}, born ${pi.birthDate}
${pi.address}
${pi.phone}, ${pi.email}
Portfolio: ${pi.portfolio}
GitHub: ${pi.github} (34 repos, 1643+ commits)

EXPERIENCE:
${(cv.experience || []).slice(0,2).map(e => `${e.position} at ${e.company}, ${e.period}`).join('\n')}

EDUCATION:
Ingenieur-Systemtechniker (Engineer in System Engineering), Specialty: Computersysteme der Datenverarbeitung und Informationssteuerung
${cv.education?.[0]?.institution}, ${cv.education?.[0]?.period}
Since 2022 in Germany: German language courses (B1 certificate, studying B2) + various professional development courses

SKILLS:
${(cv.skills?.webDevelopment || []).slice(0,8).join(', ')}

PROJECTS:
${(cv.projects || []).slice(0,2).map(p => `${p.title}: ${p.description?.substring(0,100)}`).join('\n')}

JOB POSTING:
${jobDescription}

TASKS:
1. Analyze job type (Developer/Logistics/Admin/IT/General/Warehouse/Production)
2. Create Anschreiben (DIN 5008, date: "Kreuztal, den ${currentDate}", include ${pi.phone} and full address)
3. For NON-TECH jobs (warehouse, production, service): Focus on reliability, work ethic, logistics experience. DON'T mention portfolio/GitHub unless tech-relevant!
4. For TECH jobs (Developer, IT): Mention GitHub, Portfolio, projects
5. Create Lebenslauf: 
   - Modern clean layout, NO text overlap, proper spacing
   - Photo [PHOTO_PATH] top-right corner
   - Education: "Studium" section with title "Ingenieur-Systemtechniker, Fachrichtung: Computersysteme der Datenverarbeitung und Informationssteuerung"
   - Weiterbildung: "Seit 2022 in Deutschland: Deutschkurse (B1-Zertifikat, B2-Niveau), Webentwicklung (selbstständig erlernt)"
6. Tone: Motivated but realistic. NOT overconfident. Seeking opportunity, willing to learn, flexible.
7. Integration story: Since 2022 in Germany, learning language, seeking stable work, family integrated (2 children in school)
8. Match job requirements - use their exact keywords
9. Present facts favorably but honestly - acknowledge if changing fields
10. Complete HTML with inline CSS, print-ready A4, proper spacing to avoid overlaps`;
}
