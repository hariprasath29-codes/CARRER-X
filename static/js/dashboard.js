// CareerX - Student Dashboard (dashboard.js)
// Displays student metrics, readiness score, aptitude chart, and campus drives

let aptitudeChartInstance = null;
let applicationsChartInstance = null;
let activeDrivePackageFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Populate User Profile & KPIs from Store
    if (window.CareerXStore) {
        const user = window.CareerXStore.getUser();
        const apps = window.CareerXStore.getApplications();
        const skills = window.CareerXStore.getSkills();
        const diag = window.CareerXStore.getDiagnostics();

        const nameEl = document.getElementById('dashUserName');
        const roleEl = document.getElementById('dashTargetRole');
        const collEl = document.getElementById('dashCollege');

        if (nameEl) nameEl.textContent = user.full_name || user.username;
        if (roleEl) roleEl.textContent = user.target_role || 'Software Engineer';
        if (collEl) collEl.textContent = user.college || 'College Campus';

        const appsVal = document.getElementById('kpiAppsVal');
        const skillsVal = document.getElementById('kpiSkillsVal');
        const atsVal = document.getElementById('kpiAtsVal');
        const aptVal = document.getElementById('kpiAptVal');
        const mockVal = document.getElementById('kpiMockVal');

        if (appsVal) appsVal.textContent = apps.length;
        if (skillsVal) skillsVal.textContent = skills.length;
        if (atsVal && diag) atsVal.textContent = diag.ats + '%';
        if (aptVal && diag) aptVal.textContent = diag.aptitude + '%';
        if (mockVal && diag) mockVal.innerHTML = Number(diag.mock).toFixed(1) + '<span style="font-size: 1rem; color: var(--text-muted);">/10</span>';
    }

    // Demo student profile switcher in header
    const headerSwitcher = document.getElementById('headerUserSwitcher');
    if (headerSwitcher && window.CareerXStore) {
        const currentUser = window.CareerXStore.getUser();
        if (currentUser && currentUser.username) {
            headerSwitcher.value = currentUser.username;
        }
        headerSwitcher.addEventListener('change', (e) => {
            const chosenUsername = e.target.value;
            const allUsers = window.CareerXStore.getAllUsers();
            const found = allUsers.find(u => u.username === chosenUsername);
            if (found) {
                window.CareerXStore.setUser(found);
                if (window.showToast) window.showToast(`Switched profile to ${found.full_name}`, 'success');
                setTimeout(() => { window.location.reload(); }, 250);
            }
        });
    }

    // 2. Animate Progress Bars
    const roadmapBar = document.getElementById('dashRoadmapBar');
    if (roadmapBar) {
        roadmapBar.style.width = (roadmapBar.getAttribute('data-progress') || 65) + '%';
    }

    ['diagAptBar', 'diagAtsBar', 'diagMockBar', 'diagCgpaBar'].forEach(id => {
        const bar = document.getElementById(id);
        if (bar && bar.getAttribute('data-progress')) {
            bar.style.width = bar.getAttribute('data-progress') + '%';
        }
    });

    // 3. Render Aptitude Chart
    const aptCanvas = document.getElementById('aptitudeChart');
    if (aptCanvas && typeof Chart !== 'undefined') {
        aptitudeChartInstance = new Chart(aptCanvas, {
            type: 'bar',
            data: {
                labels: ['Quantitative', 'Logical', 'Verbal'],
                datasets: [{
                    label: 'Accuracy %',
                    data: [85, 92, 78],
                    backgroundColor: ['#6366F1', '#818CF8', '#4F46E5'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    }

    // 4. Render Applications Doughnut Chart
    const appCanvas = document.getElementById('applicationsChart');
    if (appCanvas && typeof Chart !== 'undefined') {
        let applied = 1, screening = 2, interview = 1, offer = 1;
        if (window.CareerXStore) {
            const list = window.CareerXStore.getApplications();
            applied = list.filter(a => a.status === 'Applied').length;
            screening = list.filter(a => a.status === 'Screening').length;
            interview = list.filter(a => a.status === 'Interview').length;
            offer = list.filter(a => a.status === 'Offer').length;
        }

        applicationsChartInstance = new Chart(appCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Applied', 'Screening', 'Interview', 'Offer'],
                datasets: [{
                    data: [applied, screening, interview, offer],
                    backgroundColor: ['#6366F1', '#F59E0B', '#06B6D4', '#10B981']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '70%'
            }
        });
    }

    // 5. Render Campus Placement Drives dynamically from Store
    renderDashboardDrives();
});

// Render Campus Drives dynamically from CareerXStore
window.renderDashboardDrives = function() {
    const grid = document.getElementById('drivesGrid');
    if (!grid || !window.CareerXStore) return;

    const drives = window.CareerXStore.getDrives();
    const countBadge = document.getElementById('openDrivesCount');
    if (countBadge) {
        countBadge.textContent = drives.filter(d => (d.status || 'Open') === 'Open').length;
    }

    const query = (document.getElementById('driveSearchInput')?.value || '').toLowerCase().trim();

    const filtered = drives.filter(d => {
        const pkg = parseFloat(d.package_lpa || 0);
        let matchPkg = true;
        if (activeDrivePackageFilter === '10') matchPkg = pkg >= 10;
        if (activeDrivePackageFilter === '20') matchPkg = pkg >= 20;

        const matchQuery = !query || 
            (d.company || '').toLowerCase().includes(query) || 
            (d.role || '').toLowerCase().includes(query) ||
            (d.location || '').toLowerCase().includes(query);

        return matchPkg && matchQuery;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: var(--radius-md); color: var(--text-muted);">
                <i class="fa-solid fa-briefcase" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                <p style="margin: 0; font-size: 0.95rem;">No campus placement drives match the current filter.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(d => {
        const pkg = parseFloat(d.package_lpa || 10);
        const isApplied = window.CareerXStore.isDriveApplied(d.id);
        const borderColor = pkg >= 20 ? '#4F46E5' : (pkg >= 10 ? '#06B6D4' : '#10B981');
        const badgeBg = pkg >= 20 ? 'rgba(79, 70, 229, 0.12)' : (pkg >= 10 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(16, 185, 129, 0.12)');
        const badgeColor = pkg >= 20 ? '#4F46E5' : (pkg >= 10 ? '#0891B2' : '#059669');

        const cleanComp = (d.company || '').replace(/'/g, "\\'");
        const cleanRole = (d.role || '').replace(/'/g, "\\'");
        const cleanLoc = (d.location || 'Campus Selection').replace(/'/g, "\\'");

        return `
            <div class="card drive-card" data-company="${(d.company || '').toLowerCase()}" data-role="${(d.role || '').toLowerCase()}" data-package="${pkg}" style="padding: 1.25rem; border-left: 4px solid ${borderColor};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div>
                        <h4 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${d.company}</h4>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">${d.role}</div>
                    </div>
                    <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 700;">${pkg.toFixed(1)} LPA</span>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.6;">
                    <div><i class="fa-solid fa-location-dot" style="width: 16px;"></i> ${d.location || 'Campus Selection'}</div>
                    ${d.min_cgpa ? `<div><i class="fa-solid fa-graduation-cap" style="width: 16px;"></i> Min Eligibility: <strong>${d.min_cgpa} CGPA</strong></div>` : ''}
                    <div><i class="fa-solid fa-clock" style="width: 16px;"></i> Deadline: <strong>${d.deadline || 'Upcoming'}</strong></div>
                </div>
                ${isApplied ? `
                    <button type="button" class="btn btn-success btn-sm" disabled style="width: 100%;">
                        <i class="fa-solid fa-circle-check"></i> Applied ✓
                    </button>
                ` : `
                    <button type="button" class="btn btn-primary btn-sm apply-drive-btn" data-drive-id="${d.id}" onclick="handleDriveApply(this, '${d.id}', '${cleanComp}', '${cleanRole}', ${pkg}, '${cleanLoc}')" style="width: 100%;">
                        <i class="fa-solid fa-paper-plane"></i> 1-Click Apply
                    </button>
                `}
            </div>
        `;
    }).join('');
};

// Handle Campus Drive 1-Click Application
window.handleDriveApply = function(btn, driveId, company, role, package_lpa, location) {
    if (btn.disabled) return;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    btn.disabled = true;

    if (window.CareerXStore) {
        window.CareerXStore.applyToDrive(driveId, company, role, package_lpa, location);
    }

    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Applied ✓';
        btn.classList.replace('btn-primary', 'btn-success');

        // Update Job Applications count KPI
        const apps = window.CareerXStore ? window.CareerXStore.getApplications() : [];
        const kpiApps = document.getElementById('kpiAppsVal');
        if (kpiApps) kpiApps.textContent = apps.length;

        // Re-render drives so button state updates across the board
        renderDashboardDrives();

        if (window.showToast) {
            window.showToast(`Applied for ${company} (${role})! Added to Job Tracker.`, 'success');
        }
    }, 250);
};

// Toggle Simulator Drawer
window.toggleReadinessSimulator = function() {
    const box = document.getElementById('simulatorBox');
    const textEl = document.getElementById('simBtnText');
    if (!box) return;

    const isOpen = box.style.display === 'block';
    box.style.display = isOpen ? 'none' : 'block';
    if (textEl) textEl.innerText = isOpen ? 'Open Readiness Simulator' : 'Close Simulator';
};

// Calculate Live Readiness Score
window.updateSimulation = function() {
    const cgpa = parseFloat(document.getElementById('simCgpa')?.value || 8.5);
    const apt = parseFloat(document.getElementById('simApt')?.value || 85);
    const ats = parseFloat(document.getElementById('simAts')?.value || 86);
    const mock = parseFloat(document.getElementById('simMock')?.value || 8.4);

    // Update value displays
    if (document.getElementById('simCgpaDisplay')) document.getElementById('simCgpaDisplay').innerText = cgpa.toFixed(1);
    if (document.getElementById('simAptDisplay')) document.getElementById('simAptDisplay').innerText = apt + '%';
    if (document.getElementById('simAtsDisplay')) document.getElementById('simAtsDisplay').innerText = ats + '%';
    if (document.getElementById('simMockDisplay')) document.getElementById('simMockDisplay').innerText = mock.toFixed(1) + '/10';

    // Composite: 20% CGPA, 25% Aptitude, 20% ATS, 20% Mock, 15% Base
    const cgpaNorm = (cgpa / 10) * 100;
    const mockNorm = (mock / 10) * 100;
    const score = Math.round((cgpaNorm * 0.20) + (apt * 0.25) + (ats * 0.20) + (mockNorm * 0.20) + 15);

    // Update gauge dial & text
    const dial = document.getElementById('readinessScoreDial');
    const valText = document.getElementById('readinessScoreVal');
    const badge = document.getElementById('readinessTierBadge');

    if (dial) dial.style.setProperty('--score-pct', score);
    if (valText) valText.innerText = score + '%';

    // Update Diagnostic Progress Bars
    if (document.getElementById('diagAptBar')) document.getElementById('diagAptBar').style.width = apt + '%';
    if (document.getElementById('diagAtsBar')) document.getElementById('diagAtsBar').style.width = ats + '%';
    if (document.getElementById('diagMockBar')) document.getElementById('diagMockBar').style.width = mockNorm + '%';
    if (document.getElementById('diagCgpaBar')) document.getElementById('diagCgpaBar').style.width = cgpaNorm + '%';

    if (document.getElementById('diagAptVal')) document.getElementById('diagAptVal').innerText = apt + '%';
    if (document.getElementById('diagAtsVal')) document.getElementById('diagAtsVal').innerText = ats + '%';
    if (document.getElementById('diagMockVal')) document.getElementById('diagMockVal').innerText = Math.round(mockNorm) + '%';
    if (document.getElementById('diagCgpaVal')) document.getElementById('diagCgpaVal').innerText = Math.round(cgpaNorm) + '%';

    // Tier badge
    if (badge) {
        if (score >= 85) {
            badge.className = 'badge badge-success';
            badge.innerText = 'Tier 1 — Day-1 Ready';
        } else if (score >= 70) {
            badge.className = 'badge badge-primary';
            badge.innerText = 'Tier 2 — Strong Contender';
        } else {
            badge.className = 'badge badge-warning';
            badge.innerText = 'Tier 3 — Moderate Readiness';
        }
    }

    if (window.CareerXStore) {
        window.CareerXStore.updateDiagnostics({ cgpa, aptitude: apt, ats, mock });
    }
};

// Filter Campus Drives
window.setDriveFilter = function(filterVal, btn) {
    activeDrivePackageFilter = filterVal;
    document.querySelectorAll('.drive-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderDashboardDrives();
};

window.filterCampusDrives = function() {
    renderDashboardDrives();
};
