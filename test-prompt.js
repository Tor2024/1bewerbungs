// Test script to verify prompt building
const fs = require('fs');

const masterCV = JSON.parse(fs.readFileSync('masterCV.json', 'utf-8'));
const jobDescription = fs.readFileSync('example_job.txt', 'utf-8');

function buildPrompt(masterCV, jobDescription) {
    const cv = masterCV;
    const pi = cv.personalInfo || {};
    
    return `### ROLE
You are an expert HR engineer and document architect for the German job market. Your task: based on the user's Master-CV and specific job posting, generate two adaptive documents (Anschreiben and Lebenslauf).

### MASTER-CV DATA

**Personal Information:**
- Name: ${pi.name}
- Birth Date: ${pi.birthDate}
- Address: ${pi.address}
- Phone: ${pi.phone}
- Email: ${pi.email}

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

**Technical Skills:**
${(cv.skills?.technical || []).join(', ')}

**Web Development Skills:**
${(cv.skills?.webDevelopment || []).join(', ')}

**Notable Projects:**
${(cv.projects || []).map((proj, i) => `
${i + 1}. ${proj.title}
   ${proj.description}
`).join('\n')}

**Key Achievements:**
${(cv.achievements || []).map((ach, i) => `${i + 1}. ${ach}`).join('\n')}

**Driver License:** ${cv.driverLicense || 'Not specified'}

**Hobbies:** ${cv.hobbies || ''}

### JOB POSTING
${jobDescription}

### ADAPTATION PRINCIPLES (CRITICAL)

1. **Anti-Overqualified Strategy:** Soften management background. Instead of "Director/Deputy Director" use "Projektleiter" or "Senior Specialist". In the cover letter, explain that management experience gives discipline and understanding of business goals, but your passion and focus now is hands-on development.

2. **Entity Extraction:** Find in the job posting:
   - Company name
   - Contact person (name, salutation)
   - Email address
   - Complete address
   If no contact name found, use "Sehr geehrte Damen und Herren".

3. **No AI Clichés:** FORBIDDEN phrases:
   - "Ich hoffe, diese E-Mail findet Sie gut"
   - "Ich bin der ideale Kandidat"
   - "In der heutigen digitalen Welt"
   - "Mit großem Interesse habe ich..."
   Write in dry, business-like German style. Professional but accessible.

4. **Language Level:** Perfect German but syntactically accessible for B1-B2 level (professional but not overly complex).

5. **Career Transition:** Position the transition from Logistics Management to Web Development as:
   - Logical evolution using technical background from university (Datenverarbeitung und Systemtechnik)
   - Long-standing passion for web design and programming (mentioned in hobbies)
   - Practical experience from creating electronic furniture catalog and other IT projects
   - Management skills now applied to software development discipline

### ANSCHREIBEN REQUIREMENTS (DIN 5008)

Structure:
1. **Sender block** (right-aligned, top):
   ${pi.name}
   ${pi.address}
   Phone: ${pi.phone}
   Email: ${pi.email}

2. **Recipient block** (left-aligned, below sender):
   [Company name from job posting]
   [Contact person if found]
   [Address from job posting]

3. **Date:** (right-aligned) Format: Kreuztal, [current date in German format]

4. **Subject line:** Bewerbung als [Position from job posting]

5. **Salutation:** 
   - If contact person found: "Sehr geehrte/r [Herr/Frau] [Name],"
   - Otherwise: "Sehr geehrte Damen und Herren,"

6. **Body (3-4 paragraphs):**
   - Opening: Briefly state interest in the position
   - Main paragraph 1: Highlight relevant experience (soften management roles, emphasize technical work)
   - Main paragraph 2: Connect logistics background to web development (analytical thinking, systematic approach, project management)
   - Main paragraph 3: Mention specific skills from job requirements (React, Next.js, etc.)
   - Closing: Express interest in interview

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

Modern 2-column layout:
- **Left column (30%):** Photo placeholder [PHOTO_PATH], contact info, languages, skills
- **Right column (70%):** Experience, education, projects

**Sections:**
1. Personal Data (Persönliche Daten)
2. Professional Experience (Berufserfahrung) - Most recent first, soften management titles
3. Education (Ausbildung)
4. Skills (Kenntnisse) - Split: Technical/Logistics + Web Development
5. Languages (Sprachen)
6. Notable Projects (Projekte) - Select 2-3 most impressive
7. Hobbies (Hobbys) - Brief mention

**Formatting:**
- Use modern fonts (Inter, Roboto, or Arial)
- Color scheme: Dark blue (#1e3a8a) or graphite (#374151) for accents
- Clean, professional design
- Print-friendly (A4 page)

### OUTPUT FORMAT

Return ONLY valid JSON (no markdown code blocks, no extra text):

{
  "company_name": "extracted company name from job posting",
  "contact_person": "extracted contact name or null",
  "contact_email": "extracted email or null",
  "anschreiben_html": "complete HTML document with inline CSS for Anschreiben (DIN 5008)",
  "lebenslauf_html": "complete HTML document with inline CSS for Lebenslauf (use [PHOTO_PATH] for photo)",
  "check_translation_ru": {
    "summary": "краткое описание сути письма на русском (о чем просим, как обосновали опыт начальника)",
    "tone_check": "описание тона письма на русском (например: 'уверенный технарь, уважающий иерархию')"
  }
}

### CRITICAL RULES

1. **Use ALL provided CV data** - name, address, phone, email, ALL experience, ALL education, ALL skills, projects, achievements
2. **Extract contact information** from job posting accurately
3. **Return only valid JSON** - no markdown, no code blocks, no explanatory text
4. **Soften management titles** in both documents (Director → Projektleiter)
5. **Write in perfect German** suitable for professional application
6. **Make documents print-ready** with proper A4 formatting
7. **Position career change** as natural evolution, not a jump

Generate the documents now using ALL the Master-CV data provided above.`;
}

const prompt = buildPrompt(masterCV, jobDescription);

console.log('=== PROMPT LENGTH ===');
console.log(`${prompt.length} characters`);
console.log(`${prompt.split(' ').length} words`);
console.log('\n=== CHECKING DATA INCLUSION ===');
console.log('✓ Name:', prompt.includes('Oleh Kalchenko') ? 'YES' : 'NO');
console.log('✓ Phone:', prompt.includes('015237237407') ? 'YES' : 'NO');
console.log('✓ Deputy Director:', prompt.includes('Stellvertretender Direktor') ? 'YES' : 'NO');
console.log('✓ All experiences:', prompt.includes('Zolldeklarant') && prompt.includes('Import Manager') ? 'YES' : 'NO');
console.log('✓ Education:', prompt.includes('Datenverarbeitung') ? 'YES' : 'NO');
console.log('✓ Projects:', prompt.includes('Elektronischer Möbelkatalog') ? 'YES' : 'NO');
console.log('✓ Achievements:', prompt.includes('CMR') ? 'YES' : 'NO');
console.log('✓ Job posting:', prompt.includes('TechSolutions') ? 'YES' : 'NO');
console.log('✓ Contact (Frau Schmidt):', prompt.includes('Schmidt') ? 'YES' : 'NO');
console.log('\n=== PROMPT PREVIEW (first 500 chars) ===');
console.log(prompt.substring(0, 500));
console.log('\n=== DONE ===');
