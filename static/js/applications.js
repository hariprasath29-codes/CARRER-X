// Job Application Pipeline Tracker Logic (applications.js)

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

document.addEventListener('DOMContentLoaded', () => {
    // 1. Status Dropdown change listeners using data attributes
    document.querySelectorAll('.app-status-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const appId = sel.getAttribute('data-app-id');
            if (appId) updateAppStatus(appId, e.target.value);
        });
    });

    // 2. Delete button click listeners using data attributes
    document.querySelectorAll('.btn-delete-app').forEach(btn => {
        btn.addEventListener('click', () => {
            const appId = btn.getAttribute('data-app-id');
            if (appId) deleteApplication(appId);
        });
    });

    // 3. Add application form submission
    const form = document.getElementById('appForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
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

            try {
                const res = await fetch('/api/applications/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                }
            } catch (err) {
                console.error("Error adding application:", err);
                window.showToast("Failed to save application.", "danger");
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
    const term = searchTerm.toLowerCase().trim();
    document.querySelectorAll('.app-row').forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        const rowSearch = row.getAttribute('data-search') || '';

        const matchesStatus = (statusFilter === 'All' || rowStatus === statusFilter);
        const matchesSearch = (!term || rowSearch.includes(term));

        row.style.display = (matchesStatus && matchesSearch) ? '' : 'none';
    });
}

async function updateAppStatus(appId, newStatus) {
    try {
        const res = await fetch(`/api/applications/update/${appId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            window.showToast(`Status updated to ${newStatus}!`, "success");
        }
    } catch (err) {
        console.error("Error updating status:", err);
    }
}

async function deleteApplication(appId) {
    if (!confirm("Are you sure you want to remove this job application?")) return;
    try {
        const res = await fetch(`/api/applications/delete/${appId}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            window.location.reload();
        }
    } catch (err) {
        console.error("Error deleting application:", err);
    }
}
