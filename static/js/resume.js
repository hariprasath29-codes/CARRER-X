// ATS Resume Builder Logic (resume.js)
// Simple live preview, ATS scoring, and export utilities

document.addEventListener('DOMContentLoaded', () => {
    // All form input IDs to track
    const inputIds = [
        'inpName', 'inpTagline', 'inpEmail', 'inpPhone', 'inpLocation', 'inpPortfolio',
        'inpLinkedin', 'inpGithub', 'inpSummary', 'inpCollege', 'inpGradYear', 'inpDegree',
        'inpCgpa', 'inpCoursework', 'inpExpTitle', 'inpExpDate', 'inpExpBullets',
        'inpProj1Title', 'inpProj1Date', 'inpProj1Desc',
        'inpProj2Title', 'inpProj2Date', 'inpProj2Desc',
        'inpSkillsLanguages', 'inpSkillsFrameworks', 'inpSkillsTools', 'inpSkillsCore',
        'inpCertifications'
    ];

    // Live update preview on typing
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                updateResumePreview();
                calculateAtsScore();
            });
        }
    });

    // Load saved preferences or defaults
    const savedTemplate = localStorage.getItem('careerx_resume_template') || 'template-ivy';
    const savedFont = localStorage.getItem('careerx_resume_font') || 'font-inter';

    const tSelect = document.getElementById('templateSelect');
    if (tSelect) tSelect.value = savedTemplate;
    changeResumeTemplate(savedTemplate, false);

    const fSelect = document.getElementById('fontSelect');
    if (fSelect) fSelect.value = savedFont;
    changeResumeFont(savedFont, false);

    // Save button event
    const saveBtn = document.getElementById('saveResumeBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveResumeData);

    // Initial render
    updateResumePreview();
    calculateAtsScore();

    // Close modal on click outside
    const modal = document.getElementById('resumeDownloadModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDownloadModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDownloadModal();
    });
});

// Helper to get input value
function getVal(id, fallback = '') {
    const el = document.getElementById(id);
    return el && el.value ? el.value : fallback;
}

// Helper to set text content
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Helper to set input value
function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// Convert multiline text into bullet <li> elements
function renderBullets(targetUlId, rawText) {
    const ul = document.getElementById(targetUlId);
    if (!ul) return;
    if (!rawText || !rawText.trim()) {
        ul.innerHTML = '';
        return;
    }

    const lines = rawText.split('\n')
        .map(line => line.trim().replace(/^[•\-\*]\s*/, '').trim())
        .filter(line => line.length > 0);

    ul.innerHTML = lines.map(line => `<li>${line}</li>`).join('');
}

// Update resume preview sheet
function updateResumePreview() {
    // 1. Header & Contact
    setText('prevName', getVal('inpName', 'Candidate Name'));
    setText('prevTagline', getVal('inpTagline', 'Software Engineer'));

    // Contact bar
    const contactBar = document.getElementById('prevContact');
    if (contactBar) {
        const parts = [];
        const email = getVal('inpEmail');
        const phone = getVal('inpPhone');
        const loc = getVal('inpLocation');
        const linkedin = getVal('inpLinkedin');
        const github = getVal('inpGithub');

        if (email) parts.push(`<a href="mailto:${email}">${email}</a>`);
        if (phone) parts.push(`<span>${phone}</span>`);
        if (loc) parts.push(`<span>${loc}</span>`);
        if (linkedin) parts.push(`<a href="https://${linkedin.replace(/^https?:\/\//, '')}" target="_blank">LinkedIn</a>`);
        if (github) parts.push(`<a href="https://${github.replace(/^https?:\/\//, '')}" target="_blank">GitHub</a>`);

        contactBar.innerHTML = parts.join(' &bull; ');
    }

    // 2. Summary
    const summary = getVal('inpSummary');
    const summarySec = document.getElementById('prevSummarySection');
    if (summarySec) {
        summarySec.style.display = summary ? 'block' : 'none';
        setText('prevSummary', summary);
    }

    // 3. Education
    setText('prevCollege', getVal('inpCollege', 'University'));
    setText('prevGradYear', getVal('inpGradYear', '2026'));
    setText('prevDegree', getVal('inpDegree', 'B.Tech / B.E'));
    setText('prevCgpa', getVal('inpCgpa', '8.5 CGPA'));
    setText('prevCoursework', getVal('inpCoursework', 'Data Structures, Algorithms, DBMS'));

    // 4. Experience
    const expTitle = getVal('inpExpTitle');
    const expSec = document.getElementById('prevExperienceSection');
    if (expSec) {
        expSec.style.display = expTitle ? 'block' : 'none';
        setText('prevExpTitle', expTitle);
        setText('prevExpDate', getVal('inpExpDate', 'Jun 2024 - Aug 2024'));
        renderBullets('prevExpBullets', getVal('inpExpBullets'));
    }

    // 5. Projects
    const p1Title = getVal('inpProj1Title');
    const p2Title = getVal('inpProj2Title');
    const projSec = document.getElementById('prevProjectsSection');
    if (projSec) {
        projSec.style.display = (p1Title || p2Title) ? 'block' : 'none';

        const p1Entry = document.getElementById('prevProj1Entry');
        if (p1Entry) {
            p1Entry.style.display = p1Title ? 'block' : 'none';
            setText('prevProj1Title', p1Title);
            setText('prevProj1Date', getVal('inpProj1Date', '2026'));
            renderBullets('prevProj1Bullets', getVal('inpProj1Desc'));
        }

        const p2Entry = document.getElementById('prevProj2Entry');
        if (p2Entry) {
            p2Entry.style.display = p2Title ? 'block' : 'none';
            setText('prevProj2Title', p2Title);
            setText('prevProj2Date', getVal('inpProj2Date', '2025'));
            renderBullets('prevProj2Bullets', getVal('inpProj2Desc'));
        }
    }

    // 6. Technical Skills
    setText('prevSkillsLanguages', getVal('inpSkillsLanguages'));
    setText('prevSkillsFrameworks', getVal('inpSkillsFrameworks'));
    setText('prevSkillsTools', getVal('inpSkillsTools'));
    setText('prevSkillsCore', getVal('inpSkillsCore'));

    // 7. Certifications
    const certs = getVal('inpCertifications');
    const certSec = document.getElementById('prevCertSection');
    if (certSec) {
        certSec.style.display = certs ? 'block' : 'none';
        renderBullets('prevCertList', certs);
    }
}

// Calculate ATS score based on resume completeness
function calculateAtsScore() {
    let score = 0;

    if (getVal('inpName')) score += 10;
    if (getVal('inpEmail')) score += 10;
    if (getVal('inpPhone')) score += 5;
    if (getVal('inpLinkedin') || getVal('inpGithub')) score += 10;
    if (getVal('inpSummary').length >= 40) score += 15;
    if (getVal('inpCollege') && getVal('inpDegree')) score += 15;
    if (getVal('inpProj1Title') && getVal('inpProj1Desc')) score += 15;
    if (getVal('inpSkillsLanguages') && getVal('inpSkillsTools')) score += 20;

    score = Math.min(100, Math.max(30, score));

    const scoreVal = document.getElementById('atsScoreVal');
    const scoreLabel = document.getElementById('atsScoreLabel');
    if (scoreVal) scoreVal.textContent = `${score}%`;
    if (scoreLabel) {
        scoreLabel.textContent = score >= 85 ? 'Placement Ready' : (score >= 70 ? 'Good Match' : 'Needs More Info');
    }

    // Save ATS score into diagnostic state
    if (window.CareerXStore) {
        window.CareerXStore.updateDiagnostics({ ats: score });
    }
}

// Change resume template style
window.changeResumeTemplate = function(templateClass, save = true) {
    const sheet = document.getElementById('resumePreviewSheet');
    if (!sheet) return;
    sheet.classList.remove('template-ivy', 'template-modern', 'template-minimal');
    sheet.classList.add(templateClass);
    if (save) localStorage.setItem('careerx_resume_template', templateClass);
};

// Change typography font
window.changeResumeFont = function(fontClass, save = true) {
    const sheet = document.getElementById('resumePreviewSheet');
    if (!sheet) return;
    sheet.classList.remove('font-inter', 'font-merriweather', 'font-jakarta');
    sheet.classList.add(fontClass);
    if (save) localStorage.setItem('careerx_resume_font', fontClass);
};

// Color theme setter
window.setResumeColor = function(primaryHex = '#000000', accentHex = '#000000', btn = null) {
    const sheet = document.getElementById('resumePreviewSheet');
    if (sheet) {
        sheet.style.setProperty('--res-primary', primaryHex);
        sheet.style.setProperty('--res-accent', accentHex);
    }
    if (btn) {
        document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
};

// Load prefilled student profile
window.loadHighImpactPreset = function() {
    setInputValue('inpName', 'Rahul Sharma');
    setInputValue('inpTagline', 'AI/ML Engineer | Deep Learning & Distributed Systems');
    setInputValue('inpEmail', 'rahul.sharma@nit.edu');
    setInputValue('inpPhone', '+91 98765 43210');
    setInputValue('inpLocation', 'Bengaluru, India');
    setInputValue('inpPortfolio', 'rahulsharma.dev');
    setInputValue('inpLinkedin', 'linkedin.com/in/rahul-sharma-ai');
    setInputValue('inpGithub', 'github.com/rahul-sharma-dev');

    setInputValue('inpSummary', 'Passionate AI/ML Engineer with strong foundations in deep learning, data structures, and backend systems. Experienced in building full-stack web applications and deploying scalable machine learning models.');

    setInputValue('inpCollege', 'National Institute of Technology, Trichy');
    setInputValue('inpGradYear', 'Expected May 2026');
    setInputValue('inpDegree', 'Bachelor of Technology in Artificial Intelligence & Data Science');
    setInputValue('inpCgpa', '8.9 / 10 CGPA');
    setInputValue('inpCoursework', 'Data Structures, Algorithms, Operating Systems, Machine Learning, Database Management');

    setInputValue('inpExpTitle', 'Software Engineering Intern — CloudScale Technologies');
    setInputValue('inpExpDate', 'Jun 2024 - Aug 2024 | Bengaluru');
    setInputValue('inpExpBullets', '• Developed asynchronous microservices using Python and Redis to handle 50,000+ daily requests.\n• Optimized SQL database queries, reducing response times by 35%.\n• Containerized application services using Docker and automated CI/CD pipeline.');

    setInputValue('inpProj1Title', 'CareerX Placement Intelligence Platform');
    setInputValue('inpProj1Date', '2026 | Demo • GitHub');
    setInputValue('inpProj1Desc', '• Built a comprehensive campus placement portal with ATS resume scanner and practice modules.\n• Created interactive technical assessment challenges and timed aptitude simulator.');

    setInputValue('inpProj2Title', 'Distributed Microservices API');
    setInputValue('inpProj2Date', '2025 | GitHub');
    setInputValue('inpProj2Desc', '• Engineered high-performance backend microservices using Node.js and Redis caching.\n• Implemented secure JWT authentication and role-based access control.');

    setInputValue('inpSkillsLanguages', 'Python, Java, C++, JavaScript, SQL');
    setInputValue('inpSkillsFrameworks', 'FastAPI, PyTorch, React.js, Node.js, Express');
    setInputValue('inpSkillsTools', 'PostgreSQL, Redis, Docker, Git, Linux');
    setInputValue('inpSkillsCore', 'Data Structures, Algorithms, System Design, REST APIs');

    setInputValue('inpCertifications', '• AWS Certified Cloud Practitioner\n• Winner, Smart College Hackathon 2024');

    updateResumePreview();
    calculateAtsScore();

    if (window.showToast) window.showToast('Student preset loaded successfully!', 'success');
};

// Quick AI content suggestions
window.optimizeSummaryWithAI = function() {
    setInputValue('inpSummary', 'Motivated Computer Science undergraduate with hands-on expertise in full-stack web development, machine learning algorithms, and database optimization. Adept at collaborative problem-solving and writing clean, scalable code.');
    updateResumePreview();
    calculateAtsScore();
    if (window.showToast) window.showToast('Summary optimized with action verbs!', 'success');
};

window.optimizeExperienceWithAI = function() {
    setInputValue('inpExpBullets', '• Spearheaded backend feature development using Python and REST APIs, boosting throughput by 40%.\n• Streamlined PostgreSQL schemas and implemented caching, reducing query latency by 50%.\n• Collaborated in an agile team of 6 engineers using Git and weekly sprint cycles.');
    updateResumePreview();
    calculateAtsScore();
    if (window.showToast) window.showToast('Experience bullets enhanced with metrics!', 'success');
};

window.optimizeBullet1WithAI = function() {
    setInputValue('inpProj1Desc', '• Engineered a placement preparation web application supporting 500+ active student users.\n• Implemented automated ATS keyword analysis algorithms and real-time assessment feedback.\n• Designed responsive UI using modern HTML5, CSS3, and JavaScript.');
    updateResumePreview();
    calculateAtsScore();
    if (window.showToast) window.showToast('Project 1 description updated!', 'success');
};

window.optimizeBullet2WithAI = function() {
    setInputValue('inpProj2Desc', '• Designed distributed backend services using Node.js, Docker, and Redis.\n• Achieved 99.9% uptime during simulated stress tests with 10,000+ benchmark requests.');
    updateResumePreview();
    calculateAtsScore();
    if (window.showToast) window.showToast('Project 2 description updated!', 'success');
};

// Save resume to localStorage
function saveResumeData() {
    const data = {
        name: getVal('inpName'),
        tagline: getVal('inpTagline'),
        email: getVal('inpEmail'),
        phone: getVal('inpPhone'),
        location: getVal('inpLocation'),
        summary: getVal('inpSummary'),
        college: getVal('inpCollege'),
        degree: getVal('inpDegree'),
        cgpa: getVal('inpCgpa'),
        expTitle: getVal('inpExpTitle'),
        expBullets: getVal('inpExpBullets'),
        proj1Title: getVal('inpProj1Title'),
        proj1Desc: getVal('inpProj1Desc'),
        skillsLanguages: getVal('inpSkillsLanguages'),
        skillsTools: getVal('inpSkillsTools')
    };

    localStorage.setItem('careerx_resume_data', JSON.stringify(data));

    const saveBtn = document.getElementById('saveResumeBtn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Resume';
        }, 1500);
    }

    if (window.showToast) window.showToast('Resume saved successfully! Choose an export format.', 'success');
    openDownloadModal();
}

// Modal controls
window.openDownloadModal = function() {
    const modal = document.getElementById('resumeDownloadModal');
    if (modal) modal.classList.add('active');
};

window.closeDownloadModal = function() {
    const modal = document.getElementById('resumeDownloadModal');
    if (modal) modal.classList.remove('active');
};

window.dismissSaveBanner = function() {
    const banner = document.getElementById('saveSuccessBanner');
    if (banner) banner.style.display = 'none';
};

// Export PDF (browser print dialog)
window.downloadResumePDF = function() {
    closeDownloadModal();
    const oldTitle = document.title;
    document.title = (getVal('inpName') || 'Candidate') + '_Resume';
    window.print();
    setTimeout(() => { document.title = oldTitle; }, 1000);
};

// Export DOC (Word format)
window.downloadResumeDOC = function() {
    const sheet = document.getElementById('resumePreviewSheet');
    if (!sheet) return;

    const name = getVal('inpName', 'Candidate');
    const content = `<html><head><meta charset="utf-8"><title>${name} Resume</title></head><body>${sheet.innerHTML}</body></html>`;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}_Resume.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) window.showToast('Word document exported!', 'success');
};

// Export JSON
window.downloadResumeJSON = function() {
    const raw = localStorage.getItem('careerx_resume_data') || '{}';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) window.showToast('JSON data exported!', 'success');
};
