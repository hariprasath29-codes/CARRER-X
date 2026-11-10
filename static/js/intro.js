// CareerX Intro Animation (intro.js)
// Simple typing effect and smooth transition to login

(function () {
    'use strict';

    let soundEnabled = true;
    let timerIds = [];

    // Simple audio click/beep using standard Web Audio API
    function playBeep(freq = 440, duration = 0.04) {
        if (!soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.value = 0.04;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) { }
    }

    // Clear active timeouts
    function clearTimers() {
        timerIds.forEach(id => clearTimeout(id));
        timerIds = [];
    }

    function addTimer(fn, delay) {
        const id = setTimeout(fn, delay);
        timerIds.push(id);
        return id;
    }

    // Main animation: types "Career", lands the "X", then reveals login
    function startIntro() {
        const overlay = document.getElementById('intro-overlay');
        const careerEl = document.querySelector('.intro-career-text');
        const xChar = document.querySelector('.intro-x-char');
        const cursorEl = document.querySelector('.intro-cursor');
        const pill = document.querySelector('.intro-pill');
        const tagline = document.querySelector('.intro-tagline');
        const features = document.querySelector('.intro-features-row');
        const authContainer = document.querySelector('.auth-container');

        if (!overlay || !careerEl || !xChar) return;

        clearTimers();

        // Reset display
        overlay.classList.remove('intro-hidden', 'is-zooming');
        careerEl.textContent = '';
        xChar.classList.remove('landed');
        if (cursorEl) cursorEl.style.display = 'inline-block';
        if (pill) pill.classList.remove('visible');
        if (tagline) tagline.classList.remove('visible');
        if (features) features.classList.remove('visible');
        if (authContainer) authContainer.classList.remove('revealed');

        // Show pill
        addTimer(() => {
            if (pill) pill.classList.add('visible');
        }, 150);

        // Type "Career" letter by letter
        const text = "Career";
        for (let i = 0; i < text.length; i++) {
            addTimer(() => {
                careerEl.textContent += text[i];
                playBeep(520 + i * 50, 0.03);
            }, 300 + i * 75);
        }

        // Show the "X"
        const xTime = 300 + text.length * 75 + 100;
        addTimer(() => {
            if (cursorEl) cursorEl.style.display = 'none';
            xChar.classList.add('landed');
            playBeep(880, 0.08);
            if (tagline) tagline.classList.add('visible');
            if (features) features.classList.add('visible');
        }, xTime);

        // Zoom into login card
        const zoomTime = xTime + 750;
        addTimer(() => {
            overlay.classList.add('is-zooming');
            if (authContainer) authContainer.classList.add('revealed');
        }, zoomTime);

        // Hide overlay
        addTimer(() => {
            overlay.classList.add('intro-hidden');
            const usernameInput = document.querySelector('.auth-container input[name="username"]');
            if (usernameInput) usernameInput.focus();
        }, zoomTime + 450);
    }

    // Skip directly to login
    function skipIntro() {
        clearTimers();
        const overlay = document.getElementById('intro-overlay');
        const authContainer = document.querySelector('.auth-container');
        if (overlay) overlay.classList.add('intro-hidden');
        if (authContainer) {
            authContainer.classList.add('revealed');
            const usernameInput = authContainer.querySelector('input[name="username"]');
            if (usernameInput) usernameInput.focus();
        }
    }

    // Setup events
    document.addEventListener('DOMContentLoaded', function () {
        const skipBtn = document.getElementById('skipIntroBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', skipIntro);
        }

        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', function () {
                soundEnabled = !soundEnabled;
                const icon = soundBtn.querySelector('i');
                const label = soundBtn.querySelector('.sound-label');
                if (icon) icon.className = soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
                if (label) label.textContent = soundEnabled ? 'Sound On' : 'Muted';
            });
        }

        const replayBtn = document.getElementById('replayIntroBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', function (e) {
                e.preventDefault();
                startIntro();
            });
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('skip') === '1' || document.querySelector('.alert')) {
            skipIntro();
        } else {
            startIntro();
        }
    });

    window.CareerXIntro = {
        replay: startIntro,
        skip: skipIntro
    };
})();
