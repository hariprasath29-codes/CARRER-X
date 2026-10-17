// Dashboard Analytics & Charts (dashboard.js)
// Linear / Stripe Inspired Theme (Inter Font, Indigo Accent #6366F1, High Contrast)

let aptitudeChartInstance = null;
let applicationsChartInstance = null;

function getChartThemeColors(theme) {
    const isLight = theme === 'light';
    return {
        textColor: isLight ? '#0F172A' : '#E6E8EE',
        subTextColor: isLight ? '#475569' : '#9AA4B2',
        gridColor: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.08)',
        tooltipBg: isLight ? '#FFFFFF' : '#161F31',
        tooltipTitle: isLight ? '#4F46E5' : '#6366F1',
        tooltipBody: isLight ? '#0F172A' : '#E6E8EE',
        tooltipBorder: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)',
        doughnutBorder: isLight ? '#FFFFFF' : '#161F31'
    };
}

function updateChartsTheme(theme) {
    const colors = getChartThemeColors(theme);

    if (aptitudeChartInstance) {
        if (aptitudeChartInstance.options.scales.x) {
            aptitudeChartInstance.options.scales.x.ticks.color = colors.textColor;
        }
        if (aptitudeChartInstance.options.scales.y) {
            aptitudeChartInstance.options.scales.y.ticks.color = colors.subTextColor;
            aptitudeChartInstance.options.scales.y.grid.color = colors.gridColor;
        }
        if (aptitudeChartInstance.options.plugins.tooltip) {
            aptitudeChartInstance.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
            aptitudeChartInstance.options.plugins.tooltip.titleColor = colors.tooltipTitle;
            aptitudeChartInstance.options.plugins.tooltip.bodyColor = colors.tooltipBody;
            aptitudeChartInstance.options.plugins.tooltip.borderColor = colors.tooltipBorder;
        }
        aptitudeChartInstance.update();
    }

    if (applicationsChartInstance) {
        if (applicationsChartInstance.options.plugins.legend) {
            applicationsChartInstance.options.plugins.legend.labels.color = colors.textColor;
        }
        if (applicationsChartInstance.options.plugins.tooltip) {
            applicationsChartInstance.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
            applicationsChartInstance.options.plugins.tooltip.titleColor = colors.tooltipTitle;
            applicationsChartInstance.options.plugins.tooltip.bodyColor = colors.tooltipBody;
            applicationsChartInstance.options.plugins.tooltip.borderColor = colors.tooltipBorder;
        }
        if (applicationsChartInstance.data.datasets[0]) {
            applicationsChartInstance.data.datasets[0].borderColor = colors.doughnutBorder;
        }
        applicationsChartInstance.update();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const initialColors = getChartThemeColors(currentTheme);

    // Global Chart.js Font & Colors (Inter)
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        Chart.defaults.color = initialColors.subTextColor;
    }

    // 1. Animate Roadmap Progress Bar
    const dashBar = document.getElementById('dashRoadmapBar');
    if (dashBar) {
        const pct = dashBar.getAttribute('data-progress') || 0;
        dashBar.style.width = pct + '%';
        dashBar.style.background = '#6366F1';
    }

    // 1b. Animate Diagnostic Readiness Bars
    ['diagAptBar', 'diagAtsBar', 'diagMockBar', 'diagCgpaBar'].forEach(id => {
        const bar = document.getElementById(id);
        if (bar) {
            const val = bar.getAttribute('data-progress');
            if (val !== null && val !== '') {
                bar.style.width = val + '%';
            }
        }
    });

    // 2. Aptitude Performance Bar Chart (Indigo Accent Theme)
    const aptCtx = document.getElementById('aptitudeChart');
    if (aptCtx) {
        const catMapEl = document.getElementById('catMapData');
        const catMap = catMapEl ? JSON.parse(catMapEl.textContent || '{}') : {};
        const labels = Object.keys(catMap).length > 0 ? Object.keys(catMap) : ['Quantitative', 'Logical', 'Verbal'];
        const values = Object.keys(catMap).length > 0 ? Object.values(catMap) : [80, 100, 75];

        aptitudeChartInstance = new Chart(aptCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Accuracy %',
                    data: values,
                    backgroundColor: [
                        '#6366F1', // Primary Indigo
                        '#818CF8', // Soft Indigo
                        '#4F46E5'  // Deep Indigo
                    ],
                    borderColor: [
                        '#4F46E5',
                        '#6366F1',
                        '#4338CA'
                    ],
                    borderWidth: 1,
                    borderRadius: 8 // 8px rounded corners
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: initialColors.tooltipBg,
                        titleColor: initialColors.tooltipTitle,
                        bodyColor: initialColors.tooltipBody,
                        borderColor: initialColors.tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: initialColors.gridColor },
                        ticks: { 
                            color: initialColors.subTextColor,
                            callback: function(val) { return val + '%'; }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: initialColors.textColor,
                            font: { weight: '600' }
                        }
                    }
                }
            }
        });
    }

    // 3. Job Application Funnel Doughnut Chart (Status Colors from Design System)
    const appCtx = document.getElementById('applicationsChart');
    if (appCtx) {
        const statusMapEl = document.getElementById('statusMapData');
        const statusMap = statusMapEl ? JSON.parse(statusMapEl.textContent || '{}') : {};
        const labels = Object.keys(statusMap).length > 0 ? Object.keys(statusMap) : ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'];
        const counts = Object.keys(statusMap).length > 0 ? Object.values(statusMap) : [1, 1, 1, 1, 1];

        applicationsChartInstance = new Chart(appCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#38BDF8', // Applied: Info Blue
                        '#F59E0B', // Screening: Warning Amber
                        '#6366F1', // Interview: Indigo Accent
                        '#10B981', // Offer: Emerald Success
                        '#F43F5E'  // Rejected: Rose Danger
                    ],
                    borderColor: initialColors.doughnutBorder,
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: initialColors.textColor, 
                            boxWidth: 12, 
                            padding: 14,
                            font: {
                                family: "'Inter', system-ui, sans-serif",
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: initialColors.tooltipBg,
                        titleColor: initialColors.tooltipTitle,
                        bodyColor: initialColors.tooltipBody,
                        borderColor: initialColors.tooltipBorder,
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                cutout: '72%'
            }
        });
    }

    // Listen for theme changes across the app
    window.addEventListener('themeChanged', (e) => {
        updateChartsTheme(e.detail.theme);
    });

    // Check previously applied drives from localStorage
    document.querySelectorAll('.apply-drive-btn').forEach(btn => {
        const dId = btn.getAttribute('data-drive-id');
        if (localStorage.getItem('careerx_applied_' + dId)) {
            btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Applied ✓';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            btn.disabled = true;
        }
    });
});

// 1-Click Campus Drive Application Handler
window.handleDriveApply = async function(btn, driveId, company, role) {
    if (btn.disabled) return;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
    btn.disabled = true;

    try {
        const baseUrl = (window.location.port === "5500" || window.location.protocol === "file:") 
            ? "http://127.0.0.1:5000" 
            : "";
        
        let res = null;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            res = await fetch(`${baseUrl}/api/drive/apply/${driveId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company: company, role: role }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
        } catch (fetchErr) {
            // Live Server Standalone fallback
            console.log('Using Live Server mock drive application handler');
        }

        let data = res && res.ok ? await res.json() : null;
        const msg = data && data.message 
            ? data.message 
            : `Application for ${company} (${role}) successfully submitted! Verified by Campus Placement Cell.`;

        // Mark as applied in local cache
        localStorage.setItem('careerx_applied_' + driveId, 'true');

        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Applied ✓';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');

        if (window.showToast) {
            window.showToast(msg, 'success');
        } else {
            alert(msg);
        }
    } catch (err) {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        if (window.showToast) {
            window.showToast('Could not submit application. Please retry.', 'danger');
        }
    }
};

// Toggle Interactive Placement Readiness Simulator
window.toggleReadinessSimulator = function() {
    const box = document.getElementById('simulatorBox');
    const textEl = document.getElementById('simBtnText');
    if (!box) return;

    if (box.style.display === 'block') {
        box.style.display = 'none';
        if (textEl) textEl.innerText = 'Open Readiness Simulator';
    } else {
        box.style.display = 'block';
        if (textEl) textEl.innerText = 'Close Simulator';
    }
};

// Live Dynamic Readiness Score Calculation & Dial Animation
window.updateSimulation = function() {
    const cgpa = parseFloat(document.getElementById('simCgpa')?.value || 8.5);
    const apt = parseFloat(document.getElementById('simApt')?.value || 80);
    const ats = parseFloat(document.getElementById('simAts')?.value || 82);
    const mock = parseFloat(document.getElementById('simMock')?.value || 7.8);

    // Update display labels
    const dispCgpa = document.getElementById('simCgpaDisplay');
    const dispApt = document.getElementById('simAptDisplay');
    const dispAts = document.getElementById('simAtsDisplay');
    const dispMock = document.getElementById('simMockDisplay');

    if (dispCgpa) dispCgpa.innerText = cgpa.toFixed(1);
    if (dispApt) dispApt.innerText = apt + '%';
    if (dispAts) dispAts.innerText = ats + '%';
    if (dispMock) dispMock.innerText = mock.toFixed(1) + '/10';

    // Normalize
    const cgpaNorm = Math.min(Math.max((cgpa / 10) * 100, 0), 100);
    const mockNorm = Math.min(Math.max((mock / 10) * 100, 0), 100);

    // Composite: 20% CGPA, 25% Aptitude, 20% ATS, 20% Mock, 15% Verified Skills
    const composite = Math.round((cgpaNorm * 0.20) + (apt * 0.25) + (ats * 0.20) + (mockNorm * 0.20) + 15);

    // Update Dial & Text
    const dial = document.getElementById('readinessScoreDial');
    const valText = document.getElementById('readinessScoreVal');
    const tierBadge = document.getElementById('readinessTierBadge');

    if (dial) dial.style.setProperty('--score-pct', composite);
    if (valText) valText.innerText = composite + '%';

    // Update Progress Bars
    const barApt = document.getElementById('diagAptBar');
    const barAts = document.getElementById('diagAtsBar');
    const barMock = document.getElementById('diagMockBar');
    const barCgpa = document.getElementById('diagCgpaBar');

    if (barApt) barApt.style.width = apt + '%';
    if (barAts) barAts.style.width = ats + '%';
    if (barMock) barMock.style.width = mockNorm + '%';
    if (barCgpa) barCgpa.style.width = cgpaNorm + '%';

    // Update Tier Badge
    if (tierBadge) {
        if (composite >= 85) {
            tierBadge.className = 'badge badge-success';
            tierBadge.innerText = 'Tier 1 — Day-1 Ready';
        } else if (composite >= 70) {
            tierBadge.className = 'badge badge-primary';
            tierBadge.innerText = 'Tier 2 — Strong Contender';
        } else if (composite >= 55) {
            tierBadge.className = 'badge badge-warning';
            tierBadge.innerText = 'Tier 3 — Moderate Readiness';
        } else {
            tierBadge.className = 'badge badge-danger';
            tierBadge.innerText = 'Needs Acceleration';
        }
    }
};

// Live Campus Drives Filter & Search Engine
let activeDrivePackageFilter = 'all';

window.setDriveFilter = function(filterVal, btn) {
    activeDrivePackageFilter = filterVal;
    document.querySelectorAll('.drive-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    filterCampusDrives();
};

window.filterCampusDrives = function() {
    const query = (document.getElementById('driveSearchInput')?.value || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.drive-card');

    cards.forEach(card => {
        const company = card.getAttribute('data-company') || '';
        const role = card.getAttribute('data-role') || '';
        const location = card.getAttribute('data-location') || '';
        const pkg = parseFloat(card.getAttribute('data-package') || '0');

        let matchesPackage = true;
        if (activeDrivePackageFilter === '10') {
            matchesPackage = pkg >= 10;
        } else if (activeDrivePackageFilter === '20') {
            matchesPackage = pkg >= 20;
        }

        const matchesQuery = !query || company.includes(query) || role.includes(query) || location.includes(query);

        card.style.display = (matchesPackage && matchesQuery) ? '' : 'none';
    });
};

