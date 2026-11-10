// CareerX - Aptitude Trainer (aptitude.js)
// Timed aptitude test logic, scoring, and history tracking

let aptitudeCategory = 'All';
let quizQuestions = [];
let quizCurrentIndex = 0;
let studentAnswers = {};
let quizTimerId = null;
let remainingSeconds = 300;
let totalQuizSeconds = 300;

// Benchmark default test records
const DEFAULT_TEST_RECORDS = [
    {
        category: 'Quantitative Aptitude',
        score: '5 / 6',
        accuracy: '83%',
        timeSpent: '4m 12s',
        status: 'Cleared',
        date: 'Today, 10:30 AM'
    },
    {
        category: 'Logical Reasoning',
        score: '6 / 6',
        accuracy: '100%',
        timeSpent: '3m 45s',
        status: 'Mastery',
        date: 'Yesterday'
    },
    {
        category: 'Verbal Ability',
        score: '4 / 5',
        accuracy: '80%',
        timeSpent: '2m 55s',
        status: 'Cleared',
        date: '2 days ago'
    }
];

function getTestHistory() {
    try {
        const stored = localStorage.getItem('careerx_test_history');
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_TEST_RECORDS;
}

function saveTestRecord(record) {
    try {
        let history = getTestHistory();
        if (!Array.isArray(history)) history = [...DEFAULT_TEST_RECORDS];
        history.unshift(record);
        if (history.length > 20) history = history.slice(0, 20);
        localStorage.setItem('careerx_test_history', JSON.stringify(history));
        renderPastTestRecords();
    } catch (e) {
        console.error('Error saving test record', e);
    }
}

function renderPastTestRecords() {
    const tbody = document.getElementById('pastTestRecordsBody');
    if (!tbody) return;
    const history = getTestHistory();
    if (!history || history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No test attempts logged yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = history.map(rec => {
        const statusBadge = rec.status === 'Mastery' ? 'badge-success' : (rec.status === 'Cleared' ? 'badge-primary' : (rec.status === 'Cancelled' ? 'badge-warning' : 'badge-danger'));
        const accBadge = rec.accuracy === 'N/A' ? 'badge-warning' : (parseInt(rec.accuracy) >= 80 ? 'badge-success' : (parseInt(rec.accuracy) >= 60 ? 'badge-primary' : 'badge-danger'));
        return `
            <tr>
                <td><strong>${rec.category}</strong> <div style="font-size: 0.75rem; color: var(--text-muted);">${rec.date || 'Recent'}</div></td>
                <td>${rec.score}</td>
                <td><span class="badge ${accBadge}">${rec.accuracy}</span></td>
                <td>${rec.timeSpent}</td>
                <td><span class="badge ${statusBadge}">${rec.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Fallback questions if store is empty
const defaultAptitudeBank = [
    {
        id: 1,
        category: "Quantitative",
        question: "A train 120m long passes a pole in 6 seconds. What is the speed of the train in km/hr?",
        options: { A: "60 km/hr", B: "72 km/hr", C: "80 km/hr", D: "90 km/hr" },
        correct: "B",
        explanation: "Speed = Distance / Time = 120m / 6s = 20 m/s. In km/hr: 20 * (18/5) = 72 km/hr."
    },
    {
        id: 2,
        category: "Quantitative",
        question: "A sum invested at 10% compound interest per annum amounts to $2420 in 2 years. Find the principal sum.",
        options: { A: "$2000", B: "$2100", C: "$1900", D: "$1800" },
        correct: "A",
        explanation: "Amount = P(1 + r/100)^t => 2420 = P(1.1)^2 => P = 2420 / 1.21 = $2000."
    },
    {
        id: 3,
        category: "Logical",
        question: "Complete the numerical pattern sequence: 3, 8, 15, 24, 35, ?",
        options: { A: "46", B: "48", C: "50", D: "52" },
        correct: "B",
        explanation: "The increments are consecutive odd numbers: +5, +7, +9, +11. Next difference is +13: 35 + 13 = 48."
    },
    {
        id: 4,
        category: "Logical",
        question: "Pointing to a photograph, a woman says: 'He is the only son of the wife of my husband.' How is the person related to the woman?",
        options: { A: "Brother", B: "Nephew", C: "Son", D: "Father" },
        correct: "C",
        explanation: "The 'wife of my husband' is the woman herself. Her 'only son' is her Son."
    },
    {
        id: 5,
        category: "Verbal",
        question: "Select the word that is most opposite in meaning to CANDID:",
        options: { A: "Devious", B: "Honest", C: "Sincere", D: "Frank" },
        correct: "A",
        explanation: "Candid means straightforward and honest. The antonym is devious."
    },
    {
        id: 6,
        category: "Verbal",
        question: "Choose the sentence with correct grammatical structure and punctuation:",
        options: {
            A: "The candidate, prepared and confident, entered the interview room.",
            B: "The candidate prepared, and confident entered the interview room.",
            C: "The candidate prepared and confident entered, the interview room.",
            D: "The candidate prepared and, confident entered the interview room."
        },
        correct: "A",
        explanation: "Option A correctly encloses the descriptive phrase 'prepared and confident' in commas."
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // Category filter tabs
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aptitudeCategory = btn.getAttribute('data-cat') || 'All';
        });
    });

    const startBtn = document.getElementById('startQuizBtn');
    if (startBtn) startBtn.addEventListener('click', startQuiz);

    const prevBtn = document.getElementById('prevQuestionBtn');
    if (prevBtn) prevBtn.addEventListener('click', prevQuestion);

    const nextBtn = document.getElementById('nextQuestionBtn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

    const finishBtn = document.getElementById('finishQuizBtn');
    if (finishBtn) finishBtn.addEventListener('click', submitQuiz);

    const cancelBtn = document.getElementById('cancelQuizBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', handleCancelQuiz);

    const cancelTopBtn = document.getElementById('cancelQuizTopBtn');
    if (cancelTopBtn) cancelTopBtn.addEventListener('click', handleCancelQuiz);

    const clearHistoryBtn = document.getElementById('clearTestHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm("Reset past test records to default sample benchmarks?")) {
                localStorage.removeItem('careerx_test_history');
                renderPastTestRecords();
                if (window.showToast) window.showToast("Test history reset", "info");
            }
        });
    }

    renderPastTestRecords();
});

// Cancel and exit current test session
function handleCancelQuiz() {
    if (confirm("Are you sure you want to cancel the test? Your current attempt will be recorded as Cancelled.")) {
        const timeSpentSec = Math.max(1, totalQuizSeconds - remainingSeconds);
        const mins = Math.floor(timeSpentSec / 60);
        const secs = timeSpentSec % 60;
        const timeSpentStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const answeredCount = Object.keys(studentAnswers).length;

        saveTestRecord({
            category: aptitudeCategory === 'All' ? 'Comprehensive Assessment' : `${aptitudeCategory} Aptitude`,
            score: `${answeredCount} / ${quizQuestions.length} answered`,
            accuracy: 'N/A',
            timeSpent: timeSpentStr,
            status: 'Cancelled',
            date: 'Just now'
        });

        resetQuizArena();
        if (window.showToast) window.showToast("Test cancelled and logged in records.", "info");
    }
}

// Start aptitude test
function startQuiz() {
    let list = [];
    if (window.CareerXStore) {
        list = window.CareerXStore.getAptitudeQuestions(aptitudeCategory);
    }
    if (!list || list.length === 0) {
        list = defaultAptitudeBank.filter(q => aptitudeCategory === 'All' || q.category === aptitudeCategory);
    }

    quizQuestions = list;
    quizCurrentIndex = 0;
    studentAnswers = {};
    remainingSeconds = quizQuestions.length * 60;
    totalQuizSeconds = remainingSeconds;

    document.getElementById('quizStartScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'none';
    document.getElementById('quizActiveScreen').style.display = 'block';

    renderQuestion();
    startTimer();
}

// Timer countdown
function startTimer() {
    clearInterval(quizTimerId);
    quizTimerId = setInterval(() => {
        remainingSeconds--;
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        const timerText = document.getElementById('quizTimerText');
        if (timerText) {
            timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        if (remainingSeconds <= 0) {
            clearInterval(quizTimerId);
            if (window.showToast) window.showToast('Time is up! Submitting answers.', 'warning');
            submitQuiz();
        }
    }, 1000);
}

// Render active question and options
function renderQuestion() {
    const q = quizQuestions[quizCurrentIndex];
    if (!q) return;

    document.getElementById('quizCategoryBadge').textContent = q.category;
    document.getElementById('questionProgressText').textContent = `Question ${quizCurrentIndex + 1} of ${quizQuestions.length}`;
    document.getElementById('questionTitle').textContent = q.question;

    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';

    const selected = studentAnswers[q.id];

    Object.entries(q.options).forEach(([key, text]) => {
        const isChosen = selected === key;
        const btn = document.createElement('div');
        btn.style.cssText = `
            display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.15rem;
            border-radius: 8px; cursor: pointer; transition: all 0.2s;
            background: ${isChosen ? 'rgba(79, 70, 229, 0.08)' : '#FFFFFF'};
            border: 1.5px solid ${isChosen ? 'var(--primary)' : 'var(--border-color)'};
        `;
        btn.innerHTML = `
            <div style="width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; background: ${isChosen ? 'var(--primary)' : '#F1F5F9'}; color: ${isChosen ? '#FFF' : '#334155'};">
                ${key}
            </div>
            <div style="font-weight: 500; color: ${isChosen ? 'var(--primary)' : 'var(--text-primary)'};">
                ${text}
            </div>
        `;
        btn.addEventListener('click', () => {
            studentAnswers[q.id] = key;
            renderQuestion();
        });
        container.appendChild(btn);
    });

    document.getElementById('prevQuestionBtn').style.visibility = quizCurrentIndex === 0 ? 'hidden' : 'visible';
    const isLast = quizCurrentIndex === quizQuestions.length - 1;
    document.getElementById('nextQuestionBtn').style.display = isLast ? 'none' : 'inline-flex';
    document.getElementById('finishQuizBtn').style.display = isLast ? 'inline-flex' : 'none';
}

function prevQuestion() {
    if (quizCurrentIndex > 0) {
        quizCurrentIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (quizCurrentIndex < quizQuestions.length - 1) {
        quizCurrentIndex++;
        renderQuestion();
    }
}

// Evaluate and show results
function submitQuiz() {
    clearInterval(quizTimerId);

    let correct = 0;
    const breakdown = quizQuestions.map(q => {
        const choice = studentAnswers[q.id] || null;
        const isCorrect = choice === q.correct;
        if (isCorrect) correct++;
        return {
            question: q.question,
            user_choice: choice,
            correct_option: q.correct,
            explanation: q.explanation,
            is_correct: isCorrect
        };
    });

    const accuracy = Math.round((correct / quizQuestions.length) * 100);

    // Show result view
    document.getElementById('quizActiveScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'block';
    document.getElementById('resAccuracy').textContent = `${accuracy}%`;
    document.getElementById('resScoreSummary').textContent = `You scored ${correct} out of ${quizQuestions.length} correct.`;
    document.getElementById('resHeadline').textContent = accuracy >= 80 ? 'Great job! Outstanding Accuracy! 🎯' : 'Good effort! Review the solutions below:';

    const expList = document.getElementById('explanationsList');
    expList.innerHTML = '';

    breakdown.forEach((item, idx) => {
        const card = document.createElement('div');
        card.style.cssText = `
            padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; background: #FFF;
            border: 1px solid var(--border-color); border-left: 4px solid ${item.is_correct ? '#10B981' : '#EF4444'};
        `;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                <strong>Q${idx + 1}: ${item.question}</strong>
                <span class="badge ${item.is_correct ? 'badge-success' : 'badge-danger'}">${item.is_correct ? 'Correct' : 'Incorrect'}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
                Your Answer: <strong>Option ${item.user_choice || 'None'}</strong> | Correct: <strong style="color: #059669;">Option ${item.correct_option}</strong>
            </div>
            <div style="background: rgba(79, 70, 229, 0.05); padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.82rem;">
                💡 <strong>Explanation:</strong> ${item.explanation}
            </div>
        `;
        expList.appendChild(card);
    });

    // Update store readiness
    if (window.CareerXStore) {
        window.CareerXStore.updateDiagnostics({ aptitude: accuracy });
    }

    // Save attempt to test history
    const timeSpentSec = Math.max(1, totalQuizSeconds - remainingSeconds);
    const mins = Math.floor(timeSpentSec / 60);
    const secs = timeSpentSec % 60;
    const timeSpentStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    saveTestRecord({
        category: aptitudeCategory === 'All' ? 'Comprehensive Aptitude' : `${aptitudeCategory} Aptitude`,
        score: `${correct} / ${quizQuestions.length}`,
        accuracy: `${accuracy}%`,
        timeSpent: timeSpentStr,
        status: accuracy >= 90 ? 'Mastery' : (accuracy >= 65 ? 'Cleared' : 'Needs Practice'),
        date: 'Just now'
    });

    if (window.showToast) window.showToast('Test evaluated successfully!', 'success');
}

// Reset quiz to category selection
function resetQuizArena() {
    clearInterval(quizTimerId);
    document.getElementById('quizResultScreen').style.display = 'none';
    document.getElementById('quizActiveScreen').style.display = 'none';
    document.getElementById('quizStartScreen').style.display = 'block';
}
