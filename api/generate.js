const API_KEYS = (process.env.GEMINI_API_KEY || '').split(',').filter(k => k.trim());
let keyIndex = 0;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (API_KEYS.length === 0) {
        return res.status(500).json({ error: 'No API keys', hint: 'Set GEMINI_API_KEY' });
    }

    try {
        const { masterCV, jobDescription } = req.body || {};
        if (!masterCV) return res.status(400).json({ error: 'masterCV required' });
        if (!jobDescription) return res.status(400).json({ error: 'jobDescription required' });

        const apiKey = API_KEYS[keyIndex++ % API_KEYS.length];
        
        // Build complete prompt with ALL CV data
        const prompt = buildPrompt(masterCV, jobDescription);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 0.2,
                        maxOutputTokens: 8000
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            return res.status(500).json({ error: 'Gemini failed', details: err.substring(0, 200) });
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        console.log('=== RAW GEMINI RESPONSE (first 2000 chars) ===');
        console.log(text.substring(0, 2000));
        console.log('=== END RAW RESPONSE ===');
        
        // Clean markdown wrapper
        text = text.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        
        // Try parsing
        try {
            const result = JSON.parse(text);
            console.log('✓ JSON parsed successfully');
            return res.status(200).json(result);
        } catch (parseError) {
            console.error('✗ JSON Parse Error:', parseError.message);
            console.error('Error at position:', parseError.message.match(/position (\d+)/)?.[1]);
            
            // Try fix 1: Find and log the problematic character
            const errorPos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
            if (errorPos > 0) {
                console.error('Context around error:');
                console.error(text.substring(Math.max(0, errorPos - 100), errorPos + 100));
            }
            
            // Try fix 2: Replace unescaped quotes in HTML content
            try {
                console.log('Attempting to fix unescaped quotes...');
                
                // Find HTML content between quotes and escape internal quotes
                let fixedText = text.replace(
                    /"(anschreiben_html|lebenslauf_html)":\s*"([^"]*)"/g,
                    (match, key, html) => {
                        // This won't work because HTML contains unescaped quotes
                        return match;
                    }
                );
                
                const result = JSON.parse(fixedText);
                console.log('✓ Fixed and parsed successfully');
                return res.status(200).json(result);
            } catch (secondError) {
                console.error('✗ Fix attempt failed:', secondError.message);
                
                // Return detailed error for debugging
                return res.status(500).json({
                    error: 'JSON parsing failed',
                    originalError: parseError.message,
                    fixAttemptError: secondError.message,
                    rawPreview: text.substring(0, 2000),
                    errorPosition: errorPos,
                    errorContext: errorPos > 0 ? text.substring(Math.max(0, errorPos - 50), errorPos + 50) : null,
                    hint: 'Check server logs for full response'
                });
            }
        }
    } catch (error) {
        return res.status(500).json({ error: 'Failed', details: error.message });
    }
};

function buildPrompt(masterCV, jobDescription) {
    const cv = masterCV;
    const pi = cv.personalInfo || {};
    
    return `### CRITICAL: JSON OUTPUT FORMAT

**MOST IMPORTANT RULE:** Never put unescaped double quotes (") inside JSON string values!

When generating HTML strings in JSON:
1. Start with: ```json
2. Use ESCAPED quotes for HTML attributes: \\" not "
3. Example CORRECT: "anschreiben_html": "<div class=\\"header\\">text</div>"
4. Example WRONG: "anschreiben_html": "<div class="header">text</div>"
5. End with: ```

Alternative (BETTER): Use single quotes in HTML to avoid escaping:
- GOOD: "anschreiben_html": "<div class='header'>text</div>"
- NO escaping needed for single quotes!

Choose single quotes method - it's simpler and safer.

### ROLE
You are an expert HR engineer and document architect for the German job market. Your task: based on the user's Master-CV and specific job posting, generate two adaptive documents (Anschreiben and Lebenslauf).

### MASTER-CV DATA

**Personal Information:**
- Name: ${pi.name}
- Birth Date: ${pi.birthDate}
- Address: ${pi.address}
- Phone: ${pi.phone}
- Email: ${pi.email}
${pi.portfolio ? `- Portfolio: ${pi.portfolio}` : ''}
${pi.workPermit ? `- Work Permit: ${pi.workPermit}` : ''}
${pi.availability ? `- Availability: ${pi.availability}` : ''}
${pi.familyStatus ? `- Family Status: ${pi.familyStatus}` : ''}
${pi.relocation ? `- Relocation: ${pi.relocation}` : ''}

**Languages:**
${Object.entries(cv.languages || {}).map(([lang, level]) => `- ${lang}: ${level}`).join('\n')}

**Career Profile:**
${cv.profile?.de || ''}

**Current Goal:** ${cv.profile?.currentGoal || 'Web Development Position'}

**Work Experience:**
${(cv.experience || []).map((exp, i) => `
${i + 1}. ${exp.position} at ${exp.company}
   Location: ${exp.location}
   Period: ${exp.period}
   Responsibilities:
${exp.responsibilities.map(r => `   - ${r}`).join('\n')}
`).join('\n')}

**Education:**
${(cv.education || []).map((edu, i) => `
${i + 1}. ${edu.degree}
   Institution: ${edu.institution}
   Location: ${edu.location}
   Period: ${edu.period}
${edu.details ? `   Details:\n${edu.details.map(d => `   - ${d}`).join('\n')}` : ''}
`).join('\n')}

**Further Education & Certifications:**
${(cv.furtherEducation || []).map((edu, i) => `
${i + 1}. ${edu.course}
   Institution: ${edu.institution}
   Period: ${edu.period}
   ${edu.certificate ? `Certificate: ${edu.certificate}` : ''}
`).join('\n')}

**Technical Skills:**
${(cv.skills?.technical || []).join(', ')}

**Web Development Skills:**
${(cv.skills?.webDevelopment || []).join(', ')}

**Tools & Software:**
${(cv.skills?.tools || []).join(', ')}

**Notable Projects:**
${(cv.projects || []).map((proj, i) => `
${i + 1}. ${proj.title}
   ${proj.description}
   ${proj.url ? `URL: ${proj.url}` : ''}
   ${proj.technologies ? `Technologies: ${proj.technologies}` : ''}
`).join('\n')}

**Key Achievements:**
${(cv.achievements || []).map((ach, i) => `${i + 1}. ${ach}`).join('\n')}

**Driver License:** ${cv.driverLicense || 'Not specified'}

**Hobbies:** ${cv.hobbies || ''}

### JOB POSTING
${jobDescription}

### ADAPTATION PRINCIPLES (CRITICAL)

**IMPORTANT:** Analyze the job posting to determine the position type and adapt the strategy accordingly:

**Position Type Detection:**
- If keywords: "Developer", "Entwickler", "Frontend", "Backend", "Programmierer", "Software" → WEB DEVELOPER strategy
- If keywords: "Lager", "Logistik", "Versand", "Kommissionierung", "Warehouse" → LOGISTICS/WAREHOUSE strategy
- If keywords: "Verwaltung", "Administration", "Büro", "Office", "Sachbearbeiter" → ADMINISTRATIVE strategy
- If keywords: "IT-Support", "Help Desk", "Support", "Systemadministrator" → IT SUPPORT strategy
- Otherwise → GENERAL strategy (balance all experience)

**Strategy 1: WEB DEVELOPER positions**
1. **Anti-Overqualified:** Soften management background. Instead of "Deputy Director" use "Projektleiter". Explain management experience gives discipline and business understanding, but passion is hands-on development.
2. **Emphasize:** GitHub (34 repos, 1643+ contributions), Portfolio (ok-studio-umber.vercel.app), concrete projects (Garten Siegerland, CarStyleGarage), AI integration skills.
3. **Position as:** Career transition from logistics to web development, backed by university degree in Computer Science (Datenverarbeitung), long-standing hobby, practical projects.
4. **Mention:** Self-directed learning, portfolio as proof of skills, willingness to start with Praktikum/Probezeit.

**Strategy 2: LOGISTICS/WAREHOUSE positions**
1. **Emphasize Leadership:** Use full title "Deputy Director of Customs Terminal", highlight 120 trucks/day management, 1700m² warehouse.
2. **Focus on:** 20+ years logistics experience, customs knowledge, international shipping, systematic work approach.
3. **Technical skills as bonus:** Mention IT literacy, Excel skills, potential for digitalization projects.
4. **Soft skills:** Reliability, physical capability, team leadership, problem-solving.

**Strategy 3: ADMINISTRATIVE positions**
1. **Balance approach:** Mention both management experience AND technical skills.
2. **Emphasize:** Documentation expertise, customer service, MS Office proficiency, systematic work.
3. **Highlight:** International experience, multi-project coordination, detail-oriented work style.
4. **Position as:** Seeking stable office role after management position, bring organizational skills.

**Strategy 4: IT SUPPORT positions**
1. **Technical foundation:** University degree in Computer Science, self-taught modern technologies.
2. **Problem-solving:** Experience with complex systems, customer service from logistics background.
3. **Learning ability:** Self-directed learning (web development), quick adaptation to new tools.
4. **Communication:** B2 German, experience explaining technical concepts to non-technical users.

**Strategy 5: GENERAL (unknown position type)**
1. **Versatile profile:** Present as flexible candidate with diverse skill set.
2. **Highlight adaptability:** Successfully transitioned from logistics to web development through self-learning.
3. **Core strengths:** Reliability, systematic approach, quick learner, strong work ethic.

**Universal Rules (all strategies):**

**Universal Rules (all strategies):**

1. **Entity Extraction:** Find in the job posting:
   - Company name
   - Contact person (name, salutation)
   - Email address
   - Complete address
   If no contact name found, use "Sehr geehrte Damen und Herren".

2. **No AI Clichés:** FORBIDDEN phrases:
   - "Ich hoffe, diese E-Mail findet Sie gut"
   - "Ich bin der ideale Kandidat"
   - "In der heutigen digitalen Welt"
   - "Mit großem Interesse habe ich..."
   Write in dry, business-like German style. Professional but accessible.

3. **Language Level:** Perfect German but syntactically accessible for B1-B2 level (professional but not overly complex).

4. **Motivation & Integration:** Always mention:
   - Since 2022 in Germany after relocation due to war in Ukraine
   - Completed B2 German course (B1 certificate available)
   - Ready to work immediately, open to Probezeit/Praktikum
   - Family integrated in Kreuztal (two children in school)
   - Looking for long-term stable position

5. **Salary & Flexibility:** If job posting asks for salary expectation:
   - Mention: "ca. 18-20 EUR/Stunde, verhandelbar je nach Anforderungen"
   - Emphasize flexibility and willingness to learn

### ANSCHREIBEN REQUIREMENTS (DIN 5008)

**IMPORTANT:** Return complete HTML document with inline CSS. No external stylesheets.

**HTML Structure Example:**
```html
<!DOCTYPE html>
<html lang='de'>
<head>
<meta charset='UTF-8'>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  font-family: 'Arial', sans-serif; 
  font-size: 11pt; 
  line-height: 1.5; 
  color: #333;
  max-width: 210mm;
  margin: 0 auto;
  padding: 20mm 25mm;
}
@media print {
  @page { size: A4; margin: 15mm; }
  body { padding: 0; }
}
.sender { font-size: 8pt; margin-bottom: 3mm; color: #666; }
.recipient { margin-bottom: 8mm; }
.date { text-align: right; margin-bottom: 10mm; }
.subject { font-weight: bold; margin-bottom: 8mm; }
.salutation { margin-bottom: 8mm; }
.paragraph { margin-bottom: 6mm; text-align: justify; }
.closing { margin-top: 10mm; }
.signature { margin-top: 15mm; }
</style>
</head>
<body>
<!-- Full content here with single quotes in all attributes -->
</body>
</html>
```

**CRITICAL:** Use single quotes (') for ALL HTML attributes, never double quotes (")

Structure:
1. **Sender block** (right-aligned, top):
   **CRITICAL:** ALWAYS include full contact information:
   ${pi.name}
   ${pi.address}
   Tel: ${pi.phone}
   E-Mail: ${pi.email}
   
   Format small (8-9pt), right-aligned or as compact header

2. **Recipient block** (left-aligned, below sender):
   [Company name from job posting]
   [Contact person if found]
   [Address from job posting]

3. **Date:** (right-aligned) Format: Kreuztal, [CURRENT DATE in German format DD. MMMM YYYY]
   **IMPORTANT:** Use actual current date when generating (e.g., "Kreuztal, 3. Juni 2026")

4. **Subject line:** Bewerbung als [Position from job posting]

5. **Salutation:** 
   - **If contact person found:** "Sehr geehrte/r [Herr/Frau] [Nachname],"
   - **CRITICAL:** Always use contact person if available! Check contact_person field
   - Otherwise: "Sehr geehrte Damen und Herren,"

6. **Body (3-4 paragraphs) - ADAPT TO POSITION TYPE:**

   **For WEB DEVELOPER positions:**
   - Para 1: Interest in position, mention GitHub (34 repos, 1643+ commits) and portfolio
   - Para 2: University background in Computer Science, self-taught modern stack, concrete projects
   - Para 3: How logistics management experience brings systematic approach and business understanding
   - Para 4: Portfolio link, willingness to start with Praktikum, immediate availability

   **For LOGISTICS/WAREHOUSE positions:**
   - Para 1: Interest in position, 20+ years logistics experience
   - Para 2: Concrete achievements (120 trucks/day, 1700m² warehouse, customs expertise)
   - Para 3: Systematic work approach, reliability, physical capability, team experience
   - Para 4: Integration in Germany, German B2, immediate availability

   **For ADMINISTRATIVE positions:**
   - Para 1: Interest in position, diverse background in management and organization
   - Para 2: Documentation expertise, MS Office, customer service, multi-project coordination
   - Para 3: International experience, attention to detail, systematic approach
   - Para 4: Looking for stable position, German B2, immediate availability

   **For IT SUPPORT positions:**
   - Para 1: Interest in position, Computer Science degree + self-taught modern tech
   - Para 2: Problem-solving experience, customer service background, quick learner
   - Para 3: Technical projects as proof (GitHub, portfolio), systematic troubleshooting
   - Para 4: Willingness to learn company systems, German B2, immediate availability

   **For GENERAL positions:**
   - Para 1: Interest in position, versatile background
   - Para 2: Highlight most relevant experience from job requirements
   - Para 3: Emphasize reliability, learning ability, systematic approach
   - Para 4: Integration status, German B2, flexibility, immediate availability

   **Always include if relevant:**
   - Portfolio link (for tech positions): "Mein Portfolio unter ok-studio-umber.vercel.app zeigt meine praktischen Projekte."
   - GitHub (for developer positions): "Mein GitHub-Profil mit über 30 Repositories belegt meine kontinuierliche Arbeit."

7. **Closing formula:**
   Mit freundlichen Grüßen
   [Name]

**Style:**
- Use "Sie" form (formal)
- Short, clear sentences
- No marketing language or superlatives
- Focus on facts and specific experience
- German B1-B2 level (professional but clear)

### LEBENSLAUF REQUIREMENTS

**IMPORTANT:** Return complete HTML document with inline CSS. Include photo placeholder.

**HTML Structure Example:**
```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  font-family: 'Arial', sans-serif; 
  font-size: 10pt; 
  line-height: 1.4; 
  color: #333;
  max-width: 210mm;
  margin: 0 auto;
  padding: 15mm 20mm;
}
@media print {
  @page { size: A4; margin: 10mm; }
  body { padding: 0; }
}
.header { 
  display: flex; 
  align-items: flex-start; 
  margin-bottom: 15mm;
  border-bottom: 3px solid #1e3a8a;
  padding-bottom: 10mm;
}
.photo { 
  width: 35mm; 
  height: 45mm; 
  border: 1px solid #ddd; 
  border-radius: 2px;
  margin-right: 15mm;
  object-fit: cover;
}
.header-info { flex: 1; }
.name { 
  font-size: 20pt; 
  font-weight: bold; 
  color: #1e3a8a; 
  margin-bottom: 3mm;
}
.contact { font-size: 9pt; color: #666; }
.contact-item { margin-bottom: 2mm; }
.section { margin-bottom: 8mm; }
.section-title { 
  font-size: 13pt; 
  font-weight: bold; 
  color: #1e3a8a; 
  margin-bottom: 4mm;
  border-bottom: 1px solid #ddd;
  padding-bottom: 2mm;
}
.entry { margin-bottom: 5mm; }
.entry-header { 
  display: flex; 
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 1mm;
}
.entry-title { color: #1e3a8a; }
.entry-period { color: #666; font-size: 9pt; }
.entry-company { color: #666; font-style: italic; margin-bottom: 2mm; }
.entry-content { margin-left: 5mm; }
.entry-content li { margin-bottom: 1mm; }
.skills-grid { 
  display: grid; 
  grid-template-columns: repeat(2, 1fr); 
  gap: 5mm; 
}
.skill-category { margin-bottom: 3mm; }
.skill-category-title { 
  font-weight: bold; 
  color: #1e3a8a; 
  margin-bottom: 2mm; 
}
</style>
</head>
<body>
<div class="header">
  <img src="[PHOTO_PATH]" alt="Bewerbungsfoto" class="photo">
  <div class="header-info">
    <div class="name">NAME HERE</div>
    <div class="contact">
      <div class="contact-item">📍 Address</div>
      <div class="contact-item">📞 Phone</div>
      <div class="contact-item">✉ Email</div>
      <div class="contact-item">🌐 Portfolio/GitHub</div>
    </div>
  </div>
</div>
<!-- Sections here -->
</body>
</html>
```

Modern 2-column layout:
- **Left column (30%):** Photo placeholder [PHOTO_PATH], contact info (including portfolio and GitHub for tech positions), languages, core skills
- **Right column (70%):** Experience (adapt titles based on position type), education, projects (select most relevant)

**Experience Section - ADAPT TITLES:**
- For WEB DEVELOPER: "Projektleiter" or "Senior Specialist" (soften management)
- For LOGISTICS: Keep "Stellvertretender Direktor" (show leadership)
- For ADMINISTRATIVE: "Projektmanager" or "Teamleiter" (balance)
- For IT SUPPORT: "IT-Projektleiter" (technical angle)

**Projects Section - SELECT BASED ON POSITION:**
- For WEB DEVELOPER: Show OK Studio, AI Generator, Web Studio (all 3)
- For IT positions: Show AI Generator, mention GitHub
- For LOGISTICS: Show Seefrachtcontainer, Logistikprojekte
- For ADMINISTRATIVE: Show Elektronischer Möbelkatalog
- For WAREHOUSE: Skip technical projects, focus on logistics achievements

**Sections:**
1. Personal Data (Persönliche Daten) - Always include GitHub and Portfolio for tech positions
2. Professional Experience (Berufserfahrung) - Most recent first, adapt titles to position type
3. Education (Ausbildung) - Always mention Computer Science degree
4. Further Education (Weiterbildung) - B2 German course, self-learning (tech positions)
5. Skills (Kenntnisse) - PRIORITIZE based on job requirements
6. Languages (Sprachen) - German B2 prominent
7. Projects (Projekte) - Select 2-3 most relevant to position type
8. Hobbies (Hobbys) - Brief mention, include AI integration interest for tech positions

**Formatting:**
- Use modern fonts (Inter, Roboto, or Arial)
- Color scheme: Dark blue (#1e3a8a) or graphite (#374151) for accents
- Clean, professional design
- Print-friendly (A4 page)
- Add proper CSS for @media print
- Ensure photo displays correctly at ~35-40mm width in print

**CSS Requirements for Print:**
```css
@media print {
  body { margin: 0; padding: 0; }
  @page { size: A4; margin: 15mm; }
  .no-print { display: none; }
  img { max-width: 100%; page-break-inside: avoid; }
}
```

**Photo Integration:**
- Photo should be in top-left of CV (2-column layout)
- Size: approximately 35mm x 45mm (passport photo size)
- Border: subtle 1px solid #ddd
- Border-radius: 2px for professional look
- Use img tag with [PHOTO_PATH] as src
- Ensure photo is visible in both screen and print

### OUTPUT FORMAT

Return ONLY valid JSON (no markdown code blocks, no extra text):

{
  "company_name": "extracted company name from job posting",
  "contact_person": "extracted contact name or null",
  "contact_email": "extracted email or null",
  "anschreiben_html": "complete HTML document with inline CSS for Anschreiben (DIN 5008 format, A4 ready, print-optimized)",
  "lebenslauf_html": "complete HTML document with inline CSS for Lebenslauf (modern design, photo placeholder [PHOTO_PATH], A4 ready, print-optimized)",
  "check_translation_ru": {
    "summary": "ДЕТАЛЬНОЕ описание письма на русском: какую должность просим, как объяснили переход из логистики в IT/разработку, какие ключевые навыки подчеркнули, как обосновали опыт руководителя для позиции разработчика/работника склада/другой должности. Минимум 3-4 предложения.",
    "tone_check": "описание тона письма на русском (например: 'уверенный технарь с управленческим опытом' или 'надежный работник склада с опытом руководства' или 'организованный администратор')",
    "lebenslauf_summary": "Краткое описание CV на русском: какие разделы включены, как представлен опыт (какие должности выделены), какие проекты показаны, общая структура. 2-3 предложения.",
    "key_adaptations": "Ключевые адаптации для этой вакансии на русском: что подчеркнули, что смягчили, какую стратегию использовали (Developer/Logistics/Admin/IT Support/General). 2-3 пункта."
  }
}

**HTML REQUIREMENTS:**
1. **Complete documents:** Include <!DOCTYPE html>, <html>, <head>, <body>
2. **Inline CSS:** All styles in <style> tag in <head>, no external CSS
3. **Print-ready:** Include @media print with proper A4 sizing
4. **Photo integration:** Use <img src="[PHOTO_PATH]"> in Lebenslauf header
5. **Professional fonts:** Arial, Helvetica, sans-serif
6. **Color scheme:** Dark blue (#1e3a8a) or graphite (#374151) for headers/accents
7. **Typography:** 
   - Anschreiben: 11pt body text, 1.5 line-height
   - Lebenslauf: 10pt body text, 1.4 line-height, bold section titles
8. **Spacing:** Proper margins and padding for A4 format (210mm x 297mm)
9. **No JavaScript:** Pure HTML+CSS only
10. **Encoding:** UTF-8 with proper German umlauts (ä, ö, ü, ß)

**CRITICAL JSON REQUIREMENTS:**
- Wrap entire response in ```json and ``` markers
- Use SINGLE QUOTES (') for ALL HTML attributes - NEVER double quotes (")
- Example: <div class='header'> NOT <div class="header">
- If you use double quotes in HTML, you MUST escape them: <div class=\\"header\\">
- Single quotes are MUCH SAFER - always prefer them
- No literal newlines in JSON strings - HTML can be on one long line

### CRITICAL RULES

1. **DETECT POSITION TYPE FIRST** - Read job posting carefully and identify: Web Developer / Logistics / Administrative / IT Support / General
2. **APPLY CORRECT STRATEGY** - Use corresponding adaptation strategy for that position type
3. **USE RELEVANT DATA** - Select most relevant experience, skills, and projects for the position type
4. **ADAPT JOB TITLES** - Soften or emphasize management background based on position type
5. **EXTRACT CONTACT INFO** - Company name, contact person (with Herr/Frau), email, address from job posting
6. **USE CONTACT PERSON** - If contact_person found, ALWAYS use in salutation (Sehr geehrte/r Herr/Frau [Name])
7. **INCLUDE FULL CONTACT DATA** - ALWAYS include phone (${pi.phone}) and full address (${pi.address}) in sender block
8. **CURRENT DATE** - Use actual current date in German format (e.g., "Kreuztal, 3. Juni 2026")
9. **NO AI CLICHÉS** - Avoid forbidden phrases, write in business German style
10. **VALID JSON ONLY** - Return only JSON, escape quotes properly, no markdown, no extra text, no line breaks in strings
11. **DETAILED RUSSIAN CHECK** - Provide detailed summary (3-4 sentences), lebenslauf summary, key adaptations
12. **EMPHASIZE INTEGRATION** - Always mention: since 2022 in Germany, B2 German, work permit §24, immediate availability
13. **SHOW FLEXIBILITY** - Willing to start with Probezeit/Praktikum, salary negotiable (18-20 EUR/h)
14. **PRINT-READY** - Make documents professional, A4 format, ready to send

Generate the documents now using the ADAPTIVE strategy based on the job posting type.`;
}
