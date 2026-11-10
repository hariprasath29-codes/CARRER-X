// CareerX - Skill Matrix & Badges (skills.js)
// Tracks verified student competencies, proficiency levels, and certificates

function openSkillModal() {
    const modal = document.getElementById('addSkillModal');
    if (modal) modal.classList.add('active');
}

function closeSkillModal() {
    const modal = document.getElementById('addSkillModal');
    if (modal) modal.classList.remove('active');
}

function renderSkillsGrid() {
    const container = document.getElementById('skillsGridContainer');
    if (!container || !window.CareerXStore) return;

    const skills = window.CareerXStore.getSkills();

    if (skills.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fa-solid fa-code" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>No skills logged yet. Click <strong>"Add New Skill"</strong> above to build your technical matrix!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = skills.map(s => {
        const badgeClass = s.status === 'Mastered' ? 'badge-success' : (s.status === 'Proficient' ? 'badge-primary' : 'badge-warning');
        return `
            <div class="card" style="padding: 1.25rem; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                        <span class="badge badge-primary" style="font-size: 0.72rem;">${s.category || 'Technical'}</span>
                        <h4 style="font-size: 1.1rem; margin-top: 0.35rem; color: var(--text-primary);">${s.skill_name}</h4>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="badge ${badgeClass}">${s.status}</span>
                        <button type="button" data-skill-id="${s.id}" class="btn-delete-skill" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;" title="Remove Skill">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                    <span>Proficiency</span>
                    <span style="font-weight: 700; color: var(--accent);">${s.proficiency}%</span>
                </div>
                <div style="height: 6px; width: 100%; background: var(--border-color); border-radius: 99px; overflow: hidden;">
                    <div class="skill-progress-bar" style="height: 100%; width: ${s.proficiency}%; background: var(--accent); border-radius: 99px; transition: width 0.6s ease;"></div>
                </div>
            </div>
        `;
    }).join('');

    // Rebind delete buttons
    document.querySelectorAll('.btn-delete-skill').forEach(btn => {
        btn.addEventListener('click', () => {
            const skillId = btn.getAttribute('data-skill-id');
            if (skillId && confirm("Are you sure you want to remove this skill?")) {
                if (window.CareerXStore) {
                    window.CareerXStore.deleteSkill(skillId);
                    renderSkillsGrid();
                    if (window.showToast) window.showToast("Skill removed successfully.", "info");
                }
            }
        });
    });
}

function renderBadgesShowcase() {
    const container = document.getElementById('badgesGridContainer');
    const badgeCountEl = document.getElementById('badgesCountBadge');
    if (!container || !window.CareerXStore) return;

    const badges = window.CareerXStore.getBadges();
    if (badgeCountEl) badgeCountEl.textContent = `${badges.length} Badges Unlocked`;

    container.innerHTML = badges.map(b => `
        <div class="achievement-badge-card" style="display: flex; align-items: center; gap: 1rem; padding: 20px; border-radius: var(--radius-md); background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
            <div class="achievement-icon-circle" style="width: 50px; height: 50px; border-radius: 50%; background: rgba(245, 185, 66, 0.12); border: 1.5px solid rgba(245, 185, 66, 0.35); color: #F59E0B; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0;">
                <i class="fa-solid ${b.badge_icon || 'fa-trophy'}"></i>
            </div>
            <div>
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${b.badge_name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${b.badge_desc}</div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderSkillsGrid();
    renderBadgesShowcase();

    // Add skill form submission
    const form = document.getElementById('skillForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const payload = {
                skill_name: document.getElementById('modalSkillName').value,
                category: document.getElementById('modalSkillCat').value,
                proficiency: parseInt(document.getElementById('modalSkillProf').value || 50),
                status: document.getElementById('modalSkillStatus').value
            };

            if (window.CareerXStore) {
                window.CareerXStore.addSkill(payload);
                renderSkillsGrid();
                closeSkillModal();
                form.reset();
                if (window.showToast) window.showToast("Skill added to your competency matrix!", "success");
            }
        });
    }
});
