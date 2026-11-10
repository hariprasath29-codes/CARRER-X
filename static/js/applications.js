// CareerX - Job Application Tracker (applications.js)
// Tracks student job applications, interviews, and active campus drives

function openAppModal() {
    const modal = document.getElementById('addAppModal');
    if (modal) {
        modal.classList.add('active');
        const dateInp = document.getElementById('modalDate');
        if (dateInp) dateInp.value = new Date().toISOString().split('T')[0];
    }
}

function closeAppModal() {
    const modal = document.getElementById('addAppModal');
    if (modal) modal.classList.remove('active');
}

// Render Available Campus Recruitment Drives published by TPO
function renderCampusDrivesInAppTracker() {
    const grid = document.getElementById('campusDrivesTrackerGrid');
    if (!grid || !window.CareerXStore) return;

    const drives = window.CareerXStore.getDrives();
    const countBadge = document.getElementById('appDrivesCountBadge');
    if (countBadge) {
        const activeCount = drives.filter(d => (d.status || 'Open') === 'Open').length;
        countBadge.textContent = `${activeCount} Active Drives`;
    }

    if (drives.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: #F8FAFC; border: 1px dashed var(--border-color); border-radius: var(--radius-md); color: var(--text-muted);">
                <i class="fa-solid fa-building-circle-check" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                <p style="margin: 0; font-size: 0.95rem;">No active campus drives posted by the placement cell currently.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = drives.map(d => {
        const pkg = parseFloat(d.package_lpa || 10);
        const isApplied = window.CareerXStore.isDriveApplied(d.id);
        const borderColor = pkg >= 20 ? '#4F46E5' : (pkg >= 10 ? '#06B6D4' : '#10B981');
        const badgeBg = pkg >= 20 ? 'rgba(79, 70, 229, 0.12)' : (pkg >= 10 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(16, 185, 129, 0.12)');
        const badgeColor = pkg >= 20 ? '#4F46E5' : (pkg >= 10 ? '#0891B2' : '#059669');

        const cleanComp = (d.company || '').replace(/'/g, "\\'");
        const cleanRole = (d.role || '').replace(/'/g, "\\'");
        const cleanLoc = (d.location || 'Campus Selection').replace(/'/g, "\\'");

        return `
            <div class="card" style="padding: 1.25rem; border-left: 4px solid ${borderColor}; margin-bottom: 0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div>
                        <h4 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${d.company}</h4>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">${d.role}</div>
                    </div>
                    <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 700;">${pkg.toFixed(1)} LPA</span>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.85rem; line-height: 1.6;">
                    <div><i class="fa-solid fa-location-dot" style="width: 16px;"></i> ${d.location || 'Campus Selection'}</div>
                    ${d.min_cgpa ? `<div><i class="fa-solid fa-graduation-cap" style="width: 16px;"></i> Min Eligibility: <strong>${d.min_cgpa} CGPA</strong></div>` : ''}
                    <div><i class="fa-solid fa-clock" style="width: 16px;"></i> Deadline: <strong>${d.deadline || 'Upcoming'}</strong></div>
                </div>
                ${d.description ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.85rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${d.description}</p>` : ''}
                ${isApplied ? `
                    <button type="button" class="btn btn-success btn-sm" disabled style="width: 100%;">
                        <i class="fa-solid fa-circle-check"></i> Applied ✓
                    </button>
                ` : `
                    <button type="button" class="btn btn-primary btn-sm apply-tracker-drive-btn" data-drive-id="${d.id}" onclick="handleTrackerDriveApply(this, '${d.id}', '${cleanComp}', '${cleanRole}', ${pkg}, '${cleanLoc}')" style="width: 100%;">
                        <i class="fa-solid fa-paper-plane"></i> 1-Click Apply
                    </button>
                `}
            </div>
        `;
    }).join('');
}

// 1-Click Apply Handler from Job Tracker
window.handleTrackerDriveApply = function(btn, driveId, company, role, package_lpa, location) {
    if (btn.disabled) return;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    btn.disabled = true;

    if (window.CareerXStore) {
        window.CareerXStore.applyToDrive(driveId, company, role, package_lpa, location);
    }

    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Applied ✓';
        btn.classList.replace('btn-primary', 'btn-success');

        // Refresh applications pipeline table and drives grid
        renderApplicationsTable();
        renderCampusDrivesInAppTracker();

        if (window.showToast) {
            window.showToast(`Applied for ${company} (${role})! Added to your applications pipeline.`, 'success');
        }
    }, 250);
};

function renderApplicationsTable() {
    const tbody = document.querySelector('#appsTable tbody');
    if (!tbody || !window.CareerXStore) return;

    const apps = window.CareerXStore.getApplications();
    const countEl = document.querySelector('.app-filter[data-filter="All"]');
    if (countEl) countEl.textContent = `All (${apps.length})`;

    if (apps.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                    <i class="fa-solid fa-briefcase" style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.4;"></i>
                    <p>No job applications tracked yet. Click "Log New Application" or apply to campus drives!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = apps.map(app => `
        <tr class="app-row" data-status="${app.status}" data-search="${(app.company + ' ' + app.role).toLowerCase()}">
            <td><strong style="color: var(--text-primary); font-size: 1rem;">${app.company}</strong></td>
            <td>${app.role}</td>
            <td style="font-size: 0.84rem;"><i class="fa-solid fa-location-dot" style="color: var(--text-muted); margin-right: 4px;"></i> ${app.location || 'Remote'}</td>
            <td><strong style="color: var(--accent-gold);">${app.salary_lpa} LPA</strong></td>
            <td>${app.apply_date || 'Recent'}</td>
            <td>
                <select data-app-id="${app.id}" class="app-status-select form-control" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; width: auto; font-weight: 600;">
                    <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Screening" ${app.status === 'Screening' ? 'selected' : ''}>Screening</option>
                    <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
                    <option value="Offer" ${app.status === 'Offer' ? 'selected' : ''}>Offer</option>
                    <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </td>
            <td style="font-size: 0.82rem; color: var(--text-muted); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${app.notes || ''}">
                ${app.notes || '—'}
            </td>
            <td>
                <button type="button" data-app-id="${app.id}" class="btn-delete-app" style="background: transparent; border: none; color: #EF4444; cursor: pointer; padding: 4px 8px; border-radius: 4px;" title="Delete Application">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Rebind listeners
    bindTableListeners();
}

function bindTableListeners() {
    // 1. Status Dropdown listeners
    document.querySelectorAll('.app-status-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const appId = sel.getAttribute('data-app-id');
            const newStatus = e.target.value;
            if (appId && window.CareerXStore) {
                window.CareerXStore.updateApplicationStatus(appId, newStatus);
                const row = sel.closest('.app-row');
                if (row) row.setAttribute('data-status', newStatus);
                if (window.showToast) window.showToast(`Application status updated to ${newStatus}`, 'success');
            }
        });
    });

    // 2. Delete button listeners
    document.querySelectorAll('.btn-delete-app').forEach(btn => {
        btn.addEventListener('click', () => {
            const appId = btn.getAttribute('data-app-id');
            if (appId && confirm("Are you sure you want to remove this application record?")) {
                if (window.CareerXStore) {
                    window.CareerXStore.deleteApplication(appId);
                    renderApplicationsTable();
                    if (window.showToast) window.showToast("Application deleted successfully", "info");
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderCampusDrivesInAppTracker();
    renderApplicationsTable();

    // 3. Add application form submission
    const form = document.getElementById('appForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                company: document.getElementById('modalCompany').value,
                role: document.getElementById('modalRole').value,
                location: document.getElementById('modalLocation').value,
                salary_lpa: parseFloat(document.getElementById('modalSalary').value || 0),
                apply_date: document.getElementById('modalDate').value,
                status: document.getElementById('modalStatus').value,
                notes: document.getElementById('modalNotes').value
            };

            if (window.CareerXStore) {
                window.CareerXStore.addApplication(payload);
                renderApplicationsTable();
                closeAppModal();
                form.reset();
                if (window.showToast) window.showToast("New application logged into pipeline!", "success");
            }
        });
    }

    // 4. Status Filter Tabs
    document.querySelectorAll('.app-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.app-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterVal = btn.getAttribute('data-filter');
            const searchVal = document.getElementById('appSearchInput') ? document.getElementById('appSearchInput').value : '';
            filterAppRows(filterVal, searchVal);
        });
    });

    // 5. Search Filter Input
    const searchInp = document.getElementById('appSearchInput');
    if (searchInp) {
        searchInp.addEventListener('input', (e) => {
            const activeFilterBtn = document.querySelector('.app-filter.active');
            const activeFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'All';
            filterAppRows(activeFilter, e.target.value);
        });
    }
});

function filterAppRows(statusFilter, searchTerm) {
    const term = (searchTerm || '').toLowerCase().trim();
    document.querySelectorAll('.app-row').forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        const rowSearch = row.getAttribute('data-search') || '';

        const matchesStatus = (statusFilter === 'All' || rowStatus === statusFilter);
        const matchesSearch = (!term || rowSearch.includes(term));

        row.style.display = (matchesStatus && matchesSearch) ? '' : 'none';
    });
}
