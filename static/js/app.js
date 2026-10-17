// Global Application Utilities (app.js)

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileNav();
    highlightActiveNav();
    initBackendStatusBadge();
});

// Check & update server badge if present on page
async function initBackendStatusBadge() {
    const badge = document.getElementById('backendStatusBadge') || document.getElementById('serverStatusBadge');
    if (!badge) return;

    const badgeText = document.getElementById('backendStatusText') || badge.querySelector('span:not(.pulse-dot)');
    const pulseDot = badge.querySelector('.pulse-dot');

    try {
        const healthUrl = (window.location.port === '5500' || window.location.port === '5501' || window.location.protocol === 'file:')
            ? 'http://127.0.0.1:5000/api/health'
            : '/api/health';
        const res = await fetch(healthUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            badge.style.background = 'rgba(16, 185, 129, 0.15)';
            badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            badge.style.color = '#34D399';
            if (badgeText) badgeText.innerText = 'Connected: Flask Engine (5000)';
            if (pulseDot) {
                pulseDot.style.background = '#10B981';
                pulseDot.style.boxShadow = '0 0 8px #10B981';
            }
            return;
        }
    } catch (e) {
        // Backend offline / unreachable
    }

    badge.style.background = 'rgba(99, 102, 241, 0.15)';
    badge.style.borderColor = 'rgba(99, 102, 241, 0.4)';
    badge.style.color = '#A5B4FC';
    if (badgeText) badgeText.innerText = 'Live Server Standalone (5500)';
    if (pulseDot) {
        pulseDot.style.background = '#818CF8';
        pulseDot.style.boxShadow = '0 0 8px #818CF8';
    }
}

// Enforce Permanent Clean Light Theme
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

// Active Nav Item highlighting based on pathname
function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
            link.classList.add('active');
        }
    });
}

// Global Accordion Helper for Interview Flashcards
window.toggleAnswer = function(id, trigger) {
    const el = document.getElementById(id);
    const icon = trigger.querySelector('.fa-chevron-down');
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
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
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
