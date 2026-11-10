// CareerX - Write Interview Simulator (mock_interview.js)
// Practice technical questions with automated keyword evaluation and model answers

let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let isSpeaking = false;

// Default question bank if store is empty
const defaultQuestions = {
    'Python': [
        {
            id: 1,
            category: 'Python',
            difficulty: 'Medium',
            question: 'Explain the difference between deep copy and shallow copy in Python.',
            model_answer: 'A shallow copy creates a new object populated with references to the child objects of the original. A deep copy recursively duplicates every nested object, ensuring complete independence from changes in the original.',
            keywords: ['shallow', 'deep', 'reference', 'copy', 'memory', 'nested', 'object', 'mutable']
        },
        {
            id: 2,
            category: 'Python',
            difficulty: 'Easy',
            question: 'What are Python decorators and how do they work?',
            model_answer: 'Decorators are functions that take another function as an argument, add extra behavior (such as logging, timing, or authentication), and return a wrapper function without modifying the original code.',
            keywords: ['decorator', 'function', 'wrapper', 'argument', 'return', 'higher-order', 'behavior']
        },
        {
            id: 3,
            category: 'Python',
            difficulty: 'Medium',
            question: 'What is the Global Interpreter Lock (GIL) and why does Python have it?',
            model_answer: 'The GIL is a mutex used by CPython to ensure only one thread executes Python bytecode at a time, simplifying memory management and thread safety at the cost of true multi-core CPU parallelism for pure Python threads.',
            keywords: ['gil', 'thread', 'lock', 'mutex', 'cpython', 'parallelism', 'multiprocessing', 'bytecode']
        }
    ],
    'SQL': [
        {
            id: 4,
            category: 'SQL',
            difficulty: 'Medium',
            question: 'Explain the difference between WHERE and HAVING clauses in SQL.',
            model_answer: 'WHERE filters rows before grouping occurs, while HAVING filters aggregate groups after the GROUP BY clause has been evaluated.',
            keywords: ['where', 'having', 'filter', 'group by', 'aggregate', 'rows', 'condition']
        },
        {
            id: 5,
            category: 'SQL',
            difficulty: 'Hard',
            question: 'Explain ACID properties in relational database management systems.',
            model_answer: 'ACID stands for Atomicity (all or nothing transactions), Consistency (data constraints are preserved), Isolation (concurrent transactions do not interfere), and Durability (committed changes persist).',
            keywords: ['acid', 'atomicity', 'consistency', 'isolation', 'durability', 'transaction', 'commit']
        }
    ],
    'DSA': [
        {
            id: 6,
            category: 'DSA',
            difficulty: 'Medium',
            question: 'What is the time complexity of searching and inserting in a balanced Binary Search Tree?',
            model_answer: 'In a balanced BST like an AVL or Red-Black tree, search, insertion, and deletion all take O(log N) time because the height of the tree is maintained logarithmically.',
            keywords: ['o(log n)', 'binary', 'tree', 'balanced', 'avl', 'search', 'height', 'complexity']
        },
        {
            id: 7,
            category: 'DSA',
            difficulty: 'Medium',
            question: 'Explain the difference between Breadth-First Search (BFS) and Depth-First Search (DFS).',
            model_answer: 'BFS explores vertices level by level using a queue, making it ideal for shortest path in unweighted graphs. DFS explores as far as possible down each branch using recursion or a stack.',
            keywords: ['bfs', 'dfs', 'queue', 'stack', 'recursion', 'level', 'shortest path', 'graph']
        }
    ],
    'System Design': [
        {
            id: 8,
            category: 'System Design',
            difficulty: 'Hard',
            question: 'How does caching improve web application performance, and what are common eviction policies?',
            model_answer: 'Caching stores frequently requested data in fast memory (like Redis) to reduce database read pressure. Common eviction policies include LRU (Least Recently Used), LFU (Least Frequently Used), and FIFO.',
            keywords: ['cache', 'redis', 'memory', 'latency', 'database', 'lru', 'eviction', 'performance']
        }
    ]
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Start button
    const startBtn = document.getElementById('startMockBtn');
    if (startBtn) startBtn.addEventListener('click', startAssessment);

    // Submit answer button
    const submitBtn = document.getElementById('submitMockAnswerBtn');
    if (submitBtn) submitBtn.addEventListener('click', evaluateAnswer);

    // Next question button
    const nextBtn = document.getElementById('nextMockQBtn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);

    // Clear answer button
    const clearBtn = document.getElementById('mockClearAnswerBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const input = document.getElementById('mockAnswerInput');
            if (input) input.value = '';
            if (window.showToast) window.showToast('Answer cleared', 'info');
        });
    }

    // Sample answer / smart dictate button
    const sampleBtn = document.getElementById('mockSmartDictateBtn');
    if (sampleBtn) sampleBtn.addEventListener('click', fillSampleAnswer);

    // Text-to-speech for question
    const readQBtn = document.getElementById('mockReadQuestionBtn');
    if (readQBtn) readQBtn.addEventListener('click', toggleReadQuestion);

    // Text-to-speech for feedback
    const readFbBtn = document.getElementById('mockReadFeedbackBtn');
    if (readFbBtn) readFbBtn.addEventListener('click', toggleReadFeedback);
});

// Start assessment session
function startAssessment() {
    stopSpeech();
    const categorySelect = document.getElementById('mockCategorySelect');
    const countSelect = document.getElementById('mockCountSelect');

    const category = categorySelect ? categorySelect.value : 'Python';
    const count = parseInt(countSelect ? countSelect.value : '3') || 3;

    // Fetch from store or fallback
    let questions = [];
    if (window.CareerXStore) {
        questions = window.CareerXStore.getInterviewQuestions(category);
    }
    if (!questions || questions.length === 0) {
        questions = defaultQuestions[category] || defaultQuestions['Python'];
    }

    // Shuffle questions so student gets varied questions each practice session
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, count);
    currentQuestionIndex = 0;
    userAnswers = [];

    // Switch view
    document.getElementById('mockSetupScreen').style.display = 'none';
    document.getElementById('mockFinalSummaryScreen').style.display = 'none';
    document.getElementById('mockRoomScreen').style.display = 'block';

    showCurrentQuestion();
}

// Display the active question
function showCurrentQuestion() {
    stopSpeech();
    const q = currentQuestions[currentQuestionIndex];
    if (!q) return;

    // Update labels
    const domainBadge = document.getElementById('mockDomainBadge');
    const diffBadge = document.getElementById('mockDifficultyBadge');
    const counter = document.getElementById('mockQuestionCounter');
    const qText = document.getElementById('mockQuestionText');
    const answerInput = document.getElementById('mockAnswerInput');
    const feedbackBox = document.getElementById('mockAnswerFeedbackBox');
    const submitBtn = document.getElementById('submitMockAnswerBtn');

    if (domainBadge) domainBadge.textContent = q.category || 'Technical';
    if (diffBadge) diffBadge.textContent = q.difficulty || 'Medium';
    if (counter) counter.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
    if (qText) qText.textContent = q.question;
    if (answerInput) answerInput.value = '';
    if (feedbackBox) feedbackBox.style.display = 'none';
    if (submitBtn) {
        submitBtn.style.display = 'inline-flex';
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Evaluate Answer</span> <i class="fa-solid fa-wand-magic-sparkles"></i>`;
    }
}

// Fill sample answer for demonstration
function fillSampleAnswer() {
    const q = currentQuestions[currentQuestionIndex];
    if (!q) return;
    const input = document.getElementById('mockAnswerInput');
    if (input) {
        input.value = q.model_answer;
        if (window.showToast) window.showToast('Sample answer loaded!', 'info');
    }
}

// Evaluate user's answer
function evaluateAnswer() {
    stopSpeech();
    const input = document.getElementById('mockAnswerInput');
    const answer = (input ? input.value : '').trim();

    if (!answer) {
        if (window.showToast) window.showToast('Please type your response before submitting.', 'warning');
        return;
    }

    const q = currentQuestions[currentQuestionIndex];
    const submitBtn = document.getElementById('submitMockAnswerBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Evaluating...`;

    // Simple keyword and length matching
    setTimeout(() => {
        const words = answer.split(/\s+/).length;
        const answerLower = answer.toLowerCase();
        let keywordMatches = 0;
        let keywords = q.keywords ? [...q.keywords] : [];
        if (q.key_points) {
            const extracted = q.key_points.split(/[,/]+/).map(p => p.trim().toLowerCase()).filter(p => p.length > 2);
            keywords = [...new Set([...keywords, ...extracted])];
        }
        if (keywords.length === 0) {
            keywords = ['function', 'system', 'data', 'performance', 'complexity', 'algorithm'];
        }

        keywords.forEach(kw => {
            if (answerLower.includes(kw.toLowerCase())) keywordMatches++;
        });

        // Calculate score out of 10
        let score = 6.0;
        if (words >= 30) score += 1.5;
        if (words >= 60) score += 1.0;
        score += Math.min(2.0, keywordMatches * 0.5);
        score = Math.min(9.8, parseFloat(score.toFixed(1)));

        let rating = 'Needs Practice';
        if (score >= 8.5) rating = 'Outstanding';
        else if (score >= 7.0) rating = 'Proficient';

        userAnswers.push({
            question: q.question,
            answer: answer,
            score: score,
            model_answer: q.model_answer
        });

        // Display feedback
        const fbBox = document.getElementById('mockAnswerFeedbackBox');
        const fbScore = document.getElementById('fbScore');
        const fbRating = document.getElementById('fbRatingBadge');
        const fbModel = document.getElementById('fbModelAns');
        const strengthsList = document.getElementById('fbStrengthsList');
        const improvementsList = document.getElementById('fbImprovementsList');
        const nextBtn = document.getElementById('nextMockQBtn');

        if (fbScore) fbScore.textContent = `${score}/10`;
        if (fbRating) fbRating.textContent = rating;
        if (fbModel) fbModel.textContent = q.model_answer;

        if (strengthsList) {
            strengthsList.innerHTML = `
                <li>Clear technical vocabulary with ${keywordMatches} relevant domain concepts mentioned.</li>
                <li>Good response depth (${words} words articulated).</li>
            `;
        }

        if (improvementsList) {
            improvementsList.innerHTML = `
                <li>Consider including practical edge cases and memory/runtime tradeoffs.</li>
                <li>Compare alternative architectures where applicable.</li>
            `;
        }

        if (nextBtn) {
            if (currentQuestionIndex === currentQuestions.length - 1) {
                nextBtn.innerHTML = `Finish Assessment <i class="fa-solid fa-flag-checkered"></i>`;
            } else {
                nextBtn.innerHTML = `Next Question <i class="fa-solid fa-arrow-right"></i>`;
            }
        }

        submitBtn.style.display = 'none';
        if (fbBox) fbBox.style.display = 'block';

        if (window.showToast) window.showToast('Evaluation complete!', 'success');
    }, 400);
}

// Next question or show results
function nextQuestion() {
    stopSpeech();
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showCurrentQuestion();
    } else {
        showFinalSummary();
    }
}

// Final summary screen
function showFinalSummary() {
    document.getElementById('mockRoomScreen').style.display = 'none';
    const summaryScreen = document.getElementById('mockFinalSummaryScreen');
    if (summaryScreen) summaryScreen.style.display = 'block';

    const total = userAnswers.reduce((sum, item) => sum + item.score, 0);
    const avg = userAnswers.length > 0 ? (total / userAnswers.length).toFixed(1) : '8.0';

    const scoreEl = document.getElementById('finalOverallScore');
    const textEl = document.getElementById('finalSummaryText');

    if (scoreEl) scoreEl.textContent = `${avg}/10`;
    if (textEl) {
        textEl.textContent = `Completed ${userAnswers.length} technical questions. Your overall rating is ${avg >= 8 ? 'Tier-1 Day-1 Placement Ready' : 'Solid Performance, continue regular practice'}!`;
    }

    // Update store readiness score
    if (window.CareerXStore) {
        window.CareerXStore.updateDiagnostics({ mock: parseFloat(avg) });
    }
}

// Simple Text-to-Speech
function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => { isSpeaking = false; };
    isSpeaking = true;
    window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    isSpeaking = false;
}

function toggleReadQuestion() {
    if (isSpeaking) {
        stopSpeech();
    } else {
        const text = document.getElementById('mockQuestionText')?.textContent || '';
        if (text) speakText(text);
    }
}

function toggleReadFeedback() {
    if (isSpeaking) {
        stopSpeech();
    } else {
        const text = document.getElementById('fbModelAns')?.textContent || '';
        if (text) speakText("Model Answer: " + text);
    }
}
