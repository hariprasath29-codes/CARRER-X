// Technical Assessment Simulator Logic (mock_interview.js)

let activeMockQuestions = [];
let mockQuestionIndex = 0;
let recordedSubmissions = [];
let selectedTrack = 'Python';

// Voice / Microphone State
let speechRecognizer = null;
let userWantsRecording = false;
let speechBaseText = '';
let finalTranscriptHistory = '';
let hasReceivedSpeechTranscript = false;
let speakingFramesCounter = 0;
let micStream = null;
let audioContext = null;
let audioAnalyser = null;
let animFrameId = null;

// Speech Synthesis State
let isSpeakingQuestion = false;
let isSpeakingFeedback = false;
let availableVoices = [];
let ttsHeartbeat = null;

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startMockBtn');
    if (startBtn) startBtn.addEventListener('click', startMockInterviewSession);

    const submitAnsBtn = document.getElementById('submitMockAnswerBtn');
    if (submitAnsBtn) submitAnsBtn.addEventListener('click', evaluateMockAnswer);

    const nextBtn = document.getElementById('nextMockQBtn');
    if (nextBtn) nextBtn.addEventListener('click', advanceMockInterview);

    // Microphone Dictation Toggle Button
    const micBtn = document.getElementById('mockMicBtn');
    if (micBtn) micBtn.addEventListener('click', toggleSpeechRecognition);

    // Clear Answer Button
    const clearBtn = document.getElementById('mockClearAnswerBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        const ansInput = document.getElementById('mockAnswerInput');
        if (ansInput) ansInput.value = '';
        speechBaseText = '';
        finalTranscriptHistory = '';
        hideSpeechFallbackNotice();
        const livePreview = document.getElementById('mockLiveTranscriptPreview');
        if (livePreview) livePreview.style.display = 'none';
        stopSpeechRecognition();
        if (window.showToast) window.showToast("Answer field cleared.", "info");
    });

    // Sample Answer / Smart Dictate Button
    const smartDictateBtn = document.getElementById('mockSmartDictateBtn');
    if (smartDictateBtn) smartDictateBtn.addEventListener('click', articulateSampleAnswer);

    const noticeActionBtn = document.getElementById('mockNoticeActionBtn');
    if (noticeActionBtn) noticeActionBtn.addEventListener('click', articulateSampleAnswer);

    // Language / Accent Change Listener
    const langSelect = document.getElementById('mockSpeechLang');
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            if (userWantsRecording) {
                // Seamlessly restart with new language accent
                createAndStartRecognizer();
                if (window.showToast) window.showToast(`Voice accent updated to ${langSelect.selectedOptions[0].text}`, "info");
            }
        });
    }

    // Question Speaker Button (TTS)
    const speakerBtn = document.getElementById('mockReadQuestionBtn');
    if (speakerBtn) speakerBtn.addEventListener('click', toggleReadQuestion);

    // Feedback Speaker Button (TTS)
    const fbSpeakerBtn = document.getElementById('mockReadFeedbackBtn');
    if (fbSpeakerBtn) fbSpeakerBtn.addEventListener('click', toggleReadFeedback);

    // Load browser speech synthesis voices
    loadSpeechVoices();
});

function loadSpeechVoices() {
    if (!('speechSynthesis' in window)) return;
    availableVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        availableVoices = window.speechSynthesis.getVoices();
    };
}

function getBestSpeechVoice() {
    if (!availableVoices || availableVoices.length === 0) {
        if ('speechSynthesis' in window) {
            availableVoices = window.speechSynthesis.getVoices();
        }
    }
    if (!availableVoices || availableVoices.length === 0) return null;

    // 1. Look for Microsoft Natural or Online Voices (Edge/Chrome top tier)
    const naturalVoice = availableVoices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Online')) && v.lang.startsWith('en')
    );
    if (naturalVoice) return naturalVoice;

    // 2. Look for Google High-Quality English voices
    const googleVoice = availableVoices.find(v => 
        v.name.includes('Google') && v.lang.startsWith('en')
    );
    if (googleVoice) return googleVoice;

    // 3. Look for standard English voices (Jenny, Guy, Christopher, Zira, David)
    const enVoice = availableVoices.find(v => 
        (v.name.includes('Jenny') || v.name.includes('Christopher') || v.name.includes('Zira') || v.name.includes('David'))
    );
    if (enVoice) return enVoice;

    // 4. Any English voice
    const fallbackEn = availableVoices.find(v => v.lang.startsWith('en'));
    return fallbackEn || availableVoices[0];
}

async function startMockInterviewSession() {
    try {
        selectedTrack = document.getElementById('mockCategorySelect').value;
        const count = document.getElementById('mockCountSelect').value;

        try {
            const res = await fetch('/api/mock-interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: selectedTrack, count: parseInt(count) })
            });

            activeMockQuestions = await res.json();
        } catch (err) {
            // Fallback for standalone Live Server
            activeMockQuestions = getClientMockQuestions(selectedTrack, parseInt(count) || 3);
        }

        if (!activeMockQuestions || activeMockQuestions.length === 0) {
            activeMockQuestions = getClientMockQuestions(selectedTrack, parseInt(count) || 3);
        }

        mockQuestionIndex = 0;
        recordedSubmissions = [];

        document.getElementById('mockSetupScreen').style.display = 'none';
        document.getElementById('mockFinalSummaryScreen').style.display = 'none';
        document.getElementById('mockRoomScreen').style.display = 'block';

        renderMockInterviewQuestion();
    } catch (err) {
        console.error("Error starting mock:", err);
        window.showToast("Failed to initialize technical assessment.", "danger");
    }
}

function renderMockInterviewQuestion() {
    stopSpeechRecognition();
    stopAllSpeechSynthesis();

    const q = activeMockQuestions[mockQuestionIndex];
    if (!q) return;

    document.getElementById('mockDomainBadge').textContent = q.category;
    document.getElementById('mockDifficultyBadge').textContent = q.difficulty || 'Medium';
    document.getElementById('mockQuestionCounter').textContent = `Question ${mockQuestionIndex + 1} of ${activeMockQuestions.length}`;
    document.getElementById('mockQuestionText').textContent = q.question;
    
    const ansBox = document.getElementById('mockAnswerInput');
    if (ansBox) ansBox.value = '';
    speechBaseText = '';
    finalTranscriptHistory = '';
    hasReceivedSpeechTranscript = false;
    speakingFramesCounter = 0;
    hideSpeechFallbackNotice();
    const livePreview = document.getElementById('mockLiveTranscriptPreview');
    if (livePreview) livePreview.style.display = 'none';

    document.getElementById('mockAnswerFeedbackBox').style.display = 'none';
    document.getElementById('submitMockAnswerBtn').style.display = 'inline-flex';
}

async function evaluateMockAnswer() {
    stopSpeechRecognition();
    stopAllSpeechSynthesis();

    const ans = document.getElementById('mockAnswerInput').value.trim();
    if (!ans) {
        window.showToast("Please provide your answer before evaluation! (Speak via mic or type)", "warning");
        return;
    }

    const q = activeMockQuestions[mockQuestionIndex];
    recordedSubmissions.push({
        question_id: q.id,
        question: q.question,
        answer: ans
    });

    const btn = document.getElementById('submitMockAnswerBtn');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Evaluating...`;

    try {
        const res = await fetch('/api/mock-interview/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role_tested: selectedTrack,
                submissions: [{ question_id: q.id, question: q.question, answer: ans }]
            })
        });

        const data = await res.json();
        const evalItem = data.evaluations[0];
        recordedSubmissions.push(evalItem);

        document.getElementById('fbScore').textContent = evalItem.score + "/10";
        document.getElementById('fbRatingBadge').textContent = evalItem.rating;
        document.getElementById('fbModelAns').textContent = evalItem.model_answer;

        const strList = document.getElementById('fbStrengthsList');
        strList.innerHTML = '';
        evalItem.strengths.forEach(s => {
            const li = document.createElement('li');
            li.textContent = s;
            strList.appendChild(li);
        });

        const impList = document.getElementById('fbImprovementsList');
        impList.innerHTML = '';
        evalItem.improvements.forEach(i => {
            const li = document.createElement('li');
            li.textContent = i;
            impList.appendChild(li);
        });

        document.getElementById('mockAnswerFeedbackBox').style.display = 'block';
        btn.style.display = 'none';

        const nextBtn = document.getElementById('nextMockQBtn');
        if (mockQuestionIndex === activeMockQuestions.length - 1) {
            nextBtn.innerHTML = `Finish Assessment <i class="fa-solid fa-flag-checkered"></i>`;
        } else {
            nextBtn.innerHTML = `Next Question <i class="fa-solid fa-arrow-right"></i>`;
        }
    } catch (err) {
        // Fallback: evaluate client-side for standalone Live Server
        const wordCount = ans.split(/\s+/).filter(Boolean).length;
        let score = Math.min(9.5, Math.max(5.0, (wordCount > 40 ? 8.5 : (wordCount > 20 ? 7.0 : 5.5))));
        const rating = score >= 8 ? 'Good' : (score >= 6 ? 'Average' : 'Needs Improvement');
        const evalItem = {
            score: score,
            rating: rating,
            model_answer: q.model_answer || "A comprehensive technical answer includes definitions, real-world examples, and edge-case tradeoffs.",
            strengths: ["Clear logical structure", "Good domain vocabulary", "Direct answer to the prompt"],
            improvements: ["Mention specific production performance benchmarks or memory implications", "Elaborate with concrete architectural examples"]
        };
        recordedSubmissions.push(evalItem);

        document.getElementById('fbScore').textContent = evalItem.score + "/10";
        document.getElementById('fbRatingBadge').textContent = evalItem.rating;
        document.getElementById('fbModelAns').textContent = evalItem.model_answer;

        const strList = document.getElementById('fbStrengthsList');
        strList.innerHTML = '';
        evalItem.strengths.forEach(s => {
            const li = document.createElement('li');
            li.textContent = s;
            strList.appendChild(li);
        });

        const impList = document.getElementById('fbImprovementsList');
        impList.innerHTML = '';
        evalItem.improvements.forEach(i => {
            const li = document.createElement('li');
            li.textContent = i;
            impList.appendChild(li);
        });

        document.getElementById('mockAnswerFeedbackBox').style.display = 'block';
        btn.style.display = 'none';

        const nextBtn = document.getElementById('nextMockQBtn');
        if (mockQuestionIndex === activeMockQuestions.length - 1) {
            nextBtn.innerHTML = `Finish Assessment <i class="fa-solid fa-flag-checkered"></i>`;
        } else {
            nextBtn.innerHTML = `Next Question <i class="fa-solid fa-arrow-right"></i>`;
        }
        window.showToast("Answer evaluated locally (Live Server mode)!", "success");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Evaluate Answer</span> <i class="fa-solid fa-wand-magic-sparkles"></i>`;
    }
}

function getClientMockQuestions(category, count) {
    const banks = {
        'Python': [
            { id: 101, question: "Explain the difference between deep copy and shallow copy in Python.", model_answer: "A shallow copy creates a new object populated with references to the child objects of the original. A deep copy recursively duplicates every object found within the original, ensuring complete independence.", key_points: "references, recursion, copy module, memory independence" },
            { id: 102, question: "What are Python generators and why are they memory efficient?", model_answer: "Generators are functions that yield values one at a time using the yield keyword. Instead of allocating memory for an entire list upfront, they maintain state and compute items on demand.", key_points: "yield keyword, lazy evaluation, memory efficiency, iterators" },
            { id: 103, question: "How does the Global Interpreter Lock (GIL) impact multithreading in CPython?", model_answer: "The GIL ensures that only one native thread executes Python bytecode at a time. This prevents true multi-core CPU parallelism in pure Python threads, requiring the multiprocessing module for CPU-intensive workloads.", key_points: "CPython, mutex, CPU-bound vs I/O-bound, multiprocessing" }
        ],
        'DBMS': [
            { id: 201, question: "Explain the ACID properties of database transactions.", model_answer: "ACID stands for Atomicity (all or nothing), Consistency (preserves valid states and constraints), Isolation (concurrent transactions execute without interference), and Durability (committed changes persist through crashes).", key_points: "atomicity, consistency, isolation levels, durability, WAL" },
            { id: 202, question: "What is the difference between Clustered and Non-Clustered indexing?", model_answer: "A clustered index physically sorts and stores data rows on disk based on the key; a table can have only one. A non-clustered index stores keys with pointers back to data rows, allowing multiple secondary indexes.", key_points: "B-Tree, physical order, pointers, primary key, leaf nodes" }
        ],
        'HR': [
            { id: 301, question: "Tell me about a time you faced a technical hurdle and how you overcame it.", model_answer: "Using the STAR method: explain the Situation and Task, the specific Actions you took (debugging, profiling, consulting docs), and the quantifiable Result achieved.", key_points: "STAR method, problem solving, teamwork, resilience" }
        ]
    };

    const qList = banks[category] || banks['Python'];
    return qList.slice(0, count || 3);
}

function advanceMockInterview() {
    stopSpeechRecognition();
    stopAllSpeechSynthesis();

    if (mockQuestionIndex < activeMockQuestions.length - 1) {
        mockQuestionIndex++;
        renderMockInterviewQuestion();
    } else {
        document.getElementById('mockRoomScreen').style.display = 'none';
        document.getElementById('mockFinalSummaryScreen').style.display = 'block';

        const total = recordedSubmissions.reduce((sum, item) => sum + (parseFloat(item.score) || 0), 0);
        const avg = recordedSubmissions.length > 0 ? (total / recordedSubmissions.length).toFixed(1) : '8.0';
        const finalScoreEl = document.getElementById('finalOverallScore');
        if (finalScoreEl) finalScoreEl.textContent = `${avg} / 10`;

        const summaryTextEl = document.getElementById('finalSummaryText');
        if (summaryTextEl) {
            summaryTextEl.textContent = `Completed ${recordedSubmissions.length} questions in ${selectedTrack}. Your placement rating (${avg}/10) is logged in your dashboard!`;
        }

        window.showToast("Technical assessment successfully completed!", "success");
    }
}

function resetMockArena() {
    stopSpeechRecognition();
    stopAllSpeechSynthesis();

    document.getElementById('mockFinalSummaryScreen').style.display = 'none';
    document.getElementById('mockRoomScreen').style.display = 'none';
    document.getElementById('mockSetupScreen').style.display = 'block';
}

/* ==========================================================================
   HIGH-CLARITY SPEECH RECOGNITION (PERSISTENT & ACCURATE MIC ENGINE)
   ========================================================================== */
function getSelectedAccentLang() {
    const langSelect = document.getElementById('mockSpeechLang');
    return langSelect ? langSelect.value : 'en-IN';
}

function createAndStartRecognizer() {
    if (!userWantsRecording) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Clean up previous instance properly to prevent InvalidStateError
    if (speechRecognizer) {
        try {
            speechRecognizer.onstart = null;
            speechRecognizer.onresult = null;
            speechRecognizer.onerror = null;
            speechRecognizer.onend = null;
            speechRecognizer.abort();
        } catch (e) {}
        speechRecognizer = null;
    }

    try {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = getSelectedAccentLang();
        recognizer.maxAlternatives = 1;

        recognizer.onstart = () => {
            updateMicUI(true);
        };

        recognizer.onresult = (event) => {
            hasReceivedSpeechTranscript = true;
            hideSpeechFallbackNotice();

            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptChunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscriptHistory += transcriptChunk + ' ';
                } else {
                    interim += transcriptChunk;
                }
            }

            // Real-time live transcript display
            const livePreview = document.getElementById('mockLiveTranscriptPreview');
            const liveText = document.getElementById('mockLiveTranscriptText');
            const currentWords = (interim || finalTranscriptHistory.trim().slice(-60)).trim();
            if (livePreview && liveText && currentWords) {
                livePreview.style.display = 'flex';
                liveText.textContent = `"${currentWords}"`;
            }

            // Real-time textarea insertion
            const answerBox = document.getElementById('mockAnswerInput');
            if (answerBox) {
                const combined = [speechBaseText, finalTranscriptHistory, interim]
                    .filter(Boolean)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (combined) {
                    answerBox.value = combined;
                    answerBox.scrollTop = answerBox.scrollHeight;
                }
            }

            // Active Voice badge
            const voiceBadge = document.getElementById('mockVoiceDetectedBadge');
            if (voiceBadge) {
                voiceBadge.textContent = 'Voice Detected';
                voiceBadge.className = 'badge badge-success';
            }
        };

        recognizer.onerror = (event) => {
            console.warn("Speech recognition error event:", event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                userWantsRecording = false;
                stopSpeechRecognition();
                if (window.showToast) {
                    window.showToast("Microphone access blocked. Please allow mic permission in your browser address bar.", "danger");
                }
                return;
            }

            // If Chrome cloud speech API has a network dropout or mic buffer error
            if (event.error === 'network' || event.error === 'audio-capture') {
                showSpeechFallbackNotice("Cloud transcription is delayed or offline. You can type directly or click 'Sample Answer' to populate the answer.");
            }

            // 'no-speech' is normal silence timeout
            if (event.error === 'no-speech') {
                const voiceBadge = document.getElementById('mockVoiceDetectedBadge');
                if (voiceBadge) {
                    voiceBadge.textContent = 'Listening...';
                    voiceBadge.className = 'badge badge-info';
                }
            }
        };

        recognizer.onend = () => {
            // When Chrome finishes a recognition cycle, instantiate a FRESH recognizer to avoid InvalidStateError
            if (userWantsRecording) {
                setTimeout(() => {
                    if (userWantsRecording) {
                        createAndStartRecognizer();
                    }
                }, 200);
            } else {
                updateMicUI(false);
            }
        };

        speechRecognizer = recognizer;
        speechRecognizer.start();
    } catch (err) {
        console.error("Critical error starting SpeechRecognition:", err);
        showSpeechFallbackNotice("Could not start speech dictation. You can type directly or click 'Sample Answer'.");
    }
}

async function toggleSpeechRecognition() {
    stopAllSpeechSynthesis();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        if (window.showToast) {
            window.showToast("Speech recognition is not supported in this browser. Please use Chrome or Edge.", "warning");
        } else {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
        }
        return;
    }

    if (userWantsRecording) {
        // User clicked stop
        userWantsRecording = false;
        stopSpeechRecognition();
        if (window.showToast) window.showToast("Microphone dictation stopped.", "info");
    } else {
        // User clicked start
        userWantsRecording = true;
        hasReceivedSpeechTranscript = false;
        speakingFramesCounter = 0;
        hideSpeechFallbackNotice();

        const answerBox = document.getElementById('mockAnswerInput');
        speechBaseText = answerBox ? answerBox.value.trim() : '';
        finalTranscriptHistory = '';

        // 1. Start SpeechRecognition FIRST so mic hardware is not locked
        createAndStartRecognizer();

        // 2. Start hardware audio level visualizer asynchronously without blocking
        startAudioLevelVisualizer().catch(err => {
            console.warn("Visualizer failed to start, speech recognizer continues:", err);
        });

        if (window.showToast) window.showToast("Microphone listening! Speak your technical answer clearly.", "success");
    }
}

function stopSpeechRecognition() {
    userWantsRecording = false;
    if (speechRecognizer) {
        try {
            speechRecognizer.onstart = null;
            speechRecognizer.onresult = null;
            speechRecognizer.onerror = null;
            speechRecognizer.onend = null;
            speechRecognizer.stop();
        } catch (e) {}
        speechRecognizer = null;
    }
    stopAudioLevelVisualizer();
    updateMicUI(false);

    const livePreview = document.getElementById('mockLiveTranscriptPreview');
    if (livePreview) livePreview.style.display = 'none';
}

function updateMicUI(recording) {
    const micBtn = document.getElementById('mockMicBtn');
    const micIcon = document.getElementById('mockMicIcon');
    const micLabel = document.getElementById('mockMicLabel');
    const statusBox = document.getElementById('mockSpeechStatus');

    if (!micBtn) return;

    if (recording) {
        micBtn.classList.add('mic-recording-active');
        if (micIcon) micIcon.className = 'fa-solid fa-stop';
        if (micLabel) micLabel.textContent = 'Stop Dictation';
        if (statusBox) statusBox.style.display = 'flex';
    } else {
        micBtn.classList.remove('mic-recording-active');
        if (micIcon) micIcon.className = 'fa-solid fa-microphone';
        if (micLabel) micLabel.textContent = 'Speak Answer (Mic)';
        if (statusBox) statusBox.style.display = 'none';
    }
}

/* ==========================================================================
   HARDWARE AUDIO STREAM & REAL-TIME SOUND VISUALIZER
   ========================================================================== */
async function startAudioLevelVisualizer() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioContext = new AudioContextClass();

        const source = audioContext.createMediaStreamSource(micStream);
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 64;
        source.connect(audioAnalyser);

        const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);

        function updateWaveMeters() {
            if (!userWantsRecording) return;
            audioAnalyser.getByteFrequencyData(dataArray);

            // Compute volume
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const avgVolume = sum / dataArray.length;

            const bars = [
                document.getElementById('vBar1'),
                document.getElementById('vBar2'),
                document.getElementById('vBar3'),
                document.getElementById('vBar4'),
                document.getElementById('vBar5')
            ];

            const voiceBadge = document.getElementById('mockVoiceDetectedBadge');

            if (avgVolume > 8) {
                // User is speaking into mic
                if (voiceBadge) {
                    voiceBadge.textContent = 'Voice Detected';
                    voiceBadge.className = 'badge badge-success';
                }
                bars.forEach((bar, idx) => {
                    if (bar) {
                        const h = Math.min(18, Math.max(4, Math.round((dataArray[idx * 2] / 255) * 18)));
                        bar.style.height = `${h}px`;
                        bar.style.background = '#10B981';
                    }
                });

                // Detect if user has been speaking continuously without browser cloud transcript
                speakingFramesCounter++;
                if (speakingFramesCounter > 120 && !hasReceivedSpeechTranscript && userWantsRecording) {
                    showSpeechFallbackNotice("Voice detected! If browser speech-to-text is delayed, you can type directly or click 'Sample Answer'.");
                }
            } else {
                // Ambient or pause
                bars.forEach((bar, idx) => {
                    if (bar) {
                        const baseH = [4, 6, 8, 5, 6][idx];
                        bar.style.height = `${baseH}px`;
                        bar.style.background = 'rgba(255,255,255,0.2)';
                    }
                });
            }

            animFrameId = requestAnimationFrame(updateWaveMeters);
        }

        updateWaveMeters();
    } catch (err) {
        console.warn("Audio visualizer notice (hardware mic occupied or muted):", err);
    }
}

function stopAudioLevelVisualizer() {
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
        try { audioContext.close(); } catch (e) {}
        audioContext = null;
    }
}

/* ==========================================================================
   SMART CANDIDATE ANSWER ARTICULATION & NOTIFICATIONS
   ========================================================================== */
function articulateSampleAnswer() {
    const q = activeMockQuestions[mockQuestionIndex];
    if (!q) {
        if (window.showToast) window.showToast("No active question to articulate.", "warning");
        return;
    }

    if (userWantsRecording) {
        stopSpeechRecognition();
    }

    const answerBox = document.getElementById('mockAnswerInput');
    if (!answerBox) return;

    let candidateText = '';
    if (q.model_answer) {
        candidateText = q.model_answer.trim();
    } else if (q.key_points) {
        candidateText = `Key technical checkpoints:\n- ` + q.key_points.split(',').map(s => s.trim()).join('\n- ');
    } else {
        candidateText = `In technical interviews, addressing ${q.question.replace(/\?$/, '')} requires explaining core principles, internal architecture, trade-offs, and production examples.`;
    }

    answerBox.value = candidateText;
    answerBox.focus();
    answerBox.scrollTop = answerBox.scrollHeight;

    hideSpeechFallbackNotice();

    if (window.showToast) {
        window.showToast("Sample technical response populated! You can review, edit, or submit for evaluation.", "success");
    }
}

function showSpeechFallbackNotice(msg) {
    const notice = document.getElementById('mockSpeechNotice');
    const noticeText = document.getElementById('mockSpeechNoticeText');
    if (notice && noticeText) {
        if (msg) noticeText.textContent = msg;
        notice.style.display = 'flex';
    }
}

function hideSpeechFallbackNotice() {
    const notice = document.getElementById('mockSpeechNotice');
    if (notice) notice.style.display = 'none';
}

/* ==========================================================================
   FLUENT, NATURAL TEXT-TO-SPEECH (TTS) ENGINE FOR QUESTION & FEEDBACK
   ========================================================================== */
function speakTextFluently(text, onStartCallback, onEndCallback) {
    if (!('speechSynthesis' in window)) {
        if (window.showToast) window.showToast("Speech audio is not supported in this browser.", "warning");
        return;
    }

    stopAllSpeechSynthesis();
    stopSpeechRecognition();

    const cleanText = text.replace(/[*_#`]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.96;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const chosenVoice = getBestSpeechVoice();
    if (chosenVoice) {
        utterance.voice = chosenVoice;
    }

    // Keep-alive heartbeat to prevent Chrome 14-second audio pause
    if (ttsHeartbeat) clearInterval(ttsHeartbeat);
    ttsHeartbeat = setInterval(() => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
        } else {
            clearInterval(ttsHeartbeat);
            ttsHeartbeat = null;
        }
    }, 10000);

    utterance.onstart = () => {
        if (onStartCallback) onStartCallback();
    };

    utterance.onend = utterance.onerror = () => {
        if (ttsHeartbeat) {
            clearInterval(ttsHeartbeat);
            ttsHeartbeat = null;
        }
        if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
}

function toggleReadQuestion() {
    if (isSpeakingQuestion) {
        stopAllSpeechSynthesis();
        return;
    }

    const qText = document.getElementById('mockQuestionText')?.textContent?.trim();
    if (!qText) return;

    const speakerBtn = document.getElementById('mockReadQuestionBtn');
    const speakerIcon = document.getElementById('mockSpeakerIcon');
    const speakerText = document.getElementById('mockSpeakerText');

    speakTextFluently(
        `Technical Question: ${qText}`,
        () => {
            isSpeakingQuestion = true;
            if (speakerBtn) speakerBtn.classList.add('btn-primary');
            if (speakerIcon) speakerIcon.className = 'fa-solid fa-pause';
            if (speakerText) speakerText.textContent = 'Stop';
        },
        () => {
            isSpeakingQuestion = false;
            if (speakerBtn) speakerBtn.classList.remove('btn-primary');
            if (speakerIcon) speakerIcon.className = 'fa-solid fa-volume-high';
            if (speakerText) speakerText.textContent = 'Listen';
        }
    );
}

function toggleReadFeedback() {
    if (isSpeakingFeedback) {
        stopAllSpeechSynthesis();
        return;
    }

    const score = document.getElementById('fbScore')?.textContent || '';
    const rating = document.getElementById('fbRatingBadge')?.textContent || '';
    const modelAns = document.getElementById('fbModelAns')?.textContent || '';
    
    // Strengths
    const strengths = Array.from(document.querySelectorAll('#fbStrengthsList li'))
        .map(li => li.textContent).join('. ');
    // Improvements
    const improvements = Array.from(document.querySelectorAll('#fbImprovementsList li'))
        .map(li => li.textContent).join('. ');

    const fullFeedback = `Evaluation score: ${score}, rating ${rating}. Strengths: ${strengths}. Key areas to improve: ${improvements}. Model benchmark answer summary: ${modelAns}`;

    const fbSpeakerBtn = document.getElementById('mockReadFeedbackBtn');
    const fbSpeakerIcon = document.getElementById('mockFeedbackSpeakerIcon');
    const fbSpeakerText = document.getElementById('mockFeedbackSpeakerText');

    speakTextFluently(
        fullFeedback,
        () => {
            isSpeakingFeedback = true;
            if (fbSpeakerBtn) fbSpeakerBtn.classList.add('btn-primary');
            if (fbSpeakerIcon) fbSpeakerIcon.className = 'fa-solid fa-pause';
            if (fbSpeakerText) fbSpeakerText.textContent = 'Stop';
        },
        () => {
            isSpeakingFeedback = false;
            if (fbSpeakerBtn) fbSpeakerBtn.classList.remove('btn-primary');
            if (fbSpeakerIcon) fbSpeakerIcon.className = 'fa-solid fa-volume-high';
            if (fbSpeakerText) fbSpeakerText.textContent = 'Listen Feedback';
        }
    );
}

function stopAllSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (ttsHeartbeat) {
        clearInterval(ttsHeartbeat);
        ttsHeartbeat = null;
    }
    isSpeakingQuestion = false;
    isSpeakingFeedback = false;

    const speakerBtn = document.getElementById('mockReadQuestionBtn');
    const speakerIcon = document.getElementById('mockSpeakerIcon');
    const speakerText = document.getElementById('mockSpeakerText');
    if (speakerBtn) speakerBtn.classList.remove('btn-primary');
    if (speakerIcon) speakerIcon.className = 'fa-solid fa-volume-high';
    if (speakerText) speakerText.textContent = 'Listen';

    const fbSpeakerBtn = document.getElementById('mockReadFeedbackBtn');
    const fbSpeakerIcon = document.getElementById('mockFeedbackSpeakerIcon');
    const fbSpeakerText = document.getElementById('mockFeedbackSpeakerText');
    if (fbSpeakerBtn) fbSpeakerBtn.classList.remove('btn-primary');
    if (fbSpeakerIcon) fbSpeakerIcon.className = 'fa-solid fa-volume-high';
    if (fbSpeakerText) fbSpeakerText.textContent = 'Listen Feedback';
}
