import re
import os
from pypdf import PdfReader

# -------------------------------------------------------------
# ROLE-BASED SKILL TAXONOMIES FOR ATS & PLACEMENT ANALYSIS
# -------------------------------------------------------------
ROLE_PROFILES = {
    'AI/ML Engineer': {
        'required_skills': ['python', 'machine learning', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'computer vision', 'scikit-learn', 'pandas', 'numpy', 'sql', 'git', 'math', 'statistics'],
        'good_to_have': ['docker', 'fastapi', 'flask', 'aws', 'hugging face', 'mlflow', 'cuda', 'data structures'],
        'verbs': ['trained', 'fine-tuned', 'deployed', 'optimized', 'evaluated', 'architected', 'extracted']
    },
    'Software Engineer': {
        'required_skills': ['data structures', 'algorithms', 'python', 'java', 'c++', 'oop', 'sql', 'git', 'operating systems', 'database management', 'computer networks'],
        'good_to_have': ['system design', 'docker', 'ci/cd', 'linux', 'rest api', 'unit testing', 'redis'],
        'verbs': ['developed', 'engineered', 'implemented', 'designed', 'scaled', 'refactored', 'debugged']
    },
    'Full Stack Developer': {
        'required_skills': ['javascript', 'html', 'css', 'react', 'node.js', 'sql', 'mongodb', 'git', 'rest api', 'python', 'express'],
        'good_to_have': ['typescript', 'next.js', 'docker', 'tailwind', 'graphql', 'aws', 'redux'],
        'verbs': ['built', 'integrated', 'designed', 'created', 'maintained', 'launched', 'optimized']
    },
    'Frontend Developer': {
        'required_skills': ['javascript', 'typescript', 'html', 'css', 'react', 'redux', 'next.js', 'tailwind', 'git', 'responsive design', 'rest api', 'dom'],
        'verbs': ['built', 'rendered', 'styled', 'optimized', 'implemented', 'designed', 'refactored']
    },
    'Backend Developer': {
        'required_skills': ['python', 'node.js', 'express', 'sql', 'postgresql', 'mongodb', 'rest api', 'git', 'docker', 'database design', 'redis', 'authentication'],
        'good_to_have': ['fastapi', 'django', 'microservices', 'graphql', 'kafka', 'aws', 'ci/cd', 'system design'],
        'verbs': ['architected', 'developed', 'scaled', 'optimized', 'deployed', 'secured', 'integrated']
    },
    'Data Analyst': {
        'required_skills': ['sql', 'excel', 'python', 'pandas', 'power bi', 'tableau', 'statistics', 'data visualization', 'eda'],
        'good_to_have': ['r', 'machine learning', 'numpy', 'data cleaning', 'business intelligence', 'storytelling'],
        'verbs': ['analyzed', 'visualized', 'uncovered', 'reported', 'cleaned', 'modeled', 'forecasted']
    },
    'Cloud / DevOps Engineer': {
        'required_skills': ['linux', 'docker', 'kubernetes', 'aws', 'ci/cd', 'git', 'python', 'bash', 'terraform'],
        'good_to_have': ['jenkins', 'ansible', 'prometheus', 'grafana', 'azure', 'networking', 'cloudformation'],
        'verbs': ['automated', 'deployed', 'orchestrated', 'configured', 'monitored', 'provisioned', 'secured']
    },
    'Cybersecurity Analyst': {
        'required_skills': ['network security', 'cryptography', 'linux', 'python', 'wireshark', 'vulnerability assessment', 'siem', 'firewalls'],
        'good_to_have': ['penetration testing', 'burp suite', 'metasploit', 'cissp', 'owasp', 'incident response'],
        'verbs': ['secured', 'audited', 'identified', 'mitigated', 'investigated', 'defended', 'monitored']
    }
}

STANDARD_SECTIONS = ['education', 'experience', 'projects', 'skills', 'certifications', 'summary']

# -------------------------------------------------------------
# 1. ATS RESUME PARSER & EVALUATOR
# -------------------------------------------------------------
def extract_text_from_pdf(file_path):
    """Extracts raw text from an uploaded PDF resume using pypdf."""
    try:
        reader = PdfReader(file_path)
        full_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
        return full_text.strip()
    except Exception as e:
        return f"Error extracting PDF: {str(e)}"

def evaluate_ats_resume(resume_text, target_role="Software Engineer"):
    """
    Computes an ATS score (0-100), detected skills, missing skills,
    section completeness, and actionable feedback.
    """
    clean_text = resume_text.lower()
    
    # Pick role or default to Software Engineer
    profile = ROLE_PROFILES.get(target_role, ROLE_PROFILES['Software Engineer'])
    required_skills = profile['required_skills']
    good_to_have = profile['good_to_have']
    power_verbs = profile['verbs']

    # 1. Match Skills
    matched_required = []
    missing_required = []
    for skill in required_skills:
        # Check word boundary or substring match
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, clean_text):
            matched_required.append(skill)
        else:
            missing_required.append(skill)

    matched_bonus = [s for s in good_to_have if re.search(r'\b' + re.escape(s) + r'\b', clean_text)]

    # 2. Check Standard Sections
    sections_found = []
    sections_missing = []
    for sec in STANDARD_SECTIONS:
        if re.search(r'\b' + re.escape(sec) + r'\b', clean_text):
            sections_found.append(sec.capitalize())
        else:
            sections_missing.append(sec.capitalize())

    # 3. Check for Quantifiable Metrics (e.g. 20%, $5k, 100+ users, 4.5)
    numbers_found = len(re.findall(r'\b\d+(?:[\.,]\d+)?%?|\b\d+\+', clean_text))
    has_metrics = numbers_found >= 3

    # 4. Check Action Verbs
    verbs_count = sum(1 for v in power_verbs if v in clean_text)

    # 5. Calculate Weighted Score
    # Skills weight: 50 points
    skill_pct = (len(matched_required) / max(len(required_skills), 1))
    bonus_pts = min(len(matched_bonus) * 2, 10)
    skill_score = min((skill_pct * 40) + bonus_pts, 50)

    # Sections weight: 25 points
    sec_score = (len(sections_found) / len(STANDARD_SECTIONS)) * 25

    # Quantifiable metrics & formatting: 15 points
    metric_score = 15 if numbers_found >= 4 else (10 if numbers_found >= 2 else 5)

    # Action verbs: 10 points
    verb_score = min(verbs_count * 2.5, 10)

    total_score = int(round(skill_score + sec_score + metric_score + verb_score))
    total_score = max(min(total_score, 98), 25) # realistic bounds

    # Generate actionable tips
    recommendations = []
    if missing_required:
        top_missing = ", ".join([s.title() for s in missing_required[:4]])
        recommendations.append(f"Add critical missing role keywords: **{top_missing}** in your Skills or Projects section.")
    
    if not has_metrics:
        recommendations.append("Include quantifiable achievements (e.g., *'Improved latency by 35%'*, *'Handled 5,000+ daily queries'*). Numbers catch recruiter attention.")

    if sections_missing:
        missing_str = ", ".join(sections_missing)
        recommendations.append(f"Ensure clear section headings for: **{missing_str}** to help ATS scanners parse smoothly.")

    if verbs_count < 3:
        recommendations.append("Begin project bullet points with strong action verbs (e.g., *Architected, Engineered, Implemented, Scaled*).")

    if total_score >= 80:
        summary_verdict = "Strong ATS Compatibility! Your resume aligns well with industry applicant tracking standards."
    elif total_score >= 60:
        summary_verdict = "Moderate ATS Compatibility. Good foundation, but missing important technical keywords and measurable achievements."
    else:
        summary_verdict = "Needs Optimization. Lacks several primary role competencies and standard headings."

    return {
        'score': total_score,
        'target_role': target_role,
        'verdict': summary_verdict,
        'matched_skills': [s.title() for s in matched_required + matched_bonus],
        'missing_skills': [s.title() for s in missing_required],
        'sections_found': sections_found,
        'sections_missing': sections_missing,
        'metrics_count': numbers_found,
        'recommendations': recommendations
    }

# -------------------------------------------------------------
# 2. TECHNICAL ASSESSMENT EVALUATOR
# -------------------------------------------------------------
def evaluate_mock_answer(question, user_answer, key_points=""):
    """
    Evaluates a candidate's interview response on clarity,
    keyword coverage, completeness, and structure.
    """
    answer = user_answer.strip()
    words = answer.split()
    word_count = len(words)
    answer_lower = answer.lower()

    if word_count < 8:
        return {
            'score': 3.0,
            'rating': 'Needs Improvement',
            'feedback': 'Answer is too brief. In a placement interview, provide full context with explanations, technical mechanisms, and examples.',
            'strengths': ['Attempted response'],
            'improvements': ['Elaborate on core mechanisms', 'Provide a concrete coding or real-world example', 'Use proper technical vocabulary']
        }

    # Keyword matching against key_points
    kp_list = [kp.strip().lower() for kp in key_points.split(',') if kp.strip()] if key_points else []
    matched_kps = [kp for kp in kp_list if kp in answer_lower]
    kp_ratio = len(matched_kps) / max(len(kp_list), 1) if kp_list else 0.7

    # Quality indicators
    has_structure = any(connector in answer_lower for connector in ['because', 'for example', 'such as', 'in contrast', 'firstly', 'secondly', 'whereas'])
    has_tech_depth = any(term in answer_lower for term in ['time complexity', 'space complexity', 'memory', 'performance', 'reference', 'thread', 'index', 'query', 'scale', 'architecture'])

    base_score = 5.0
    if word_count >= 30:
        base_score += 1.5
    elif word_count >= 15:
        base_score += 0.8

    base_score += kp_ratio * 2.0
    if has_structure:
        base_score += 0.8
    if has_tech_depth:
        base_score += 0.7

    final_score = round(min(max(base_score, 2.5), 9.8), 1)

    strengths = []
    if word_count >= 25:
        strengths.append("Good descriptive depth and willingness to elaborate.")
    if matched_kps:
        strengths.append(f"Successfully highlighted key technical terms ({', '.join(matched_kps[:2])}).")
    if has_structure:
        strengths.append("Logical structure with clear transitional connectors.")
    if not strengths:
        strengths.append("Direct and to the point.")

    improvements = []
    missing_kps = [kp for kp in kp_list if kp not in matched_kps]
    if missing_kps:
        improvements.append(f"Mention related concepts such as: {', '.join(missing_kps[:3])}.")
    if not has_tech_depth:
        improvements.append("Incorporate runtime / memory implications or engineering trade-offs.")
    if word_count < 25:
        improvements.append("Use the STAR (Situation, Task, Action, Result) method to make your answer more compelling.")

    rating = "Outstanding" if final_score >= 8.5 else ("Good" if final_score >= 7.0 else ("Average" if final_score >= 5.0 else "Needs Improvement"))

    return {
        'score': final_score,
        'rating': rating,
        'feedback': f"Scored {final_score}/10. {rating} attempt. You demonstrated understanding of the core concept.",
        'strengths': strengths,
        'improvements': improvements
    }

# -------------------------------------------------------------
# 3. CONVERSATIONAL AI PLACEMENT ASSISTANT
# -------------------------------------------------------------
def get_ai_chat_response(prompt, chat_history=None, user_context=None):
    """
    Intelligent Placement Assistant conversational brain.
    Provides structured, markdown-rich guidance on placement prep,
    DSA, System Design, HR interview questions, resume review, and career paths.
    """
    if isinstance(chat_history, dict) and user_context is None:
        user_context = chat_history
        chat_history = None

    p = prompt.strip().lower()
    
    # 1. Greetings
    if re.match(r'^(hi|hello|hey|greetings|morning|afternoon|evening)\b', p):
        name = 'Candidate'
        if user_context:
            name = user_context.get('name') or user_context.get('full_name') or 'Student'
        return (
            f"Hello **{name}**! 👋 Welcome to **CareerX – AI Placement Assistant**.\n\n"
            "I'm here to help you crack your campus placements and off-campus tech drives. Here is what we can do today:\n\n"
            "- 🧠 **DSA & Coding Prep**: Ask me to explain algorithms, solve questions, or optimize time/space complexity.\n"
            "- 🎯 **Technical Assessments**: Practice technical (Python, JS, SQL, OOPs) and engineering questions.\n"
            "- 📄 **Resume & ATS Strategy**: Get recommendations to pass applicant tracking filters.\n"
            "- 🗺️ **Career Roadmaps**: Personalized milestone guides for AI, Full-Stack, Cloud, and Data Science.\n"
            "- ⚡ **Aptitude Mastery**: Shortcuts and tricks for Quantitative, Logical, and Verbal rounds.\n\n"
            "What would you like to prepare right now?"
        )

    # 2. DSA / Coding Queries
    if any(k in p for k in ['dsa', 'data structure', 'algorithm', 'binary search', 'dynamic programming', 'linked list', 'two pointer', 'sliding window', 'graph', 'tree']):
        if 'two pointer' in p or 'sliding window' in p:
            return (
                "### 🚀 Two Pointers vs Sliding Window Pattern\n\n"
                "Both patterns operate on linear structures (Arrays/Strings) in **O(n)** time instead of nested **O(n²)** loops.\n\n"
                "#### 1. Two Pointers Pattern\n"
                "- **When to use**: Sorted arrays, pair sum problems, palindrome checks, removing duplicates.\n"
                "- **Template**:\n"
                "```python\n"
                "def two_sum_sorted(arr, target):\n"
                "    left, right = 0, len(arr) - 1\n"
                "    while left < right:\n"
                "        curr_sum = arr[left] + arr[right]\n"
                "        if curr_sum == target:\n"
                "            return [left, right]\n"
                "        elif curr_sum < target:\n"
                "            left += 1   # Increase sum\n"
                "        else:\n"
                "            right -= 1  # Decrease sum\n"
                "    return []\n"
                "```\n\n"
                "#### 2. Sliding Window Pattern\n"
                "- **When to use**: Contiguous sub-arrays/sub-strings (e.g., maximum sum sub-array of size K, longest substring without repeating characters).\n"
                "- **Core Logic**: Expand the `right` pointer to include elements, and contract the `left` pointer once a constraint is broken.\n\n"
                "💡 *Placement Tip*: Interviewers love testing this because it demonstrates whether you can avoid brute-force Quadratic complexity!"
            )
        elif 'dynamic programming' in p or 'dp' in p:
            return (
                "### 🧩 Dynamic Programming (DP) Placement Strategy\n\n"
                "DP is simply **recursion with memorization** (caching subproblem solutions to prevent redundant calculations).\n\n"
                "#### The 4-Step DP Framework for Interviews:\n"
                "1. **Identify**: Check for overlapping subproblems and optimal substructure.\n"
                "2. **State Definition**: Clearly define `dp[i]` (e.g., `dp[i]` = max profit at index `i`).\n"
                "3. **Recurrence Relation**: Formulate the state transition (e.g., `dp[i] = max(dp[i-1], dp[i-2] + val[i])`).\n"
                "4. **Base Cases**: Initialize the starting bounds (`dp[0]`, `dp[1]`).\n\n"
                "#### Must-Do Placement Patterns:\n"
                "- 0/1 Knapsack & Unbounded Knapsack\n"
                "- Longest Common Subsequence (LCS)\n"
                "- Longest Increasing Subsequence (LIS)\n"
                "- Coin Change (Min coins & total ways)\n"
                "- Grid Paths (Unique paths with obstacles)\n\n"
                "Would you like me to walk through code for any specific problem?"
            )
        else:
            return (
                "### 📚 DSA Placement Roadmap & Core Checklist\n\n"
                "To clear coding rounds for Tier-1 and Product-based companies (Google, Microsoft, Amazon, Razorpay):\n\n"
                "| Category | High-Yield Topics | Target Problems |\n"
                "| :--- | :--- | :--- |\n"
                "| **Foundations** | Arrays, HashMaps, Strings | 30 Problems |\n"
                "| **Linked Lists & Stacks** | Fast-Slow pointers, Monotonic stack | 25 Problems |\n"
                "| **Trees & Graphs** | BFS, DFS, Tree Traversals, Dijkstra | 35 Problems |\n"
                "| **Advanced** | Dynamic Programming, Greedy, Tries | 30 Problems |\n\n"
                "💡 **Pro-Tip**: Quality over quantity! Solve standard patterns rather than 500 random questions. Explain your thought process out loud before typing code in interviews."
            )

    # 3. HR / Behavioral Questions
    if any(k in p for k in ['tell me about yourself', 'introduce yourself', 'why should we hire you', 'strengths', 'weaknesses', 'star method', 'hr question']):
        if 'tell me about yourself' in p or 'introduce' in p:
            return (
                "### 🎯 Master Formula: 'Tell Me About Yourself'\n\n"
                "Never recite your resume line-by-line! Deliver a crisp **90-second pitch** using the **Present ➔ Past ➔ Future** structure:\n\n"
                "1. **Present (30 sec)**:\n"
                "   *\"I am currently in my final year of B.Tech in AI & Data Science at [College]. My core focus is building scalable backend systems and applied machine learning models, with strong proficiency in Python, Flask, and SQL.\"*\n\n"
                "2. **Past (30 sec)**:\n"
                "   *\"Recently, I built 'CareerX', an end-to-end placement preparation assistant that automates resume ATS analysis and technical assessment evaluations. I also cleared online assessments and solved 150+ DSA problems.\"*\n\n"
                "3. **Future (30 sec)**:\n"
                "   *\"I have been closely following [Company Name]'s innovations in [Specific domain, e.g., cloud platforms / fintech], and I'm eager to bring my software engineering fundamentals and problem-solving drive to this engineering team.\"*\n\n"
                "Would you like to draft your personalized version now?"
            )
        elif 'why should we hire you' in p:
            return (
                "### 💼 How to Answer: 'Why Should We Hire You?'\n\n"
                "Connect your unique value proposition to their direct business needs:\n\n"
                "1. **Technical Capability**: Emphasize hands-on project experience rather than just textbook theory.\n"
                "2. **Fast Learner**: Highlight how quickly you adapt to modern toolchains (Docker, Cloud, REST APIs).\n"
                "3. **Team Culture & Ownership**: Demonstrate that you take pride in shipping robust, tested code.\n\n"
                "**Sample Response**:\n"
                "> *\"You should hire me because I offer a strong balance of theoretical computer science fundamentals and real-world project execution. Through my projects in AI and full-stack development, I have developed the ability to break down complex business requirements into clean, scalable software architecture. I am enthusiastic, learn quickly from code reviews, and am excited to contribute to your engineering milestones from Day 1.\"*"
            )
        else:
            return (
                "### 🌟 The STAR Method for Behavioral Interviews\n\n"
                "Top tech companies (Amazon, Microsoft, startups) assess candidates through behavioral questions using the STAR framework:\n\n"
                "- **S - Situation**: Set the scene and project context (1-2 sentences).\n"
                "- **T - Task**: What was your responsibility or the challenge faced?\n"
                "- **A - Action**: What specific engineering steps did YOU take? (Debugging, refactoring, algorithms chosen).\n"
                "- **R - Result**: Quantifiable outcomes! (*'Reduced API latency by 40%'*, *'Delivered 3 days ahead of deadline'*).\n\n"
                "Tell me a project scenario, and I will help format it into a perfect STAR story!"
            )

    # 4. Resume & ATS Guidance
    if any(k in p for k in ['resume', 'ats', 'cv', 'score', 'bullet points', 'action verbs']):
        return (
            "### 📄 Blueprint for an ATS-Proof Tech Resume\n\n"
            "Applicant Tracking Systems parse keywords and formatting before any human recruiter reads your resume.\n\n"
            "#### 1. The Golden Format Rules:\n"
            "- Single column layout (Multi-column resumes often scramble in legacy ATS parsers).\n"
            "- Standard font (Inter, Roboto, Arial, Calibri) - size 10-11pt.\n"
            "- Save as text-searchable PDF (never an image export!).\n\n"
            "#### 2. The Google 'X-Y-Z' Formula for Bullet Points:\n"
            "> **\"Accomplished [X], as measured by [Y], by doing [Z].\"**\n\n"
            "❌ *Weak*: \"Built a machine learning project for sentiment analysis.\"\n"
            "✅ *Strong*: \"Developed an NLP sentiment classifier using PyTorch and Flask, achieving **92% validation accuracy** and serving **1,200+ requests/sec** with sub-50ms latency.\"\n\n"
            "💡 You can also use our **ATS Resume Checker** tab in the sidebar to upload your PDF and get instant feedback!"
        )

    # 5. Aptitude Tricks
    if any(k in p for k in ['aptitude', 'quant', 'logical reasoning', 'verbal', 'math trick']):
        return (
            "### ⚡ High-Speed Aptitude Shortcuts for Placement Tests\n\n"
            "Campus recruitment tests (TCS NQT, Cognizant, Wipro, Accenture, Infosys) rely on speed and pattern recognition:\n\n"
            "1. **Time & Work Shortcut**:\n"
            "   - If A takes $x$ days and B takes $y$ days, together they take $\\frac{x \\cdot y}{x + y}$ days.\n"
            "   - Example: A takes 10 days, B takes 15 days ➔ $\\frac{10 \\times 15}{25} = 6$ days.\n\n"
            "2. **Percentage Change Shortcut**:\n"
            "   - Successive percentage change: $a + b + \\frac{a \\cdot b}{100}$.\n"
            "   - If price increases by 20% then discounts by 10% ➔ $20 - 10 + \\frac{20 \\times (-10)}{100} = 10 - 2 = +8\\%$.\n\n"
            "3. **Speed & Distance Unit Conversion**:\n"
            "   - Multiply by $\\frac{5}{18}$ to convert km/h to m/s.\n"
            "   - Multiply by $\\frac{18}{5}$ to convert m/s to km/h.\n\n"
            "Jump over to our **Aptitude Trainer** module to take a timed 10-minute quiz with live scoring!"
        )

    # 6. Core CS Subjects (DBMS, OS, OOP, CN)
    if any(k in p for k in ['dbms', 'sql', 'acid', 'normalization', 'operating system', 'oops', 'oops concept', 'computer network']):
        return (
            "### 💾 Core Computer Science Placement Essentials\n\n"
            "Most technical rounds dedicate 30-40% of time to core CS fundamentals:\n\n"
            "#### 1. DBMS & SQL:\n"
            "- **ACID**: Atomicity (all/none), Consistency (valid state), Isolation (independent transactions), Durability (persisted on disk).\n"
            "- **Indexes**: Clustered (orders physical storage) vs Non-Clustered (separate B-Tree pointer table).\n"
            "- **Joins**: INNER, LEFT, RIGHT, FULL OUTER joins and query execution plans.\n\n"
            "#### 2. OOPs Principles:\n"
            "- **Encapsulation**: Data hiding via access modifiers.\n"
            "- **Abstraction**: Hiding internal implementation through interfaces/abstract classes.\n"
            "- **Inheritance**: Code reusability between parent and child.\n"
            "- **Polymorphism**: Compile-time (Method Overloading) vs Run-time (Method Overriding / Virtual functions).\n\n"
            "#### 3. Operating Systems:\n"
            "- Process vs Thread, Deadlocks (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait), Paging & Virtual Memory."
        )

    # 7. Full Stack Engineering (MERN / PERN / SSR / Auth / Architecture)
    if any(k in p for k in ['full stack', 'fullstack', 'mern', 'pern', 'mean', 'ssr', 'csr', 'ssg', 'jwt', 'token', 'auth flow', 'cookie', 'cors', 'websocket', 'websockets']):
        return (
            "### 🌐 Full Stack Engineering Placement Mastery\n\n"
            "Full Stack interviews test how seamlessly you connect the client, server, database, and cloud layers.\n\n"
            "#### 1. Architecture: Client vs Server Rendering\n"
            "- **CSR (Client-Side Rendering)**: Browser downloads minimal HTML + JS bundle; client renders DOM (e.g., standard React SPA). Great for dashboards; slower First Contentful Paint (FCP).\n"
            "- **SSR (Server-Side Rendering)**: Server renders complete HTML on each request (e.g., Next.js). Superior SEO and faster initial load; higher server compute load.\n"
            "- **SSG (Static Site Generation)**: HTML generated once at build time. Ultra-fast CDN delivery with zero runtime server latency.\n\n"
            "#### 2. Authentication Flow: JWT + HttpOnly Refresh Tokens\n"
            "```text\n"
            "Client (React) ➔ POST /login ➔ Server (Node/Flask)\n"
            "                                     │ (Verifies credentials & hash)\n"
            "Client 🡄 Short-lived Access Token ───┘\n"
            "Client 🡄 HttpOnly Secure Cookie (Refresh Token)\n"
            "```\n"
            "- **Access Token (15m)**: Sent in `Authorization: Bearer <token>` header for stateless API validation.\n"
            "- **Refresh Token (7d)**: Stored in an `HttpOnly, Secure, SameSite=Strict` cookie to prevent XSS theft.\n\n"
            "#### 3. Core Placement Talking Points:\n"
            "- **CORS (Cross-Origin Resource Sharing)**: Browser security restricting cross-domain API calls; solved via server headers (`Access-Control-Allow-Origin`).\n"
            "- **State Management**: Local state (`useState`) vs Global state (`Context`, `Redux Toolkit`, `Zustand`).\n"
            "- **REST vs GraphQL**: Fixed endpoints with potential over/under-fetching vs single endpoint with flexible client query schemas."
        )

    # 8. Frontend Engineering (React, DOM, Performance, CSS)
    if any(k in p for k in ['frontend', 'front end', 'react', 'virtual dom', 'reconciliation', 'fiber', 'hook', 'useeffect', 'usestate', 'usememo', 'usecallback', 'redux', 'zustand', 'css grid', 'flexbox', 'web vitals', 'lazy loading', 'tree shaking']):
        return (
            "### 🎨 Frontend Engineering Placement Deep-Dive\n\n"
            "Modern frontend interviews assess performance, React internals, and responsive design systems.\n\n"
            "#### 1. React Virtual DOM & Reconciliation:\n"
            "- **Virtual DOM**: Lightweight in-memory JavaScript representation of the actual DOM tree.\n"
            "- **Diffing Algorithm**: O(n) heuristic matching by component type and unique `key` props on list items.\n"
            "- **React Fiber**: Incremental reconciler that can pause, prioritize, and resume rendering work to prevent blocking the main thread.\n\n"
            "#### 2. Essential Hook Best Practices:\n"
            "- **`useEffect`**: For side effects (API calls, subscriptions). Always specify accurate dependency arrays to prevent infinite re-render loops.\n"
            "- **`useMemo` vs `useCallback`**:\n"
            "  - `useMemo(() => compute(), [deps])`: Caches the *result* of an expensive calculation.\n"
            "- `useCallback(fn, [deps])`: Caches the *function reference* itself to prevent child re-renders.\n\n"
            "#### 3. Frontend Web Performance Checklist:\n"
            "- **Code Splitting & Lazy Loading**: `React.lazy()` and dynamic `import()` to minimize initial bundle size.\n"
            "- **Debouncing & Throttling**: Rate-limit search input handlers and scroll listeners.\n"
            "- **CSS Layout Strategy**: **Flexbox** for 1D direction-based alignment; **CSS Grid** for 2D multi-row/column responsive layouts.\n"
            "- **Core Web Vitals**: Optimize LCP (Largest Contentful Paint), FID/INP (Interactivity), and CLS (Cumulative Layout Shift)."
        )

    # 9. Backend Engineering & Distributed Systems
    if any(k in p for k in ['backend', 'back end', 'node', 'express', 'django', 'fastapi', 'microservice', 'microservices', 'redis', 'caching', 'cache', 'message queue', 'rabbitmq', 'kafka', 'celery', 'docker', 'rate limiting', 'load balancer']):
        return (
            "### ⚙️ Backend Engineering & System Scalability\n\n"
            "Backend interviews focus on high availability, database efficiency, and fault tolerance.\n\n"
            "#### 1. Production REST API Design Rules:\n"
            "- **Resource-Oriented URIs**: Use plural nouns (`/api/v1/students`, `/api/v1/applications/42`).\n"
            "- **HTTP Verbs & Idempotency**:\n"
            "  - `GET`, `PUT`, `DELETE`: **Idempotent** (multiple identical requests have the exact same effect).\n"
            "  - `POST`: **Non-idempotent** (each call creates a new sub-resource).\n"
            "- **Proper Status Codes**: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`, `500 Internal Error`.\n\n"
            "#### 2. Caching Patterns with Redis:\n"
            "- **Cache-Aside (Lazy Loading)**:\n"
            "  1. App checks Redis cache for key.\n"
            "  2. If *Cache Hit* ➔ Return immediately.\n"
            "  3. If *Cache Miss* ➔ Query SQL DB, write into Redis with TTL, return data.\n"
            "- **Preventing Cache Stampede**: Use mutex locks or probabilistic early expiration.\n\n"
            "#### 3. Microservices vs Monolith:\n"
            "- **Monolith**: Single deployable codebase. Easy to start, debug, and test; hard to scale independently as team expands.\n"
            "- **Microservices**: Independent services communicating via REST, gRPC, or async message brokers (RabbitMQ / Kafka). Autonomous scaling, but requires distributed tracing, circuit breakers, and network resilience."
        )

    # 10. Default Contextual Placement Intelligence
    return (
        f"### 💡 CareerX Insight: {prompt.title()}\n\n"
        f"Thank you for asking about **\"{prompt}\"**. Here is how to approach this for placement interviews:\n\n"
        "1. **Core Understanding**: Always start with a precise definition and the problem this technology/approach solves.\n"
        "2. **Real-world Application**: Connect it to a tangible use case in industry software (scalability, security, or performance).\n"
        "3. **Engineering Trade-offs**: Tech interviewers love when you mention pros vs cons (e.g., speed vs memory, consistency vs availability).\n\n"
        "Feel free to ask for:\n"
        "- A code implementation in Python or JavaScript\n"
        "- Common interview follow-up questions\n"
        "- How to describe this project on your resume!"
    )
