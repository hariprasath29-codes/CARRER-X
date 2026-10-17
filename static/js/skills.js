// Skill Matrix & Badges Client Logic (skills.js)

function openSkillModal() {
    const modal = document.getElementById('addSkillModal');
    if (modal) modal.classList.add('active');
}

function closeSkillModal() {
    const modal = document.getElementById('addSkillModal');
    if (modal) modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Animate skill progress bars from data attribute (No inline CSS syntax issues)
    document.querySelectorAll('.skill-progress-bar').forEach(bar => {
        const pct = bar.getAttribute('data-progress') || 0;
        bar.style.width = pct + '%';
    });

    // 2. Bind delete buttons cleanly using data attributes
    document.querySelectorAll('.btn-delete-skill').forEach(btn => {
        btn.addEventListener('click', () => {
            const skillId = btn.getAttribute('data-skill-id');
            if (skillId) deleteSkill(skillId);
        });
    });

    // 3. Add skill form submission
    const form = document.getElementById('skillForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                skill_name: document.getElementById('modalSkillName').value,
                category: document.getElementById('modalSkillCat').value,
                proficiency: parseInt(document.getElementById('modalSkillProf').value),
                status: document.getElementById('modalSkillStatus').value
            };

            try {
                const res = await fetch('/api/skills/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                }
            } catch (err) {
                console.error("Error adding skill:", err);
                window.showToast("Failed to save skill.", "danger");
            }
        });
    }
});

async function deleteSkill(skillId) {
    if (!confirm("Are you sure you want to remove this skill?")) return;
    try {
        const res = await fetch(`/api/skills/delete/${skillId}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            window.location.reload();
        }
    } catch (err) {
        console.error("Error deleting skill:", err);
    }
}
