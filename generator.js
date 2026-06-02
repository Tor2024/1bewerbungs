// Document Generator Engine - Core Logic
class DocumentGenerator {
    constructor(masterCV, jobDescription, aiResult = null) {
        this.masterCV = masterCV;
        this.jobDescription = jobDescription;
        this.aiResult = aiResult;
        this.extractedInfo = this.extractJobInfo();
    }

    extractJobInfo() {
        const text = this.jobDescription;
        
        // Extract company name
        const companyPatterns = [
            /(?:bei|für|Unternehmen:?)\s+([A-ZÄÖÜ][a-zäöü\s&]+(?:GmbH|AG|KG|e\.V\.|Inc\.|Ltd\.))/i,
            /([A-ZÄÖÜ][a-zäöü\s&]+(?:GmbH|AG|KG|e\.V\.))/,
            /Firma:?\s*([A-ZÄÖÜ][^\n]+)/i
        ];
        
        let companyName = null;
        for (const pattern of companyPatterns) {
            const match = text.match(pattern);
            if (match) {
                companyName = match[1].trim();
                break;
            }
        }

        // Extract contact person
        const contactPatterns = [
            /(?:Ansprechpartner|Kontakt|Ihre Ansprechpartnerin?):?\s*(?:Herr|Frau)?\s*([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+)?)/i,
            /(?:Herr|Frau)\s+([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+)?)/
        ];
        
        let contactPerson = null;
        for (const pattern of contactPatterns) {
            const match = text.match(pattern);
            if (match) {
                contactPerson = match[1].trim();
                break;
            }
        }

        // Extract required skills
        const skillKeywords = [
            'React', 'Next.js', 'JavaScript', 'TypeScript', 'Node.js',
            'Frontend', 'Backend', 'Fullstack', 'Webentwicklung',
            'HTML', 'CSS', 'Vue', 'Angular'
        ];
        
        const foundSkills = skillKeywords.filter(skill => 
            text.toLowerCase().includes(skill.toLowerCase())
        );

        return {
            companyName: companyName || 'Ihr Unternehmen',
            contactPerson,
            requiredSkills: foundSkills,
            jobTitle: this.extractJobTitle(text)
        };
    }

    extractJobTitle(text) {
        const titlePatterns = [
            /(?:Stellenangebot|Position|Stelle).*?:\s*([^\n]+)/i,
            /^([A-ZÄÖÜ][^\n]{10,80})/m
        ];
        
        for (const pattern of titlePatterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }
        return 'Software-Entwickler';
    }

    generateAnschreiben() {
        const { companyName, contactPerson, jobTitle } = this.extractedInfo;
        const { name, address, email, phone } = this.masterCV.personalInfo;
        
        const greeting = contactPerson 
            ? `Sehr geehrte Frau ${contactPerson},\nSehr geehrter Herr ${contactPerson},`
            : 'Sehr geehrte Damen und Herren,';

        const currentDate = new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anschreiben - ${name}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 25mm 25mm 20mm 25mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            margin-bottom: 10mm;
        }
        
        .sender-line {
            font-size: 8pt;
            color: #666;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2mm;
            margin-bottom: 3mm;
        }
        
        .recipient {
            margin-bottom: 8mm;
            min-height: 40mm;
        }
        
        .recipient-company {
            font-weight: 600;
            font-size: 11pt;
        }
        
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8mm;
            font-size: 10pt;
        }
        
        .subject {
            font-weight: 700;
            font-size: 12pt;
            margin-bottom: 6mm;
            color: #1e3a8a;
        }
        
        .greeting {
            margin-bottom: 4mm;
        }
        
        .content p {
            margin-bottom: 4mm;
            text-align: justify;
        }
        
        .closing {
            margin-top: 8mm;
        }
        
        .signature {
            margin-top: 15mm;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .page {
                box-shadow: none;
                margin: 0;
                padding: 25mm;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="sender-line">
                ${name} • ${address}
            </div>
            <div class="recipient">
                <div class="recipient-company">${companyName}</div>
                ${contactPerson ? `<div>z. Hd. ${contactPerson}</div>` : ''}
            </div>
        </div>
        
        <div class="meta-info">
            <div>
                <strong>${name}</strong><br>
                ${address}<br>
                Tel: ${phone}<br>
                E-Mail: ${email}
            </div>
            <div style="text-align: right;">
                Kreuztal, ${currentDate}
            </div>
        </div>
        
        <div class="subject">
            Bewerbung als ${jobTitle}
        </div>
        
        <div class="greeting">
            ${greeting}
        </div>
        
        <div class="content">
            <p>
                mit großem Interesse habe ich Ihre Stellenausschreibung gelesen. Die Position passt 
                optimal zu meiner beruflichen Neuorientierung in Richtung Webentwicklung, die ich nach 
                meiner Ankunft in Deutschland konsequent verfolge.
            </p>
            
            <p>
                Mein Hintergrund in der Logistik und Zollabwicklung hat mir systematisches Denken, 
                Präzision und die Fähigkeit vermittelt, komplexe Prozesse zu strukturieren. Diese 
                Kompetenzen setze ich nun gezielt in der Softwareentwicklung ein. Während meiner Zeit 
                als stellvertretender Direktor eines Zollterminals verantwortete ich die Koordination 
                internationaler Warenströme und die Führung eines Teams – Erfahrungen, die mir heute 
                helfen, technische Anforderungen zu verstehen und Projekte diszipliniert umzusetzen.
            </p>
            
            <p>
                Parallel dazu entwickle ich seit Jahren aus Leidenschaft Websites und arbeite mit 
                modernen Frontend-Technologien. Mein Studium der Datenverarbeitung und Systemtechnik 
                bildet dafür die technische Grundlage. Bereits während meiner Tätigkeit als 
                Importmanager realisierte ich eigenständig einen elektronischen Produktkatalog für über 
                60 Möbelhersteller – ein Projekt, das Datenbanklogik, Filterung und Benutzerführung 
                vereinte.
            </p>
            
            <p>
                Mein Fokus liegt klar auf der praktischen Entwicklungsarbeit. Ich schätze es, 
                Herausforderungen hands-on zu lösen, Code zu schreiben und funktionale Lösungen zu 
                schaffen. Die Managementerfahrung nutze ich, um strukturiert zu arbeiten und 
                Geschäftsprozesse zu verstehen – meine Motivation gilt jedoch der technischen 
                Umsetzung.
            </p>
            
            <p>
                Ich lerne schnell, arbeite selbstständig und bringe die nötige Ausdauer mit, mich in 
                neue Technologien einzuarbeiten. Mein Deutsch entspricht dem Niveau B1, das ich stetig 
                weiterentwickle. Ich bin in Kreuztal ansässig und kann kurzfristig beginnen.
            </p>
        </div>
        
        <div class="closing">
            <p>
                Über die Möglichkeit, meine Kenntnisse in einem persönlichen Gespräch näher vorzustellen, 
                würde ich mich sehr freuen.
            </p>
            <p style="margin-top: 6mm;">
                Mit freundlichen Grüßen
            </p>
        </div>
        
        <div class="signature">
            ${name}
        </div>
    </div>
</body>
</html>`;
    }

    generateAnschreibenWithAI(aiText) {
        const { companyName, contactPerson, jobTitle } = this.aiResult || this.extractedInfo;
        const { name, address, email, phone } = this.masterCV.personalInfo;
        
        const greeting = contactPerson 
            ? `Sehr geehrte Frau ${contactPerson},\nSehr geehrter Herr ${contactPerson},`
            : 'Sehr geehrte Damen und Herren,';

        const currentDate = new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Convert AI text paragraphs to HTML
        const paragraphs = aiText.split('\n\n')
            .filter(p => p.trim())
            .map(p => `<p>${p.trim()}</p>`)
            .join('\n            ');

        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anschreiben - ${name}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 25mm 25mm 20mm 25mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            margin-bottom: 10mm;
        }
        
        .sender-line {
            font-size: 8pt;
            color: #666;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2mm;
            margin-bottom: 3mm;
        }
        
        .recipient {
            margin-bottom: 8mm;
            min-height: 40mm;
        }
        
        .recipient-company {
            font-weight: 600;
            font-size: 11pt;
        }
        
        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8mm;
            font-size: 10pt;
        }
        
        .subject {
            font-weight: 700;
            font-size: 12pt;
            margin-bottom: 6mm;
            color: #1e3a8a;
        }
        
        .greeting {
            margin-bottom: 4mm;
        }
        
        .content p {
            margin-bottom: 4mm;
            text-align: justify;
        }
        
        .closing {
            margin-top: 8mm;
        }
        
        .signature {
            margin-top: 15mm;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .page {
                box-shadow: none;
                margin: 0;
                padding: 25mm;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="sender-line">
                ${name} • ${address}
            </div>
            <div class="recipient">
                <div class="recipient-company">${companyName}</div>
                ${contactPerson ? `<div>z. Hd. ${contactPerson}</div>` : ''}
            </div>
        </div>
        
        <div class="meta-info">
            <div>
                <strong>${name}</strong><br>
                ${address}<br>
                Tel: ${phone}<br>
                E-Mail: ${email}
            </div>
            <div style="text-align: right;">
                Kreuztal, ${currentDate}
            </div>
        </div>
        
        <div class="subject">
            Bewerbung als ${jobTitle}
        </div>
        
        <div class="greeting">
            ${greeting}
        </div>
        
        <div class="content">
            ${paragraphs}
        </div>
        
        <div class="closing">
            <p>
                Über die Möglichkeit, meine Kenntnisse in einem persönlichen Gespräch näher vorzustellen, 
                würde ich mich sehr freuen.
            </p>
            <p style="margin-top: 6mm;">
                Mit freundlichen Grüßen
            </p>
        </div>
        
        <div class="signature">
            ${name}
        </div>
    </div>
</body>
</html>`;
    }

    generateLebenslauf(photoPath = null) {
        const cv = this.masterCV;
        const photo = photoPath || cv.personalInfo.photo || '[PHOTO_PATH]';
        
        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lebenslauf - ${cv.personalInfo.name}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #2c3e50;
            background: #f5f5f5;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            background: white;
            margin: 0 auto;
            display: flex;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .sidebar {
            width: 35%;
            background: linear-gradient(180deg, #1e3a8a 0%, #374151 100%);
            color: white;
            padding: 25mm 15mm 20mm 15mm;
        }
        
        .photo-container {
            text-align: center;
            margin-bottom: 20mm;
        }
        
        .photo {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        
        .sidebar h1 {
            font-size: 18pt;
            font-weight: 700;
            text-align: center;
            margin-bottom: 5mm;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .sidebar-section {
            margin-bottom: 8mm;
        }
        
        .sidebar-section h2 {
            font-size: 11pt;
            font-weight: 600;
            margin-bottom: 3mm;
            padding-bottom: 2mm;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .contact-item {
            margin-bottom: 2mm;
            font-size: 9pt;
            line-height: 1.6;
        }
        
        .contact-item strong {
            display: block;
            font-size: 8pt;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .skills-list {
            list-style: none;
        }
        
        .skills-list li {
            padding: 2mm 0;
            padding-left: 5mm;
            position: relative;
            font-size: 9pt;
        }
        
        .skills-list li:before {
            content: "▸";
            position: absolute;
            left: 0;
            color: #60a5fa;
        }
        
        .main-content {
            width: 65%;
            padding: 25mm 15mm 20mm 15mm;
        }
        
        .main-section {
            margin-bottom: 8mm;
        }
        
        .main-section h2 {
            font-size: 13pt;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 4mm;
            padding-bottom: 2mm;
            border-bottom: 3px solid #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .experience-item, .education-item {
            margin-bottom: 5mm;
            page-break-inside: avoid;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 2mm;
        }
        
        .item-title {
            font-size: 11pt;
            font-weight: 700;
            color: #1e3a8a;
        }
        
        .item-period {
            font-size: 9pt;
            color: #64748b;
            font-weight: 600;
            white-space: nowrap;
        }
        
        .item-company {
            font-size: 10pt;
            color: #475569;
            margin-bottom: 2mm;
            font-style: italic;
        }
        
        .item-details {
            list-style: none;
            padding-left: 5mm;
        }
        
        .item-details li {
            margin-bottom: 1.5mm;
            position: relative;
            font-size: 9pt;
            line-height: 1.5;
        }
        
        .item-details li:before {
            content: "•";
            position: absolute;
            left: -5mm;
            color: #1e3a8a;
            font-weight: bold;
        }
        
        .project-item {
            margin-bottom: 4mm;
            padding: 3mm;
            background: #f8fafc;
            border-left: 3px solid #3b82f6;
            border-radius: 2mm;
        }
        
        .project-title {
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 1mm;
        }
        
        .project-desc {
            font-size: 9pt;
            color: #475569;
        }
        
        @media print {
            body {
                background: white;
            }
            .page {
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="sidebar">
            <div class="photo-container">
                <img src="${photo}" alt="${cv.personalInfo.name}" class="photo">
            </div>
            
            <h1>${cv.personalInfo.name}</h1>
            
            <div class="sidebar-section">
                <h2>Kontakt</h2>
                <div class="contact-item">
                    <strong>Adresse</strong>
                    ${cv.personalInfo.address}
                </div>
                <div class="contact-item">
                    <strong>Telefon</strong>
                    ${cv.personalInfo.phone}
                </div>
                <div class="contact-item">
                    <strong>E-Mail</strong>
                    ${cv.personalInfo.email}
                </div>
                <div class="contact-item">
                    <strong>Geburtsdatum</strong>
                    ${cv.personalInfo.birthDate}
                </div>
            </div>
            
            <div class="sidebar-section">
                <h2>Sprachen</h2>
                ${Object.entries(cv.languages).map(([lang, level]) => `
                    <div class="contact-item">
                        <strong>${lang}</strong>
                        ${level}
                    </div>
                `).join('')}
            </div>
            
            <div class="sidebar-section">
                <h2>Kompetenzen</h2>
                <ul class="skills-list">
                    ${cv.skills.webDevelopment.map(skill => `<li>${skill}</li>`).join('')}
                    ${cv.skills.technical.slice(0, 8).map(skill => `<li>${skill}</li>`).join('')}
                </ul>
            </div>
            
            <div class="sidebar-section">
                <h2>Führerschein</h2>
                <div class="contact-item">${cv.driverLicense}</div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="main-section">
                <h2>Berufserfahrung</h2>
                ${cv.experience.map(exp => `
                    <div class="experience-item">
                        <div class="item-header">
                            <div class="item-title">${exp.position}</div>
                            <div class="item-period">${exp.period}</div>
                        </div>
                        <div class="item-company">${exp.company}, ${exp.location}</div>
                        <ul class="item-details">
                            ${exp.responsibilities.slice(0, 4).map(resp => `<li>${resp}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
            
            <div class="main-section">
                <h2>Ausbildung</h2>
                ${cv.education.map(edu => `
                    <div class="education-item">
                        <div class="item-header">
                            <div class="item-title">${edu.degree}</div>
                            <div class="item-period">${edu.period}</div>
                        </div>
                        <div class="item-company">${edu.institution}, ${edu.location}</div>
                        ${edu.details ? `
                            <ul class="item-details">
                                ${edu.details.slice(0, 2).map(detail => `<li>${detail}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            <div class="main-section">
                <h2>Projekte</h2>
                ${cv.projects.map(proj => `
                    <div class="project-item">
                        <div class="project-title">${proj.title}</div>
                        <div class="project-desc">${proj.description}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="main-section">
                <h2>Hobbys</h2>
                <p style="font-size: 9pt; color: #475569;">${cv.hobbies}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    generateQualityCheck() {
        return {
            summary: `Bewerbung für ${this.extractedInfo.jobTitle} bei ${this.extractedInfo.companyName}. Der Brief erklärt die Neuorientierung vom Management in der Logistik zur Web-Entwicklung. Betont werden: technische Grundausbildung, praktische Erfahrung mit Webprojekten und die Übertragbarkeit von Führungserfahrung (Struktur, Disziplin) auf die Entwicklung. Klare Aussage: Fokus liegt auf hands-on Entwicklung, nicht auf Management.`,
            
            tone_check: `Sachlich und professionell. Selbstbewusst, aber nicht überheblich. Zeigt Respekt für die neue Rolle und erklärt den Karrierewechsel nachvollziehbar. Vermeidet typische KI-Klischees und formuliert im deutschen Business-Stil: konkret, strukturiert, ohne Übertreibungen.`,
            
            extracted_data: [
                `Firma: ${this.extractedInfo.companyName}`,
                `Kontakt: ${this.extractedInfo.contactPerson || 'Keine spezifische Person gefunden'}`,
                `Position: ${this.extractedInfo.jobTitle}`,
                `Gefundene Skills: ${this.extractedInfo.requiredSkills.join(', ') || 'Allgemeine Entwicklung'}`
            ]
        };
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentGenerator;
}
