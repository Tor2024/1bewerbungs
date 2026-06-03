const STORAGE_KEYS = {
    masterCV: 'master_cv',
    userPhoto: 'user_photo',
    lastApplication: 'last_application',
    bundledCVVersion: 'bundled_master_cv_version'
};

const BUNDLED_MASTER_CV_VERSION = '2026-06-03';

let masterCV = null;
let userPhotoData = null;
let lastApplication = null;

const elements = {
    masterCVInput: document.getElementById('masterCV'),
    loadSampleBtn: document.getElementById('loadSample'),
    cvStatus: document.getElementById('cvStatus'),
    jobDescription: document.getElementById('jobDescription'),
    userPhotoInput: document.getElementById('userPhoto'),
    photoPreview: document.getElementById('photoPreview'),
    generateBtn: document.getElementById('generateBtn'),
    outputSection: document.getElementById('outputSection'),
    modelInfo: document.getElementById('modelInfo'),
    clearLastApplicationBtn: document.getElementById('clearLastApplication'),
    anschreibenPreview: document.getElementById('anschreibenPreview'),
    lebenslaufPreview: document.getElementById('lebenslaufPreview'),
    checkSummary: document.getElementById('checkSummary'),
    checkTone: document.getElementById('checkTone'),
    checkData: document.getElementById('checkData')
};

elements.masterCVInput.addEventListener('change', handleMasterCVUpload);
elements.loadSampleBtn.addEventListener('click', loadSampleCV);
elements.userPhotoInput.addEventListener('change', handlePhotoUpload);
elements.generateBtn.addEventListener('click', generateDocuments);
elements.clearLastApplicationBtn.addEventListener('click', clearLastApplication);

document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
});

document.getElementById('printAnschreiben').addEventListener('click', () => {
    printDocument(lastApplication?.anschreiben_html);
});

document.getElementById('downloadAnschreiben').addEventListener('click', () => {
    downloadDocument('anschreiben', lastApplication?.anschreiben_html);
});

document.getElementById('printLebenslauf').addEventListener('click', () => {
    printDocument(getLebenslaufHtmlWithPhoto());
});

document.getElementById('downloadLebenslauf').addEventListener('click', () => {
    downloadDocument('lebenslauf', getLebenslaufHtmlWithPhoto());
});

// Add PDF download buttons
const anschreibenActions = document.querySelector('#anschreiben-tab .document-actions');
const lebenslaufActions = document.querySelector('#lebenslauf-tab .document-actions');

const pdfBtnAnschreiben = document.createElement('button');
pdfBtnAnschreiben.className = 'btn-action';
pdfBtnAnschreiben.textContent = 'Als PDF speichern';
pdfBtnAnschreiben.type = 'button';
pdfBtnAnschreiben.addEventListener('click', () => {
    if (lastApplication?.anschreiben_html) {
        printDocument(lastApplication.anschreiben_html);
        setTimeout(() => {
            alert('Tipp: Im Druckdialog "Als PDF speichern" wählen');
        }, 100);
    }
});

const pdfBtnLebenslauf = document.createElement('button');
pdfBtnLebenslauf.className = 'btn-action';
pdfBtnLebenslauf.textContent = 'Als PDF speichern';
pdfBtnLebenslauf.type = 'button';
pdfBtnLebenslauf.addEventListener('click', () => {
    const html = getLebenslaufHtmlWithPhoto();
    if (html) {
        printDocument(html);
        setTimeout(() => {
            alert('Tipp: Im Druckdialog "Als PDF speichern" wählen');
        }, 100);
    }
});

if (anschreibenActions) anschreibenActions.appendChild(pdfBtnAnschreiben);
if (lebenslaufActions) lebenslaufActions.appendChild(pdfBtnLebenslauf);

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    // Always load sample CV and photo on startup
    loadSampleCV();
    loadStoredPhoto();
    loadStoredApplication();

    // Auto-load bundled photo if no photo stored
    setTimeout(() => {
        if (!userPhotoData) {
            loadBundledPhoto();
        }
    }, 500);
}

function loadStoredMasterCV() {
    const storedValue = localStorage.getItem(STORAGE_KEYS.masterCV);
    if (!storedValue) {
        return;
    }

    try {
        masterCV = JSON.parse(storedValue);
        showStatus('success', 'Gespeicherter Master-CV geladen.');
    } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.masterCV);
        showStatus('error', 'Gespeicherter Master-CV ist ungültig und wurde entfernt.');
        console.error('Stored CV parse error:', error);
    }
}

function loadStoredPhoto() {
    userPhotoData = localStorage.getItem(STORAGE_KEYS.userPhoto);
    if (userPhotoData) {
        showPhotoPreview(userPhotoData);
    }
}

function loadStoredApplication() {
    const storedValue = localStorage.getItem(STORAGE_KEYS.lastApplication);
    if (!storedValue) {
        return;
    }

    try {
        lastApplication = JSON.parse(storedValue);
        renderApplication(lastApplication);
    } catch (error) {
        localStorage.removeItem(STORAGE_KEYS.lastApplication);
        console.error('Stored application parse error:', error);
    }
}

function handleMasterCVUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = event => {
        try {
            const parsedCV = JSON.parse(event.target.result);
            validateMasterCV(parsedCV);
            masterCV = parsedCV;
            localStorage.setItem(STORAGE_KEYS.masterCV, JSON.stringify(masterCV));
            showStatus('success', 'Master-CV gespeichert.');
        } catch (error) {
            showStatus('error', `Master-CV konnte nicht geladen werden: ${error.message}`);
            console.error('CV parse error:', error);
        }
    };
    reader.onerror = () => showStatus('error', 'Datei konnte nicht gelesen werden.');
    reader.readAsText(file);
}

async function loadSampleCV() {
    try {
        const response = await fetch('masterCV.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const sampleCV = await response.json();
        validateMasterCV(sampleCV);
        masterCV = sampleCV;
        localStorage.setItem(STORAGE_KEYS.masterCV, JSON.stringify(masterCV));
        localStorage.setItem(STORAGE_KEYS.bundledCVVersion, BUNDLED_MASTER_CV_VERSION);
        showStatus('success', '✓ Master-CV geladen (Oleh Kalchenko)');
    } catch (error) {
        showStatus('error', 'Beispiel-CV konnte nicht geladen werden.');
        console.error('Sample CV load error:', error);
    }
}

async function loadBundledPhoto() {
    try {
        const response = await fetch('photo.jpg');
        if (!response.ok) {
            console.log('Bundled photo not found, skipping');
            return;
        }

        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (event) => {
            userPhotoData = event.target.result;
            localStorage.setItem(STORAGE_KEYS.userPhoto, userPhotoData);
            showPhotoPreview(userPhotoData);
            showStatus('success', '✓ Master-CV und Foto geladen - Bereit zur Verwendung!');
        };
        reader.readAsDataURL(blob);
    } catch (error) {
        console.log('Could not load bundled photo:', error);
    }
}

async function refreshBundledCVIfNeeded() {
    if (!isBundledCV(masterCV)) {
        return;
    }

    const storedVersion = localStorage.getItem(STORAGE_KEYS.bundledCVVersion);
    if (storedVersion === BUNDLED_MASTER_CV_VERSION) {
        return;
    }

    await loadSampleCV();
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    if (!file.type.startsWith('image/')) {
        showStatus('error', 'Bitte eine Bilddatei auswählen.');
        return;
    }

    const reader = new FileReader();
    reader.onload = event => {
        userPhotoData = event.target.result;
        localStorage.setItem(STORAGE_KEYS.userPhoto, userPhotoData);
        showPhotoPreview(userPhotoData);

        if (lastApplication) {
            renderApplication(lastApplication);
        }
    };
    reader.onerror = () => showStatus('error', 'Foto konnte nicht gelesen werden.');
    reader.readAsDataURL(file);
}

async function generateDocuments() {
    try {
        validateMasterCV(masterCV);
    } catch (error) {
        alert(`Bitte zuerst einen gültigen Master-CV laden: ${error.message}`);
        return;
    }

    const jobDescription = elements.jobDescription.value.trim();
    if (jobDescription.length < 30) {
        alert('Bitte den vollständigen Text der Stellenanzeige einfügen.');
        return;
    }

    setLoadingState(true);

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                masterCV,
                jobDescription
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            // Show detailed error information
            console.error('API Error Response:', result);
            
            // Build detailed error message
            let errorDetails = `Fehler: ${result.error || 'Unknown error'}`;
            
            if (result.responsePreview) {
                errorDetails += `\n\nGemini hat zurückgegeben:\n${result.responsePreview.substring(0, 300)}...`;
            }
            
            if (result.rawPreview) {
                errorDetails += `\n\nRaw Response:\n${result.rawPreview.substring(0, 300)}...`;
            }
            
            if (result.hint) {
                errorDetails += `\n\nHinweis: ${result.hint}`;
            }
            
            // Show in alert
            alert(errorDetails);
            
            throw new Error(result.error || 'API Error');
        }

        validateApplicationResult(result);
        lastApplication = result;
        localStorage.setItem(STORAGE_KEYS.lastApplication, JSON.stringify(result));
        renderApplication(result);
        elements.outputSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert(`Fehler bei der Generierung:\n\n${error.message}\n\nBitte prüfen Sie die Browser-Konsole (F12) für Details.`);
        console.error('Generation error:', error);
    } finally {
        setLoadingState(false);
    }
}

function validateMasterCV(value) {
    if (!value || typeof value !== 'object') {
        throw new Error('JSON-Objekt erwartet.');
    }

    if (!value.personalInfo || typeof value.personalInfo !== 'object') {
        throw new Error('personalInfo fehlt.');
    }

    if (!value.personalInfo.name || !value.personalInfo.email) {
        throw new Error('Name oder E-Mail fehlt.');
    }
}

function isBundledCV(value) {
    return value?.personalInfo?.email === 'kalchenko2022@gmail.com'
        && value?.personalInfo?.name === 'Oleh Kalchenko';
}

function validateApplicationResult(result) {
    if (!result || typeof result !== 'object') {
        throw new Error('Ungültige API-Antwort.');
    }

    const requiredFields = ['company_name', 'anschreiben_html', 'lebenslauf_html'];
    for (const field of requiredFields) {
        if (typeof result[field] !== 'string' || result[field].trim() === '') {
            throw new Error(`API-Antwort ohne ${field}.`);
        }
    }

    if (!result.check_translation_ru) {
        throw new Error('Russische Prüfung fehlt.');
    }
}

function renderApplication(result) {
    elements.anschreibenPreview.srcdoc = sanitizeHtml(result.anschreiben_html);
    elements.lebenslaufPreview.srcdoc = sanitizeHtml(getLebenslaufHtmlWithPhoto());
    
    // Render Russian check information
    const checkRu = result.check_translation_ru || {};
    elements.checkSummary.textContent = checkRu.summary || 'Не доступно';
    elements.checkTone.textContent = checkRu.tone_check || 'Не доступно';
    
    // Add Lebenslauf summary if available
    const lebenslaufEl = document.getElementById('checkLebenslauf');
    if (lebenslaufEl) {
        lebenslaufEl.textContent = checkRu.lebenslauf_summary || 'Не доступно';
    }
    
    // Add key adaptations if available
    const adaptationsEl = document.getElementById('checkAdaptations');
    if (adaptationsEl) {
        adaptationsEl.textContent = checkRu.key_adaptations || 'Не доступно';
    }
    
    elements.modelInfo.textContent = result.model_used ? `Modell: ${result.model_used}` : '';
    elements.checkData.innerHTML = [
        `<strong>Firma:</strong> ${result.company_name || 'nicht erkannt'}`,
        `<strong>Kontaktperson:</strong> ${result.contact_person || 'nicht erkannt'}`,
        `<strong>E-Mail:</strong> ${result.contact_email || 'nicht erkannt'}`
    ].map(item => `<li>${item}</li>`).join('');
    elements.outputSection.hidden = false;
}

function getLebenslaufHtmlWithPhoto() {
    const html = lastApplication?.lebenslauf_html || '';
    const photo = userPhotoData || masterCV?.personalInfo?.photo || '';
    return html.replaceAll('[PHOTO_PATH]', photo);
}

function sanitizeHtml(html) {
    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');
    const blockedSelectors = 'script, iframe, object, embed, link[rel="import"]';

    document.querySelectorAll(blockedSelectors).forEach(element => element.remove());
    document.querySelectorAll('*').forEach(element => {
        [...element.attributes].forEach(attribute => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();

            if (name.startsWith('on') || value.startsWith('javascript:')) {
                element.removeAttribute(attribute.name);
            }
        });
    });

    return `<!DOCTYPE html>${document.documentElement.outerHTML}`;
}

function showPhotoPreview(photoData) {
    elements.photoPreview.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
            <img src="${photoData}" alt="Bewerbungsfoto" style="width: 80px; height: 100px; object-fit: cover; border: 1px solid #ccc; border-radius: 4px;">
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #047857; margin-bottom: 4px;">✓ Foto geladen</div>
                <div style="font-size: 0.85rem; color: #666;">Wird automatisch im Lebenslauf eingefügt</div>
            </div>
        </div>
    `;
}

function setLoadingState(isLoading) {
    elements.generateBtn.disabled = isLoading;
    elements.generateBtn.textContent = isLoading ? 'Generierung läuft...' : 'Dokumente generieren';
}

function showStatus(type, message) {
    elements.cvStatus.className = `status-message ${type}`;
    elements.cvStatus.textContent = message;
    elements.cvStatus.style.display = 'block';
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

function printDocument(html) {
    if (!html) {
        alert('Dokument ist noch nicht generiert.');
        return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
        alert('Pop-up wurde blockiert. Bitte Pop-ups für diese Seite erlauben.');
        return;
    }

    printWindow.document.open();
    printWindow.document.write(sanitizeHtml(html));
    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.addEventListener('load', () => {
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    });
}

function downloadDocument(documentType, html) {
    if (!html) {
        alert('Dokument ist noch nicht generiert.');
        return;
    }

    const safeName = (masterCV?.personalInfo?.name || 'bewerbung')
        .replace(/[^\p{L}\p{N}]+/gu, '_')
        .replace(/^_+|_+$/g, '');
    const blob = new Blob([sanitizeHtml(html)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${documentType}_${safeName}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function clearLastApplication() {
    localStorage.removeItem(STORAGE_KEYS.lastApplication);
    lastApplication = null;
    elements.outputSection.hidden = true;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
