/**
 * CAREERX – ULTRA-SMOOTH CINEMATIC INTRO & PORTAL TRANSITION ENGINE
 * 
 * Performance Optimizations:
 * - Hardware-accelerated GPU transforms (translate3d, scale3d)
 * - Canvas loop paused during active zoom to eliminate frame drops
 * - Zero dynamic Gaussian blur recalculations
 * - Seamless portal bloom hand-off to login card
 * - Snappy typing cadence with low-latency Web Audio API synthesizer
 */

(function () {
    'use strict';

    // -------------------------------------------------------------
    // LOW-LATENCY AUDIO SYNTHESIZER (WEB AUDIO API)
    // -------------------------------------------------------------
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Snappy cyber click for typing
    function playTypeSound() {
        if (!soundEnabled || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(820 + Math.random() * 250, now);
            osc.frequency.exponentialRampToValueAtTime(280, now + 0.035);

            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) { }
    }

    // Punchy impact sound when "X" strikes
    function playXImpactSound() {
        if (!soundEnabled || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;

            // Sub-bass impact
            const subOsc = audioCtx.createOscillator();
            const subGain = audioCtx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(110, now);
            subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

            subGain.gain.setValueAtTime(0.25, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            subOsc.connect(subGain);
            subGain.connect(audioCtx.destination);
            subOsc.start(now);
            subOsc.stop(now + 0.42);

            // Laser energy zap
            const zapOsc = audioCtx.createOscillator();
            const zapGain = audioCtx.createGain();
            zapOsc.type = 'sawtooth';
            zapOsc.frequency.setValueAtTime(880, now);
            zapOsc.frequency.exponentialRampToValueAtTime(240, now + 0.22);

            zapGain.gain.setValueAtTime(0.09, now);
            zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            zapOsc.connect(zapGain);
            zapGain.connect(audioCtx.destination);
            zapOsc.start(now);
            zapOsc.stop(now + 0.28);
        } catch (e) { }
    }

    // Smooth hyperspace warp whoosh during 3D zoom
    function playZoomWarpSound() {
        if (!soundEnabled || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;

            // Filtered riser
            const riser = audioCtx.createOscillator();
            const riserGain = audioCtx.createGain();
            riser.type = 'triangle';
            riser.frequency.setValueAtTime(150, now);
            riser.frequency.exponentialRampToValueAtTime(850, now + 0.65);

            riserGain.gain.setValueAtTime(0.02, now);
            riserGain.gain.linearRampToValueAtTime(0.14, now + 0.4);
            riserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

            riser.connect(riserGain);
            riserGain.connect(audioCtx.destination);

            riser.start(now);
            riser.stop(now + 0.75);
        } catch (e) { }
    }

    // -------------------------------------------------------------
    // LIGHTWEIGHT AMBIENT PARTICLES (AUTO-PAUSES DURING ZOOM)
    // -------------------------------------------------------------
    let animationFrameId = null;
    let isCanvasRunning = false;

    function initParticleCanvas() {
        const canvas = document.getElementById('intro-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        const particles = [];
        const count = Math.min(32, Math.floor(window.innerWidth / 36));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.6 + 0.6,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                alpha: Math.random() * 0.5 + 0.25,
                color: Math.random() > 0.4 ? '99, 102, 241' : '56, 189, 248'
            });
        }

        function render() {
            if (!isCanvasRunning) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
                ctx.fill();
            }
            animationFrameId = requestAnimationFrame(render);
        }

        isCanvasRunning = true;
        render();
    }

    function stopParticleCanvas() {
        isCanvasRunning = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function resumeParticleCanvas() {
        if (!isCanvasRunning) {
            isCanvasRunning = true;
            initParticleCanvas();
        }
    }

    // -------------------------------------------------------------
    // INTRO ANIMATION TIMELINE CONTROLLER
    // -------------------------------------------------------------
    let timeouts = [];

    function clearAllTimeouts() {
        for (let i = 0; i < timeouts.length; i++) {
            clearTimeout(timeouts[i]);
        }
        timeouts = [];
    }

    function addTimeout(fn, delay) {
        const id = setTimeout(fn, delay);
        timeouts.push(id);
        return id;
    }

    function runIntroSequence() {
        const overlay = document.getElementById('intro-overlay');
        const pill = document.querySelector('.intro-pill');
        const careerEl = document.querySelector('.intro-career-text');
        const cursorEl = document.querySelector('.intro-cursor');
        const xChar = document.querySelector('.intro-x-char');
        const shockwave = document.querySelector('.intro-shockwave');
        const tagline = document.querySelector('.intro-tagline');
        const features = document.querySelector('.intro-features-row');
        const authContainer = document.querySelector('.auth-container');

        if (!overlay || !careerEl || !xChar) return;

        // Reset all states cleanly
        clearAllTimeouts();
        resumeParticleCanvas();

        overlay.classList.remove('intro-hidden', 'is-zooming');
        if (pill) pill.classList.remove('visible');
        if (tagline) tagline.classList.remove('visible');
        if (features) features.classList.remove('visible');
        if (shockwave) shockwave.classList.remove('active');
        if (authContainer) authContainer.classList.remove('revealed');

        careerEl.textContent = '';
        xChar.classList.remove('landed');
        if (cursorEl) cursorEl.style.display = 'inline-block';

        // 1. Show Top Pill (Snappy t = 140ms)
        addTimeout(() => {
            if (pill) pill.classList.add('visible');
        }, 140);

        // 2. Type "Career" letter by letter (Snappy 55ms per char)
        const word = "Career";
        const typeSpeed = 55;
        const startType = 300;

        for (let i = 0; i < word.length; i++) {
            addTimeout(() => {
                careerEl.textContent += word[i];
                playTypeSound();
            }, startType + (i * typeSpeed));
        }

        const typingDoneTime = startType + (word.length * typeSpeed);

        // 3. Immediately as the letters finish typing: The last "X" strikes in!
        const xLandTime = typingDoneTime + 100;
        addTimeout(() => {
            if (cursorEl) cursorEl.style.display = 'none';

            // Punchy landing of the last "X"
            xChar.classList.add('landed');
            if (shockwave) shockwave.classList.add('active');
            playXImpactSound();
        }, xLandTime);

        // 4. In the last step: "X zooms in after the letter finished"
        // Crisp cinematic beat (~280ms) to read "Career X", then X zooms in dynamically!
        const zoomStartTime = xLandTime + 280;
        addTimeout(() => {
            stopParticleCanvas();
            overlay.classList.add('is-zooming');
            playZoomWarpSound();
        }, zoomStartTime);

        // 5. Seamless Hand-off: Prime login card at peak portal bloom (~400ms into zoom)
        const primeLoginTime = zoomStartTime + 400;
        addTimeout(() => {
            if (authContainer) {
                authContainer.classList.add('revealed');
            }
        }, primeLoginTime);

        // 6. Complete zoom & dismiss overlay smoothly
        const finishTime = zoomStartTime + 660;
        addTimeout(() => {
            overlay.classList.add('intro-hidden');
            if (authContainer) {
                const userInput = authContainer.querySelector('input[name="username"]');
                if (userInput) userInput.focus();
            }
        }, finishTime);
    }

    // Instant Skip Functionality
    function skipIntro() {
        clearAllTimeouts();
        stopParticleCanvas();

        const overlay = document.getElementById('intro-overlay');
        const authContainer = document.querySelector('.auth-container');

        if (overlay) overlay.classList.add('intro-hidden');
        if (authContainer) {
            authContainer.classList.add('revealed');
            const userInput = authContainer.querySelector('input[name="username"]');
            if (userInput) userInput.focus();
        }
    }

    // -------------------------------------------------------------
    // INITIALIZATION & EVENT LISTENERS
    // -------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {
        initParticleCanvas();

        // Audio activation on first user interaction
        const enableAudioOnGesture = () => {
            initAudio();
            document.removeEventListener('click', enableAudioOnGesture);
            document.removeEventListener('keydown', enableAudioOnGesture);
        };
        document.addEventListener('click', enableAudioOnGesture);
        document.addEventListener('keydown', enableAudioOnGesture);

        // Skip Button
        const skipBtn = document.getElementById('skipIntroBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                skipIntro();
            });
        }

        // Sound Toggle Button
        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                initAudio();
                soundEnabled = !soundEnabled;
                const icon = soundBtn.querySelector('i');
                const label = soundBtn.querySelector('.sound-label');
                if (icon) {
                    icon.className = soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
                }
                if (label) {
                    label.textContent = soundEnabled ? 'Sound On' : 'Muted';
                }
                soundBtn.style.color = soundEnabled ? '#6366F1' : '#94A3B8';
            });
        }

        // Replay Button (from Login Screen)
        const replayBtn = document.getElementById('replayIntroBtn');
        if (replayBtn) {
            replayBtn.addEventListener('click', function (e) {
                e.preventDefault();
                initAudio();
                runIntroSequence();
            });
        }

        // Automatic skip check: If page already has flash alerts (e.g. invalid credentials)
        const urlParams = new URLSearchParams(window.location.search);
        const hasAlert = document.querySelector('.alert');
        if (hasAlert || urlParams.get('skip') === '1') {
            skipIntro();
        } else {
            runIntroSequence();
        }
    });

    // Expose controller globally
    window.CareerXIntro = {
        replay: runIntroSequence,
        skip: skipIntro
    };
})();
