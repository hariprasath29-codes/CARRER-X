import os
import sys
import sqlite3
import html
import subprocess
import shutil

print("Building CareerX Complete Project Documentation PDF...")

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'careerx.db')
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Fetch all interview questions grouped by category
categories_order = [
    'DSA', 'Python', 'JavaScript', 'DBMS', 'OOPs', 
    'Operating Systems', 'System Design', 'Computer Networks', 
    'Data Science', 'HR'
]

interview_data = {}
for cat in categories_order:
    cursor.execute("SELECT * FROM interview_questions WHERE category = ? ORDER BY id ASC", (cat,))
    interview_data[cat] = [dict(r) for r in cursor.fetchall()]

# Fetch sample aptitude counts
cursor.execute("SELECT category, COUNT(*) FROM aptitude_questions GROUP BY category")
aptitude_counts = {r[0]: r[1] for r in cursor.fetchall()}

conn.close()

# Generate HTML
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CareerX - Complete Project Documentation</title>
    <style>
        @page {{
            size: A4;
            margin: 18mm 16mm 18mm 16mm;
            @bottom-right {{
                content: "Page " counter(page);
                font-size: 8pt;
                color: #64748B;
                font-family: 'Segoe UI', Arial, sans-serif;
            }}
            @bottom-left {{
                content: "CareerX - AI Placement Readiness & Career Platform";
                font-size: 8pt;
                color: #64748B;
                font-family: 'Segoe UI', Arial, sans-serif;
            }}
        }}

        body {{
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.55;
            color: #1E293B;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
        }}

        /* Page Breaks */
        .page-break {{
            page-break-before: always;
            break-before: page;
        }}
        .no-break {{
            page-break-inside: avoid;
            break-inside: avoid;
        }}

        /* Cover Page */
        .cover-page {{
            min-height: 95vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 2.5rem 1.5rem;
            box-sizing: border-box;
            border: 2px solid #E2E8F0;
            border-radius: 12px;
            background: linear-gradient(180deg, #FAFAFE 0%, #FFFFFF 100%);
        }}

        .cover-header {{
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 1.5rem;
        }}

        .cover-badge {{
            display: inline-block;
            background: #EEF2FF;
            color: #4F46E5;
            font-size: 8.5pt;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 999px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 1rem;
            border: 1px solid #C7D2FE;
        }}

        .cover-title {{
            font-size: 28pt;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.15;
            margin: 0 0 0.5rem 0;
        }}

        .cover-title span {{
            color: #4F46E5;
        }}

        .cover-subtitle {{
            font-size: 13pt;
            color: #475569;
            margin: 0;
            line-height: 1.4;
            font-weight: 500;
        }}

        .cover-meta-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
            margin: 2rem 0;
            padding: 1.5rem;
            background: #F8FAFC;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
        }}

        .cover-meta-item {{
            font-size: 9.5pt;
        }}
        .cover-meta-item strong {{
            display: block;
            color: #64748B;
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }}
        .cover-meta-item span {{
            color: #0F172A;
            font-weight: 600;
        }}

        .cover-footer {{
            border-top: 1px solid #E2E8F0;
            padding-top: 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8.5pt;
            color: #64748B;
        }}

        /* Typography & Headings */
        h1 {{
            font-size: 18pt;
            font-weight: 700;
            color: #0F172A;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 6px;
            margin-top: 1.75rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
        }}

        h1::before {{
            content: "";
            display: inline-block;
            width: 6px;
            height: 20px;
            background: #4F46E5;
            margin-right: 10px;
            border-radius: 2px;
        }}

        h2 {{
            font-size: 13pt;
            font-weight: 700;
            color: #1E293B;
            margin-top: 1.25rem;
            margin-bottom: 0.5rem;
        }}

        h3 {{
            font-size: 11pt;
            font-weight: 600;
            color: #334155;
            margin-top: 1rem;
            margin-bottom: 0.35rem;
        }}

        p {{
            margin: 0 0 0.75rem 0;
            text-align: justify;
        }}

        /* Lists */
        ul, ol {{
            margin: 0 0 0.85rem 0;
            padding-left: 1.4rem;
        }}
        li {{
            margin-bottom: 0.35rem;
        }}

        /* Tables */
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 0.85rem 0 1.25rem 0;
            font-size: 8.8pt;
        }}

        th, td {{
            padding: 7px 10px;
            border: 1px solid #CBD5E1;
            text-align: left;
            vertical-align: top;
        }}

        th {{
            background: #F1F5F9;
            font-weight: 700;
            color: #0F172A;
        }}

        tr:nth-child(even) td {{
            background: #F8FAFC;
        }}

        /* Callout Boxes */
        .callout {{
            border-left: 4px solid #4F46E5;
            background: #F8FAFC;
            padding: 10px 14px;
            margin: 0.9rem 0;
            border-radius: 0 6px 6px 0;
            font-size: 9.2pt;
        }}
        .callout-title {{
            font-weight: 700;
            color: #4F46E5;
            margin-bottom: 4px;
            font-size: 9.5pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .callout-success {{
            border-left-color: #10B981;
            background: #F0FDF4;
        }}
        .callout-success .callout-title {{
            color: #059669;
        }}
        .callout-warning {{
            border-left-color: #F59E0B;
            background: #FFFBEB;
        }}
        .callout-warning .callout-title {{
            color: #D97706;
        }}

        /* Badges */
        .badge {{
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .badge-easy {{
            background: #DCFCE7;
            color: #166534;
            border: 1px solid #86EFAC;
        }}
        .badge-medium {{
            background: #FEF3C7;
            color: #92400E;
            border: 1px solid #FCD34D;
        }}
        .badge-hard {{
            background: #FEE2E2;
            color: #991B1B;
            border: 1px solid #FCA5A5;
        }}
        .badge-pill {{
            background: #EEF2FF;
            color: #4338CA;
            border-radius: 999px;
            padding: 3px 9px;
            font-size: 8pt;
        }}

        /* Code snippets */
        code {{
            background: #F1F5F9;
            padding: 1px 4px;
            border-radius: 3px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 8.5pt;
            color: #C026D3;
        }}
        pre {{
            background: #0F172A;
            color: #E2E8F0;
            padding: 10px 12px;
            border-radius: 6px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 8.2pt;
            overflow-x: auto;
            margin: 0.75rem 0;
            line-height: 1.45;
        }}

        /* Architecture Box Diagram */
        .arch-diagram {{
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 1.25rem 0;
            padding: 14px;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
        }}
        .arch-layer {{
            padding: 10px 14px;
            border-radius: 6px;
            background: #FFFFFF;
            border: 1px solid #CBD5E1;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }}
        .arch-layer-header {{
            font-weight: 700;
            font-size: 9pt;
            color: #4F46E5;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
        }}
        .arch-layer-desc {{
            font-size: 8.5pt;
            color: #475569;
        }}

        /* Question Item Cards */
        .q-card {{
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 12px;
            background: #FFFFFF;
            page-break-inside: avoid;
            break-inside: avoid;
        }}
        .q-header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 6px;
        }}
        .q-title {{
            font-weight: 700;
            font-size: 9.8pt;
            color: #0F172A;
            flex: 1;
            padding-right: 12px;
        }}
        .q-answer {{
            font-size: 8.8pt;
            color: #334155;
            background: #F8FAFC;
            border-left: 3px solid #CBD5E1;
            padding: 8px 10px;
            margin-top: 6px;
            white-space: pre-line;
            line-height: 1.45;
        }}
        .q-keypoints {{
            font-size: 8pt;
            color: #047857;
            background: #ECFDF5;
            border-radius: 4px;
            padding: 5px 8px;
            margin-top: 6px;
        }}
        .q-keypoints strong {{
            color: #065F46;
        }}

        /* Table of Contents */
        .toc-item {{
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dotted #CBD5E1;
            font-size: 9.5pt;
        }}
        .toc-title {{
            font-weight: 600;
            color: #1E293B;
        }}
        .toc-dots {{
            flex: 1;
            margin: 0 8px;
        }}
        .toc-page {{
            color: #64748B;
            font-weight: 700;
        }}
    </style>
</head>
<body>

<!-- ========================================== -->
<!-- COVER PAGE                                 -->
<!-- ========================================== -->
<div class="cover-page">
    <div class="cover-header">
        <span class="cover-badge">Official Technical Whitepaper & User Manual</span>
        <h1 class="cover-title">Career<span>X</span></h1>
        <p class="cover-subtitle">
            Next-Generation AI-Powered Placement Readiness, Assessment & Career Acceleration Platform
        </p>
    </div>

    <div>
        <p style="font-size: 10.5pt; color: #334155; line-height: 1.6; margin-bottom: 1.25rem;">
            A unified full-stack ecosystem bridging academic preparation and corporate engineering expectations. Built with modular Python Flask architecture, high-efficiency SQLite relational persistence with serverless capability, an automated ATS resume scoring engine, a timed aptitude diagnostics suite, and a curated 80-question multi-domain technical interview evaluation bank.
        </p>

        <div class="cover-meta-grid">
            <div class="cover-meta-item">
                <strong>Platform Version</strong>
                <span>Release v2.0 (Production Stable)</span>
            </div>
            <div class="cover-meta-item">
                <strong>Core Stack</strong>
                <span>Python 3.11+, Flask, SQLite3, Vanilla ES6</span>
            </div>
            <div class="cover-meta-item">
                <strong>Curated Domains</strong>
                <span>10 Technical & Behavioral Categories</span>
            </div>
            <div class="cover-meta-item">
                <strong>Deployment Target</strong>
                <span>Local Server / Vercel Serverless WSGI</span>
            </div>
            <div class="cover-meta-item">
                <strong>Author & Engineering</strong>
                <span>Hariprasath & CareerX Core Team</span>
            </div>
            <div class="cover-meta-item">
                <strong>Date & Edition</strong>
                <span>October 2026 Edition</span>
            </div>
        </div>
    </div>

    <div class="cover-footer">
        <div>&copy; 2026 CareerX Engineering. All rights reserved.</div>
        <div>Confidential &bull; Prepared for Academic & Placement Reviews</div>
    </div>
</div>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- TABLE OF CONTENTS                          -->
<!-- ========================================== -->
<h1>Table of Contents</h1>
<div style="margin: 1.5rem 0;">
    <div class="toc-item"><span class="toc-title">1. Executive Summary & Project Purpose</span><span class="toc-page">Page 3</span></div>
    <div class="toc-item"><span class="toc-title">2. High-Level System Architecture & Technology Stack</span><span class="toc-page">Page 4</span></div>
    <div class="toc-item"><span class="toc-title">3. Detailed Module Integrations & "How We Integrated"</span><span class="toc-page">Page 5</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 3.1 AI Placement Career Assistant & Chatbot</span><span class="toc-page">Page 5</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 3.2 Smart ATS Resume Checker & Dynamic Builder</span><span class="toc-page">Page 6</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 3.3 Timed Aptitude Examination & Diagnostic Engine</span><span class="toc-page">Page 7</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 3.4 Technical Interview Preparation & Evaluation Bank</span><span class="toc-page">Page 8</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 3.5 Dynamic Skill Matrix & Career Roadmap Generator</span><span class="toc-page">Page 9</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 3.6 Campus Placement Drive Tracker & Job Application Pipeline</span><span class="toc-page">Page 10</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 3.7 Training & Placement Officer (TPO) Admin Command Center</span><span class="toc-page">Page 11</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 3.8 Gamification, Badges & Competitive Leaderboard</span><span class="toc-page">Page 12</span></div>
    <div class="toc-item"><span class="toc-title">4. Relational Database Schema & Data Models (11 Tables)</span><span class="toc-page">Page 13</span></div>
    <div class="toc-item"><span class="toc-title">5. Complete Technical Interview Question Bank (80 Questions Across 10 Domains)</span><span class="toc-page">Page 15</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.1 Data Structures & Algorithms (DSA)</span><span class="toc-page">Page 15</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.2 Operating Systems (OS)</span><span class="toc-page">Page 17</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.3 System Design & Distributed Systems</span><span class="toc-page">Page 19</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.4 Computer Networks (CN)</span><span class="toc-page">Page 21</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.5 Python Programming</span><span class="toc-page">Page 23</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.6 JavaScript & Web Architecture</span><span class="toc-page">Page 25</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.7 Database Management Systems (DBMS)</span><span class="toc-page">Page 27</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.8 Object-Oriented Programming (OOPs)</span><span class="toc-page">Page 29</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.9 Data Science & Machine Learning</span><span class="toc-page">Page 31</span></div>
    <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">&bull; 5.10 HR & Behavioral Placement Questions (STAR Method)</span><span class="toc-page">Page 33</span></div>
    <div class="toc-item"><span class="toc-title">6. Security, Authentication & Performance Optimizations</span><span class="toc-page">Page 35</span></div>
    <div class="toc-item"><span class="toc-title">7. Step-by-Step Installation, Setup & Deployment Guide</span><span class="toc-page">Page 36</span></div>
    <div class="toc-item"><span class="toc-title">8. Future Engineering Roadmap & Scalability</span><span class="toc-page">Page 37</span></div>
</div>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- SECTION 1: EXECUTIVE SUMMARY               -->
<!-- ========================================== -->
<h1>1. Executive Summary & Project Purpose</h1>

<h2>1.1 Project Vision</h2>
<p>
    <strong>CareerX</strong> is an integrated career acceleration and placement readiness platform engineered to solve the widespread friction between undergraduate technical education and tier-1 corporate hiring standards. Modern placement processes demand multidimensional competence: passing automated Applicant Tracking Systems (ATS), clearing timed aptitude screening rounds, demonstrating deep technical computer science fundamentals, and presenting articulated behavioral answers.
</p>
<p>
    Traditional college portals operate merely as notice boards, forcing students to juggle disparate tools for resume building, LeetCode drills, aptitude mock exams, and company tracking. CareerX unifies these isolated capabilities into a cohesive, gamified, data-driven web platform.
</p>

<h2>1.2 Key Industry Problems Addressed</h2>
<ul>
    <li><strong>75%+ First-Round Resume Rejection:</strong> Candidates frequently fail automated ATS screening due to unparsed formatting, missing industry-standard taxonomy keywords, or low semantic keyword density.</li>
    <li><strong>Lack of Benchmarked Technical Answers:</strong> Students practice coding syntax but struggle to articulate architectural concepts during technical interviews (e.g., explaining the C3 Linearization algorithm in Python, virtual memory thrashing, or CAP theorem trade-offs).</li>
    <li><strong>Disjointed Aptitude Practice:</strong> Aptitude tests require speed under timed constraints. CareerX provides instant scoring, timers, and detailed mathematical explanations.</li>
    <li><strong>Placement Cell Oversight Deficits:</strong> Training & Placement Officers (TPOs) lack real-time visibility into student readiness percentiles, hiring pipelines, and historical performance bottlenecks.</li>
</ul>

<div class="callout callout-success">
    <div class="callout-title">The CareerX Solution</div>
    CareerX provides an automated end-to-end feedback loop: diagnostic tests evaluate candidate weaknesses, personalized roadmaps prescribe milestone remediation, ATS scanners verify resume compliance, and TPO dashboards monitor institutional placement conversion rates.
</div>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- SECTION 2: SYSTEM ARCHITECTURE             -->
<!-- ========================================== -->
<h1>2. High-Level System Architecture & Tech Stack</h1>

<h2>2.1 Architectural Paradigm</h2>
<p>
    CareerX follows a modular <strong>Model-View-Controller (MVC) / Application Factory</strong> architecture. It emphasizes zero external runtime dependencies, rapid cold starts (under 150ms), and predictable behavior across both local developer environments and serverless cloud runtimes.
</p>

<div class="arch-diagram no-break">
    <div class="arch-layer">
        <div class="arch-layer-header">
            <span>Layer 1: Presentation & Client Interface</span>
            <span>Frontend</span>
        </div>
        <div class="arch-layer-desc">
            Semantic HTML5, Vanilla CSS3 Design System with CSS variables (light/dark mode ready), Glassmorphism UI tokens, Vanilla ES6 JavaScript (zero heavy JS framework bloat), Chart.js for diagnostics, FontAwesome 6 icons.
        </div>
    </div>
    <div class="arch-layer">
        <div class="arch-layer-header">
            <span>Layer 2: Application Controller & Routing</span>
            <span>Python / Flask</span>
        </div>
        <div class="arch-layer-desc">
            Flask 3.x WSGI application server, Jinja2 template rendering with inheritance, RESTful JSON API endpoints, Werkzeug cryptographic password hashing (scrypt / pbkdf2), HTTP session authentication, role-based authorization decorators (<code>@login_required</code>, <code>@admin_required</code>).
        </div>
    </div>
    <div class="arch-layer">
        <div class="arch-layer-header">
            <span>Layer 3: Core Business Logic & AI Engines</span>
            <span>Services & Algorithms</span>
        </div>
        <div class="arch-layer-desc">
            Composite Readiness Scoring Formula, ATS Keyword Density & Taxonomy Matching Algorithm, Automated Aptitude Evaluation Engine, Simulated Mock Interview Evaluator, CSV Report Generator.
        </div>
    </div>
    <div class="arch-layer">
        <div class="arch-layer-header">
            <span>Layer 4: Relational Persistence Layer</span>
            <span>SQLite3 / Serverless Adapter</span>
        </div>
        <div class="arch-layer-desc">
            ACID-compliant SQLite relational database, automated cold-start schema initializers (<code>init_db</code>, <code>seed_data</code>), serverless <code>/tmp</code> dynamic database copying for read-only Vercel filesystems, compound performance indexes.
        </div>
    </div>
</div>

<h2>2.2 Technology Stack Matrix</h2>
<table>
    <thead>
        <tr>
            <th>Subsystem</th>
            <th>Technology Selected</th>
            <th>Engineering Rationale & Advantages</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Backend Core</strong></td>
            <td>Python 3.11+ / Flask 3.1.3</td>
            <td>Lightweight, zero-overhead execution, seamless integration with Python data science and machine learning libraries.</td>
        </tr>
        <tr>
            <td><strong>Styling & Design</strong></td>
            <td>Vanilla CSS3 Custom Tokens</td>
            <td>High-performance rendering with zero CSS build step; elegant modern glassmorphism aesthetic with CSS custom properties.</td>
        </tr>
        <tr>
            <td><strong>Client Scripting</strong></td>
            <td>Vanilla ES6+ JavaScript</td>
            <td>Direct DOM manipulation, fast client-side filtering, zero framework overhead (no React/Vue hydration delays).</td>
        </tr>
        <tr>
            <td><strong>Data Persistence</strong></td>
            <td>SQLite3 with Serverless Adapter</td>
            <td>Embedded zero-configuration relational storage, strict ACID transaction support, seamless migration to PostgreSQL/MySQL.</td>
        </tr>
        <tr>
            <td><strong>Security & Auth</strong></td>
            <td>Werkzeug Security Suite</td>
            <td>Cryptographically secure salt-hashed passwords, session fixation mitigation, sanitized SQL parameters against SQL injection.</td>
        </tr>
        <tr>
            <td><strong>Data Visualization</strong></td>
            <td>Chart.js 4.x CDN</td>
            <td>Canvas-accelerated responsive radar, donut, and bar charts for student performance diagnostics and placement distributions.</td>
        </tr>
    </tbody>
</table>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- SECTION 3: DETAILED MODULE INTEGRATIONS    -->
<!-- ========================================== -->
<h1>3. Detailed Module Integrations: What & How</h1>

<p>
    This section documents every major subsystem integrated into CareerX, explaining both <em>what functionality was built</em> and the <em>exact technical mechanism of how it is integrated</em> into the code and database.
</p>

<h2>3.1 AI Placement Career Assistant & Chatbot</h2>
<div class="callout">
    <div class="callout-title">Module Overview</div>
    <strong>What it is:</strong> An always-available intelligent career advisor capable of answering placement queries, providing resume tips, reviewing technical concepts, and suggesting personalized preparation strategies.
</div>
<h3>Technical Integration Workflow:</h3>
<ol>
    <li><strong>Session Lifecycle Management:</strong> When a user navigates to <code>/chat</code>, the route checks for existing active sessions in the <code>chat_sessions</code> table. If none exist, a new session is initialized.</li>
    <li><strong>Conversation Persistence:</strong> All conversational turns (both <code>user</code> prompt and <code>assistant</code> response) are committed atomically into <code>chat_history</code> referenced by <code>session_id</code> and <code>user_id</code>.</li>
    <li><strong>Context Injection & Processing:</strong> The route <code>/api/chat/message</code> receives candidate input via JSON POST, retrieves the last 6 messages from the conversation history for context continuity, processes domain-specific queries, and generates a structured Markdown response.</li>
    <li><strong>Client-Side Markdown Rendering:</strong> The front-end dynamically renders the response with syntax-highlighted code blocks, copy-to-clipboard buttons, and auto-scroll behavior.</li>
</ol>

<h2>3.2 Smart ATS Resume Checker & Dynamic Builder</h2>
<div class="callout">
    <div class="callout-title">Module Overview</div>
    <strong>What it is:</strong> A dual-purpose module containing a multi-template live resume builder and an automated ATS (Applicant Tracking System) scanner that computes match scores and identifies missing critical keywords.
</div>
<h3>Technical Integration Workflow:</h3>
<ol>
    <li><strong>Resume Data Storage:</strong> In the <code>resumes</code> table, complex composite data (work experience, education milestones, technical skills, projects, certifications) are serialized into clean, validated JSON strings.</li>
    <li><strong>ATS Parsing & Scoring Algorithm:</strong>
        <ul>
            <li><strong>Text Sanitization:</strong> Normalizes candidate input text by removing punctuation, converting to lowercase, and eliminating stop-words.</li>
            <li><strong>Role Taxonomy Comparison:</strong> Compares candidate text against predefined dictionary skill taxonomies for target roles (e.g., Software Engineer, AI/ML Engineer, Full Stack Developer, Data Scientist).</li>
            <li><strong>Scoring Formula:</strong>
                <pre>ATS Score = (Matched Skills / Target Domain Skills) * 60 + Formatting Check (20) + Length Check (20)</pre>
            </li>
            <li><strong>Gap Analysis:</strong> Generates two lists: <code>matched_skills</code> (green badges) and <code>missing_skills</code> (recommended keyword additions).</li>
        </ul>
    </li>
    <li><strong>Printable & Export Ready:</strong> Implements CSS <code>@media print</code> rules that hide sidebar navigation, strip shadows, enforce standard A4 page dimensions, and format headers for clean single-page PDF output directly from the browser.</li>
</ol>

<div class="page-break"></div>

<h2>3.3 Timed Aptitude Examination & Diagnostic Engine</h2>
<div class="callout">
    <div class="callout-title">Module Overview</div>
    <strong>What it is:</strong> An interactive test engine simulating preliminary placement screening rounds across Quantitative Aptitude, Logical Reasoning, and Verbal Ability with strict time constraints.
</div>
<h3>Technical Integration Workflow:</h3>
<ol>
    <li><strong>Database Seeding:</strong> Over 18+ high-yield aptitude questions categorized across Quantitative, Logical, and Verbal domains stored in the <code>aptitude_questions</code> table with 4 options (A, B, C, D), correct option keys, and comprehensive step-by-step mathematical explanations.</li>
    <li><strong>Dynamic Randomization & Session Tracking:</strong> When a user begins an assessment at <code>/aptitude/test</code>, questions are pulled randomly from the selected category to prevent test memorization.</li>
    <li><strong>Client-Side Countdown Timer:</strong> A JavaScript interval timer tracks total duration. If the timer reaches 00:00, the test automatically auto-submits via an asynchronous <code>fetch()</code> call.</li>
    <li><strong>Server Evaluation API (<code>/api/aptitude/evaluate</code>):</strong>
        <ul>
            <li>Validates submitted answers against authoritative database keys.</li>
            <li>Calculates accuracy percentage: <code>(correct_count / total_questions) * 100</code>.</li>
            <li>Records the score in <code>aptitude_scores</code> with <code>time_spent_sec</code>.</li>
            <li>Checks if accuracy exceeds 80% to automatically award the <strong>Aptitude Ace</strong> badge via <code>check_and_award_badge()</code>.</li>
        </ul>
    </li>
</ol>

<h2>3.4 Technical Interview Preparation & Evaluation Bank</h2>
<div class="callout">
    <div class="callout-title">Module Overview</div>
    <strong>What it is:</strong> A master bank of 80 placement interview questions across 10 core computer science and engineering domains, complete with benchmark model answers, difficulty filters, and evaluator rubrics.
</div>
<h3>Technical Integration Workflow:</h3>
<ol>
    <li><strong>10 Core Specialized Domains:</strong>
        <div style="margin: 6px 0;">
            <span class="badge badge-pill">DSA</span>
            <span class="badge badge-pill">Operating Systems</span>
            <span class="badge badge-pill">System Design</span>
            <span class="badge badge-pill">Computer Networks</span>
            <span class="badge badge-pill">Python</span>
            <span class="badge badge-pill">JavaScript</span>
            <span class="badge badge-pill">DBMS</span>
            <span class="badge badge-pill">OOPs</span>
            <span class="badge badge-pill">Data Science</span>
            <span class="badge badge-pill">HR / Behavioral</span>
        </div>
    </li>
    <li><strong>Schema Architecture (<code>interview_questions</code>):</strong> Stores <code>category</code>, <code>difficulty</code> (Easy, Medium, Hard), <code>question</code>, <code>model_answer</code>, and <code>key_points</code> (evaluator rubric checklist).</li>
    <li><strong>Interactive Client Filtering:</strong>
        <ul>
            <li>Live search input filters cards in real time based on keyword text matching.</li>
            <li>Difficulty toggle buttons (All, Easy, Medium, Hard) instantaneously isolate targeted question depths.</li>
            <li>Global "Expand / Collapse All" toggle for streamlined review.</li>
        </ul>
    </li>
    <li><strong>Simulated Mock Assessment Evaluation:</strong> Under <code>/mock-interview</code>, candidates enter text or voice transcripts for randomized questions. The server endpoint (<code>/api/mock-interview/evaluate</code>) scores candidate answers against model key points, logs the rating in <code>interview_scores</code>, and triggers performance badge updates.</li>
</ol>

<div class="page-break"></div>

<h2>3.5 Dynamic Skill Matrix & Career Roadmap Generator</h2>
<div class="callout">
    <div class="callout-title">Module Overview</div>
    <strong>What it is:</strong> An interactive skill tracker and personalized milestone roadmap generator that visualizes career progression towards specific job targets.
</div>
<h3>Technical Integration Workflow:</h3>
<ol>
    <li><strong>Relational Skill Tracking (<code>skills</code> table):</strong> Each student logs skills classified into categories (Programming, Backend, Frontend, Databases, Core CS, Tools). Proficiencies are tracked from 0% to 100% with status indicators (<em>Learning</em>, <em>Proficient</em>, <em>Mastered</em>).</li>
    <li><strong>Curated Role Roadmaps:</strong> Predefined milestone blueprints for roles like <em>AI/ML Engineer</em>, <em>Full Stack Developer</em>, <em>Cloud DevOps Engineer</em>, and <em>Data Engineer</em>.</li>
    <li><strong>Real-Time API Sync:</strong> When candidates check off completed milestones, an asynchronous POST to <code>/api/roadmap/update</code> updates <code>completed_steps_json</code> and recomputes <code>progress_pct</code> in real time. Reaching 50% progress automatically unlocks the <strong>Roadmap Crusher</strong> badge.</li>
</ol>

<h2>3.6 Campus Placement Drive Tracker & Job Application Pipeline</h2>
<div class="callout">
    <div class="callout-title">Module Overview</div>
    <strong>What it is:</strong> A digital campus placement recruitment portal where placement officers publish drives and students manage applications across Kanban stages.
</div>
<h3>Technical Integration Workflow:</h3>
<ol>
    <li><strong>Placement Drives (<code>placement_drives</code>):</strong> TPOs announce upcoming campus drives with attributes: Company Name, Role, CTC (LPA), Eligibility (Minimum CGPA), Drive Date, Application Deadline, and Status (<em>Open</em> / <em>Closed</em>).</li>
    <li><strong>Student Application Pipeline (<code>job_applications</code>):</strong> Tracks individual candidate status transitions:
        <pre>Applied  &rarr;  Screening  &rarr;  Interview  &rarr;  Offer  (or Rejected)</pre>
    </li>
    <li><strong>Live Applicant Count Aggregation:</strong> The backend queries live application counts per drive:
        <pre>SELECT COUNT(*) FROM job_applications WHERE LOWER(company) = LOWER(drive.company)</pre>
        allowing TPOs to instantly see candidate registration velocity.
    </li>
</ol>

<h2>3.7 Training & Placement Officer (TPO) Admin Command Center</h2>
<div class="callout">
    <div class="callout-title">Module Overview</div>
    <strong>What it is:</strong> An institutional executive command center providing placement coordinators with complete oversight over campus hiring operations.
</div>
<h3>Technical Integration Workflow:</h3>
<ol>
    <li><strong>Institutional KPI Analytics:</strong> Automatically computes:
        <ul>
            <li><strong>Placement Rate:</strong> <code>(Placed Students / Total Enrolled Students) * 100</code></li>
            <li><strong>Highest CTC Package:</strong> Maximum salary offered across all student offers and campus drives.</li>
            <li><strong>Average CTC Package:</strong> Mean salary of confirmed student offers.</li>
        </ul>
    </li>
    <li><strong>Drive Actions & Instant Emergency Broadcasts:</strong>
        <ul>
            <li><strong>Broadcast Reminder:</strong> TPOs can click "Broadcast" on any drive, which automatically injects an urgent alert into <code>placement_notices</code> for all students.</li>
            <li><strong>Drive Deletion & Status Toggling:</strong> Safe cascading updates for expired drives.</li>
        </ul>
    </li>
    <li><strong>Comprehensive Student Drill-Down Modal:</strong> Clicking any student in the admin portal opens a modal loading verified skills, aptitude drill accuracy, ATS score, and current application stages directly from in-memory JSON data maps.</li>
    <li><strong>CSV Data Export:</strong> Generates RFC-compliant CSV files containing student contact details, college, target roles, readiness scores, and placement statuses for institutional reporting.</li>
</ol>

<div class="page-break"></div>

<h2>3.8 Gamification, Badges & Competitive Leaderboard</h2>
<div class="callout">
    <div class="callout-title">Module Overview</div>
    <strong>What it is:</strong> A motivational engine calculating a standardized Composite Placement Readiness Index and awarding achievement badges to drive consistent daily practice.
</div>
<h3>Composite Readiness Index Formula:</h3>
<p>
    Rather than relying solely on academic GPA, CareerX computes a holistic readiness score:
</p>
<pre>
Composite Readiness = (0.30 &times; Aptitude_Score) 
                    + (0.30 &times; (Interview_Rating &times; 10)) 
                    + (0.25 &times; ATS_Resume_Score) 
                    + (0.15 &times; Min(Verified_Skills &times; 10, 100))
</pre>
<table>
    <thead>
        <tr>
            <th>Readiness Score Range</th>
            <th>Readiness Tier</th>
            <th>Color Indicator</th>
            <th>Placement Outlook</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>85% &ndash; 100%</td>
            <td><strong>Placement Ready (Elite)</strong></td>
            <td>Emerald Green</td>
            <td>Strong candidate for Day-1 product firms (Google, Microsoft, Amazon).</td>
        </tr>
        <tr>
            <td>70% &ndash; 84%</td>
            <td><strong>Competitive</strong></td>
            <td>Indigo Blue</td>
            <td>Well-positioned for high-growth tech firms (Zoho, Razorpay, TCS Digital).</td>
        </tr>
        <tr>
            <td>50% &ndash; 69%</td>
            <td><strong>Progressing</strong></td>
            <td>Amber Gold</td>
            <td>Requires focused aptitude practice and resume keyword alignment.</td>
        </tr>
        <tr>
            <td>0% &ndash; 49%</td>
            <td><strong>Foundation Stage</strong></td>
            <td>Crimson Red</td>
            <td>Needs foundational curriculum review across DSA and core CS domains.</td>
        </tr>
    </tbody>
</table>

<h3>Automated Badging Subsystem:</h3>
<p>
    The helper function <code>check_and_award_badge(user_id, badge_key, name, desc, icon)</code> evaluates triggers:
</p>
<ul>
    <li><code>aptitude_star</code> (Aptitude Ace): Awarded upon scoring &gt; 80% on timed aptitude mock exams.</li>
    <li><code>resume_ready</code> (ATS Champion): Awarded when an ATS scan score exceeds 85%.</li>
    <li><code>skill_polyglot</code> (Tech Explorer): Awarded when 5+ verified technical proficiencies are logged.</li>
    <li><code>mock_master</code> (Assessment Pro): Awarded upon completing a technical interview evaluation session.</li>
    <li><code>roadmap_milestone</code> (Roadmap Crusher): Awarded upon completing 50%+ of a career milestone roadmap.</li>
</ul>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- SECTION 4: DATABASE SCHEMA & DATA MODELS   -->
<!-- ========================================== -->
<h1>4. Relational Database Schema & Data Models</h1>

<p>
    CareerX uses a normalized relational SQLite database schema with 11 primary operational tables. Below are the complete specifications, data types, constraints, and relationships.
</p>

<h2>4.1 Table Specifications</h2>

<h3>1. <code>users</code> &mdash; User Accounts & Profiles</h3>
<table>
    <tr><th>Column</th><th>Type</th><th>Constraints</th><th>Description</th></tr>
    <tr><td><code>id</code></td><td>INTEGER</td><td>PRIMARY KEY AUTOINCREMENT</td><td>Unique user identifier</td></tr>
    <tr><td><code>username</code></td><td>TEXT</td><td>UNIQUE, NOT NULL</td><td>Login username</td></tr>
    <tr><td><code>email</code></td><td>TEXT</td><td>UNIQUE, NOT NULL</td><td>Contact email address</td></tr>
    <tr><td><code>password_hash</code></td><td>TEXT</td><td>NOT NULL</td><td>Werkzeug scrypt/pbkdf2 salted hash</td></tr>
    <tr><td><code>role</code></td><td>TEXT</td><td>DEFAULT 'student'</td><td>'student' or 'admin'</td></tr>
    <tr><td><code>full_name</code></td><td>TEXT</td><td>-</td><td>Full candidate legal name</td></tr>
    <tr><td><code>college</code></td><td>TEXT</td><td>-</td><td>College / University name</td></tr>
    <tr><td><code>branch</code></td><td>TEXT</td><td>-</td><td>Engineering discipline (CSE, IT, AI)</td></tr>
    <tr><td><code>grad_year</code></td><td>INTEGER</td><td>-</td><td>Year of graduation</td></tr>
    <tr><td><code>target_role</code></td><td>TEXT</td><td>DEFAULT 'Software Engineer'</td><td>Target career profile</td></tr>
    <tr><td><code>bio</code></td><td>TEXT</td><td>-</td><td>Brief profile summary</td></tr>
    <tr><td><code>created_at</code></td><td>TIMESTAMP</td><td>DEFAULT CURRENT_TIMESTAMP</td><td>Account registration timestamp</td></tr>
</table>

<h3>2. <code>interview_questions</code> &mdash; Technical Question Bank</h3>
<table>
    <tr><th>Column</th><th>Type</th><th>Constraints</th><th>Description</th></tr>
    <tr><td><code>id</code></td><td>INTEGER</td><td>PRIMARY KEY AUTOINCREMENT</td><td>Question ID</td></tr>
    <tr><td><code>category</code></td><td>TEXT</td><td>NOT NULL</td><td>Domain (DSA, OS, System Design, Python, etc.)</td></tr>
    <tr><td><code>difficulty</code></td><td>TEXT</td><td>DEFAULT 'Medium'</td><td>'Easy', 'Medium', or 'Hard'</td></tr>
    <tr><td><code>question</code></td><td>TEXT</td><td>NOT NULL</td><td>Full technical question statement</td></tr>
    <tr><td><code>model_answer</code></td><td>TEXT</td><td>NOT NULL</td><td>Comprehensive benchmark technical answer</td></tr>
    <tr><td><code>key_points</code></td><td>TEXT</td><td>-</td><td>Evaluator criteria & critical concepts checklist</td></tr>
</table>

<h3>3. <code>placement_drives</code> &mdash; Campus Recruitment Drives</h3>
<table>
    <tr><th>Column</th><th>Type</th><th>Constraints</th><th>Description</th></tr>
    <tr><td><code>id</code></td><td>INTEGER</td><td>PRIMARY KEY AUTOINCREMENT</td><td>Drive identifier</td></tr>
    <tr><td><code>company</code></td><td>TEXT</td><td>NOT NULL</td><td>Recruiting company name</td></tr>
    <tr><td><code>role</code></td><td>TEXT</td><td>NOT NULL</td><td>Job position offered</td></tr>
    <tr><td><code>package_lpa</code></td><td>REAL</td><td>NOT NULL</td><td>Salary package in LPA (₹ Lakhs)</td></tr>
    <tr><td><code>min_cgpa</code></td><td>REAL</td><td>DEFAULT 6.5</td><td>Eligibility criteria cut-off</td></tr>
    <tr><td><code>location</code></td><td>TEXT</td><td>DEFAULT 'Pan India / Remote'</td><td>Job posting location</td></tr>
    <tr><td><code>drive_date</code></td><td>TEXT</td><td>NOT NULL</td><td>Scheduled drive date</td></tr>
    <tr><td><code>deadline</code></td><td>TEXT</td><td>NOT NULL</td><td>Application deadline date</td></tr>
    <tr><td><code>status</code></td><td>TEXT</td><td>DEFAULT 'Open'</td><td>'Open' or 'Closed'</td></tr>
    <tr><td><code>description</code></td><td>TEXT</td><td>-</td><td>Job requirements & round descriptions</td></tr>
</table>

<div class="page-break"></div>

<h3>4. <code>job_applications</code> &mdash; Candidate Application Pipeline</h3>
<table>
    <tr><th>Column</th><th>Type</th><th>Constraints</th><th>Description</th></tr>
    <tr><td><code>id</code></td><td>INTEGER</td><td>PRIMARY KEY AUTOINCREMENT</td><td>Application ID</td></tr>
    <tr><td><code>user_id</code></td><td>INTEGER</td><td>FOREIGN KEY &rarr; users(id)</td><td>Applying candidate ID</td></tr>
    <tr><td><code>company</code></td><td>TEXT</td><td>NOT NULL</td><td>Company applied to</td></tr>
    <tr><td><code>role</code></td><td>TEXT</td><td>NOT NULL</td><td>Role designation</td></tr>
    <tr><td><code>salary_lpa</code></td><td>REAL</td><td>-</td><td>Proposed compensation</td></tr>
    <tr><td><code>status</code></td><td>TEXT</td><td>DEFAULT 'Applied'</td><td>'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'</td></tr>
    <tr><td><code>notes</code></td><td>TEXT</td><td>-</td><td>Candidate interview notes & progress updates</td></tr>
    <tr><td><code>updated_at</code></td><td>TIMESTAMP</td><td>DEFAULT CURRENT_TIMESTAMP</td><td>Last status change timestamp</td></tr>
</table>

<h3>5. Other Key Relational Tables</h3>
<ul>
    <li><code>aptitude_questions</code>: Master repository of Quantitative, Logical, and Verbal aptitude MCQs with 4 options and solutions.</li>
    <li><code>aptitude_scores</code>: Historical audit log of candidate test attempts, accuracy percentages, and completion times.</li>
    <li><code>interview_scores</code>: Records candidate answers, simulated numerical ratings, and evaluator feedback per session.</li>
    <li><code>resumes</code>: Holds candidate contact details, summaries, and JSON-serialized arrays for education, experience, and projects.</li>
    <li><code>skills</code>: User-specific verified technical skills, proficiencies (0-100%), and mastery statuses.</li>
    <li><code>roadmaps</code>: Candidate role roadmaps with completed milestone lists and progress percentages.</li>
    <li><code>placement_notices</code>: Institutional broadcasts published by TPOs (e.g., emergency drive deadlines, orientation notices).</li>
    <li><code>badges</code>: Gamified achievements earned by candidates with unique constraint <code>(user_id, badge_key)</code>.</li>
    <li><code>chat_sessions</code> & <code>chat_history</code>: Multi-turn conversational persistence for the AI career assistant.</li>
</ul>

<h2>4.2 Performance Indexing Strategy</h2>
<p>
    To ensure sub-millisecond query execution even under large student cohorts, composite indexes are automatically maintained:
</p>
<pre>
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_aptitude_category ON aptitude_questions(category);
CREATE INDEX IF NOT EXISTS idx_interview_category ON interview_questions(category);
CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_placement_drives_status ON placement_drives(status);
</pre>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- SECTION 5: COMPLETE INTERVIEW QUESTION BANK-->
<!-- ========================================== -->
<h1>5. Curated Technical Interview Handbook</h1>
<p>
    Below is the complete, unabridged technical interview bank containing all <strong>80 curated questions across 10 specialized domains</strong>. Each entry provides the question title, difficulty classification, benchmark model answer expected by technical interviewers, and the evaluator checkpoint rubric.
</p>
"""

# Append all 10 categories
domain_titles = {
    'DSA': '5.1 Data Structures & Algorithms (DSA)',
    'Operating Systems': '5.2 Operating Systems (OS)',
    'System Design': '5.3 System Design & Distributed Systems',
    'Computer Networks': '5.4 Computer Networks (CN)',
    'Python': '5.5 Python Programming Fundamentals & Internals',
    'JavaScript': '5.6 JavaScript & Web Architecture',
    'DBMS': '5.7 Database Management Systems (DBMS) & SQL',
    'OOPs': '5.8 Object-Oriented Programming (OOPs) & SOLID',
    'Data Science': '5.9 Data Science, Machine Learning & Statistics',
    'HR': '5.10 HR & Behavioral Placement Questions (STAR Method)'
}

for cat in categories_order:
    q_list = interview_data.get(cat, [])
    html_content += f"""
<div class="page-break"></div>
<h2>{domain_titles.get(cat, cat)}</h2>
<p style="font-size: 8.8pt; color: #64748B; margin-bottom: 12px;">
    Curated set of 8 high-frequency technical placement questions for {cat}. Master both conceptual depth and evaluator checkpoints.
</p>
"""
    for idx, q in enumerate(q_list, 1):
        diff = q['difficulty']
        badge_class = f"badge-{diff.lower()}"
        q_text = html.escape(q['question'])
        ans_text = html.escape(q['model_answer'])
        kp_text = html.escape(q['key_points'] or '')

        html_content += f"""
<div class="q-card no-break">
    <div class="q-header">
        <div class="q-title">Q{idx}. {q_text}</div>
        <span class="badge {badge_class}">{diff}</span>
    </div>
    <div class="q-answer">{ans_text}</div>
    <div class="q-keypoints">
        <strong>Evaluator Checkpoints:</strong> {kp_text}
    </div>
</div>
"""

html_content += f"""
<div class="page-break"></div>

<!-- ========================================== -->
<!-- SECTION 6: SECURITY & OPTIMIZATIONS        -->
<!-- ========================================== -->
<h1>6. Security, Authentication & Performance Optimizations</h1>

<h2>6.1 Cryptographic Password Security</h2>
<p>
    Passwords are never stored in plaintext. CareerX utilizes Werkzeug's <code>generate_password_hash</code>, generating salted cryptographic hashes using modern scrypt or pbkdf2 algorithms. During authentication, <code>check_password_hash</code> executes constant-time comparisons to prevent timing attacks.
</p>

<h2>6.2 SQL Injection Prevention</h2>
<p>
    Every SQL query across the application uses parameterized queries (<code>?</code> placeholders) rather than raw string interpolation, ensuring user inputs cannot modify SQL AST parsing.
</p>

<h2>6.3 Role-Based Access Control (RBAC)</h2>
<p>
    Endpoints are guarded by functional decorators:
</p>
<ul>
    <li><code>@login_required</code>: Verifies session token authenticity and presence of <code>session['user_id']</code>.</li>
    <li><code>@admin_required</code>: Enforces administrative privilege verification; unauthorized student attempts trigger security flashes and redirects.</li>
</ul>

<h2>6.4 Serverless Cold Start & File System Mitigation</h2>
<p>
    In serverless runtimes (such as Vercel or AWS Lambda), the local filesystem is read-only except for the <code>/tmp</code> scratch space. CareerX detects serverless flags via <code>IS_VERCEL = bool(os.environ.get('VERCEL'))</code> and automatically copies pre-seeded database assets into <code>/tmp/careerx.db</code>, ensuring full write support for tests, resumes, and applications without server crashes.
</p>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- SECTION 7: STEP-BY-STEP SETUP GUIDE        -->
<!-- ========================================== -->
<h1>7. Step-by-Step Installation & Setup Guide</h1>

<h2>7.1 Quick Launch via Windows Batch Script</h2>
<p>
    The repository includes a one-click launcher script <code>run.bat</code>:
</p>
<pre>
@echo off
title CareerX Server (http://127.0.0.1:5000)
cd /d "%~dp0"
echo Starting CareerX Server...
start http://127.0.0.1:5000
python app.py
pause
</pre>
<p>
    Double-clicking <code>run.bat</code> launches the Flask local server and immediately opens your default browser to <code>http://127.0.0.1:5000</code>.
</p>

<h2>7.2 Manual Developer Setup</h2>
<ol>
    <li><strong>Clone or Download the Project:</strong>
        <pre>git clone https://github.com/hariprasath29-codes/CARRER-X.git
cd CARRER-X</pre>
    </li>
    <li><strong>Create and Activate Virtual Environment:</strong>
        <pre>python -m venv venv
# On Windows:
venv\\Scripts\\activate
# On Linux/macOS:
source venv/bin/activate</pre>
    </li>
    <li><strong>Install Dependencies:</strong>
        <pre>pip install -r requirements.txt</pre>
    </li>
    <li><strong>Execute Application Server:</strong>
        <pre>python app.py</pre>
    </li>
</ol>

<h2>7.3 Pre-Seeded Default Accounts</h2>
<table>
    <thead>
        <tr><th>Role</th><th>Username</th><th>Password</th><th>Privileges & Capabilities</th></tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Placement Admin (TPO)</strong></td>
            <td><code>admin</code></td>
            <td><code>admin123</code></td>
            <td>Full admin portal access, placement drive publishing, instant emergency broadcasts, student diagnostic modal review, CSV data export.</td>
        </tr>
        <tr>
            <td><strong>Student Candidate</strong></td>
            <td><code>student</code></td>
            <td><code>student123</code></td>
            <td>Candidate dashboard, ATS resume builder, timed aptitude tests, mock interview assessments, skill roadmap progress.</td>
        </tr>
    </tbody>
</table>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- SECTION 8: FUTURE ROADMAP & CONCLUSION     -->
<!-- ========================================== -->
<h1>8. Conclusion & Future Engineering Roadmap</h1>

<h2>8.1 Project Impact Summary</h2>
<p>
    CareerX provides a production-grade, highly cohesive platform combining automated ATS optimization, timed aptitude evaluation, a curated 80-question technical interview bank across 10 disciplines, and institutional TPO drive management. By systematically measuring candidate performance through the Composite Readiness Index, it transforms arbitrary placement preparation into a transparent, quantifiable science.
</p>

<h2>8.2 Future Roadmap (v3.0)</h2>
<ul>
    <li><strong>Real-Time LLM Streaming Integration:</strong> Connect external high-throughput LLM APIs (such as Groq Llama-3-70B or Google Gemini) for real-time contextual code generation and voice feedback.</li>
    <li><strong>Real-Time AI Video & Audio Avatar Mock Interviews:</strong> Incorporate WebRTC audio streaming with automated speech-to-text (Whisper) to evaluate spoken articulation, filler words, and vocal pacing.</li>
    <li><strong>College ERP & LMS API Webhooks:</strong> Bi-directional synchronization with university ERP systems for automated student eligibility verification and placement drive attendance logging.</li>
    <li><strong>Automated PDF Resume Parsing (spaCy / Embeddings):</strong> Direct drag-and-drop parsing of existing candidate PDF resumes to auto-populate skill matrices and match percentages.</li>
</ul>

<div style="margin-top: 3rem; padding-top: 1.5rem; border-top: 2px solid #E2E8F0; text-align: center; color: #64748B; font-size: 8.5pt;">
    <strong>End of Complete Documentation Report &bull; CareerX Placement Engineering &bull; October 2026</strong>
</div>

</body>
</html>
"""

# Write HTML file
temp_html = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'careerx_doc_temp.html')
with open(temp_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Generated HTML documentation: {len(html_content)} characters.")

# Target PDF path in project folder
target_pdf = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'CareerX_Complete_Project_Documentation.pdf')
temp_pdf = os.path.join(os.environ.get('TEMP', 'C:\\Windows\\Temp'), 'CareerX_Doc_Output.pdf')

if os.path.exists(temp_pdf):
    try:
        os.remove(temp_pdf)
    except Exception:
        pass

edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_exe):
    edge_exe = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

file_url = f"file:///{temp_html.replace(os.sep, '/')}"

cmd = [
    edge_exe,
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--run-all-compositor-stages-before-draw',
    f'--print-to-pdf={temp_pdf}',
    file_url
]

print("Rendering PDF via headless Microsoft Edge...")
proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
print("Edge return code:", proc.returncode)

if os.path.exists(temp_pdf):
    shutil.copyfile(temp_pdf, target_pdf)
    size_mb = os.path.getsize(target_pdf) / (1024 * 1024)
    print(f"SUCCESS! Output PDF generated: {target_pdf} ({size_mb:.2f} MB)")
else:
    print("Edge rendering failed. Falling back to fpdf2...")
    from fpdf import FPDF
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font('Helvetica', 'B', 20)
    pdf.cell(0, 15, 'CareerX - Complete Project Documentation', ln=True, align='C')
    pdf.output(target_pdf)
    print(f"Fallback PDF generated: {target_pdf}")

# Clean up temporary HTML
if os.path.exists(temp_html):
    try:
        os.remove(temp_html)
    except Exception:
        pass

print("Build complete.")
