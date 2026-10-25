from app import app
import json

def run_tests():
    client = app.test_client()

    print("==================================================")
    print("CAREERX – PLACEMENT READINESS PLATFORM: INTEGRATION TEST")
    print("==================================================")

    # 1. Student Authentication
    res = client.post('/login', data={'username': 'student', 'password': 'student123'}, follow_redirects=True)
    assert res.status_code == 200, f"Login failed with status {res.status_code}"
    print("[PASS] 1. Student Authentication & Session Creation")

    # 2. AI Chat Engine
    res = client.post('/api/chat/send', json={'message': 'Explain Two Pointers vs Sliding Window with code'})
    assert res.status_code == 200, f"Chat failed with status {res.status_code}"
    data = res.get_json()
    assert 'reply' in data and len(data['reply']) > 50
    print("[PASS] 2. Candidate Guidance & Career Q&A Engine")

    # 3. ATS Resume Scanner
    res = client.post('/api/ats-scan', data={
        'target_role': 'AI/ML Engineer',
        'resume_text': 'Experienced Python engineer with expertise in PyTorch, Machine Learning, Deep Learning, SQL, Pandas, NumPy. Built and deployed NLP models serving 5000 users with sub-50ms latency.'
    })
    assert res.status_code == 200, f"ATS failed with status {res.status_code}"
    report = res.get_json()['report']
    score = report['score']
    print(f"[PASS] 3. ATS Resume Scanner (Calculated Score: {score}%)")

    # 4. Aptitude Engine
    res = client.get('/api/aptitude/questions?category=Quantitative&limit=2')
    questions = res.get_json()
    assert len(questions) > 0
    q1 = questions[0]
    res = client.post('/api/aptitude/submit', json={
        'category': 'Quantitative',
        'answers': {str(q1['id']): q1['correct']},
        'time_spent_sec': 45
    })
    assert res.status_code == 200
    print("[PASS] 4. Timed Aptitude Practice & Scoring Engine")

    # 5. Technical Assessment Evaluator
    res = client.post('/api/technical-assessment/evaluate', json={
        'role_tested': 'Python',
        'submissions': [{
            'question_id': 1,
            'question': 'What is shallow vs deep copy in Python?',
            'answer': 'A shallow copy copies references of nested objects, while a deep copy recursively creates completely independent copies of all objects in memory using copy.deepcopy.'
        }]
    })
    assert res.status_code == 200
    eval_res = res.get_json()
    print(f"[PASS] 5. Technical Assessment Simulator (Rating: {eval_res['overall_score']}/10)")

    # 6. Career Roadmap
    res = client.post('/api/roadmap/update', json={
        'career_role': 'AI/ML Engineer',
        'completed_steps': ['Master Python, NumPy, Pandas & Vectorized Computation']
    })
    assert res.status_code == 200
    print("[PASS] 6. Career Roadmap & Milestone Progress")

    # 7. Job Application Tracker
    res = client.post('/api/applications/add', json={
        'company': 'Amazon AWS',
        'role': 'Cloud Associate',
        'location': 'Hyderabad',
        'salary_lpa': 22.0,
        'apply_date': '2026-10-12',
        'status': 'Applied',
        'notes': 'Campus application submitted'
    })
    assert res.status_code == 200
    print("[PASS] 7. Job Application Pipeline Tracker")

    # 8. Student Leaderboard
    res = client.get('/leaderboard')
    assert res.status_code == 200
    print("[PASS] 8. Student Ranking & Placement Leaderboard")

    # 9. Public Health Check & Server Status
    res = client.get('/api/health')
    assert res.status_code == 200
    assert res.get_json()['health'] == 'ok'
    print("[PASS] 9. Backend Health & Server Status Endpoint")

    # 10. Public Chat API
    res = client.post('/api/public/chat', json={'message': 'Explain binary search tree'})
    assert res.status_code == 200
    assert len(res.get_json()['reply']) > 20
    print("[PASS] 10. Public Live Chat Engine Integration")

    # 11. Public Admin Question Injection
    res = client.post('/api/public/question/add', json={
        'question_type': 'interview',
        'category': 'Python',
        'difficulty': 'Medium',
        'question': 'What are Python decorators?',
        'model_answer': 'Decorators are functions that take another function as argument and extend its behavior without modifying it.',
        'key_points': 'higher-order functions, wrappers, @ syntax'
    })
    assert res.status_code == 200
    print("[PASS] 11. Platform Admin Question Injection API")

    # 12. Public Campus Drives API
    res = client.get('/api/public/drives')
    assert res.status_code == 200
    drives = res.get_json()
    assert isinstance(drives, list) and len(drives) > 0
    print(f"[PASS] 12. Campus Placement Drives Board API ({len(drives)} Active Drives)")

    # 13. Public Placement Notices API
    res = client.get('/api/public/notices')
    assert res.status_code == 200
    notices = res.get_json()
    assert isinstance(notices, list) and len(notices) > 0
    print(f"[PASS] 13. Placement Cell Notices & Broadcasts API ({len(notices)} Notices)")

    # 14. Placement Readiness Diagnostic Tool
    res = client.post('/api/public/readiness-check', json={
        'cgpa': 8.5,
        'aptitude_accuracy': 82.0,
        'ats_score': 88.0,
        'mock_score': 8.5,
        'skills_count': 6
    })
    assert res.status_code == 200
    diag = res.get_json()
    assert 'score' in diag and 'tier' in diag and diag['score'] >= 75
    print(f"[PASS] 14. Placement Readiness Evaluator (Calculated Index: {diag['score']}%, Tier: {diag['tier']})")

    # 15. 1-Click Campus Drive Application
    res = client.post('/api/drive/apply/1')
    assert res.status_code == 200
    apply_data = res.get_json()
    assert apply_data['status'] in ('success', 'info')
    print(f"[PASS] 15. 1-Click Campus Drive Application Engine ({apply_data['message']})")

    # 16. Admin Authentication & TPO Features
    res = client.post('/login', data={'username': 'admin', 'password': 'admin123'}, follow_redirects=True)
    assert res.status_code == 200

    # 17. TPO Student Roster CSV Export
    res = client.get('/admin/export-csv')
    assert res.status_code == 200
    assert 'text/csv' in res.content_type
    assert b'careerx_tpo_student_roster.csv' in res.headers.get('Content-Disposition', b'').encode()
    print("[PASS] 16. TPO Student Directory CSV Export Engine")

    # 18. Admin Add Drive & Toggle Status
    res = client.post('/admin/drive/add', data={
        'company': 'Atlassian',
        'role': 'Graduate SDE',
        'package_lpa': 26.5,
        'min_cgpa': 8.0,
        'location': 'Bengaluru',
        'drive_date': '2026-12-05',
        'deadline': '2026-11-20',
        'description': 'Jira and Confluence core engineering team.'
    }, follow_redirects=True)
    assert res.status_code == 200
    print("[PASS] 17. Admin Publish Campus Recruitment Drive")

    res = client.post('/admin/drive/toggle/1', follow_redirects=True)
    assert res.status_code == 200
    print("[PASS] 18. Admin Toggle Drive Open/Closed Status")

    # 19. Admin Broadcast Notice
    res = client.post('/admin/notice/add', data={
        'title': 'Technical Assessment Drive Scheduled',
        'content': 'All registered students must take at least 2 technical assessment tests before Friday.',
        'priority': 'High'
    }, follow_redirects=True)
    assert res.status_code == 200
    print("[PASS] 19. Admin Broadcast Notice to Student Dashboards")

    print("==================================================")
    print("ALL 19 FULL-STACK MODULES PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()

