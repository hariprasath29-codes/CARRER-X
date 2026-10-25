import os
import json
import uuid
import csv
import io
from datetime import datetime
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory, Response
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from database import get_db_connection
from ai_engine import (
    evaluate_ats_resume, 
    extract_text_from_pdf, 
    evaluate_mock_answer, 
    get_ai_chat_response,
    ROLE_PROFILES
)

app = Flask(__name__)
# Stable secret key for serverless sessions across Lambda container instances
app.secret_key = os.environ.get('SECRET_KEY', 'careerx-session-secret-key-prod-2026')

# Detect Serverless environment (Vercel, AWS Lambda)
IS_VERCEL = bool(os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'))

# File upload configuration - Vercel filesystem is read-only except /tmp
if IS_VERCEL:
    UPLOAD_FOLDER = '/tmp/uploads'
else:
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

ALLOWED_EXTENSIONS = {'pdf', 'txt'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except Exception as e:
    print(f"Warning: could not create uploads directory {UPLOAD_FOLDER}: {e}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# -------------------------------------------------------------
# CORS HEADERS FOR LIVE SERVER INTEGRATION (PORT 5500 <-> 5000)
# -------------------------------------------------------------
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

@app.route('/api/public/chat', methods=['POST', 'OPTIONS'])
def public_chat():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    target_role = data.get('target_role', 'Software Engineer')
    if not message:
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    reply = get_ai_chat_response(message, user_context={
        'name': 'Student',
        'full_name': 'Student',
        'target_role': target_role,
        'branch': 'Computer Science & AI',
        'college': 'University'
    })
    return jsonify({
        'reply': reply,
        'status': 'success'
    })

@app.route('/api/public/status', methods=['GET', 'OPTIONS'])
def public_status():
    if request.method == 'OPTIONS':
        return '', 204
    return jsonify({
        'status': 'online',
        'app': 'CareerX AI Placement Assistant',
        'port': 5000
    })

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def api_health():
    if request.method == 'OPTIONS':
        return '', 204
    return jsonify({
        'status': 'online',
        'health': 'ok',
        'app': 'CareerX AI Placement Assistant',
        'port': 5000
    })

@app.route('/api/public/question/add', methods=['POST', 'OPTIONS'])
def public_add_question():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json() or {}
    q_type = data.get('question_type', 'aptitude')
    conn = get_db_connection()
    try:
        if q_type == 'aptitude':
            category = data.get('category', 'Quantitative')
            question = data.get('question', '').strip()
            existing = conn.execute('SELECT id FROM aptitude_questions WHERE category = ? AND question = ?', (category, question)).fetchone()
            if not existing and question:
                conn.execute('''
                    INSERT INTO aptitude_questions (category, question, option_a, option_b, option_c, option_d, correct_option, explanation)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    category,
                    question,
                    data.get('option_a', ''),
                    data.get('option_b', ''),
                    data.get('option_c', ''),
                    data.get('option_d', ''),
                    data.get('correct_option', 'A'),
                    data.get('explanation', '')
                ))
                conn.commit()
        else:
            category = data.get('category', 'Python')
            difficulty = data.get('difficulty', 'Medium')
            question = data.get('question', '').strip()
            existing = conn.execute('SELECT id FROM interview_questions WHERE category = ? AND question = ?', (category, question)).fetchone()
            if not existing and question:
                conn.execute('''
                    INSERT INTO interview_questions (category, difficulty, question, model_answer, key_points)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    category,
                    difficulty,
                    question,
                    data.get('model_answer', ''),
                    data.get('key_points', '')
                ))
                conn.commit()
        return jsonify({'status': 'success', 'message': 'Question saved to placement bank'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/public/drives', methods=['GET', 'OPTIONS'])
def public_drives():
    if request.method == 'OPTIONS':
        return '', 204
    conn = get_db_connection()
    try:
        drives = conn.execute("SELECT * FROM placement_drives WHERE status = 'Open' ORDER BY deadline ASC").fetchall()
        return jsonify([dict(d) for d in drives])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/public/notices', methods=['GET', 'OPTIONS'])
def public_notices():
    if request.method == 'OPTIONS':
        return '', 204
    conn = get_db_connection()
    try:
        notices = conn.execute("SELECT * FROM placement_notices ORDER BY created_at DESC LIMIT 10").fetchall()
        return jsonify([dict(n) for n in notices])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/public/drive/apply', methods=['POST', 'OPTIONS'])
def public_drive_apply():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json() or {}
    company = data.get('company', 'Campus Partner')
    role = data.get('role', 'Candidate')
    return jsonify({
        'status': 'success',
        'message': f'Application for {company} ({role}) received successfully! Notification sent to Placement Cell.'
    })

@app.route('/api/public/drive/add', methods=['POST', 'OPTIONS'])
def public_drive_add():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json() or {}
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO placement_drives (company, role, package_lpa, min_cgpa, location, drive_date, deadline, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('company', '').strip(),
            data.get('role', '').strip(),
            float(data.get('package_lpa', 0) or 0),
            float(data.get('min_cgpa', 0) or 0),
            data.get('location', 'On-Campus / Hybrid').strip(),
            data.get('drive_date', ''),
            data.get('deadline', ''),
            data.get('description', '')
        ))
        conn.commit()
        return jsonify({'status': 'success', 'message': 'New placement drive published successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/public/notice/add', methods=['POST', 'OPTIONS'])
def public_notice_add():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json() or {}
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO placement_notices (title, content, priority, posted_by)
            VALUES (?, ?, ?, ?)
        ''', (
            data.get('title', '').strip(),
            data.get('content', '').strip(),
            data.get('priority', 'Normal'),
            data.get('posted_by', 'Training & Placement Cell (TPO)')
        ))
        conn.commit()
        return jsonify({'status': 'success', 'message': 'Placement announcement published!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/public/readiness-check', methods=['POST', 'OPTIONS'])
def public_readiness_check():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json() or {}
    cgpa = float(data.get('cgpa', 8.0) or 8.0)
    aptitude_acc = float(data.get('aptitude_accuracy', 75.0) or 75.0)
    ats_score = float(data.get('ats_score', 80.0) or 80.0)
    mock_score = float(data.get('mock_score', 7.5) or 7.5)
    skills_count = int(data.get('skills_count', 5) or 5)

    cgpa_norm = min(max((cgpa / 10.0) * 100, 0), 100)
    apt_norm = min(max(aptitude_acc, 0), 100)
    ats_norm = min(max(ats_score, 0), 100)
    mock_norm = min(max(mock_score * 10.0, 0), 100)
    skills_norm = min(max((skills_count / 8.0) * 100, 0), 100)

    composite = round((cgpa_norm * 0.20) + (apt_norm * 0.25) + (ats_norm * 0.20) + (mock_norm * 0.20) + (skills_norm * 0.15), 1)

    if composite >= 85:
        tier = "Tier 1 — High Day-1 Placement Readiness"
        badge = "badge-success"
        color = "#10b981"
    elif composite >= 70:
        tier = "Tier 2 — Strong Competitive Contender"
        badge = "badge-primary"
        color = "#6366f1"
    elif composite >= 55:
        tier = "Tier 3 — Moderate Readiness (Focus Needed)"
        badge = "badge-warning"
        color = "#f59e0b"
    else:
        tier = "Needs Targeted Acceleration"
        badge = "badge-danger"
        color = "#ef4444"

    strengths = []
    if ats_norm >= 80: strengths.append("Resume is ATS-optimized and industry-formatted")
    if apt_norm >= 75: strengths.append("Solid quantitative & logical aptitude foundation")
    if mock_norm >= 70: strengths.append("Strong technical assessment evaluation rating")
    if skills_count >= 5: strengths.append("Diverse verified technical skillset")
    if not strengths: strengths.append("Foundation established; ready for dedicated assessment practice")

    recommendations = []
    if apt_norm < 75: recommendations.append("Complete 3 daily aptitude sets (Logical & Quantitative)")
    if mock_norm < 75: recommendations.append("Complete at least 2 technical assessment sessions")
    if ats_norm < 80: recommendations.append("Enhance resume bullet points with quantifiable impact metrics")
    if skills_count < 5: recommendations.append("Add 2 or more core verified skills with mini projects")
    if not recommendations: recommendations.append("Maintain peak performance; review system design and leadership STAR stories!")

    return jsonify({
        'score': composite,
        'tier': tier,
        'badge': badge,
        'color': color,
        'breakdown': {
            'cgpa': round(cgpa_norm, 1),
            'aptitude': round(apt_norm, 1),
            'ats': round(ats_norm, 1),
            'mock': round(mock_norm, 1),
            'skills': round(skills_norm, 1)
        },
        'strengths': strengths,
        'recommendations': recommendations
    })


# -------------------------------------------------------------
# AUTHENTICATION & ACCESS CONTROL (CUSTOM DECORATORS)
# -------------------------------------------------------------
# Helper decorator to ensure the user is logged in before viewing a protected page
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Helper decorator to protect TPO Admin pages from regular students
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            flash('Admin authorization required.', 'danger')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

# Context processor: automatically injects 'current_user' into all Jinja templates
# so we don't have to query the user table manually in every single route.
@app.context_processor
def inject_user():
    if 'user_id' in session:
        conn = get_db_connection()
        user = conn.execute("SELECT id, username, email, full_name, role, target_role, college, branch, grad_year, bio FROM users WHERE id = ?", (session['user_id'],)).fetchone()
        conn.close()
        return dict(current_user=user)
    return dict(current_user=None)

# -------------------------------------------------------------
# BADGE AWARD HELPER
# -------------------------------------------------------------
def check_and_award_badge(user_id, badge_key, badge_name, badge_desc, badge_icon):
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT OR IGNORE INTO badges (user_id, badge_key, badge_name, badge_desc, badge_icon)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, badge_key, badge_name, badge_desc, badge_icon))
        conn.commit()
    except Exception as e:
        pass
    finally:
        conn.close()

# -------------------------------------------------------------
# CORE AUTH & PROFILE ROUTES
# -------------------------------------------------------------
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static', 'img'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/app.py')
@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        full_name = request.form.get('full_name', '').strip()
        college = request.form.get('college', '').strip()
        branch = request.form.get('branch', '').strip()
        grad_year = request.form.get('grad_year', 2025)
        target_role = request.form.get('target_role', 'Software Engineer')

        if not username or not email or not password:
            flash('Username, email, and password are required!', 'danger')
            return render_template('register.html')

        conn = get_db_connection()
        existing = conn.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email)).fetchone()
        if existing:
            conn.close()
            flash('Username or email already exists. Please choose another or login.', 'danger')
            return render_template('register.html')

        password_hash = generate_password_hash(password)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, full_name, college, branch, grad_year, target_role, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (username, email, password_hash, full_name, college, branch, grad_year, target_role, 'Motivated engineering student preparing for tech placements.'))
        
        user_id = cursor.lastrowid
        conn.commit()

        # Seed initial starter roadmap for new student
        default_steps = ["Master Fundamentals of Programming", "Build 2 Full Stack / AI Projects"]
        conn.execute('''
            INSERT INTO roadmaps (user_id, career_role, completed_steps_json, current_milestone, progress_pct)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, target_role, json.dumps(default_steps), 'Solve 100+ LeetCode DSA Problems', 30))
        conn.commit()
        conn.close()

        session['user_id'] = user_id
        session['username'] = username
        session['role'] = 'student'
        flash(f'Account created successfully! Welcome to CareerX, {full_name or username}!', 'success')
        return redirect(url_for('dashboard'))

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, username)).fetchone()
        conn.close()

        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            flash(f'Welcome back, {user["full_name"] or user["username"]}!', 'success')
            if user['role'] == 'admin':
                return redirect(url_for('admin_panel'))
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username/email or password.', 'danger')

    return render_template('login.html')

@app.route('/quick-login/<role>')
def quick_login(role):
    target_role = role.lower().strip()
    conn = get_db_connection()
    user = conn.execute("SELECT id, username, role, full_name FROM users WHERE role = ? LIMIT 1", (target_role,)).fetchone()
    if not user:
        # Fallback 1: match by username if role was misconfigured
        user = conn.execute("SELECT id, username, role, full_name FROM users WHERE username = ? LIMIT 1", (target_role,)).fetchone()
        if user:
            conn.execute("UPDATE users SET role = ? WHERE id = ?", (target_role, user['id']))
            conn.commit()
            user = conn.execute("SELECT id, username, role, full_name FROM users WHERE id = ?", (user['id'],)).fetchone()
        else:
            # Fallback 2: auto-seed demo student or admin if missing
            if target_role == 'student':
                pwd_hash = generate_password_hash("student123")
                conn.execute('''
                    INSERT INTO users (username, email, password_hash, role, full_name, college, branch, grad_year, target_role, bio)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', ('student', 'student@careerx.ai', pwd_hash, 'student', 'Candidate Student', 'National Institute of Technology', 'AI & Data Science', 2025, 'AI/ML Engineer', 'Aspiring AI engineer.'))
                conn.commit()
                user = conn.execute("SELECT id, username, role, full_name FROM users WHERE username = 'student' LIMIT 1").fetchone()
            elif target_role == 'admin':
                pwd_hash = generate_password_hash("admin123")
                conn.execute('''
                    INSERT INTO users (username, email, password_hash, role, full_name, college, branch, grad_year, target_role, bio)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', ('admin', 'admin@careerx.ai', pwd_hash, 'admin', 'CareerX Admin', 'IIT Madras', 'Computer Science & Engg', 2024, 'Lead Placement Officer', 'Placement administration.'))
                conn.commit()
                user = conn.execute("SELECT id, username, role, full_name FROM users WHERE username = 'admin' LIMIT 1").fetchone()

    conn.close()
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        flash(f'Signed in as demo {target_role.capitalize()} ({user["username"]})', 'success')
        if target_role == 'admin':
            return redirect(url_for('admin_panel'))
        return redirect(url_for('dashboard'))
    flash('User role not found.', 'danger')
    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('login'))

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    conn = get_db_connection()
    user_id = session['user_id']
    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        college = request.form.get('college', '').strip()
        branch = request.form.get('branch', '').strip()
        grad_year = request.form.get('grad_year')
        target_role = request.form.get('target_role')
        bio = request.form.get('bio', '').strip()

        conn.execute('''
            UPDATE users SET full_name = ?, college = ?, branch = ?, grad_year = ?, target_role = ?, bio = ?
            WHERE id = ?
        ''', (full_name, college, branch, grad_year, target_role, bio, user_id))
        conn.commit()
        flash('Profile updated successfully!', 'success')

    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    badges = conn.execute("SELECT * FROM badges WHERE user_id = ? ORDER BY earned_at DESC", (user_id,)).fetchall()
    conn.close()
    return render_template('profile.html', user=user, badges=badges)

# -------------------------------------------------------------
# DASHBOARD (ANALYTICS & METRICS)
# -------------------------------------------------------------
@app.route('/dashboard')
@login_required
def dashboard():
    if session.get('role') == 'admin':
        return redirect(url_for('admin_panel'))
    user_id = session['user_id']
    conn = get_db_connection()

    # Core Metric counts
    skills_count = conn.execute("SELECT COUNT(*) FROM skills WHERE user_id = ?", (user_id,)).fetchone()[0]
    apps_count = conn.execute("SELECT COUNT(*) FROM job_applications WHERE user_id = ?", (user_id,)).fetchone()[0]
    
    # Aptitude metrics
    aptitude_data = conn.execute("SELECT COUNT(*), AVG(accuracy_pct) FROM aptitude_scores WHERE user_id = ?", (user_id,)).fetchone()
    total_tests = aptitude_data[0] or 0
    avg_accuracy = round(aptitude_data[1] or 0, 1)

    # Technical Assessment metrics
    interview_data = conn.execute("SELECT COUNT(*), AVG(overall_score) FROM interview_scores WHERE user_id = ?", (user_id,)).fetchone()
    mock_count = interview_data[0] or 0
    avg_interview_score = round(interview_data[1] or 0, 1)

    # Latest ATS Scan score
    latest_ats = conn.execute("SELECT score FROM ats_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,)).fetchone()
    ats_score = latest_ats['score'] if latest_ats else 75

    # Badges
    badges = conn.execute("SELECT * FROM badges WHERE user_id = ? ORDER BY earned_at DESC", (user_id,)).fetchall()

    # Recent Job Applications
    recent_apps = conn.execute("SELECT * FROM job_applications WHERE user_id = ? ORDER BY updated_at DESC LIMIT 4", (user_id,)).fetchall()

    # Application status distribution for chart
    status_counts = conn.execute('''
        SELECT status, COUNT(*) as count FROM job_applications 
        WHERE user_id = ? GROUP BY status
    ''', (user_id,)).fetchall()
    status_map = {row['status']: row['count'] for row in status_counts}

    # Aptitude category breakdown for radar/bar chart
    cat_scores = conn.execute('''
        SELECT category, AVG(accuracy_pct) as avg_acc FROM aptitude_scores
        WHERE user_id = ? GROUP BY category
    ''', (user_id,)).fetchall()
    cat_map = {row['category']: round(row['avg_acc'], 1) for row in cat_scores}

    # Roadmap progress
    roadmap = conn.execute("SELECT * FROM roadmaps WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1", (user_id,)).fetchone()

    # Active Placement Drives & Notices
    drives = conn.execute("SELECT * FROM placement_drives WHERE status = 'Open' ORDER BY deadline ASC").fetchall()
    notices = conn.execute("SELECT * FROM placement_notices ORDER BY created_at DESC LIMIT 5").fetchall()

    conn.close()

    return render_template('dashboard.html',
                           skills_count=skills_count,
                           apps_count=apps_count,
                           total_tests=total_tests,
                           avg_accuracy=avg_accuracy,
                           mock_count=mock_count,
                           avg_interview_score=avg_interview_score,
                           ats_score=ats_score,
                           badges=badges,
                           recent_apps=recent_apps,
                           status_map=status_map,
                           cat_map=cat_map,
                           roadmap=roadmap,
                           drives=drives,
                           notices=notices)

# -------------------------------------------------------------
# CHATGPT-LIKE AI CHAT INTERFACE & APIS
# -------------------------------------------------------------
@app.route('/chat')
@login_required
def chat():
    return redirect(url_for('dashboard'))

@app.route('/api/chat/sessions', methods=['GET'])
@login_required
def get_chat_sessions():
    conn = get_db_connection()
    user_id = session['user_id']
    sessions = conn.execute("SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(s) for s in sessions])

@app.route('/api/chat/session/new', methods=['POST'])
@login_required
def create_chat_session():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)", (user_id, "New Placement Conversation"))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'session_id': new_id, 'title': "New Placement Conversation"})

@app.route('/api/chat/session/<int:session_id>', methods=['GET'])
@login_required
def get_session_history(session_id):
    user_id = session['user_id']
    conn = get_db_connection()
    # Verify ownership
    sess = conn.execute("SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user_id)).fetchone()
    if not sess:
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    
    messages = conn.execute("SELECT role, content, timestamp FROM chat_history WHERE session_id = ? ORDER BY timestamp ASC", (session_id,)).fetchall()
    conn.close()
    return jsonify({'session': dict(sess), 'messages': [dict(m) for m in messages]})

@app.route('/api/chat/session/<int:session_id>/delete', methods=['POST'])
@login_required
def delete_chat_session(session_id):
    user_id = session['user_id']
    conn = get_db_connection()
    conn.execute("DELETE FROM chat_history WHERE session_id = ? AND user_id = ?", (session_id, user_id))
    conn.execute("DELETE FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/chat/send', methods=['POST'])
@login_required
def send_chat_message():
    user_id = session['user_id']
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    session_id = data.get('session_id')

    if not message:
        return jsonify({'error': 'Message cannot be empty'}), 400

    conn = get_db_connection()
    
    # If session doesn't exist, create one
    if not session_id:
        cursor = conn.cursor()
        title = message[:32] + ("..." if len(message) > 32 else "")
        cursor.execute("INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)", (user_id, title))
        session_id = cursor.lastrowid
        conn.commit()
    else:
        # Verify session exists and belongs to current user
        sess_check = conn.execute("SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user_id)).fetchone()
        if not sess_check:
            cursor = conn.cursor()
            title = message[:32] + ("..." if len(message) > 32 else "")
            cursor.execute("INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)", (user_id, title))
            session_id = cursor.lastrowid
            conn.commit()
        else:
            # Check if first message in existing session to update title
            count = conn.execute("SELECT COUNT(*) FROM chat_history WHERE session_id = ?", (session_id,)).fetchone()[0]
            if count == 0:
                title = message[:32] + ("..." if len(message) > 32 else "")
                conn.execute("UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (title, session_id))
                conn.commit()
            else:
                conn.execute("UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (session_id,))
                conn.commit()

    # Save User message
    conn.execute('''
        INSERT INTO chat_history (session_id, user_id, role, content)
        VALUES (?, ?, 'user', ?)
    ''', (session_id, user_id, message))
    conn.commit()

    # User context for smart personalized responses
    user_info = conn.execute("SELECT full_name, target_role, college FROM users WHERE id = ?", (user_id,)).fetchone()
    selected_role = data.get('target_role') or (user_info['target_role'] if user_info else 'Full Stack Developer')
    user_ctx = {'name': (user_info['full_name'] if user_info else None) or session.get('username', 'Student'), 'target_role': selected_role}

    # Generate AI response
    ai_reply = get_ai_chat_response(message, user_context=user_ctx)

    # Save Assistant message
    conn.execute('''
        INSERT INTO chat_history (session_id, user_id, role, content)
        VALUES (?, ?, 'assistant', ?)
    ''', (session_id, user_id, ai_reply))
    conn.commit()
    conn.close()

    return jsonify({
        'session_id': session_id,
        'user_message': message,
        'reply': ai_reply
    })

# -------------------------------------------------------------
# CAREER ROADMAP GENERATOR
# -------------------------------------------------------------
ROADMAP_TEMPLATES = {
    'AI/ML Engineer': [
        "Master Python, NumPy, Pandas & Vectorized Computation",
        "Linear Algebra, Multivariate Calculus & Probability for ML",
        "Classical Machine Learning (Regression, Random Forests, XGBoost)",
        "Deep Learning Foundations (PyTorch, Neural Networks, Backprop)",
        "Computer Vision (CNNs, OpenCV) or NLP (Transformers, LLMs, HuggingFace)",
        "Model Deployment with FastAPI, Docker & ONNX",
        "End-to-End Capstone Project on GitHub with Live Demo"
    ],
    'Full Stack Developer': [
        "HTML5, Semantic Tags & Modern CSS (Flexbox, Grid, Responsive Design)",
        "JavaScript Deep Dive (ES6+, Promises, Event Loop, DOM Manipulation)",
        "Frontend Framework (React / Next.js, Hooks, State Management)",
        "Backend Development (Node.js/Express or Python/Flask & REST APIs)",
        "Relational & NoSQL Databases (PostgreSQL, SQLite, MongoDB)",
        "Authentication, JWT Tokens & Web Security (OWASP Top 10)",
        "Deploy Full-Stack App on Vercel / Render / AWS"
    ],
    'Frontend Developer': [
        "HTML5 Semantic Architecture & Modern CSS (Flexbox, Grid, Animations)",
        "Advanced JavaScript (ES6+, Closures, Event Loop, Async/Await, DOM)",
        "React Mastery (Hooks, Custom Hooks, State Architecture, Performance)",
        "Next.js / SSR & Static Site Generation (SSG)",
        "Tailwind CSS, Styled Components & UI Component Libraries",
        "Frontend Testing (Jest, React Testing Library) & Web Vitals Optimization",
        "Build 3 Production Web Apps with Responsive Mobile-First Design"
    ],
    'Backend Developer': [
        "Server-Side Language Mastery (Python/Node.js/Go/Java)",
        "RESTful API & GraphQL Design with Standard HTTP Status Codes",
        "Relational (PostgreSQL/MySQL) & NoSQL (MongoDB/Redis) Systems",
        "Authentication & Security (OAuth2, JWT, Password Salting, CORS)",
        "Caching Strategies with Redis (Cache-Aside, Write-Through)",
        "Message Queues & Asynchronous Processing (RabbitMQ / Kafka / Celery)",
        "Dockerization, Microservices Architecture & Cloud Deployment"
    ],
    'Software Engineer': [
        "Core Programming Mastery (C++, Java, or Python)",
        "Data Structures (Arrays, Linked Lists, Stacks, Queues, Trees, Graphs)",
        "Algorithms (Sorting, Binary Search, Dynamic Programming, Greedy)",
        "Database Management Systems & Advanced SQL Queries",
        "Operating Systems (Process, Threads, Synchronization, Paging)",
        "Object Oriented Design Principles (SOLID Principles, Design Patterns)",
        "Solve 200+ High-Yield LeetCode / GFG Problems"
    ],
    'Cloud / DevOps Engineer': [
        "Linux CLI Mastery, Shell Scripting & Git Collaboration",
        "Networking Fundamentals (DNS, TCP/IP, OSI, Load Balancing)",
        "Containerization with Docker & Docker Compose",
        "Continuous Integration & Continuous Delivery (GitHub Actions)",
        "Cloud Architecture (AWS / Azure: EC2, S3, IAM, VPC, Lambda)",
        "Container Orchestration with Kubernetes (Pods, Services, Ingress)",
        "Infrastructure as Code (Terraform) & Monitoring (Prometheus/Grafana)"
    ],
    'Data Analyst': [
        "Advanced Microsoft Excel (VLOOKUP, Pivot Tables, Power Query)",
        "Relational SQL (Complex Joins, Window Functions, Aggregations)",
        "Python for Analytics (Pandas, NumPy, Data Cleaning)",
        "Exploratory Data Analysis & Visualization (Matplotlib, Seaborn)",
        "Business Intelligence Dashboards (Power BI or Tableau)",
        "Applied Business Statistics & A/B Hypothesis Testing",
        "Portfolio of 3 Industry Analytics Case Studies"
    ]
}

@app.route('/roadmap')
@login_required
def roadmap_view():
    user_id = session['user_id']
    conn = get_db_connection()
    user = conn.execute("SELECT target_role FROM users WHERE id = ?", (user_id,)).fetchone()
    current_role = user['target_role'] if user and user['target_role'] in ROADMAP_TEMPLATES else 'Software Engineer'
    
    user_roadmap = conn.execute("SELECT * FROM roadmaps WHERE user_id = ? AND career_role = ?", (user_id, current_role)).fetchone()
    completed_steps = json.loads(user_roadmap['completed_steps_json']) if user_roadmap and user_roadmap['completed_steps_json'] else []
    
    conn.close()
    return render_template('roadmap.html', 
                           all_roles=list(ROADMAP_TEMPLATES.keys()),
                           current_role=current_role,
                           roadmap_steps=ROADMAP_TEMPLATES[current_role],
                           completed_steps=completed_steps,
                           templates_json=ROADMAP_TEMPLATES)

@app.route('/api/roadmap/update', methods=['POST'])
@login_required
def update_roadmap():
    user_id = session['user_id']
    data = request.get_json() or {}
    role = data.get('career_role', 'Software Engineer')
    completed_steps = data.get('completed_steps', [])
    
    all_steps = ROADMAP_TEMPLATES.get(role, ROADMAP_TEMPLATES['Software Engineer'])
    progress_pct = int((len(completed_steps) / max(len(all_steps), 1)) * 100)
    current_milestone = completed_steps[-1] if completed_steps else (all_steps[0] if all_steps else "Getting Started")

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM roadmaps WHERE user_id = ? AND career_role = ?", (user_id, role)).fetchone()
    if existing:
        conn.execute('''
            UPDATE roadmaps SET completed_steps_json = ?, current_milestone = ?, progress_pct = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (json.dumps(completed_steps), current_milestone, progress_pct, existing['id']))
    else:
        conn.execute('''
            INSERT INTO roadmaps (user_id, career_role, completed_steps_json, current_milestone, progress_pct)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, role, json.dumps(completed_steps), current_milestone, progress_pct))
    
    # Also sync user's target role
    conn.execute("UPDATE users SET target_role = ? WHERE id = ?", (role, user_id))
    conn.commit()
    conn.close()

    if progress_pct >= 50:
        check_and_award_badge(user_id, 'roadmap_milestone', 'Roadmap Crusher', 'Completed 50%+ of your technical roadmap', 'fa-route')

    return jsonify({'success': True, 'progress_pct': progress_pct, 'current_milestone': current_milestone})

# -------------------------------------------------------------
# RESUME BUILDER & ATS SCANNER
# -------------------------------------------------------------
@app.route('/resume-builder')
@app.route('/resume/builder')
@login_required
def resume_builder():
    user_id = session['user_id']
    conn = get_db_connection()
    resume_row = conn.execute("SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1", (user_id,)).fetchone()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    resume = dict(resume_row) if resume_row else {}
    if resume:
        for key in ['education', 'experience', 'projects', 'skills', 'certifications']:
            json_key = f"{key}_json"
            if resume.get(json_key):
                try:
                    resume[key] = json.loads(resume[json_key])
                except Exception:
                    resume[key] = []
            else:
                resume[key] = []
    return render_template('resume_builder.html', resume=resume, user=user)

@app.route('/api/resume/save', methods=['POST'])
@login_required
def save_resume():
    user_id = session['user_id']
    data = request.get_json() or {}

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM resumes WHERE user_id = ?", (user_id,)).fetchone()

    title = data.get('title', 'Placement Resume')
    full_name = data.get('full_name', '')
    email = data.get('email', '')
    phone = data.get('phone', '')
    linkedin = data.get('linkedin', '')
    github = data.get('github', '')
    portfolio = data.get('portfolio', '')
    summary = data.get('summary', '')
    education_json = json.dumps(data.get('education', []))
    experience_json = json.dumps(data.get('experience', []))
    projects_json = json.dumps(data.get('projects', []))
    skills_json = json.dumps(data.get('skills', []))
    certifications_json = json.dumps(data.get('certifications', []))
    template = data.get('template', 'modern')

    if existing:
        conn.execute('''
            UPDATE resumes SET title=?, full_name=?, email=?, phone=?, linkedin=?, github=?, portfolio=?,
                               summary=?, education_json=?, experience_json=?, projects_json=?, skills_json=?,
                               certifications_json=?, template=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=?
        ''', (title, full_name, email, phone, linkedin, github, portfolio, summary, education_json, experience_json, projects_json, skills_json, certifications_json, template, existing['id']))
    else:
        conn.execute('''
            INSERT INTO resumes (user_id, title, full_name, email, phone, linkedin, github, portfolio, summary,
                                education_json, experience_json, projects_json, skills_json, certifications_json, template)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, title, full_name, email, phone, linkedin, github, portfolio, summary, education_json, experience_json, projects_json, skills_json, certifications_json, template))

    conn.commit()
    conn.close()

    check_and_award_badge(user_id, 'resume_built', 'Resume Pro', 'Crafted your placement-ready resume', 'fa-file-lines')

    return jsonify({'success': True, 'message': 'Resume saved successfully!'})

@app.route('/ats-checker')
@app.route('/ats')
@app.route('/ats/checker')
@login_required
def ats_checker():
    user_id = session['user_id']
    conn = get_db_connection()
    history = conn.execute("SELECT * FROM ats_scans WHERE user_id = ? ORDER BY created_at DESC LIMIT 5", (user_id,)).fetchall()
    roles = list(ROLE_PROFILES.keys())
    conn.close()
    return render_template('ats_checker.html', history=history, roles=roles)

@app.route('/api/ats-scan', methods=['POST'])
@login_required
def run_ats_scan():
    user_id = session['user_id']
    target_role = request.form.get('target_role', 'Software Engineer')
    raw_text = request.form.get('resume_text', '').strip()

    # Handle file upload if present
    if 'resume_file' in request.files:
        file = request.files['resume_file']
        if file and file.filename and allowed_file(file.filename):
            filename = f"{user_id}_{secure_filename(file.filename)}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            if filename.lower().endswith('.pdf'):
                extracted = extract_text_from_pdf(save_path)
                if extracted and not extracted.startswith("Error"):
                    raw_text = extracted

    if not raw_text:
        return jsonify({'error': 'Please upload a PDF resume or paste your resume content!'}), 400

    report = evaluate_ats_resume(raw_text, target_role=target_role)

    # Persist in ats_scans
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO ats_scans (user_id, target_role, score, matched_skills, missing_skills, feedback)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, target_role, report['score'], 
          ", ".join(report['matched_skills']), 
          ", ".join(report['missing_skills']), 
          report['verdict']))
    conn.commit()
    conn.close()

    if report['score'] >= 80:
        check_and_award_badge(user_id, 'ats_champion', 'ATS Master', 'Achieved an 80%+ ATS Resume score', 'fa-award')

    return jsonify({'success': True, 'report': report})

# -------------------------------------------------------------
# APTITUDE TRAINER
# -------------------------------------------------------------
@app.route('/aptitude')
@login_required
def aptitude_view():
    conn = get_db_connection()
    user_id = session['user_id']
    history = conn.execute("SELECT * FROM aptitude_scores WHERE user_id = ? ORDER BY taken_at DESC LIMIT 6", (user_id,)).fetchall()
    categories = ['Quantitative', 'Logical', 'Verbal']
    conn.close()
    return render_template('aptitude.html', history=history, categories=categories)

@app.route('/api/aptitude/questions', methods=['GET'])
@login_required
def get_aptitude_questions():
    category = request.args.get('category', 'All')
    limit = int(request.args.get('limit', 10))
    
    conn = get_db_connection()
    if category and category != 'All':
        questions = conn.execute("SELECT * FROM aptitude_questions WHERE category = ? ORDER BY RANDOM() LIMIT ?", (category, limit)).fetchall()
    else:
        questions = conn.execute("SELECT * FROM aptitude_questions ORDER BY RANDOM() LIMIT ?", (limit,)).fetchall()
    conn.close()

    result = []
    for q in questions:
        result.append({
            'id': q['id'],
            'category': q['category'],
            'question': q['question'],
            'options': {
                'A': q['option_a'],
                'B': q['option_b'],
                'C': q['option_c'],
                'D': q['option_d']
            },
            'correct': q['correct_option'],
            'explanation': q['explanation']
        })
    return jsonify(result)

@app.route('/api/aptitude/submit', methods=['POST'])
@login_required
def submit_aptitude_test():
    user_id = session['user_id']
    data = request.get_json() or {}
    category = data.get('category', 'All Practice')
    answers = data.get('answers', {}) # {question_id: 'A'}
    time_spent = int(data.get('time_spent_sec', 0))

    if not answers:
        return jsonify({'error': 'No answers submitted'}), 400

    q_ids = list(answers.keys())
    conn = get_db_connection()
    placeholders = ','.join('?' for _ in q_ids)
    rows = conn.execute(f"SELECT * FROM aptitude_questions WHERE id IN ({placeholders})", q_ids).fetchall()

    correct_count = 0
    total = len(rows)
    breakdown = []

    for r in rows:
        qid_str = str(r['id'])
        user_choice = answers.get(qid_str)
        is_correct = (user_choice == r['correct_option'])
        if is_correct:
            correct_count += 1
        breakdown.append({
            'id': r['id'],
            'question': r['question'],
            'user_choice': user_choice,
            'correct_option': r['correct_option'],
            'is_correct': is_correct,
            'explanation': r['explanation']
        })

    accuracy = round((correct_count / max(total, 1)) * 100, 1)

    # Save score
    conn.execute('''
        INSERT INTO aptitude_scores (user_id, category, score, total_questions, accuracy_pct, time_spent_sec)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, category, correct_count, total, accuracy, time_spent))
    conn.commit()
    conn.close()

    check_and_award_badge(user_id, 'first_quiz', 'Aptitude Pioneer', 'Completed your first timed aptitude test', 'fa-bolt')
    if accuracy >= 80:
        check_and_award_badge(user_id, 'aptitude_ace', 'Speed Demigod', 'Scored > 80% on a placement aptitude test', 'fa-trophy')

    return jsonify({
        'score': correct_count,
        'total': total,
        'accuracy_pct': accuracy,
        'breakdown': breakdown
    })

# -------------------------------------------------------------
# TECHNICAL ASSESSMENT & INTERVIEW MODULES
# -------------------------------------------------------------
@app.route('/interview')
@app.route('/interview/prep')
@login_required
def interview_prep():
    conn = get_db_connection()
    categories = ['Python', 'JavaScript', 'DBMS', 'OOPs', 'Data Science', 'HR']
    selected_cat = request.args.get('category', 'Python')
    questions = conn.execute("SELECT * FROM interview_questions WHERE category = ? ORDER BY id ASC", (selected_cat,)).fetchall()
    
    # Aggregate category counts for badges
    counts_rows = conn.execute("SELECT category, COUNT(*) as cnt FROM interview_questions GROUP BY category").fetchall()
    category_counts = {r['category']: r['cnt'] for r in counts_rows}
    total_questions = sum(category_counts.values())

    conn.close()
    return render_template(
        'interview.html', 
        categories=categories, 
        selected_cat=selected_cat, 
        questions=questions,
        category_counts=category_counts,
        total_questions=total_questions
    )

@app.route('/interview/question/add', methods=['POST'])
@login_required
def interview_add_question():
    category = request.form.get('category', 'Python').strip()
    difficulty = request.form.get('difficulty', 'Medium').strip()
    question = request.form.get('question', '').strip()
    model_answer = request.form.get('model_answer', '').strip()
    key_points = request.form.get('key_points', '').strip()

    if not question or not model_answer:
        flash('Please provide both the Question statement and a Model Benchmark Answer.', 'warning')
        return redirect(url_for('interview_prep', category=category))

    conn = get_db_connection()
    existing = conn.execute('SELECT id FROM interview_questions WHERE category = ? AND question = ?', (category, question)).fetchone()
    if existing:
        flash(f'Notice: This interview question already exists under {category}.', 'warning')
    else:
        conn.execute('''
            INSERT INTO interview_questions (category, difficulty, question, model_answer, key_points)
            VALUES (?, ?, ?, ?, ?)
        ''', (category, difficulty, question, model_answer, key_points))
        conn.commit()
        flash(f'Successfully added new interview question to {category} question bank!', 'success')
    conn.close()
    return redirect(url_for('interview_prep', category=category))

@app.route('/technical-assessment')
@app.route('/mock-interview')
@app.route('/mock/interview')
@login_required
def mock_interview():
    conn = get_db_connection()
    user_id = session['user_id']
    past_interviews = conn.execute("SELECT * FROM interview_scores WHERE user_id = ? ORDER BY taken_at DESC LIMIT 5", (user_id,)).fetchall()
    categories = ['Python', 'JavaScript', 'DBMS', 'OOPs', 'Data Science', 'HR']
    conn.close()
    return render_template('mock_interview.html', past_interviews=past_interviews, categories=categories)

@app.route('/api/technical-assessment/start', methods=['POST'])
@app.route('/api/mock-interview/start', methods=['POST'])
@login_required
def start_mock_interview():
    data = request.get_json() or {}
    category = data.get('category', 'Python')
    count = int(data.get('count', 3))

    conn = get_db_connection()
    questions = conn.execute("SELECT id, category, difficulty, question, model_answer, key_points FROM interview_questions WHERE category = ? ORDER BY RANDOM() LIMIT ?", (category, count)).fetchall()
    conn.close()

    return jsonify([dict(q) for q in questions])

@app.route('/api/technical-assessment/evaluate', methods=['POST'])
@app.route('/api/mock-interview/evaluate', methods=['POST'])
@login_required
def evaluate_mock_session():
    user_id = session['user_id']
    data = request.get_json() or {}
    role_tested = data.get('role_tested', 'General Tech')
    submissions = data.get('submissions', []) # [{'question_id': 1, 'question': '', 'answer': ''}]

    if not submissions:
        return jsonify({'error': 'No answers submitted'}), 400

    conn = get_db_connection()
    evaluations = []
    total_score = 0.0

    for sub in submissions:
        qid = sub.get('question_id')
        user_ans = sub.get('answer', '')
        q_row = conn.execute("SELECT question, model_answer, key_points FROM interview_questions WHERE id = ?", (qid,)).fetchone()
        
        q_text = q_row['question'] if q_row else sub.get('question', '')
        kps = q_row['key_points'] if q_row else ""
        model_ans = q_row['model_answer'] if q_row else "Standard clear answer with mechanism and example."

        eval_res = evaluate_mock_answer(q_text, user_ans, kps)
        eval_res['question'] = q_text
        eval_res['model_answer'] = model_ans
        eval_res['user_answer'] = user_ans
        evaluations.append(eval_res)
        total_score += eval_res['score']

    avg_score = round(total_score / max(len(evaluations), 1), 1)
    overall_feedback = f"Average Score: {avg_score}/10 across {len(evaluations)} technical questions."

    conn.execute('''
        INSERT INTO interview_scores (user_id, role_tested, question_count, overall_score, feedback, answers_json)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, role_tested, len(evaluations), avg_score, overall_feedback, json.dumps(evaluations)))
    conn.commit()
    conn.close()

    check_and_award_badge(user_id, 'mock_interview_done', 'Assessment Gladiator', 'Completed a Technical Assessment test', 'fa-clipboard-check')

    return jsonify({
        'overall_score': avg_score,
        'overall_feedback': overall_feedback,
        'evaluations': evaluations
    })

# -------------------------------------------------------------
# SKILLS & JOB TRACKER MODULES
# -------------------------------------------------------------
@app.route('/skills')
@login_required
def skills_view():
    user_id = session['user_id']
    conn = get_db_connection()
    skills = conn.execute("SELECT * FROM skills WHERE user_id = ? ORDER BY category, proficiency DESC", (user_id,)).fetchall()
    badges = conn.execute("SELECT * FROM badges WHERE user_id = ? ORDER BY earned_at DESC", (user_id,)).fetchall()
    conn.close()
    return render_template('skills.html', skills=skills, badges=badges)

@app.route('/api/skills/add', methods=['POST'])
@login_required
def add_skill():
    user_id = session['user_id']
    data = request.get_json() or {}
    skill_name = data.get('skill_name', '').strip()
    category = data.get('category', 'Programming')
    proficiency = int(data.get('proficiency', 75))
    status = data.get('status', 'Proficient')

    if not skill_name:
        return jsonify({'error': 'Skill name is required'}), 400

    conn = get_db_connection()
    conn.execute('''
        INSERT INTO skills (user_id, skill_name, category, proficiency, status)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, skill_name, category, proficiency, status))
    conn.commit()
    conn.close()

    return jsonify({'success': True})

@app.route('/api/skills/delete/<int:skill_id>', methods=['POST'])
@login_required
def delete_skill(skill_id):
    user_id = session['user_id']
    conn = get_db_connection()
    conn.execute("DELETE FROM skills WHERE id = ? AND user_id = ?", (skill_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/applications')
@login_required
def applications_view():
    user_id = session['user_id']
    conn = get_db_connection()
    apps = conn.execute("SELECT * FROM job_applications WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)).fetchall()
    conn.close()
    return render_template('applications.html', applications=apps)

@app.route('/api/applications/add', methods=['POST'])
@login_required
def add_application():
    user_id = session['user_id']
    data = request.get_json() or {}
    company = data.get('company', '').strip()
    role = data.get('role', '').strip()
    location = data.get('location', 'Remote / Hybrid')
    salary_lpa = float(data.get('salary_lpa') or 0.0)
    apply_date = data.get('apply_date', '')
    status = data.get('status', 'Applied')
    notes = data.get('notes', '')

    if not company or not role:
        return jsonify({'error': 'Company and Role are required'}), 400

    conn = get_db_connection()
    existing = conn.execute(
        "SELECT id FROM job_applications WHERE user_id = ? AND LOWER(company) = LOWER(?) AND LOWER(role) = LOWER(?)",
        (user_id, company, role)
    ).fetchone()

    if existing:
        conn.execute('''
            UPDATE job_applications 
            SET location = ?, salary_lpa = ?, apply_date = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (location, salary_lpa, apply_date, status, notes, existing['id']))
    else:
        conn.execute('''
            INSERT INTO job_applications (user_id, company, role, location, salary_lpa, apply_date, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, company, role, location, salary_lpa, apply_date, status, notes))

    conn.commit()
    conn.close()

    check_and_award_badge(user_id, 'first_app', 'Job Hunter', 'Logged your first job application', 'fa-paper-plane')

    return jsonify({'success': True})

@app.route('/api/applications/update/<int:app_id>', methods=['POST'])
@login_required
def update_application(app_id):
    user_id = session['user_id']
    data = request.get_json() or {}
    status = data.get('status', 'Applied')
    notes = data.get('notes', '')

    conn = get_db_connection()
    conn.execute('''
        UPDATE job_applications SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ''', (status, notes, app_id, user_id))
    conn.commit()
    conn.close()

    if status == 'Offer':
        check_and_award_badge(user_id, 'offer_received', 'Placement Legend', 'Secured a job offer!', 'fa-champagne-glasses')

    return jsonify({'success': True})

@app.route('/api/applications/delete/<int:app_id>', methods=['POST'])
@login_required
def delete_application(app_id):
    user_id = session['user_id']
    conn = get_db_connection()
    conn.execute("DELETE FROM job_applications WHERE id = ? AND user_id = ?", (app_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# -------------------------------------------------------------
# LEADERBOARD / STUDENT RANKINGS
# -------------------------------------------------------------
@app.route('/leaderboard')
@login_required
def leaderboard():
    conn = get_db_connection()
    # Rank students based on aptitude score, skills count, and interview performance
    rankings_raw = conn.execute('''
        SELECT u.id, u.username, u.full_name, u.college, u.branch, u.target_role,
               COALESCE(AVG(a.accuracy_pct), 0) as avg_aptitude,
               COALESCE(AVG(i.overall_score), 0) as avg_interview,
               (SELECT COUNT(*) FROM skills s WHERE s.user_id = u.id) as skills_count,
               (SELECT COUNT(*) FROM badges b WHERE b.user_id = u.id) as badge_count
        FROM users u
        LEFT JOIN aptitude_scores a ON u.id = a.user_id
        LEFT JOIN interview_scores i ON u.id = i.user_id
        WHERE u.role = 'student'
        GROUP BY u.id
    ''').fetchall()
    conn.close()

    leaderboard_list = []
    for r in rankings_raw:
        # Composite score calculation out of 100
        composite = round(
            (r['avg_aptitude'] * 0.45) + 
            (r['avg_interview'] * 10 * 0.35) + 
            (min(r['skills_count'] * 3, 20)), 
            1
        )
        leaderboard_list.append({
            'id': r['id'],
            'username': r['username'],
            'full_name': r['full_name'] or r['username'],
            'college': r['college'] or 'Tech Institute',
            'branch': r['branch'] or 'Engineering',
            'target_role': r['target_role'],
            'avg_aptitude': round(r['avg_aptitude'], 1),
            'avg_interview': round(r['avg_interview'], 1),
            'skills_count': r['skills_count'],
            'badge_count': r['badge_count'],
            'composite_score': composite
        })

    # Sort descending by composite score
    leaderboard_list.sort(key=lambda x: x['composite_score'], reverse=True)
    for idx, item in enumerate(leaderboard_list):
        item['rank'] = idx + 1

    return render_template('leaderboard.html', leaderboard=leaderboard_list)

# -------------------------------------------------------------
# ADMIN PANEL & CAMPUS PLACEMENT MANAGEMENT
# -------------------------------------------------------------
@app.route('/admin')
@login_required
@admin_required
def admin_panel():
    conn = get_db_connection()
    users = conn.execute("SELECT id, username, email, full_name, college, branch, grad_year, role, target_role, bio, created_at FROM users ORDER BY created_at DESC").fetchall()
    total_users = len(users)

    # 1. Student Performance Records
    students_performance = []
    for u in users:
        if u['role'] != 'student':
            continue
        uid = u['id']
        apt_row = conn.execute('''
            SELECT COUNT(*) as test_count, COALESCE(AVG(accuracy_pct), 0) as avg_accuracy, COALESCE(SUM(total_questions), 0) as total_q
            FROM aptitude_scores WHERE user_id = ?
        ''', (uid,)).fetchone()

        ats_row = conn.execute('''
            SELECT score FROM ats_scans WHERE user_id = ? ORDER BY id DESC LIMIT 1
        ''', (uid,)).fetchone()
        ats_score = ats_row['score'] if ats_row else 78

        skills_rows = conn.execute('''
            SELECT skill_name, category, proficiency, status FROM skills WHERE user_id = ? ORDER BY proficiency DESC
        ''', (uid,)).fetchall()
        top_skills = [s['skill_name'] for s in skills_rows[:4]]

        app_rows = conn.execute('''
            SELECT company, role, salary_lpa, apply_date, status, notes FROM job_applications WHERE user_id = ? ORDER BY id DESC
        ''', (uid,)).fetchall()
        offers_count = sum(1 for a in app_rows if a['status'] == 'Offer')
        interview_count = sum(1 for a in app_rows if a['status'] == 'Interview')
        screening_count = sum(1 for a in app_rows if a['status'] == 'Screening')

        badge_count = conn.execute('SELECT COUNT(*) FROM badges WHERE user_id = ?', (uid,)).fetchone()[0]

        avg_apt = round(apt_row['avg_accuracy'], 1)
        skills_score = min(len(skills_rows) * 3, 20)
        readiness = min(round((avg_apt * 0.45) + (ats_score * 0.35) + skills_score, 1), 100.0)
        if readiness >= 85:
            readiness_label = "Placement Ready (Tier 1)"
            readiness_badge = "badge-success"
        elif readiness >= 70:
            readiness_label = "Competitive (Tier 2)"
            readiness_badge = "badge-primary"
        else:
            readiness_label = "In Training"
            readiness_badge = "badge-warning"

        students_performance.append({
            'id': uid,
            'username': u['username'],
            'full_name': u['full_name'] or u['username'],
            'email': u['email'],
            'college': u['college'] or 'Prathyusha Engineering College',
            'branch': u['branch'] or 'Engineering',
            'grad_year': u['grad_year'] or 2026,
            'target_role': u['target_role'] or 'Software Engineer',
            'aptitude_count': apt_row['test_count'],
            'avg_aptitude': avg_apt,
            'total_apt_questions': apt_row['total_q'],
            'ats_score': ats_score,
            'skills_count': len(skills_rows),
            'top_skills': top_skills,
            'all_skills': [dict(s) for s in skills_rows],
            'total_apps': len(app_rows),
            'offers_count': offers_count,
            'interview_count': interview_count,
            'screening_count': screening_count,
            'all_apps': [dict(a) for a in app_rows],
            'badge_count': badge_count,
            'readiness': readiness,
            'readiness_label': readiness_label,
            'readiness_badge': readiness_badge
        })

    students_performance.sort(key=lambda s: s['readiness'], reverse=True)
    for idx, item in enumerate(students_performance):
        item['rank'] = idx + 1

    # 2. Company Applications & Candidate Hiring Pipeline
    company_applications = conn.execute('''
        SELECT ja.id, ja.user_id, ja.company, ja.role, ja.location, ja.salary_lpa, 
               ja.apply_date, ja.status, ja.notes, ja.updated_at,
               u.username, u.full_name, u.college, u.email, u.target_role, u.branch
        FROM job_applications ja
        JOIN users u ON ja.user_id = u.id
        ORDER BY ja.id DESC
    ''').fetchall()

    total_apps = len(company_applications)
    total_offers = sum(1 for a in company_applications if a['status'] == 'Offer')
    total_quizzes = conn.execute("SELECT COUNT(*) FROM aptitude_scores").fetchone()[0]

    # Campus Placement Drives & Notices
    raw_drives = conn.execute("SELECT * FROM placement_drives ORDER BY created_at DESC").fetchall()
    notices = conn.execute("SELECT * FROM placement_notices ORDER BY created_at DESC").fetchall()

    # Advanced TPO Analytics: Placement Rate & CTC Highlights
    placed_students_count = sum(1 for s in students_performance if s['offers_count'] > 0)
    total_students_count = len(students_performance)
    placement_rate = round((placed_students_count / total_students_count) * 100, 1) if total_students_count > 0 else 0.0

    all_salaries = [d['package_lpa'] for d in raw_drives if d['package_lpa']] + [a['salary_lpa'] for a in company_applications if a['salary_lpa']]
    highest_package = max(all_salaries) if all_salaries else 0.0

    offer_salaries = [a['salary_lpa'] for a in company_applications if a['status'] == 'Offer' and a['salary_lpa'] and a['salary_lpa'] > 0]
    avg_package = round(sum(offer_salaries) / len(offer_salaries), 1) if offer_salaries else (round(sum(all_salaries) / len(all_salaries), 1) if all_salaries else 0.0)

    # Attach live applicant count to each drive
    drives = []
    for d in raw_drives:
        d_dict = dict(d)
        cnt = conn.execute("SELECT COUNT(*) FROM job_applications WHERE LOWER(company) = LOWER(?)", (d['company'],)).fetchone()[0]
        d_dict['applicant_count'] = cnt
        drives.append(d_dict)

    unique_companies = sorted(list(set([d['company'] for d in drives] + [a['company'] for a in company_applications])))

    conn.close()

    return render_template('admin.html', 
                           users=users,
                           students_performance=students_performance,
                           company_applications=company_applications,
                           unique_companies=unique_companies,
                           total_users=total_users,
                           total_students=total_students_count,
                           total_apps=total_apps,
                           total_offers=total_offers,
                           total_quizzes=total_quizzes,
                           total_drives=len(drives),
                           drives=drives,
                           notices=notices,
                           placed_students_count=placed_students_count,
                           placement_rate=placement_rate,
                           highest_package=highest_package,
                           avg_package=avg_package)

@app.route('/admin/drive/add', methods=['POST'])
@login_required
@admin_required
def admin_add_drive():
    company = request.form.get('company', '').strip()
    role = request.form.get('role', '').strip()
    package_lpa = float(request.form.get('package_lpa', 0) or 0)
    min_cgpa = float(request.form.get('min_cgpa', 0) or 0)
    location = request.form.get('location', 'On-Campus / Hybrid').strip()
    drive_date = request.form.get('drive_date', '')
    deadline = request.form.get('deadline', '')
    description = request.form.get('description', '')

    if not company or not role:
        flash('Company and Role are required fields.', 'danger')
        return redirect(url_for('admin_panel'))

    conn = get_db_connection()
    existing_drive = conn.execute(
        "SELECT id FROM placement_drives WHERE LOWER(company) = LOWER(?) AND LOWER(role) = LOWER(?)",
        (company, role)
    ).fetchone()
    if existing_drive:
        conn.execute('''
            UPDATE placement_drives 
            SET package_lpa = ?, min_cgpa = ?, location = ?, drive_date = ?, deadline = ?, description = ?
            WHERE id = ?
        ''', (package_lpa, min_cgpa, location, drive_date, deadline, description, existing_drive['id']))
    else:
        conn.execute('''
            INSERT INTO placement_drives (company, role, package_lpa, min_cgpa, location, drive_date, deadline, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (company, role, package_lpa, min_cgpa, location, drive_date, deadline, description))
    conn.commit()
    conn.close()
    flash(f'Placement drive for {company} ({role}) published successfully!', 'success')
    return redirect(url_for('admin_panel') + '#drives-section')

@app.route('/admin/drive/toggle/<int:drive_id>', methods=['POST'])
@login_required
@admin_required
def admin_toggle_drive(drive_id):
    conn = get_db_connection()
    drive = conn.execute("SELECT status, company FROM placement_drives WHERE id = ?", (drive_id,)).fetchone()
    if drive:
        new_status = 'Closed' if drive['status'] == 'Open' else 'Open'
        conn.execute("UPDATE placement_drives SET status = ? WHERE id = ?", (new_status, drive_id))
        conn.commit()
        flash(f'Drive for {drive["company"]} marked as {new_status}.', 'info')
    conn.close()
    return redirect(url_for('admin_panel') + '#drives-section')

@app.route('/admin/drive/delete/<int:drive_id>', methods=['POST'])
@login_required
@admin_required
def admin_delete_drive(drive_id):
    conn = get_db_connection()
    drive = conn.execute("SELECT company FROM placement_drives WHERE id = ?", (drive_id,)).fetchone()
    if drive:
        conn.execute("DELETE FROM placement_drives WHERE id = ?", (drive_id,))
        conn.commit()
        flash(f'Placement drive for {drive["company"]} removed successfully.', 'info')
    conn.close()
    return redirect(url_for('admin_panel') + '#drives-section')

@app.route('/admin/drive/broadcast/<int:drive_id>', methods=['POST'])
@login_required
@admin_required
def admin_broadcast_drive(drive_id):
    conn = get_db_connection()
    drive = conn.execute("SELECT company, role, package_lpa, drive_date, deadline FROM placement_drives WHERE id = ?", (drive_id,)).fetchone()
    if drive:
        title = f"📢 Upcoming Drive: {drive['company']} ({drive['role']})"
        content = f"{drive['company']} is recruiting for {drive['role']} (₹{drive['package_lpa']} LPA). Drive Date: {drive['drive_date']}. Application Deadline: {drive['deadline']}. Check requirements and apply from your dashboard!"
        conn.execute('''
            INSERT INTO placement_notices (title, content, priority, posted_by)
            VALUES (?, ?, 'Urgent', 'TPO Placement Cell')
        ''', (title, content))
        conn.commit()
        flash(f'Instant broadcast reminder sent to all students for {drive["company"]}!', 'success')
    conn.close()
    return redirect(url_for('admin_panel') + '#notices-section')

@app.route('/admin/notice/add', methods=['POST'])
@login_required
@admin_required
def admin_add_notice():
    title = request.form.get('title', '').strip()
    content = request.form.get('content', '').strip()
    priority = request.form.get('priority', 'Normal')
    posted_by = session.get('username', 'Placement Cell')

    if not title or not content:
        flash('Notice title and content cannot be empty.', 'danger')
        return redirect(url_for('admin_panel'))

    conn = get_db_connection()
    existing_notice = conn.execute("SELECT id FROM placement_notices WHERE LOWER(title) = LOWER(?)", (title,)).fetchone()
    if existing_notice:
        conn.execute('''
            UPDATE placement_notices 
            SET content = ?, priority = ?, posted_by = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (content, priority, posted_by, existing_notice['id']))
    else:
        conn.execute('''
            INSERT INTO placement_notices (title, content, priority, posted_by)
            VALUES (?, ?, ?, ?)
        ''', (title, content, priority, posted_by))
    conn.commit()
    conn.close()
    flash('Placement notice successfully broadcast to all students!', 'success')
    return redirect(url_for('admin_panel') + '#notices-section')

@app.route('/admin/notice/delete/<int:notice_id>', methods=['POST'])
@login_required
@admin_required
def admin_delete_notice(notice_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM placement_notices WHERE id = ?", (notice_id,))
    conn.commit()
    conn.close()
    flash('Placement notice removed.', 'info')
    return redirect(url_for('admin_panel') + '#notices-section')

@app.route('/admin/application/update/<int:app_id>', methods=['POST'])
@login_required
@admin_required
def admin_update_application(app_id):
    status = request.form.get('status', 'Applied').strip()
    notes = request.form.get('notes', '').strip()
    conn = get_db_connection()
    app_record = conn.execute("SELECT user_id, company, role FROM job_applications WHERE id = ?", (app_id,)).fetchone()
    if app_record:
        if notes:
            conn.execute("UPDATE job_applications SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (status, notes, app_id))
        else:
            conn.execute("UPDATE job_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (status, app_id))
        conn.commit()
        if status == 'Offer':
            check_and_award_badge(app_record['user_id'], 'offer_received', 'Placement Legend', 'Secured a job offer!', 'fa-champagne-glasses')
        flash(f'Application #{app_id} for {app_record["company"]} updated to stage: {status}.', 'success')
    conn.close()
    return redirect(url_for('admin_panel') + '#applications-section')

@app.route('/admin/application/add', methods=['POST'])
@login_required
@admin_required
def admin_add_application():
    user_id = request.form.get('user_id')
    company = request.form.get('company', '').strip()
    role = request.form.get('role', '').strip()
    salary_lpa = float(request.form.get('salary_lpa', 0) or 0)
    location = request.form.get('location', 'On-Campus / Hybrid').strip()
    status = request.form.get('status', 'Applied').strip()
    notes = request.form.get('notes', 'Logged by Placement Cell').strip()
    apply_date = request.form.get('apply_date') or datetime.now().strftime('%Y-%m-%d')

    if not user_id or not company or not role:
        flash('Student, Company, and Role are required fields.', 'danger')
        return redirect(url_for('admin_panel'))

    conn = get_db_connection()
    conn.execute('''
        INSERT INTO job_applications (user_id, company, role, location, salary_lpa, apply_date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, company, role, location, salary_lpa, apply_date, status, notes))
    conn.commit()
    if status == 'Offer':
        check_and_award_badge(int(user_id), 'offer_received', 'Placement Legend', 'Secured a job offer!', 'fa-champagne-glasses')
    conn.close()
    flash(f'Candidate application logged for {company} ({role}) successfully!', 'success')
    return redirect(url_for('admin_panel') + '#applications-section')

@app.route('/admin/application/delete/<int:app_id>', methods=['POST'])
@login_required
@admin_required
def admin_delete_application(app_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM job_applications WHERE id = ?", (app_id,))
    conn.commit()
    conn.close()
    flash('Candidate application removed from tracking roster.', 'info')
    return redirect(url_for('admin_panel') + '#applications-section')

@app.route('/admin/export-csv')
@login_required
@admin_required
def admin_export_csv():
    conn = get_db_connection()
    users = conn.execute("SELECT id, username, email, full_name, college, branch, grad_year, target_role, role, created_at FROM users ORDER BY id ASC").fetchall()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Student ID', 'Username', 'Full Name', 'Email', 'College / University', 'Branch / Stream', 'Graduation Year', 'Target Role', 'Access Role', 'Aptitude Accuracy %', 'ATS Score', 'Verified Skills', 'Company Apps', 'Offers', 'Readiness Index', 'Registration Date'])
    for u in users:
        uid = u['id']
        apt_row = conn.execute("SELECT COALESCE(AVG(accuracy_pct), 0) FROM aptitude_scores WHERE user_id = ?", (uid,)).fetchone()[0]
        ats_row = conn.execute("SELECT score FROM ats_scans WHERE user_id = ? ORDER BY id DESC LIMIT 1", (uid,)).fetchone()
        ats_score = ats_row[0] if ats_row else 75
        skills_count = conn.execute("SELECT COUNT(*) FROM skills WHERE user_id = ?", (uid,)).fetchone()[0]
        apps_count = conn.execute("SELECT COUNT(*) FROM job_applications WHERE user_id = ?", (uid,)).fetchone()[0]
        offers_count = conn.execute("SELECT COUNT(*) FROM job_applications WHERE user_id = ? AND status = 'Offer'", (uid,)).fetchone()[0]
        readiness = round((apt_row * 0.45) + (ats_score * 0.35) + min(skills_count * 3, 20), 1)

        writer.writerow([
            u['id'],
            u['username'],
            u['full_name'] or '',
            u['email'],
            u['college'] or '',
            u['branch'] or '',
            u['grad_year'] or '',
            u['target_role'] or '',
            u['role'],
            f"{round(apt_row, 1)}%",
            f"{ats_score}%",
            skills_count,
            apps_count,
            offers_count,
            f"{readiness}%",
            u['created_at']
        ])
    conn.close()

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=careerx_tpo_student_roster.csv"}
    )

@app.route('/admin/export-applications-csv')
@login_required
@admin_required
def admin_export_applications_csv():
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT ja.id, u.full_name, u.username, u.college, u.email, ja.company, ja.role, ja.salary_lpa, ja.location, ja.apply_date, ja.status, ja.notes
        FROM job_applications ja
        JOIN users u ON ja.user_id = u.id
        ORDER BY ja.id DESC
    ''').fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['App ID', 'Student Full Name', 'Username', 'College', 'Email', 'Company', 'Role / Designation', 'Package (LPA)', 'Location', 'Applied Date', 'Hiring Stage / Status', 'Notes'])
    for r in rows:
        writer.writerow([
            r['id'],
            r['full_name'] or r['username'],
            r['username'],
            r['college'] or '',
            r['email'],
            r['company'],
            r['role'],
            r['salary_lpa'] or '',
            r['location'] or '',
            r['apply_date'] or '',
            r['status'],
            r['notes'] or ''
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=careerx_company_applications_pipeline.csv"}
    )

@app.route('/api/drive/apply/<int:drive_id>', methods=['POST', 'OPTIONS'])
def apply_placement_drive(drive_id):
    if request.method == 'OPTIONS':
        return '', 204
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'success', 'message': 'Demo application submitted! Added to your campus interview schedule.'})
    
    conn = get_db_connection()
    drive = conn.execute("SELECT * FROM placement_drives WHERE id = ?", (drive_id,)).fetchone()
    if not drive:
        conn.close()
        return jsonify({'error': 'Placement drive not found'}), 404

    existing = conn.execute("SELECT id FROM job_applications WHERE user_id = ? AND company = ? AND role = ?", 
                            (user_id, drive['company'], drive['role'])).fetchone()
    if existing:
        conn.close()
        return jsonify({'status': 'info', 'message': f'You have already applied to {drive["company"]}!'})

    conn.execute('''
        INSERT INTO job_applications (user_id, company, role, status, apply_date, salary_lpa, notes)
        VALUES (?, ?, ?, 'Applied', date('now'), ?, ?)
    ''', (user_id, drive['company'], drive['role'], drive['package_lpa'], f"Applied via CareerX Campus Drive Portal (Drive Date: {drive['drive_date']})"))
    conn.commit()

    check_and_award_badge(user_id, 'campus_driver', 'Campus Candidate', 'Applied to an official campus placement drive on CareerX', 'fa-building-columns')
    conn.close()

    return jsonify({'status': 'success', 'message': f'Successfully applied to {drive["company"]} ({drive["role"]})! Logged to your Job Tracker.'})

@app.route('/admin/question/add', methods=['POST'])
@login_required
@admin_required
def admin_add_question():
    q_type = request.form.get('question_type') # 'aptitude' or 'interview'
    conn = get_db_connection()

    if q_type == 'aptitude':
        category = request.form.get('category')
        question = request.form.get('question', '').strip()
        opt_a = request.form.get('option_a')
        opt_b = request.form.get('option_b')
        opt_c = request.form.get('option_c')
        opt_d = request.form.get('option_d')
        correct = request.form.get('correct_option')
        explanation = request.form.get('explanation')
        existing = conn.execute('SELECT id FROM aptitude_questions WHERE category = ? AND question = ?', (category, question)).fetchone()
        if existing:
            flash(f'Notice: This aptitude question already exists in {category}.', 'warning')
        else:
            conn.execute('''
                INSERT INTO aptitude_questions (category, question, option_a, option_b, option_c, option_d, correct_option, explanation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (category, question, opt_a, opt_b, opt_c, opt_d, correct, explanation))
            conn.commit()
            flash('New aptitude question successfully added to question bank!', 'success')
    else:
        category = request.form.get('category')
        difficulty = request.form.get('difficulty', 'Medium')
        question = request.form.get('question', '').strip()
        answer = request.form.get('model_answer')
        key_points = request.form.get('key_points', '')
        existing = conn.execute('SELECT id FROM interview_questions WHERE category = ? AND question = ?', (category, question)).fetchone()
        if existing:
            flash(f'Notice: This interview question already exists in {category}.', 'warning')
        else:
            conn.execute('''
                INSERT INTO interview_questions (category, difficulty, question, model_answer, key_points)
                VALUES (?, ?, ?, ?, ?)
            ''', (category, difficulty, question, answer, key_points))
            conn.commit()
            flash('New interview question successfully added to question bank!', 'success')

    conn.close()
    return_to = request.form.get('return_to')
    if return_to == 'interview_prep':
        return redirect(url_for('interview_prep', category=category))
    return redirect(url_for('admin_panel'))

@app.route('/admin/user/toggle-role/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def admin_toggle_role(user_id):
    conn = get_db_connection()
    user = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
    if user:
        new_role = 'student' if user['role'] == 'admin' else 'admin'
        conn.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
        conn.commit()
    conn.close()
    flash('User role updated successfully.', 'info')
    return redirect(url_for('admin_panel'))

# -------------------------------------------------------------
# APPLICATION ENTRYPOINT
# -------------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
