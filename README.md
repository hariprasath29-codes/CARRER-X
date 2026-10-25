# CareerX – Placement Preparation & Intelligence Platform 🎓🚀

CareerX is a comprehensive, student-first placement preparation platform built to give engineering candidates an unfair advantage in campus hiring. It brings together resume building, ATS scoring, timed aptitude drills, technical assessments, career roadmaps, and campus recruitment tracking into a single, cohesive experience.

Crafted with **HTML5, Modern Vanilla CSS (Outfit typography & clean design system), JavaScript, Python (Flask), and SQLite**.

---

## ✨ Core Features & Student Toolkit

1. **Cinematic Brand Intro & One-Click Access**
   - Fluid 60 FPS hardware-accelerated welcome sequence showcasing the CareerX brand with smooth portal transitions.
   - Fast demo role authentication for Students and Administrators.

2. **Personalized Career Roadmaps (`/roadmap`)**
   - 5 Guided Tracks: **Software Engineer**, **AI/ML Engineer**, **Full Stack Developer**, **Cloud & DevOps**, and **Data Analyst**.
   - Interactive milestone checklist with real-time completion progress tracking.

3. **Interactive Resume Studio (`/resume-builder`)**
   - Dual-pane live resume editor: updates in form fields render instantly onto a standard campus recruitment resume sheet.
   - Tailored for the Google X-Y-Z formula (`Accomplished [X], as measured by [Y], by doing [Z]`).
   - Automated post-save download modal and toolbar options for instant **PDF (A4 single-page)**, **Word Document (.doc)**, and **JSON** exports.

4. **ATS Resume Scanner & Keyword Analysis (`/ats-checker`)**
   - PDF resume upload with automatic text extraction using `pypdf`.
   - Checks role-specific keyword density, section structure, action verbs, and generates actionable improvement tips.

5. **Timed Aptitude Practice Suite (`/aptitude`)**
   - Categorized question banks: **Quantitative Aptitude**, **Logical Reasoning**, and **Verbal Ability**.
   - Real-time countdown timer, question navigator, and instant scoring with step-by-step explanations.

6. **Technical Interview Flashcards (`/interview`)**
   - Curated high-frequency question bank covering **Python**, **JavaScript**, **DBMS**, **OOPs**, **System Concepts**, and **HR**.
   - Collapsible cards with recommended answers and key concepts interviewers look for.

7. **Technical Assessment Simulator (`/technical-assessment`)**
   - Realistic assessment arena where domain questions are presented sequentially.
   - Evaluates candidate answers and provides ratings (0–10), highlighted strengths, missing key technical points, and benchmark answers.

8. **Skill Matrix & Gamified Badges (`/skills`)**
   - Visual proficiency trackers across programming languages and frameworks.
   - Dynamic badge unlocks as candidates complete tests and practice sessions.

9. **Campus Placement Drives & Notice Board**
   - Real-time campus drive listings with eligibility criteria, package (CTC), drive dates, and 1-click applications.
   - Live broadcast notices from the placement cell.

10. **Application Pipeline Tracker (`/applications`)**
    - Kanban-style progress tracker: *Applied ➔ Screening ➔ Interview ➔ Offer ➔ Closed*.
    - Searchable by company name and role.

11. **Student Leaderboard (`/leaderboard`)**
    - Balanced composite scoring model: `Aptitude (45%) + Technical Assessment (35%) + Skills (20%)`.
    - Real-time class ranking with podium recognition.

12. **Placement Cell & Admin Console (`/admin`)**
    - Overview of cohort readiness metrics.
    - Question management to add new aptitude and technical questions.
    - Student directory with 1-click CSV export for placement coordinators.

---

## 🚀 Getting Started

### 1. Prerequisites

- Python 3.10 or higher
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Initialize the Database

```bash
python database.py
```

*(This sets up the SQLite schema and pre-loads sample questions, campus drives, and student records).*

### 4. Run the Application

```bash
python app.py
```

Open your browser and visit:

```text
http://127.0.0.1:5000
```

> **Live Server Note:** You can also preview the front-end directly via VS Code's **Live Server** (`http://127.0.0.1:5500`). It automatically launches with the interactive intro and static client demonstration.

---

## 🔑 Demo Credentials

| Role | Username / Email | Password | Quick Access |
| :--- | :--- | :--- | :--- |
| **Student** | `student` or `student@careerx.ai` | `student123` | Click **Student Demo** on Login |
| **Administrator (TPO)** | `admin` or `admin@careerx.ai` | `admin123` | Click **Admin Demo** on Login |

*(You can also create a new student account using the Registration page).*

---

## 📁 Repository Structure

```text
Carrer X project/
├── app.py                     # Flask web server, authentication, and REST API routes
├── database.py                # Database schema, migrations, and seed data
├── ai_engine.py               # Technical assessment evaluator, ATS parser, and conversational advisor
├── test_suite.py              # Automated full-stack integration test suite
├── requirements.txt           # Python library dependencies
├── .gitignore                 # Version control exclusion rules
├── INTERVIEW_CHEAT_SHEET.md    # Technical interview questions & code guide
├── README.md                  # Project overview and documentation
│
├── index.html                 # Live Server entry point (Cinematic 3D intro & Quick Login)
│
├── data/
│   └── careerx.db             # Local SQLite database
│
├── uploads/                   # Stored resume files for ATS scanning
│
├── static/
│   ├── css/
│   │   ├── style.css          # Design system: Outfit typography, variables, buttons, forms
│   │   ├── intro.css          # Hardware-accelerated cinematic welcome & portal zoom
│   │   ├── dashboard.css      # Analytics layout, drive cards, and leaderboard tables
│   │   └── resume.css         # Print & live resume sheet styling
│   ├── js/
│   │   ├── intro.js           # Intro animation controller, Web Audio synthesizer, skip/replay
│   │   ├── app.js             # General utilities, toasts, and mobile navigation
│   │   ├── dashboard.js       # Chart.js charts and live activity feeds
│   │   ├── resume.js          # Live resume two-way binding & PDF printing
│   │   ├── ats.js             # ATS scanner file upload & report visualization
│   │   ├── aptitude.js        # Timed test engine, countdown timer, scoring logic
│   │   ├── mock_interview.js  # Technical assessment simulation & answer evaluation
│   │   ├── skills.js          # Technical skill matrix management
│   │   └── applications.js    # Job application tracker modal and filtering
│   └── img/
│       ├── favicon-16x16.png
│       └── favicon-32x32.png
│
└── templates/
    ├── base.html              # Core layout shell with sidebar, topbar, and notifications
    ├── login.html             # Login screen with intro animation and role shortcuts
    ├── register.html          # New student onboarding form
    ├── dashboard.html         # Main student dashboard with readiness metrics & drives
    ├── roadmap.html           # Interactive career track roadmap
    ├── resume_builder.html    # Dual-pane resume builder
    ├── ats_checker.html       # Resume ATS scanner
    ├── aptitude.html          # Timed aptitude testing module
    ├── interview.html         # Technical interview question bank
    ├── mock_interview.html    # Interactive technical assessment & coding arena
    ├── skills.html            # Skill inventory and badges
    ├── applications.html      # Job application tracker
    ├── leaderboard.html       # Campus placement ranking table
    ├── profile.html           # Student profile management
    └── admin.html             # Placement officer management portal
```

---

## 🧪 Testing & Quality Assurance

Run the automated test suite to verify all backend routes, database integrity, and scoring engines:

```bash
python test_suite.py
```

All 19 modular tests validate student authentication, aptitude scoring, ATS parsing, technical assessment evaluation, application tracking, and administrative controls with 100% pass rate.
