# CareerX 🎓 - Campus Placement & Career Intelligence Portal

A comprehensive, client-side campus placement preparation and recruitment intelligence portal built with **pure HTML5, CSS3, and JavaScript (ES6+)**. 

Designed for engineering students and college Training & Placement Officers (TPO) to streamline interview preparation, aptitude testing, resume building, and campus drive tracking — running 100% in the browser with **zero backend or database setup required**.

---

## 🌟 Key Features

### 1. 📊 Student Dashboard & Placement Diagnostics
- **Live Readiness Benchmark**: Visual placement readiness percentage based on CGPA, aptitude test accuracy, ATS resume match, and technical assessments.
- **KPI Metrics**: Total job applications, verified skills, and interview scores.
- **Profile Switcher**: Switch between 6 pre-configured engineering student profiles (NIT Trichy, IIT Madras, BITS Pilani, NIT Surathkal, VIT, PSG Tech) with one click.

### 2. ⚡ Placement Aptitude Trainer
- **Timed Mock Tests**: Quantitative Aptitude, Logical Reasoning, and Verbal Ability tests with live countdown timer.
- **Cancel Test & Instant Scoring**: Ability to cancel ongoing test or complete it to view accuracy percentage and correct answers.
- **Test History Tracking**: Automatically logs test scores, accuracy %, time spent, and dates in browser localStorage.

### 3. ✍️ Write Interview Simulator & Question Bank
- **80 Curated Technical Questions**: 20 Python, 20 DSA, 20 SQL, and 20 System Design questions.
- **Answer Practice & Evaluation**: Write answers to interview prompts with keyword-based evaluation, model answers, and instant feedback.
- **Mastery Tracker**: Filter by domain, difficulty (Easy, Medium, Hard), and mark questions as mastered.

### 4. 📝 ATS Resume Builder & Scanner
- **Live Interactive Resume Builder**: Multiple templates (Ivy League, Modern Tech, Elegant), live PDF/print preview, and instant ATS score calculation.
- **ATS Scanner**: Paste your resume text to evaluate keyword match density against target engineering roles.

### 5. 🏢 Campus Recruitment Drives Pipeline
- **TPO Admin Management**: Placement cell can create new campus drives (Company, Role, Package LPA, Eligibility Criteria, Deadlines).
- **1-Click Apply**: Students can view all eligible campus drives on their dashboard or applications tracker and apply with a single click.
- **Real-Time Applications Log**: Tracks application status (`Applied`, `Screening`, `Interview`, `Offered`) dynamically.

### 6. 🏆 Placement Leaderboard & Skill Matrix
- **Campus Leaderboard**: Top ranks podium (Gold, Silver, Bronze) with composite placement readiness scoring.
- **Skill Tracker**: Verified competencies with proficiency levels (`Mastered`, `Proficient`, `Learning`) and certification records.

---

## 🚀 Demo Accounts

| Role | Username | Password | Full Name | College / Track |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student` | `student123` | Rahul Sharma | NIT Trichy (AI/ML Engineer) |
| **Student** | `priya` | `priya123` | Priya Patel | IIT Madras (Software Engineer) |
| **Student** | `ananya` | `ananya123` | Ananya Iyer | BITS Pilani (Full Stack Developer) |
| **Student** | `rohan` | `rohan123` | Rohan Verma | NIT Surathkal (DevOps Engineer) |
| **Student** | `siddharth` | `siddharth123` | Siddharth Nair | VIT Vellore (Data Analyst) |
| **Student** | `sneha` | `sneha123` | Sneha Reddy | PSG Tech (Cybersecurity) |
| **Placement Officer (TPO)** | `admin` | `admin123` | Dr. K. Ramanathan | Head of Corporate Relations |

---

## 💻 Tech Stack

- **Frontend**: Pure Semantic HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid)
- **Scripting**: Modern Vanilla JavaScript (ES6+)
- **Data Visualization**: [Chart.js](https://www.chartjs.org/)
- **Icons & Typography**: Font Awesome 6.5, Google Fonts (`Outfit`, `Fira Code`, `Inter`)
- **Data Storage**: Browser `localStorage` (Instant client-side persistence, zero server latency)

---

## 🛠️ How to Run Locally

Since CareerX is built strictly with pure HTML, CSS, and JavaScript, no build tools, Node.js, or server installations are required:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hariprasath29-codes/CARRER-X.git
   cd CARRER-X
   ```

2. **Open the project**:
   - Double-click `index.html` to open it directly in any modern web browser (Chrome, Edge, Firefox, Brave, Safari).
   - Alternatively, open the folder in **VS Code** and click **Go Live** using the Live Server extension.

---

## 🌐 How to Host on Vercel (Recommended)

### Method A: Via GitHub (Continuous Deployment)
1. Push your code to GitHub:
   ```bash
   git add -A
   git commit -m "Configure CareerX for Vercel static deployment"
   git push origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** and log in with GitHub.
3. Click **"Add New..."** > **"Project"**.
4. Select your **`CARRER-X`** repository and click **Import**.
5. Leave all settings at default (**Framework Preset: Other**, **Root Directory: ./**).
6. Click **Deploy**! Your site will be live in ~10 seconds with free SSL and custom domain support (e.g. `https://carrer-x.vercel.app`).

### Method B: Via Vercel CLI (Instant)
```bash
npx vercel
```
Accept default settings by pressing `Enter`, and Vercel will upload and give you a live production link immediately!

---

## 🌐 Alternative: Host on GitHub Pages (Free)

1. Push this repository to GitHub:
   ```bash
   git add -A
   git commit -m "Launch CareerX pure HTML/CSS/JS placement portal"
   git push origin main
   ```

2. On GitHub, navigate to your repository:
   - Click **Settings** (top tab)
   - In the left sidebar, click **Pages**
   - Under **Build and deployment** > **Branch**:
     - Select `main`
     - Select folder `/ (root)`
   - Click **Save**

3. Within 1–2 minutes, your live website will be published at:
   ```
   https://hariprasath29-codes.github.io/CARRER-X/
   ```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

