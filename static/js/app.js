// CareerX - Common Application Scripts (app.js)
// Handles sidebar navigation, user sessions, active links, and UI helpers

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    if (window.CareerXStore) {
        window.CareerXStore.init();
    }
    syncUserProfileUI();
    initMobileNav();
    highlightActiveNav();
    initSidebarScrollPersistence();
    initBackendStatusBadge();
});

// Update student profile in sidebar
function syncUserProfileUI() {
    if (!window.CareerXStore) return;
    const user = window.CareerXStore.getUser();
    if (!user) return;

    // Mini profile in sidebar
    const avatarEl = document.querySelector('.user-mini-profile .user-avatar');
    const nameEl = document.querySelector('.user-mini-profile .name');
    const roleEl = document.querySelector('.user-mini-profile .role');

    if (avatarEl) {
        const initial = (user.full_name || user.username || 'S').charAt(0).toUpperCase();
        avatarEl.textContent = initial;
    }
    if (nameEl) {
        nameEl.textContent = user.full_name || user.username;
    }
    if (roleEl) {
        roleEl.textContent = user.role === 'admin' ? 'Placement Officer' : (user.target_role || 'Student');
    }

    // Hide admin navigation for student users
    if (user.role !== 'admin') {
        document.querySelectorAll('a[href*="admin.html"], .admin-only').forEach(el => {
            el.closest('.nav-item')?.remove() || el.remove();
        });
    }

    // Setup logout buttons
    document.querySelectorAll('.logout-trigger, a[href*="logout"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.CareerXStore) window.CareerXStore.logout();
            window.location.href = 'login.html';
        });
    });
}

// System status indicator badge in header
function initBackendStatusBadge() {
    const badge = document.getElementById('backendStatusBadge') || document.getElementById('serverStatusBadge');
    if (!badge) return;

    const badgeText = document.getElementById('backendStatusText') || badge.querySelector('span:not(.pulse-dot)');
    const pulseDot = badge.querySelector('.pulse-dot');

    badge.style.background = 'rgba(16, 185, 129, 0.15)';
    badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    badge.style.color = '#059669';
    if (badgeText) badgeText.innerText = 'System Status: Active';
    if (pulseDot) {
        pulseDot.style.background = '#10B981';
        pulseDot.style.boxShadow = '0 0 8px #10B981';
    }
}

// Enforce Clean Light Theme
function initTheme() {
    localStorage.setItem('careerx_theme', 'light');
    localStorage.setItem('careerx-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
}

// Mobile Sidebar Navigation
function initMobileNav() {
    const toggle = document.getElementById('mobileNavToggle');
    const closeBtn = document.getElementById('mobileSidebarClose');
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
    }

    if (toggle) toggle.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebar();
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && toggle && !toggle.contains(e.target)) {
                closeSidebar();
            }
        }
    });
}

// Active Nav Item highlighting based on HTML filename
function highlightActiveNav() {
    const rawPath = window.location.pathname.toLowerCase();
    const cleanPath = rawPath.split('?')[0].split('#')[0];
    let filename = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
    
    // Default to dashboard.html if running on root folder or index.html in an app context
    if (!filename || filename === 'index.html' || filename === '') {
        filename = 'dashboard.html';
    }

    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    let matchedLink = null;

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = (link.getAttribute('href') || '').toLowerCase().split('?')[0].split('#')[0];
        const linkFile = href.substring(href.lastIndexOf('/') + 1);
        if (linkFile && linkFile === filename) {
            link.classList.add('active');
            matchedLink = link;
        }
    });

    if (!matchedLink && filename === 'dashboard.html') {
        const dashLink = document.querySelector('.sidebar-nav .nav-item[href*="dashboard.html"]');
        if (dashLink) {
            dashLink.classList.add('active');
            matchedLink = dashLink;
        }
    }

    // Ensure the active item is always scrolled comfortably into view!
    if (matchedLink) {
        setTimeout(() => {
            matchedLink.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        }, 15);
    }
}

// Preserve sidebar scroll position across navigation so it never jumps/slides up
function initSidebarScrollPersistence() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;

    // Restore saved scroll position
    const saved = sessionStorage.getItem('careerx_sidebar_scroll');
    if (saved !== null) {
        sidebarNav.scrollTop = parseInt(saved, 10);
    }

    // Save scroll position whenever user scrolls
    sidebarNav.addEventListener('scroll', () => {
        sessionStorage.setItem('careerx_sidebar_scroll', String(sidebarNav.scrollTop));
    }, { passive: true });

    // Save scroll position right before clicking any nav item
    sidebarNav.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
            sessionStorage.setItem('careerx_sidebar_scroll', String(sidebarNav.scrollTop));
        });
    });
}

// Global Accordion Helper for Interview Flashcards
window.toggleAnswer = function(id, trigger) {
    const el = document.getElementById(id);
    const icon = trigger ? trigger.querySelector('.fa-chevron-down') : null;
    if (!el) return;
    if (el.style.display === 'none' || !el.style.display) {
        el.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        el.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
};

// Global Admin Question Type Switcher
window.toggleQTypeFields = function(type) {
    const aptFields = document.getElementById('aptitudeFields');
    const intFields = document.getElementById('interviewFields');
    if (!aptFields || !intFields) return;
    if (type === 'aptitude') {
        aptFields.style.display = 'block';
        intFields.style.display = 'none';
    } else {
        aptFields.style.display = 'none';
        intFields.style.display = 'block';
    }
};

// Global Toast Notification Helper
window.showToast = function(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '99999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
    toast.style.minWidth = '280px';
    toast.style.animation = 'fadeIn 0.3s ease';

    const iconMap = {
        success: 'fa-circle-check',
        danger: 'fa-circle-exclamation',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };
    const iconClass = iconMap[type] || 'fa-circle-info';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};
