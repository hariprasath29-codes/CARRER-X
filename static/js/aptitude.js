// Aptitude Trainer & Timed Test Arena (aptitude.js)

let aptitudeCategory = 'All';
let quizQuestions = [];
let quizCurrentIndex = 0;
let studentAnswers = {};
let quizTimerId = null;
let remainingSeconds = 600;
let elapsedSeconds = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Category tabs
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aptitudeCategory = btn.getAttribute('data-cat');
        });
    });

    const startBtn = document.getElementById('startQuizBtn');
    if (startBtn) startBtn.addEventListener('click', startAptitudeQuiz);

    const prevBtn = document.getElementById('prevQuestionBtn');
    if (prevBtn) prevBtn.addEventListener('click', prevQuizQuestion);

    const nextBtn = document.getElementById('nextQuestionBtn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuizQuestion);

    const finishBtn = document.getElementById('finishQuizBtn');
    if (finishBtn) finishBtn.addEventListener('click', submitAptitudeQuiz);
});

async function startAptitudeQuiz() {
    try {
        try {
            const res = await fetch(`/api/aptitude/questions?category=${encodeURIComponent(aptitudeCategory)}&limit=6`);
            quizQuestions = await res.json();
        } catch (err) {
            // Live Server client fallback questions
            quizQuestions = getClientAptitudeQuestions(aptitudeCategory);
        }

        if (!quizQuestions || quizQuestions.length === 0) {
            quizQuestions = getClientAptitudeQuestions(aptitudeCategory);
        }

        quizCurrentIndex = 0;
        studentAnswers = {};
        remainingSeconds = quizQuestions.length * 90;
        elapsedSeconds = 0;

        document.getElementById('quizStartScreen').style.display = 'none';
        document.getElementById('quizResultScreen').style.display = 'none';
        document.getElementById('quizActiveScreen').style.display = 'block';

        renderQuizQuestion();
        runQuizTimer();
    } catch (err) {
        console.error("Error loading questions:", err);
        window.showToast("Failed to load questions.", "danger");
    }
}

function runQuizTimer() {
    clearInterval(quizTimerId);
    quizTimerId = setInterval(() => {
        remainingSeconds--;
        elapsedSeconds++;

        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        const timerText = document.getElementById('quizTimerText');
        if (timerText) {
            timerText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        if (remainingSeconds <= 0) {
            clearInterval(quizTimerId);
            window.showToast("Time expired! Submitting test automatically.", "warning");
            submitAptitudeQuiz();
        }
    }, 1000);
}

function renderQuizQuestion() {
    const q = quizQuestions[quizCurrentIndex];
    if (!q) return;

    document.getElementById('quizCategoryBadge').textContent = q.category;
    document.getElementById('questionProgressText').textContent = `Question ${quizCurrentIndex + 1} of ${quizQuestions.length}`;
    document.getElementById('questionTitle').textContent = q.question;

    const optContainer = document.getElementById('optionsContainer');
    optContainer.innerHTML = '';

    const savedChoice = studentAnswers[q.id];

    for (const [key, text] of Object.entries(q.options)) {
        const optBtn = document.createElement('div');
        const isSelected = savedChoice === key;
        optBtn.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            border-radius: var(--radius-sm);
            background: ${isSelected ? 'rgba(79, 70, 229, 0.08)' : '#FFFFFF'};
            border: 1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
            box-shadow: ${isSelected ? '0 2px 8px rgba(79, 70, 229, 0.15)' : 'var(--shadow-sm)'};
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        optBtn.innerHTML = `
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${isSelected ? 'var(--primary)' : '#F1F5F9'}; color: ${isSelected ? '#FFFFFF' : '#334155'}; border: 1px solid ${isSelected ? 'var(--primary)' : '#CBD5E1'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem;">
                ${key}
            </div>
            <div style="font-size: 0.95rem; font-weight: ${isSelected ? '600' : '500'}; color: ${isSelected ? 'var(--primary)' : 'var(--text-primary)'};">
                ${text}
            </div>
        `;

        optBtn.addEventListener('click', () => {
            studentAnswers[q.id] = key;
            renderQuizQuestion();
        });

        optContainer.appendChild(optBtn);
    }

    // Controls
    document.getElementById('prevQuestionBtn').style.visibility = quizCurrentIndex === 0 ? 'hidden' : 'visible';
    const isLast = quizCurrentIndex === quizQuestions.length - 1;
    document.getElementById('nextQuestionBtn').style.display = isLast ? 'none' : 'inline-flex';
    document.getElementById('finishQuizBtn').style.display = isLast ? 'inline-flex' : 'none';
}

function prevQuizQuestion() {
    if (quizCurrentIndex > 0) {
        quizCurrentIndex--;
        renderQuizQuestion();
    }
}

function nextQuizQuestion() {
    if (quizCurrentIndex < quizQuestions.length - 1) {
        quizCurrentIndex++;
        renderQuizQuestion();
    }
}

async function submitAptitudeQuiz() {
    clearInterval(quizTimerId);
    try {
        const res = await fetch('/api/aptitude/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: aptitudeCategory,
                answers: studentAnswers,
                time_spent_sec: elapsedSeconds
            })
        });

        const data = await res.json();
        showAptitudeResults(data);
    } catch (err) {
        // Fallback: evaluate client-side for standalone Live Server
        let correctCount = 0;
        const total = quizQuestions.length;
        const reviewList = quizQuestions.map(q => {
            const chosen = studentAnswers[q.id] || null;
            const isCorrect = chosen === q.correct;
            if (isCorrect) correctCount++;
            return {
                id: q.id,
                question: q.question,
                chosen: chosen,
                correct: q.correct,
                explanation: q.explanation || "Correct answer: Option " + q.correct,
                is_correct: isCorrect
            };
        });

        const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        showAptitudeResults({
            score: correctCount,
            total: total,
            accuracy: accuracy,
            time_spent: `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`,
            review: reviewList
        });
        window.showToast("Test evaluated locally (Live Server mode)!", "success");
    }
}

function getClientAptitudeQuestions(cat) {
    const questions = [
        {
            id: 1,
            category: "Quantitative",
            question: "A train 120m long passes a pole in 6 seconds. What is the speed of the train in km/hr?",
            options: { A: "60 km/hr", B: "72 km/hr", C: "80 km/hr", D: "90 km/hr" },
            correct: "B",
            explanation: "Speed = Distance / Time = 120m / 6s = 20 m/s. Convert to km/hr: 20 * (18/5) = 72 km/hr."
        },
        {
            id: 2,
            category: "Quantitative",
            question: "A sum invested at 10% compound interest per annum amounts to $2420 in 2 years. Find the principal sum.",
            options: { A: "$2000", B: "$2100", C: "$1900", D: "$1800" },
            correct: "A",
            explanation: "Amount = P(1 + r/100)^t => 2420 = P(1.10)^2 => 2420 = 1.21 * P => P = 2420 / 1.21 = $2000."
        },
        {
            id: 3,
            category: "Logical",
            question: "Complete the numerical pattern sequence: 3, 8, 15, 24, 35, ?",
            options: { A: "46", B: "48", C: "50", D: "52" },
            correct: "B",
            explanation: "The increments are consecutive odd numbers: +5, +7, +9, +11. The next difference is +13: 35 + 13 = 48."
        },
        {
            id: 4,
            category: "Logical",
            question: "Pointing to a photograph, a woman says: 'He is the only son of the wife of my husband.' How is the person related to the woman?",
            options: { A: "Brother", B: "Nephew", C: "Son", D: "Father" },
            correct: "C",
            explanation: "The 'wife of my husband' is the woman herself. Her 'only son' is clearly her Son."
        },
        {
            id: 5,
            category: "Verbal",
            question: "Select the word that is most opposite in meaning to CANDID:",
            options: { A: "Devious", B: "Honest", C: "Sincere", D: "Frank" },
            correct: "A",
            explanation: "Candid means straightforward, honest, and frank. The antonym is devious (deceitful/dishonest)."
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
            explanation: "Option A correctly encloses the non-essential descriptive phrase 'prepared and confident' in commas."
        }
    ];

    if (!cat || cat === 'All') return questions;
    return questions.filter(q => q.category.toLowerCase() === cat.toLowerCase());
}

function showAptitudeResults(data) {
    document.getElementById('quizActiveScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'block';

    document.getElementById('resAccuracy').textContent = data.accuracy_pct + "%";
    document.getElementById('resScoreSummary').textContent = `You scored ${data.score} out of ${data.total} correct.`;
    document.getElementById('resHeadline').textContent = data.accuracy_pct >= 80 ? 'Outstanding Speed & Accuracy! 🎯' : 'Good Attempt! Review the solutions below:';

    const expContainer = document.getElementById('explanationsList');
    expContainer.innerHTML = '';

    data.breakdown.forEach((item, idx) => {
        const box = document.createElement('div');
        box.style.cssText = `
            padding: 1.25rem;
            border-radius: var(--radius-sm);
            background: #FFFFFF;
            border-left: 4px solid ${item.is_correct ? '#10B981' : '#F43F5E'};
            border-top: 1px solid var(--border-color);
            border-right: 1px solid var(--border-color);
            border-bottom: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
        `;

        box.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Q${idx + 1}: ${item.question}</span>
                <span class="badge ${item.is_correct ? 'badge-success' : 'badge-danger'}">
                    ${item.is_correct ? 'Correct' : 'Incorrect'}
                </span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                Your Answer: <strong>Option ${item.user_choice || 'Skipped'}</strong> | Correct Answer: <strong style="color: #059669;">Option ${item.correct_option}</strong>
            </div>
            <div style="background: rgba(79, 70, 229, 0.06); border: 1px solid rgba(79, 70, 229, 0.15); padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; color: var(--text-primary); line-height: 1.5;">
                💡 <strong style="color: var(--accent);">Explanation:</strong> ${item.explanation || 'Direct formula based question.'}
            </div>
        `;
        expContainer.appendChild(box);
    });
}

function resetQuizArena() {
    document.getElementById('quizResultScreen').style.display = 'none';
    document.getElementById('quizActiveScreen').style.display = 'none';
    document.getElementById('quizStartScreen').style.display = 'block';
}
