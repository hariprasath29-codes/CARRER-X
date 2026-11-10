// CareerX - Career Roadmap (roadmap.js)
// Interactive skill milestones and learning roadmaps per career track

let roadmapTemplates = {};
let activeRole = "AI/ML Engineer";
let userCompletedSteps = [];

document.addEventListener('DOMContentLoaded', () => {
    if (window.CareerXStore) {
        roadmapTemplates = window.CareerXStore.getRoadmaps();
        const user = window.CareerXStore.getUser();
        if (user && user.target_role) {
            activeRole = user.target_role;
        }
        userCompletedSteps = window.CareerXStore.getCompletedSteps(activeRole);
    }

    const roleSelector = document.getElementById('roleSelector');
    if (roleSelector) {
        roleSelector.value = activeRole;
        roleSelector.addEventListener('change', (e) => {
            activeRole = e.target.value;
            const badge = document.getElementById('trackBadge');
            if (badge) badge.textContent = activeRole + " Track";
            if (window.CareerXStore) {
                userCompletedSteps = window.CareerXStore.getCompletedSteps(activeRole);
            }
            renderRoadmapSteps();
        });
    }

    const trackBadge = document.getElementById('trackBadge');
    if (trackBadge) trackBadge.textContent = activeRole + " Track";

    renderRoadmapSteps();

    const saveBtn = document.getElementById('saveRoadmapBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveRoadmapProgress);
    }
});

function renderRoadmapSteps() {
    const steps = roadmapTemplates[activeRole] || roadmapTemplates['Software Engineer'] || [];
    const container = document.getElementById('milestonesList');
    if (!container) return;

    container.innerHTML = '';

    if (steps.length === 0) {
        container.innerHTML = '<div style="padding: 1.5rem; color: var(--text-muted); text-align: center;">No roadmap steps found for this track.</div>';
        return;
    }

    steps.forEach((step, idx) => {
        const isChecked = userCompletedSteps.includes(step);
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1.25rem;
            padding: 1.15rem 1.25rem;
            border-radius: var(--radius-sm);
            background: ${isChecked ? 'rgba(79, 70, 229, 0.06)' : '#FFFFFF'};
            border: 1.5px solid ${isChecked ? 'rgba(79, 70, 229, 0.3)' : 'var(--border-color)'};
            box-shadow: var(--shadow-sm);
            transition: all 0.2s ease;
        `;

        item.innerHTML = `
            <div style="font-weight: 800; font-size: 1.1rem; color: ${isChecked ? 'var(--accent)' : 'var(--text-muted)'}; min-width: 28px;">
                0${idx + 1}
            </div>
            <input type="checkbox" class="step-checkbox" value="${step}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent); cursor: pointer;">
            <div style="flex: 1;">
                <div style="font-size: 0.96rem; font-weight: 600; color: ${isChecked ? 'var(--text-muted)' : 'var(--text-primary)'}; text-decoration: ${isChecked ? 'line-through' : 'none'};">
                    ${step}
                </div>
            </div>
            <span class="badge ${isChecked ? 'badge-success' : 'badge-warning'}">
                ${isChecked ? '<i class="fa-solid fa-check"></i> Mastered' : 'Pending'}
            </span>
        `;

        const checkbox = item.querySelector('.step-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!userCompletedSteps.includes(step)) userCompletedSteps.push(step);
            } else {
                userCompletedSteps = userCompletedSteps.filter(s => s !== step);
            }
            updateRoadmapProgress();
            renderRoadmapSteps();
        });

        container.appendChild(item);
    });

    updateRoadmapProgress();
}

function updateRoadmapProgress() {
    const steps = roadmapTemplates[activeRole] || roadmapTemplates['Software Engineer'] || [];
    const completedCount = steps.filter(s => userCompletedSteps.includes(s)).length;
    const pct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

    const pctText = document.getElementById('progressPctText');
    const bar = document.getElementById('roadmapProgressBar');
    if (pctText) pctText.textContent = pct + "%";
    if (bar) bar.style.width = pct + "%";
}

function saveRoadmapProgress() {
    if (window.CareerXStore) {
        window.CareerXStore.saveRoadmapProgress(activeRole, userCompletedSteps);
    }
    if (window.showToast) {
        window.showToast("Roadmap progress successfully saved!", "success");
    } else {
        alert("Roadmap progress saved!");
    }
}
