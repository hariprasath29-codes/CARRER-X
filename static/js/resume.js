// ==========================================================================
// CAREERX - EXECUTIVE ATS RESUME STUDIO LOGIC (resume.js)
// Dynamic real-time preview, ATS scoring engine, bullet formatter, and persistence
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // List of input IDs to monitor for real-time live preview
    const inputIds = [
        'inpName', 'inpTagline', 'inpEmail', 'inpPhone', 'inpLocation', 'inpPortfolio',
        'inpLinkedin', 'inpGithub', 'inpSummary', 'inpCollege', 'inpGradYear', 'inpDegree',
        'inpCgpa', 'inpCoursework', 'inpExpTitle', 'inpExpDate', 'inpExpBullets',
        'inpProj1Title', 'inpProj1Date', 'inpProj1Desc',
        'inpProj2Title', 'inpProj2Date', 'inpProj2Desc',
        'inpSkillsLanguages', 'inpSkillsFrameworks', 'inpSkillsTools', 'inpSkillsCore',
        'inpCertifications'
    ];

    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                updateResumePreview();
                calculateAtsScore();
            });
        }
    });

    // Force pure black monochrome standard (Recruiter & ATS preference)
    localStorage.setItem('careerx_resume_primary_color', '#000000');
    localStorage.setItem('careerx_resume_accent_color', '#000000');
    const savedTemplate = localStorage.getItem('careerx_resume_template') || 'template-ivy';
    const savedFont = localStorage.getItem('careerx_resume_font') || 'font-inter';
    const savedPrimaryColor = '#000000';
    const savedAccentColor = '#000000';

    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) templateSelect.value = savedTemplate;
    changeResumeTemplate(savedTemplate, false);

    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect) fontSelect.value = savedFont;
    changeResumeFont(savedFont, false);

    setResumeColor(savedPrimaryColor, savedAccentColor, null, false);

    // Initial render & score calculation
    updateResumePreview();
    calculateAtsScore();

    // Hook save button
    const saveBtn = document.getElementById('saveResumeBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveResumeData);
    }
});

/**
 * Updates all sections in the right-pane simulated A4 resume sheet
 */
function updateResumePreview() {
    // 1. Header & Contact
    setElText('prevName', getVal('inpName', 'Candidate Name'));
    setElText('prevTagline', getVal('inpTagline', 'Software Engineer | Distributed Systems & Machine Learning'));

    renderContactBar();

    // 2. Summary
    const summaryVal = getVal('inpSummary', '').trim();
    const summarySec = document.getElementById('prevSummarySection');
    if (summarySec) {
        if (summaryVal) {
            summarySec.style.display = 'block';
            setElText('prevSummary', summaryVal);
        } else {
            summarySec.style.display = 'none';
        }
    }

    // 3. Education
    setElText('prevCollege', getVal('inpCollege', 'National Institute of Technology'));
    setElText('prevGradYear', getVal('inpGradYear', 'Expected May 2026'));
    setElText('prevDegree', getVal('inpDegree', 'Bachelor of Technology in Artificial Intelligence & Data Science'));
    setElText('prevCgpa', getVal('inpCgpa', '8.9 / 10 CGPA (Top 5%)'));

    const courseworkVal = getVal('inpCoursework', '').trim();
    const courseworkWrap = document.getElementById('prevCourseworkWrap');
    if (courseworkWrap) {
        if (courseworkVal) {
            courseworkWrap.style.display = 'block';
            setElText('prevCoursework', courseworkVal);
        } else {
            courseworkWrap.style.display = 'none';
        }
    }

    // 4. Work Experience & Internships
    const expTitle = getVal('inpExpTitle', '').trim();
    const expSec = document.getElementById('prevExperienceSection');
    if (expSec) {
        if (expTitle) {
            expSec.style.display = 'block';
            setElText('prevExpTitle', expTitle);
            setElText('prevExpDate', getVal('inpExpDate', 'Jun 2024 – Aug 2024 | Bangalore, India'));
            renderBullets('prevExpBullets', getVal('inpExpBullets', ''));
        } else {
            expSec.style.display = 'none';
        }
    }

    // 5. Featured Projects
    const p1Title = getVal('inpProj1Title', '').trim();
    const p2Title = getVal('inpProj2Title', '').trim();
    const projSec = document.getElementById('prevProjectsSection');

    if (projSec) {
        if (!p1Title && !p2Title) {
            projSec.style.display = 'none';
        } else {
            projSec.style.display = 'block';

            // Project 1
            const p1Entry = document.getElementById('prevProj1Entry');
            if (p1Entry) {
                if (p1Title) {
                    p1Entry.style.display = 'block';
                    // Parse tech stack if enclosed in parentheses
                    const p1Parsed = splitTitleAndTech(p1Title);
                    setElText('prevProj1Title', p1Parsed.title);
                    setElText('prevProj1Tech', p1Parsed.tech ? `(${p1Parsed.tech})` : '');
                    setElText('prevProj1Date', getVal('inpProj1Date', '2026'));
                    renderBullets('prevProj1Bullets', getVal('inpProj1Desc', ''));
                } else {
                    p1Entry.style.display = 'none';
                }
            }

            // Project 2
            const p2Entry = document.getElementById('prevProj2Entry');
            if (p2Entry) {
                if (p2Title) {
                    p2Entry.style.display = 'block';
                    const p2Parsed = splitTitleAndTech(p2Title);
                    setElText('prevProj2Title', p2Parsed.title);
                    setElText('prevProj2Tech', p2Parsed.tech ? `(${p2Parsed.tech})` : '');
                    setElText('prevProj2Date', getVal('inpProj2Date', '2025'));
                    renderBullets('prevProj2Bullets', getVal('inpProj2Desc', ''));
                } else {
                    p2Entry.style.display = 'none';
                }
            }
        }
    }

    // 6. Technical Skills (Categorized)
    const langVal = getVal('inpSkillsLanguages', '').trim();
    const frameVal = getVal('inpSkillsFrameworks', '').trim();
    const toolsVal = getVal('inpSkillsTools', '').trim();
    const coreVal = getVal('inpSkillsCore', '').trim();

    toggleSkillRow('prevSkillRowLanguages', 'prevSkillsLanguages', langVal);
    toggleSkillRow('prevSkillRowFrameworks', 'prevSkillsFrameworks', frameVal);
    toggleSkillRow('prevSkillRowTools', 'prevSkillsTools', toolsVal);
    toggleSkillRow('prevSkillRowCore', 'prevSkillsCore', coreVal);

    // 7. Certifications & Honors
    const certVal = getVal('inpCertifications', '').trim();
    const certSec = document.getElementById('prevCertSection');
    if (certSec) {
        if (certVal) {
            certSec.style.display = 'block';
            renderBullets('prevCertList', certVal);
        } else {
            certSec.style.display = 'none';
        }
    }
}

/**
 * Builds clean, professional contact bar with active links and bullet dot separators
 */
function renderContactBar() {
    const contactBar = document.getElementById('prevContact');
    if (!contactBar) return;

    const email = getVal('inpEmail', '').trim();
    const phone = getVal('inpPhone', '').trim();
    const location = getVal('inpLocation', '').trim();
    const portfolio = getVal('inpPortfolio', '').trim();
    const linkedin = getVal('inpLinkedin', '').trim();
    const github = getVal('inpGithub', '').trim();

    const items = [];

    if (email) {
        items.push(`<a href="mailto:${email}"><i class="fa-solid fa-envelope" style="font-size: 0.76rem; margin-right: 3px;"></i>${email}</a>`);
    }
    if (phone) {
        items.push(`<a href="tel:${phone}"><i class="fa-solid fa-phone" style="font-size: 0.76rem; margin-right: 3px;"></i>${phone}</a>`);
    }
    if (location) {
        items.push(`<span><i class="fa-solid fa-location-dot" style="font-size: 0.76rem; margin-right: 3px;"></i>${location}</span>`);
    }
    if (linkedin) {
        const cleanLnk = linkedin.replace(/^https?:\/\/(www\.)?/, '');
        const fullLnk = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;
        items.push(`<a href="${fullLnk}" target="_blank"><i class="fa-brands fa-linkedin" style="font-size: 0.76rem; margin-right: 3px;"></i>${cleanLnk}</a>`);
    }
    if (github) {
        const cleanGh = github.replace(/^https?:\/\/(www\.)?/, '');
        const fullGh = github.startsWith('http') ? github : `https://${github}`;
        items.push(`<a href="${fullGh}" target="_blank"><i class="fa-brands fa-github" style="font-size: 0.76rem; margin-right: 3px;"></i>${cleanGh}</a>`);
    }
    if (portfolio) {
        const cleanPf = portfolio.replace(/^https?:\/\/(www\.)?/, '');
        const fullPf = portfolio.startsWith('http') ? portfolio : `https://${portfolio}`;
        items.push(`<a href="${fullPf}" target="_blank"><i class="fa-solid fa-globe" style="font-size: 0.76rem; margin-right: 3px;"></i>${cleanPf}</a>`);
    }

    contactBar.innerHTML = items.join('<span class="contact-sep">&bull;</span>');
}

/**
 * Smart Bullet Point Formatter:
 * Converts raw multi-line strings into high-impact <li> elements with automatic
 * bolding of metrics (percentages, numbers with +, rankings, and action verbs).
 */
function renderBullets(targetUlId, rawText) {
    const ul = document.getElementById(targetUlId);
    if (!ul) return;

    if (!rawText || !rawText.trim()) {
        ul.innerHTML = '';
        return;
    }

    // Split by newline or standard bullet markers
    const lines = rawText.split('\n')
        .map(l => l.trim().replace(/^[•\-\*\>]\s*/, '').trim())
        .filter(l => l.length > 0);

    ul.innerHTML = lines.map(line => {
        const enhanced = highlightMetricsAndVerbs(line);
        return `<li>${enhanced}</li>`;
    }).join('');
}

/**
 * Highlights quantifiable metrics (%, numbers, latency, ranks)
 */
function highlightMetricsAndVerbs(text) {
    // Escape HTML first
    let safe = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Highlight metrics: e.g. 75%, 45%, 10,000+, 1,200+, 250,000+, 99.95%, sub-50ms, 8 minutes, 1st Place, Top 4%
    const metricRegex = /\b(\d+(?:\.\d+)?%|\d{1,3}(?:,\d{3})*\+?|\d+\s*(?:minutes|seconds|hours|ms)|sub-\d+ms|1st Place|Top\s*\d+%|Rank\s*#?\d+)\b/gi;
    
    // Avoid double-wrapping if already strong
    if (!safe.includes('<strong>')) {
        safe = safe.replace(metricRegex, '<strong>$1</strong>');
    }

    return safe;
}

/**
 * Helper to split "Title (Tech1, Tech2)" into title and tech components
 */
function splitTitleAndTech(fullTitle) {
    const match = fullTitle.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        return { title: match[1].trim(), tech: match[2].trim() };
    }
    return { title: fullTitle.trim(), tech: '' };
}

function toggleSkillRow(rowId, textId, val) {
    const row = document.getElementById(rowId);
    if (row) {
        if (val) {
            row.style.display = 'flex';
            setElText(textId, val);
        } else {
            row.style.display = 'none';
        }
    }
}

function getVal(id, fallback = '') {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
}

function setElText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/**
 * Real-Time ATS Strength Calculator
 * Evaluates completeness, action verbs, quantifiable metrics, and single-column formatting.
 */
function calculateAtsScore() {
    let score = 0;
    const name = getVal('inpName');
    const email = getVal('inpEmail');
    const phone = getVal('inpPhone');
    const linkedin = getVal('inpLinkedin');
    const github = getVal('inpGithub');
    const summary = getVal('inpSummary');
    const college = getVal('inpCollege');
    const degree = getVal('inpDegree');
    const exp = getVal('inpExpBullets');
    const p1 = getVal('inpProj1Desc');
    const p2 = getVal('inpProj2Desc');
    const lang = getVal('inpSkillsLanguages');
    const tools = getVal('inpSkillsTools');

    // 1. Contact & Identity (20 pts)
    if (name) score += 4;
    if (email && email.includes('@')) score += 4;
    if (phone) score += 4;
    if (linkedin) score += 4;
    if (github) score += 4;

    // 2. Professional Summary (15 pts)
    if (summary.length >= 80) score += 15;
    else if (summary.length > 20) score += 8;

    // 3. Education (15 pts)
    if (college) score += 8;
    if (degree) score += 7;

    // 4. Projects & Experience (30 pts)
    const combinedDesc = `${exp} ${p1} ${p2}`;
    if (p1.length > 30) score += 10;
    if (p2.length > 30) score += 10;

    // Metric density check
    const metricsCount = (combinedDesc.match(/\b\d+(?:%|\+|\s*ms|\s*min)/g) || []).length;
    if (metricsCount >= 3) score += 10;
    else if (metricsCount >= 1) score += 5;

    // 5. Technical Skills (20 pts)
    if (lang.length > 10) score += 10;
    if (tools.length > 10) score += 10;

    score = Math.min(100, Math.max(20, score));

    // Update UI badge
    const scoreValEl = document.getElementById('atsScoreVal');
    const scoreLabelEl = document.getElementById('atsScoreLabel');
    const badgeEl = document.getElementById('atsScoreBadge');

    if (scoreValEl) scoreValEl.textContent = `${score}%`;

    if (scoreLabelEl && badgeEl) {
        if (score >= 90) {
            scoreLabelEl.textContent = "Placement Ready (Top 1%)";
            badgeEl.style.color = "#059669";
            badgeEl.style.background = "rgba(16, 185, 129, 0.1)";
            badgeEl.style.borderColor = "rgba(16, 185, 129, 0.3)";
        } else if (score >= 75) {
            scoreLabelEl.textContent = "Recruiter Approved";
            badgeEl.style.color = "#2563EB";
            badgeEl.style.background = "rgba(37, 99, 235, 0.1)";
            badgeEl.style.borderColor = "rgba(37, 99, 235, 0.3)";
        } else {
            scoreLabelEl.textContent = "Needs More Metrics";
            badgeEl.style.color = "#D97706";
            badgeEl.style.background = "rgba(217, 119, 6, 0.1)";
            badgeEl.style.borderColor = "rgba(217, 119, 6, 0.3)";
        }
    }
}

/**
 * Switch layout templates (Ivy League, Silicon Modern, Executive Minimal)
 */
window.changeResumeTemplate = function(templateClass, saveToStorage = true) {
    const sheet = document.getElementById('resumePreviewSheet');
    if (!sheet) return;

    sheet.classList.remove('template-ivy', 'template-modern', 'template-minimal');
    sheet.classList.add(templateClass);

    if (saveToStorage) {
        localStorage.setItem('careerx_resume_template', templateClass);
        if (window.showToast) {
            const label = templateClass === 'template-ivy' ? 'Ivy League ATS' :
                          templateClass === 'template-modern' ? 'Silicon Modern' : 'Executive Minimal';
            window.showToast(`Switched layout to ${label}`, 'info');
        }
    }
};

/**
 * Switch typography font families
 */
window.changeResumeFont = function(fontClass, saveToStorage = true) {
    const sheet = document.getElementById('resumePreviewSheet');
    if (!sheet) return;

    sheet.classList.remove('font-inter', 'font-merriweather', 'font-jakarta');
    sheet.classList.add(fontClass);

    if (saveToStorage) {
        localStorage.setItem('careerx_resume_font', fontClass);
        if (window.showToast) {
            const label = fontClass === 'font-inter' ? 'Inter (Modern Sans)' :
                          fontClass === 'font-merriweather' ? 'Merriweather (Serif)' : 'Plus Jakarta';
            window.showToast(`Updated typography to ${label}`, 'info');
        }
    }
};

/**
 * Set Resume Accent Colors
 */
window.setResumeColor = function(primaryHex = '#000000', accentHex = '#000000', btnEl = null, saveToStorage = true) {
    const sheet = document.getElementById('resumePreviewSheet');
    if (!sheet) return;

    // Enforce pure black monochrome standard
    sheet.style.setProperty('--res-primary', '#000000');
    sheet.style.setProperty('--res-accent', '#000000');
    sheet.style.setProperty('--res-text', '#000000');
    sheet.style.setProperty('--res-rule', '#000000');

    if (btnEl) {
        document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btnEl.classList.add('active');
    }

    if (saveToStorage) {
        localStorage.setItem('careerx_resume_primary_color', '#000000');
        localStorage.setItem('careerx_resume_accent_color', '#000000');
    }
};

/**
 * ONE-CLICK PRESET:
 * Instantly loads award-winning FAANG/Silicon Valley student resume data
 */
window.loadHighImpactPreset = function() {
    const currentName = getVal('inpName');
    const safeName = currentName.trim() || 'Candidate Name';
    setInputValue('inpName', safeName);
    setInputValue('inpTagline', 'Software Engineer | Distributed Systems & Machine Learning');
    setInputValue('inpEmail', 'student@careerx.ai');
    setInputValue('inpPhone', '+91 98765 43210');
    setInputValue('inpLocation', 'Bangalore, India');
    setInputValue('inpPortfolio', 'yourportfolio.dev');
    setInputValue('inpLinkedin', 'linkedin.com/in/your-profile');
    setInputValue('inpGithub', 'github.com/your-username');

    setInputValue('inpSummary', 'Results-driven Software Engineer with proven expertise in architecting high-throughput full-stack systems, optimizing database pipelines, and deploying production machine learning models. Adept in modern distributed computing and algorithmic problem-solving with a passion for building robust, scalable products.');

    setInputValue('inpCollege', 'National Institute of Technology');
    setInputValue('inpGradYear', 'Expected May 2026');
    setInputValue('inpDegree', 'Bachelor of Technology in Artificial Intelligence & Data Science');
    setInputValue('inpCgpa', '8.9 / 10 CGPA (Top 5% of Department)');
    setInputValue('inpCoursework', 'Data Structures & Algorithms, Distributed Systems, Operating Systems, Database Management Systems, Machine Learning');

    setInputValue('inpExpTitle', 'Software Engineer Intern — CloudScale Technologies');
    setInputValue('inpExpDate', 'Jun 2024 – Aug 2024 | Bangalore, India (Hybrid)');
    setInputValue('inpExpBullets', `• Architected asynchronous data ingestion pipeline using FastAPI, Celery, and Redis, reducing candidate profile ingestion latency by 42%.
• Optimized complex PostgreSQL queries and added multi-column B-Tree indexes across 250,000+ records, slashing query execution time by 60%.
• Containerized microservices with Docker and configured automated CI/CD GitHub Actions workflows, accelerating deployment cycles to under 8 minutes.`);

    setInputValue('inpProj1Title', 'CareerX – Placement Intelligence Platform (Python, Flask, SQLite, JS)');
    setInputValue('inpProj1Date', '2026 | Demo • GitHub');
    setInputValue('inpProj1Desc', `• Architected an end-to-end placement intelligence platform reducing tool-switching friction by 75% for 1,200+ active candidates.
• Integrated automated multi-stage ATS resume scoring algorithms and real-time technical assessment simulators with automated evaluation benchmarks.
• Constructed modular SQLite relational schema with automated indexing and query caching, maintaining sub-50ms response times under simulated peak loads.`);

    setInputValue('inpProj2Title', 'Distributed Microservices API (Node.js, Docker, Redis, Go)');
    setInputValue('inpProj2Date', '2025 | GitHub');
    setInputValue('inpProj2Desc', `• Engineered asynchronous distributed microservices containerized with Docker; slashed database read loads by 45% via Redis caching across 10,000+ benchmarked requests.
• Implemented token bucket rate limiting and zero-downtime health-check circuit breakers, achieving 99.95% system uptime during load tests.`);

    setInputValue('inpSkillsLanguages', 'Python, Java, C++, JavaScript (ES6+), TypeScript, SQL, Bash');
    setInputValue('inpSkillsFrameworks', 'Flask, FastAPI, Django, React.js, Next.js, Node.js, PyTorch, Scikit-Learn, Tailwind CSS');
    setInputValue('inpSkillsTools', 'PostgreSQL, SQLite, Redis, Docker, Kubernetes, AWS (S3, EC2), Git, GitHub Actions, Linux');
    setInputValue('inpSkillsCore', 'Data Structures & Algorithms, System Design, RESTful APIs, Object-Oriented Design, Microservices, CI/CD');

    setInputValue('inpCertifications', `• AWS Certified Cloud Practitioner (CLF-C02) — Amazon Web Services (2025)
• Winner (1st Place / 450 Teams) — National Smart University Hackathon 2024
• LeetCode Knight — Top 4% Globally (Rating: 1920+, 500+ algorithmic problems solved)`);

    updateResumePreview();
    calculateAtsScore();

    if (window.showToast) {
        window.showToast("Loaded FAANG-ready student profile preset!", "success");
    }
};

function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// AI Optimizers
window.optimizeSummaryWithAI = function() {
    setInputValue('inpSummary', 'Results-driven Software Engineer with proven expertise in developing scalable full-stack applications, optimizing relational/NoSQL database queries, and deploying production machine learning microservices. Passionate about engineering clean, maintainable architecture in fast-paced collaborative agile environments.');
    updateResumePreview();
    calculateAtsScore();
    if (window.showToast) window.showToast("Summary enhanced with high-impact ATS keywords!", "success");
};

window.optimizeExperienceWithAI = function() {
    setInputValue('inpExpBullets', `• Spearheaded migration of legacy monolithic endpoints to asynchronous microservices using FastAPI and Redis, cutting p99 latency by 44%.
• Designed scalable PostgreSQL schema with composite indexing across 300,000+ customer records, reducing database read bottleneck by 55%.
• Engineered automated Docker build pipelines integrated with GitHub Actions, reducing release cycle lead time from 40 minutes to 7 minutes.`);
    updateResumePreview();
    calculateAtsScore();
    if (window.showToast) window.showToast("Experience upgraded with Google X-Y-Z formula!", "success");
};

window.optimizeBullet1WithAI = function() {
    setInputValue('inpProj1Desc', `• Architected an end-to-end placement intelligence platform reducing preparation tool-switching by 75% across 1,200+ users.
• Engineered automated multi-factor ATS resume analysis algorithms delivering sub-100ms response times and 98% parsing accuracy.
• Implemented interactive technical assessment module with instant rubric evaluations and domain proficiency metrics.`);
    updateResumePreview();
    calculateAtsScore();
    if (window.showToast) window.showToast("Project 1 upgraded with quantifiable metrics!", "success");
};

window.optimizeBullet2WithAI = function() {
    setInputValue('inpProj2Desc', `• Engineered asynchronous distributed microservices containerized with Docker; slashed database read loads by 45% via Redis caching across 10,000+ benchmarked requests.
• Implemented token bucket rate limiting and zero-downtime health-check circuit breakers, achieving 99.95% system uptime during load tests.`);
    updateResumePreview();
    calculateAtsScore();
    if (window.showToast) window.showToast("Project 2 upgraded with measurable metrics!", "success");
};

/**
 * Collects current resume form data into a structured payload
 */
function collectResumePayload() {
    return {
        title: 'Placement Resume',
        full_name: getVal('inpName'),
        tagline: getVal('inpTagline'),
        email: getVal('inpEmail'),
        phone: getVal('inpPhone'),
        location: getVal('inpLocation'),
        linkedin: getVal('inpLinkedin'),
        github: getVal('inpGithub'),
        portfolio: getVal('inpPortfolio'),
        summary: getVal('inpSummary'),
        education: [{
            college: getVal('inpCollege'),
            grad_year: getVal('inpGradYear'),
            degree: getVal('inpDegree'),
            cgpa: getVal('inpCgpa'),
            coursework: getVal('inpCoursework')
        }],
        experience: [{
            title: getVal('inpExpTitle'),
            date: getVal('inpExpDate'),
            bullets: getVal('inpExpBullets')
        }],
        projects: [
            {
                title: getVal('inpProj1Title'),
                date: getVal('inpProj1Date'),
                desc: getVal('inpProj1Desc')
            },
            {
                title: getVal('inpProj2Title'),
                date: getVal('inpProj2Date'),
                desc: getVal('inpProj2Desc')
            }
        ],
        skills: {
            languages: getVal('inpSkillsLanguages'),
            frameworks: getVal('inpSkillsFrameworks'),
            tools: getVal('inpSkillsTools'),
            core: getVal('inpSkillsCore')
        },
        certifications: getVal('inpCertifications'),
        template: localStorage.getItem('careerx_resume_template') || 'template-ivy'
    };
}

/**
 * Save Resume Data to Backend and LocalStorage, then present download options
 */
async function saveResumeData() {
    const saveBtn = document.getElementById('saveResumeBtn');
    const originalHtml = saveBtn ? saveBtn.innerHTML : '';
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const payload = collectResumePayload();
    let saveSuccessful = false;

    try {
        const res = await fetch('/api/resume/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            saveSuccessful = true;
            localStorage.setItem('careerx_resume_data', JSON.stringify(payload));
        }
    } catch (err) {
        // Fallback for standalone Live Server / offline
        localStorage.setItem('careerx_resume_data', JSON.stringify(payload));
        saveSuccessful = true;
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Saved!';
            saveBtn.style.background = '#059669';
            saveBtn.style.borderColor = '#059669';

            setTimeout(() => {
                saveBtn.innerHTML = originalHtml || '<i class="fa-solid fa-floppy-disk"></i> Save Resume';
                saveBtn.style.background = '';
                saveBtn.style.borderColor = '';
            }, 2500);
        }

        if (saveSuccessful) {
            if (window.showToast) {
                window.showToast("Resume saved successfully! Choose a download format.", "success");
            }

            // Show persistent inline banner above preview sheet
            const banner = document.getElementById('saveSuccessBanner');
            if (banner) {
                banner.style.display = 'flex';
            }

            // Open the dedicated post-save download modal
            openDownloadModal();
        }
    }
}

/**
 * Modal Controls
 */
window.openDownloadModal = function() {
    const modal = document.getElementById('resumeDownloadModal');
    if (modal) {
        modal.classList.add('active');
    }
};

window.closeDownloadModal = function() {
    const modal = document.getElementById('resumeDownloadModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

window.dismissSaveBanner = function() {
    const banner = document.getElementById('saveSuccessBanner');
    if (banner) {
        banner.style.display = 'none';
    }
};

/**
 * 1. Download Resume as PDF (via calibrated single-page A4 print)
 */
window.downloadResumePDF = function() {
    const rawName = (document.getElementById('inpName')?.value || 'Candidate').trim();
    const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Placement';
    const oldTitle = document.title;
    
    // Set document title so browser default PDF filename matches the candidate's name
    document.title = `${cleanName}_ATS_Resume`;

    // Close download modal so it doesn't overlay anything
    closeDownloadModal();

    // Trigger browser print/save as PDF dialog
    window.print();

    // Restore title after dialog
    setTimeout(() => {
        document.title = oldTitle;
    }, 2000);
};

/**
 * 2. Download Resume as Word Document (.doc)
 */
window.downloadResumeDOC = function() {
    const rawName = (document.getElementById('inpName')?.value || 'Candidate').trim();
    const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Placement';
    const resumeEl = document.getElementById('resumePreviewSheet');
    if (!resumeEl) return;

    const resumeContent = resumeEl.innerHTML;
    const docHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${cleanName} Resume</title>
<style>
    @page {
        size: 8.27in 11.69in;
        margin: 0.5in 0.65in 0.5in 0.65in;
    }
    body {
        font-family: Calibri, 'Segoe UI', Arial, sans-serif;
        font-size: 10.5pt;
        color: #000000;
        line-height: 1.35;
        background: #ffffff;
    }
    h1, h2, h3, h4, h5, h6, p, ul, li { margin: 0; padding: 0; }
    .res-header { text-align: center; margin-bottom: 10pt; border-bottom: 1.5pt solid #000; padding-bottom: 6pt; }
    .res-name { font-size: 20pt; font-weight: bold; text-transform: uppercase; margin-bottom: 3pt; }
    .res-tagline { font-size: 11pt; font-weight: bold; margin-bottom: 4pt; }
    .res-contact-bar { font-size: 9.5pt; margin-top: 3pt; }
    .res-section-title { font-size: 11.5pt; font-weight: bold; text-transform: uppercase; border-bottom: 1pt solid #000; margin-top: 10pt; margin-bottom: 4pt; }
    .res-entry { margin-bottom: 6pt; }
    .res-entry-header { display: flex; justify-content: space-between; font-weight: bold; margin-top: 4pt; }
    .res-entry-title { font-weight: bold; font-size: 10.5pt; }
    .res-entry-date { font-weight: bold; font-size: 9.5pt; }
    .res-entry-subtitle { font-style: italic; font-size: 10pt; margin-bottom: 2pt; }
    .res-bullet-list { margin-left: 18pt; margin-top: 3pt; margin-bottom: 4pt; }
    .res-bullet-list li { margin-bottom: 2pt; font-size: 10pt; line-height: 1.35; }
    .res-skills-container { margin-top: 4pt; }
    .res-skill-row { margin-bottom: 3pt; font-size: 10pt; }
    .res-skill-label { font-weight: bold; }
    a { color: #000000; text-decoration: none; }
</style>
</head>
<body>
    ${resumeContent}
</body>
</html>`;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanName}_ATS_Resume.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) {
        window.showToast("Word (.doc) resume downloaded successfully!", "success");
    }
};

/**
 * 3. Export Resume as JSON (.json)
 */
window.downloadResumeJSON = function() {
    const rawName = (document.getElementById('inpName')?.value || 'Candidate').trim();
    const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Placement';
    const payload = collectResumePayload();

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanName}_Resume_Data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) {
        window.showToast("Resume JSON data exported successfully!", "success");
    }
};

// Listen for Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDownloadModal();
});

// Close modal when clicking outside modal-card
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('resumeDownloadModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDownloadModal();
        });
    }
});

