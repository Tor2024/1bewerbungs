// Application State
let masterCV = null;
let userPhotoData = null;

// DOM Elements
const elements = {
    masterCVInput: document.getElementById('masterCV'),
    loadSampleBtn: document.getElementById('loadSample'),
    cvStatus: document.getElementById('cvStatus'),
    jobDescription: document.getElementById('jobDescription'),
    userPhotoInput: document.getElementById('userPhoto'),
    photoPreview: document.getElementById('photoPreview'),
    generateBtn: document.getElementById('generateBtn'),
    outputSection: document.getElementById('outputSection'),
    anschreibenPreview: document.getElementById('anschreibenPreview'),
    lebenslaufPreview: document.getElementById('lebenslaufPreview'),
    checkSummary: document.getElementById('checkSummary'),
    checkTone: document.getElementById('checkTone'),
    checkData: document.getElementById('checkData')
};

// Event Listeners
elements.masterCVInput.addEventListener('change', handleMasterCVUpload);
elements.loadSampleBtn.addEventListener('click', loadSampleCV);
elements.userPhotoInput.addEventListener('change', handlePhotoUpload);
elements.generateBtn.addEventListener('click', generateDocuments);

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Print and download handlers
document.getElementById('printAnschreiben').addEventListener('click', () => {
    printDocument('anschreiben');
});

document.getElementById('downloadAnschreiben').addEventListener('click', () => {
    downloadDocument('anschreiben', elements.anschreibenPreview.innerHTML);
});

document.getElementById('printLebenslauf').addEventListener('click', () => {
    printDocument('lebenslauf');
});

document.getElementById('downloadLebenslauf').addEventListener('click', () => {
    downloadDocument('lebenslauf', elements.lebenslaufPreview.innerHTML);
});

// Handle Master CV Upload
function handleMasterCVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            masterCV = JSON.parse(e.target.result);
            showStatus('success', 'Master-CV erfolgreich geladen!');
        } catch (error) {
            showStatus('error', 'Fehler beim Laden des Master-CV. Bitte überprüfen Sie das JSON-Format.');
            console.error('CV Parse Error:', error);
        }
    };
    reader.readAsText(file);
}

// Load Sample CV
async function loadSampleCV() {
    try {
        const response = await fetch('masterCV.json');
        masterCV = await response.json();
        showStatus('success', 'Beispiel Master-CV geladen!');
    } catch (error) {
        showStatus('error', 'Fehler beim Laden des Beispiel-CV.');
        console.error('Sample Load Error:', error);
    }
}

// Handle Photo Upload
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        userPhotoData = e.target.result;
        elements.photoPreview.innerHTML = `<img src="${userPhotoData}" alt="Bewerbungsfoto" style="max-width: 150px; border-radius: 8px; margin-top: 10px;">`;
    };
    reader.readAsDataURL(file);
}

// Generate Documents
function generateDocuments() {
    if (!masterCV) {
        alert('Bitte laden Sie zuerst einen Master-CV!');
        return;
    }
    
    const jobDesc = elements.jobDescription.value.trim();
    if (!jobDesc) {
        alert('Bitte geben Sie eine Stellenanzeige ein!');
        return;
    }
    
    try {
        const generator = new DocumentGenerator(masterCV, jobDesc);
        
        // Generate Anschreiben
        const anschreiben = generator.generateAnschreiben();
        elements.anschreibenPreview.innerHTML = anschreiben;
        
        // Generate Lebenslauf
        const lebenslauf = generator.generateLebenslauf(userPhotoData);
        elements.lebenslaufPreview.innerHTML = lebenslauf;
        
        // Generate Quality Check
        const qualityCheck = generator.generateQualityCheck();
        elements.checkSummary.textContent = qualityCheck.summary;
        elements.checkTone.textContent = qualityCheck.tone_check;
        elements.checkData.innerHTML = qualityCheck.extracted_data
            .map(item => `<li>${item}</li>`)
            .join('');
        
        // Show output section
        elements.outputSection.style.display = 'block';
        
        // Scroll to output
        elements.outputSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        alert('Fehler bei der Dokumentengenerierung: ' + error.message);
        console.error('Generation Error:', error);
    }
}

// Show Status Message
function showStatus(type, message) {
    elements.cvStatus.className = `status-message ${type}`;
    elements.cvStatus.textContent = message;
    
    setTimeout(() => {
        elements.cvStatus.style.display = 'none';
    }, 5000);
}

// Switch Tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

// Print Document
function printDocument(docType) {
    const printWindow = window.open('', '_blank');
    const content = docType === 'anschreiben' 
        ? elements.anschreibenPreview.innerHTML 
        : elements.lebenslaufPreview.innerHTML;
    
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Download Document
function downloadDocument(docType, htmlContent) {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}_${masterCV.personalInfo.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('CV & Anschreiben Generator initialized');
    
    // Load sample CV on start for demo
    loadSampleCV();
});
