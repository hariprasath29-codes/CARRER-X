import sqlite3
import os
import json
import shutil
from werkzeug.security import generate_password_hash

# Detect Serverless environment (Vercel, AWS Lambda)
IS_VERCEL = bool(os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'))

if IS_VERCEL:
    DB_DIR = '/tmp'
    DB_PATH = '/tmp/careerx.db'
else:
    DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    DB_PATH = os.path.join(DB_DIR, 'careerx.db')

# Database connection helper function
def get_db_connection():
    """
    Creates and returns a connection to the SQLite database.
    In serverless environments like Vercel, uses /tmp and automatically
    initializes the schema and initial seed data if not yet created.
    """
    try:
        if not os.path.exists(DB_DIR):
            os.makedirs(DB_DIR, exist_ok=True)
    except Exception as e:
        print(f"Warning: could not create DB_DIR {DB_DIR}: {e}")

    # On Vercel, if DB not in /tmp but a bundled pre-seeded DB exists in the repo, copy it
    if IS_VERCEL and not os.path.exists(DB_PATH):
        bundled_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'careerx.db')
        if os.path.exists(bundled_db):
            try:
                shutil.copyfile(bundled_db, DB_PATH)
            except Exception as e:
                print(f"Warning: could not copy bundled db: {e}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Auto-initialize if tables do not exist
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            init_db(existing_conn=conn)
    except Exception as e:
        print(f"Error checking/initializing database: {e}")

    return conn

# Main schema initialization function
def init_db(existing_conn=None):
    """
    Creates all relational tables if they do not already exist.
    Called once when setting up the platform, or automatically on cold start.
    """
    if existing_conn:
        conn = existing_conn
        should_close = False
    else:
        try:
            if not os.path.exists(DB_DIR):
                os.makedirs(DB_DIR, exist_ok=True)
        except Exception as e:
            print(f"Warning: could not create DB_DIR {DB_DIR}: {e}")
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        should_close = True

    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        full_name TEXT,
        college TEXT,
        branch TEXT,
        grad_year INTEGER,
        target_role TEXT DEFAULT 'Software Engineer',
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Chat Sessions & Messages
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT DEFAULT 'New Placement Chat',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # 3. Resumes Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT DEFAULT 'Placement Resume',
        full_name TEXT,
        email TEXT,
        phone TEXT,
        linkedin TEXT,
        github TEXT,
        portfolio TEXT,
        summary TEXT,
        education_json TEXT,
        experience_json TEXT,
        projects_json TEXT,
        skills_json TEXT,
        certifications_json TEXT,
        template TEXT DEFAULT 'modern',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # 4. Skills Matrix & Roadmaps
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_name TEXT NOT NULL,
        category TEXT NOT NULL,
        proficiency INTEGER DEFAULT 70,
        status TEXT DEFAULT 'In Progress',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS roadmaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        career_role TEXT NOT NULL,
        completed_steps_json TEXT DEFAULT '[]',
        current_milestone TEXT,
        progress_pct INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # 5. Aptitude Questions & Scores
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS aptitude_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL,
        explanation TEXT
    )
    ''')
    cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_aptitude_category_question ON aptitude_questions(category, question)')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS aptitude_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        accuracy_pct REAL NOT NULL,
        time_spent_sec INTEGER DEFAULT 0,
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # 6. Technical Assessment & Interview Bank + Evaluations
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS interview_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        difficulty TEXT DEFAULT 'Medium',
        question TEXT NOT NULL,
        model_answer TEXT NOT NULL,
        key_points TEXT
    )
    ''')
    cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_category_question ON interview_questions(category, question)')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS interview_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role_tested TEXT NOT NULL,
        question_count INTEGER NOT NULL,
        overall_score REAL NOT NULL,
        feedback TEXT,
        answers_json TEXT,
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # 7. Job Application Tracker
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS job_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        location TEXT,
        salary_lpa REAL,
        apply_date TEXT,
        status TEXT DEFAULT 'Applied',
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # 8. Gamification Badges
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        badge_key TEXT NOT NULL,
        badge_name TEXT NOT NULL,
        badge_desc TEXT NOT NULL,
        badge_icon TEXT NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, badge_key)
    )
    ''')

    # 9. ATS Resume Scans
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ats_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        target_role TEXT NOT NULL,
        score INTEGER NOT NULL,
        matched_skills TEXT,
        missing_skills TEXT,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')

    # 10. Campus Placement Drives
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS placement_drives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        package_lpa REAL NOT NULL,
        min_cgpa REAL DEFAULT 6.5,
        location TEXT DEFAULT 'Pan India / Remote',
        drive_date TEXT NOT NULL,
        deadline TEXT NOT NULL,
        status TEXT DEFAULT 'Open',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 11. Campus Placement Notices & Broadcasts
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS placement_notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        priority TEXT DEFAULT 'Info',
        posted_by TEXT DEFAULT 'TPO Placement Cell',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    # Performance Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_aptitude_category ON aptitude_questions(category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_interview_category ON interview_questions(category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_job_apps_user ON job_applications(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_apt_scores_user ON aptitude_scores(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_int_scores_user ON interview_scores(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_placement_drives_status ON placement_drives(status)")

    # Schema migration checks for existing databases
    cursor.execute("PRAGMA table_info(chat_sessions)")
    chat_session_cols = [c[1] for c in cursor.fetchall()]
    if 'updated_at' not in chat_session_cols:
        cursor.execute("ALTER TABLE chat_sessions ADD COLUMN updated_at TIMESTAMP")
        cursor.execute("UPDATE chat_sessions SET updated_at = COALESCE(created_at, CURRENT_TIMESTAMP)")

    conn.commit()
    seed_data(cursor, conn)
    if should_close:
        conn.close()

def seed_data(cursor, conn):
    """Inserts default accounts, rich placement question banks, and demo records."""
    # Check if admin already exists
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        admin_pass = generate_password_hash("admin123")
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, full_name, college, branch, grad_year, target_role, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('admin', 'admin@careerx.ai', admin_pass, 'admin', 'CareerX Admin', 'IIT Madras', 'Computer Science & Engg', 2024, 'Lead Placement Officer', 'Placement administration and curriculum coordinator.'))

    # Check if student already exists
    cursor.execute("SELECT id, role FROM users WHERE username = 'student'")
    student_row = cursor.fetchone()
    if not student_row:
        student_pass = generate_password_hash("student123")
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, full_name, college, branch, grad_year, target_role, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('student', 'student@careerx.ai', student_pass, 'student', 'Candidate Student', 'National Institute of Technology', 'AI & Data Science', 2025, 'AI/ML Engineer', 'Aspiring AI engineer with a passion for deep learning, NLP, and scalable backend systems.'))
    elif student_row['role'] != 'student':
        cursor.execute("UPDATE users SET role = 'student' WHERE username = 'student'")

    # Seed Aptitude Questions if empty
    cursor.execute("SELECT COUNT(*) FROM aptitude_questions")
    if cursor.fetchone()[0] == 0:
        sample_aptitude = [
            # Quantitative
            ('Quantitative', 'A train running at 54 km/hr crosses a pole in 20 seconds. What is the length of the train?', '250 m', '300 m', '350 m', '200 m', 'B', 'Speed in m/s = 54 * (5/18) = 15 m/s. Distance = Speed * Time = 15 * 20 = 300 meters.'),
            ('Quantitative', 'If 12 men complete a project in 8 days, in how many days can 16 men finish the same project?', '5 days', '6 days', '7 days', '8 days', 'B', 'Total work = 12 * 8 = 96 man-days. Days required by 16 men = 96 / 16 = 6 days.'),
            ('Quantitative', 'A laptop marked at $800 is sold at a 15% discount. What is the selling price?', '$680', '$700', '$650', '$720', 'A', 'Discount = 15% of 800 = $120. Selling Price = 800 - 120 = $680.'),
            ('Quantitative', 'The ratio of ages of A and B is 3:5. If the sum of their ages is 56, what is B’s age?', '30 years', '35 years', '25 years', '40 years', 'B', 'Sum of parts = 3 + 5 = 8 parts = 56 years. One part = 7. B = 5 * 7 = 35 years.'),
            ('Quantitative', 'What is the compound interest on $5,000 at 10% per annum for 2 years compounded annually?', '$1,000', '$1,050', '$1,100', '$1,200', 'B', 'Amount = 5000 * (1.1)^2 = 5000 * 1.21 = $6050. CI = 6050 - 5000 = $1050.'),
            ('Quantitative', 'Two pipes A and B can fill a tank in 20 and 30 minutes respectively. If both pipes are opened together, how much time will they take?', '10 mins', '12 mins', '15 mins', '18 mins', 'B', 'Combined rate = 1/20 + 1/30 = (3+2)/60 = 5/60 = 1/12 tank/min. Time taken = 12 minutes.'),
            ('Quantitative', 'A car travels first 120 km at 60 km/h and the next 120 km at 40 km/h. What is the average speed for the whole journey?', '50 km/h', '48 km/h', '45 km/h', '52 km/h', 'B', 'Average Speed = Total Distance / Total Time = 240 / (2 + 3) = 240 / 5 = 48 km/h.'),

            # Logical Reasoning
            ('Logical', 'Find the missing number in the sequence: 4, 9, 19, 39, ?', '79', '69', '89', '75', 'A', 'Pattern is *2 + 1: 4*2+1=9, 9*2+1=19, 19*2+1=39, 39*2+1=79.'),
            ('Logical', 'If CLOCK is coded as KCOLC, how is STEPS coded?', 'SPETS', 'STPES', 'SPETZ', 'PESTS', 'A', 'The word letters are completely reversed: S-T-E-P-S becomes S-P-E-T-S.'),
            ('Logical', 'Pointing to a photograph, a woman says: "He is the son of the only daughter of my father." How is the man related to the woman?', 'Brother', 'Son', 'Nephew', 'Father', 'B', 'The only daughter of the woman’s father is the woman herself. So the man is her son.'),
            ('Logical', 'Statements: All laptops are devices. Some devices are electronic. Which conclusion follows?', 'Some laptops are electronic', 'All devices are laptops', 'No devices are laptops', 'Neither follows necessarily', 'D', 'Because the intersection between laptops and electronic is not explicitly guaranteed.'),
            ('Logical', 'If NORTH is coded as SOUTH and EAST is coded as WEST, what is NORTHEAST coded as?', 'SOUTHWEST', 'SOUTHEAST', 'NORTHWEST', 'WESTSOUTH', 'A', 'Opposite directional substitution: NORTH -> SOUTH, EAST -> WEST, therefore NORTHEAST -> SOUTHWEST.'),
            ('Logical', 'Find the odd one out: 27, 64, 125, 144, 216', '64', '125', '144', '216', 'C', '27=3^3, 64=4^3, 125=5^3, 216=6^3 are all perfect cubes. 144 is 12^2 (not a cube).'),

            # Verbal Ability
            ('Verbal', 'Choose the synonym of "METICULOUS":', 'Careless', 'Thorough and precise', 'Hasty', 'Vague', 'B', 'Meticulous means showing great attention to detail; very careful and precise.'),
            ('Verbal', 'Select the antonym of "MITIGATE":', 'Aggravate', 'Alleviate', 'Soothe', 'Diminish', 'A', 'Mitigate means to make less severe. The opposite is aggravate or exacerbate.'),
            ('Verbal', 'Identify the grammatically correct sentence:', 'Neither of the candidates were selected.', 'Neither of the candidates was selected.', 'Neither candidates are selected.', 'Neither candidate have been selected.', 'B', '"Neither of" refers to singular items individually and requires the singular verb "was".'),
            ('Verbal', 'Fill in the blank: "She has been working on this software project _____ January."', 'for', 'since', 'from', 'in', 'B', 'We use "since" to denote a specific starting point in time in continuous tenses.'),
            ('Verbal', 'Select the correct meaning of the idiom: "Bite the bullet"', 'To give up easily', 'To face a difficult situation with courage', 'To get into an argument', 'To make a hasty decision', 'B', '"Bite the bullet" means accepting and enduring an inevitable hardship with bravery.')
        ]
        cursor.executemany('''
            INSERT INTO aptitude_questions (category, question, option_a, option_b, option_c, option_d, correct_option, explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_aptitude)

    # Seed Technical Interview Questions (Deduplicated, 8 per category across 6 core domains)
    sample_interviews = [
        # ==========================================
        # 1. PYTHON (8 Questions)
        # ==========================================
        (
            'Python', 'Medium',
            'What is the difference between shallow copy and deep copy in Python?',
            'A shallow copy constructs a new compound object and inserts references into it to the objects found in the original. If any nested element is mutated, both copies reflect the modification.\n\nA deep copy recursively duplicates every nested object, constructing an entirely independent clone in memory using Python\'s `copy.deepcopy()` module.',
            'Shallow copy duplicates top-level container only; deep copy recursively copies child objects; copy vs copy.deepcopy; mutability effects on nested structures.'
        ),
        (
            'Python', 'Easy',
            'Explain the differences between lists and tuples in Python.',
            '1. Mutability: Lists are mutable (can add, remove, modify elements in-place); Tuples are immutable (cannot be altered after creation).\n2. Syntax: Lists use square brackets `[1, 2]`; Tuples use parentheses `(1, 2)`.\n3. Memory & Performance: Tuples consume less memory and have faster iteration speeds because Python allocates fixed memory blocks for them.\n4. Hashability: Tuples containing only immutable elements are hashable and can be used as dictionary keys or set members; lists cannot.',
            'Mutability vs immutability; syntax differences; memory allocation overhead; hashability as dictionary keys.'
        ),
        (
            'Python', 'Medium',
            'What are Python decorators?',
            'Decorators are higher-order functions that take another function as an argument, extend or modify its execution behavior without altering its source code, and return a callable object.\n\nThey rely on Python\'s first-class functions and closures. The `@decorator` syntax is syntactic sugar for `func = decorator(func)`. Typically, `functools.wraps` is applied to preserve the original function\'s docstring and `__name__`.',
            'Higher-order functions; closures; syntactic sugar (@); functools.wraps preservation; cross-cutting concerns (logging, auth, timing).'
        ),
        (
            'Python', 'Medium',
            'Explain how Python generators and the "yield" keyword differ from standard functions.',
            'A standard function returns a single value via `return` and terminates its execution context completely.\n\nA generator function uses the `yield` statement. When called, it returns a generator iterator without executing the function body immediately. Each time `next()` is invoked, code executes up to the `yield` expression, yields the value, and suspends execution—retaining local variables and state. This yields O(1) space efficiency for massive streams.',
            'yield vs return; lazy evaluation / generator iterator; execution state suspension; memory efficiency for large datasets (O(1) memory).'
        ),
        (
            'Python', 'Easy',
            'How does memory management and Garbage Collection work in Python?',
            'Python uses two primary mechanisms for automatic memory management:\n1. Reference Counting: Every object maintains a counter of how many references point to it. When the reference count drops to 0, memory is deallocated immediately.\n2. Cyclic Garbage Collector: To handle cyclic references (Object A points to B, and B points to A), Python has a generational garbage collector (Generations 0, 1, 2) that tracks container objects and cleans unreachable reference cycles.',
            'Reference counting; circular references; generational garbage collector (Gen 0, 1, 2); PyMalloc private heap allocation.'
        ),
        (
            'Python', 'Medium',
            'What is the difference between *args and **kwargs in Python functions?',
            '`*args` allows a function to accept an arbitrary number of positional arguments. Inside the function, `args` is received as a tuple.\n\n`**kwargs` allows a function to accept an arbitrary number of keyword (named) arguments. Inside the function, `kwargs` is received as a dictionary.\n\nThey are frequently used in function wrappers, decorators, and subclassing to pass parameters through to `super()`.',
            'Positional arguments tuple (*args); keyword arguments dictionary (**kwargs); parameter unpacking; decorator and subclass passthrough.'
        ),
        (
            'Python', 'Hard',
            'What is the Python GIL (Global Interpreter Lock) and how does it affect concurrency?',
            'The Global Interpreter Lock (GIL) is a mutual exclusion lock in CPython that prevents multiple native threads from executing Python bytecode simultaneously. It safeguards CPython\'s reference counting memory management against race conditions.\n\nImpact:\n- I/O-bound tasks: Multi-threading still works effectively because threads release the GIL during network/disk wait.\n- CPU-bound tasks: Threads cannot achieve true parallelism across multi-core processors. The recommended solution is using `multiprocessing`, `concurrent.futures.ProcessPoolExecutor`, or delegating heavy computation to C extensions/NumPy.',
            'CPython bytecode mutex; thread safety in reference counting; I/O-bound vs CPU-bound performance; multiprocessing workaround.'
        ),
        (
            'Python', 'Hard',
            'Explain Method Resolution Order (MRO) and the C3 Linearization algorithm in Python.',
            'Method Resolution Order (MRO) defines the exact order in which Python traverses the class inheritance hierarchy to resolve method or attribute lookups in multiple inheritance.\n\nPython uses the C3 Linearization algorithm, which enforces two essential properties:\n1. Local Precedence Order: Subclasses precede their parent classes, and direct parents are evaluated in the order listed in the class header.\n2. Monotonicity: If class A precedes class B in one parent\'s MRO, it must precede class B in all derived classes\' MROs.\nYou can inspect a class\'s MRO using `ClassName.__mro__` or `ClassName.mro()`.',
            'Multiple inheritance resolution; C3 Linearization algorithm; local precedence order; monotonicity; ClassName.__mro__; super() cooperative lookup.'
        ),

        # ==========================================
        # 2. JAVASCRIPT (8 Questions)
        # ==========================================
        (
            'JavaScript', 'Easy',
            'What are the differences between var, let, and const in JavaScript?',
            '1. Scope: `var` is function-scoped (or globally scoped); `let` and `const` are block-scoped (confined to `{}`).\n2. Hoisting: `var` declarations are hoisted and initialized to `undefined`. `let` and `const` are hoisted to the block top but remain in the "Temporal Dead Zone" (TDZ) until initialized, throwing a `ReferenceError` if accessed early.\n3. Re-assignment: `var` and `let` can be reassigned; `const` cannot be reassigned (though objects declared with `const` can have their internal properties mutated).',
            'Function scope vs block scope; Temporal Dead Zone (TDZ); variable hoisting; mutability and re-assignment rules.'
        ),
        (
            'JavaScript', 'Easy',
            'What is the difference between "==" and "===" in JavaScript?',
            '`==` (Abstract Equality) performs implicit type coercion before comparing values. For example, `\'5\' == 5` evaluates to `true` because the string is coerced into a number.\n\n`===` (Strict Equality) compares both the value and the underlying data type without performing any type conversion. Therefore, `\'5\' === 5` evaluates to `false` because types differ (`string` vs `number`). Best practice is always to use `===` to prevent subtle runtime bugs.',
            'Type coercion; abstract vs strict equality; predictability and best practices; falsy edge cases.'
        ),
        (
            'JavaScript', 'Medium',
            'What is the Event Loop and how does asynchronous JavaScript work?',
            'JavaScript executes synchronously on a single Call Stack. Asynchronous tasks (timers, fetch requests, event listeners) are handled by Browser Web APIs.\n\nWhen asynchronous operations complete:\n1. Promises and `MutationObserver` callbacks queue in the Microtask Queue.\n2. `setTimeout`, `setInterval`, and I/O callbacks queue in the Macrotask (Task) Queue.\n\nThe Event Loop continually inspects the Call Stack. Once empty, it exhausts ALL tasks in the Microtask Queue before processing the next Macrotask from the Task Queue.',
            'Single-threaded Call Stack; Web APIs; Microtask Queue (Promises, queueMicrotask); Macrotask Queue (setTimeout, I/O); Event Loop turn order.'
        ),
        (
            'JavaScript', 'Medium',
            'What are Closures in JavaScript? Provide an example and practical use cases.',
            'A closure is a function bundled together with references to its surrounding lexical environment. It gives an inner function persistent access to an outer function\'s scope even after the outer function has finished executing.\n\nUse Cases:\n1. Data privacy / encapsulation (creating private state in functions/factory patterns).\n2. Function currying and partial application.\n3. Event handlers and memoization caches.',
            'Lexical scoping; persistent access to outer variables; data encapsulation/privacy; practical currying or memoization.'
        ),
        (
            'JavaScript', 'Medium',
            'What are the differences between Arrow Functions and Regular Functions in JavaScript?',
            '1. `this` Binding: Regular functions dynamically bind `this` based on how they are called. Arrow functions lexically inherit `this` from their enclosing execution context.\n2. `arguments` Object: Regular functions have access to their own `arguments` object; arrow functions do not (rest parameters `...args` are used instead).\n3. Constructors: Regular functions can be invoked with `new` as constructors; arrow functions lack a `[[Construct]]` method and throw an error.\n4. Methods & Prototypes: Arrow functions do not possess a `prototype` property.',
            'Lexical this vs dynamic this; absence of arguments object; non-constructible with new; prototype property absence.'
        ),
        (
            'JavaScript', 'Medium',
            'Explain Promise.all(), Promise.allSettled(), and Promise.race().',
            '1. `Promise.all([p1, p2])`: Resolves when all promises resolve with an array of values; rejects immediately upon the first rejected promise (fail-fast).\n2. `Promise.allSettled([p1, p2])`: Waits for all promises to finish (either fulfilled or rejected) and returns an array of outcome objects `{status: "fulfilled"|"rejected", value/reason}`. Never short-circuits.\n3. `Promise.race([p1, p2])`: Settles as soon as the first promise resolves or rejects, adopting that promise\'s outcome.',
            'Promise.all fail-fast behavior; Promise.allSettled resilient outcome inspection; Promise.race first-settler behavior.'
        ),
        (
            'JavaScript', 'Hard',
            'How does Prototypal Inheritance work in JavaScript? Explain __proto__ vs prototype.',
            'Every JavaScript object has an internal link to another object called its prototype (`[[Prototype]]`, accessible via `Object.getPrototypeOf()` or `__proto__`). When a property or method is accessed on an object, the engine searches the object itself; if missing, it traverses up the prototype chain until found or until reaching `null` (`Object.prototype.__proto__`).\n\nDifference:\n- `prototype` is a property on constructor functions and classes used as the blueprint for instances created via `new`.\n- `__proto__` is an accessor property on instance objects pointing to their constructor\'s `prototype`.',
            '[[Prototype]] chain; Object.prototype root; prototype property on constructor functions; __proto__ instance link; property delegation.'
        ),
        (
            'JavaScript', 'Hard',
            'Explain Debouncing vs Throttling with real-world frontend use cases.',
            'Both are techniques to optimize performance and control the frequency of expensive function calls triggered by rapid events.\n\n1. Debouncing: Delays execution until a specified delay period has elapsed since the LAST time the event was triggered. If triggered again before the timer expires, the timer resets.\n- Use Case: Search auto-complete inputs, window resizing.\n\n2. Throttling: Enforces a maximum execution rate, ensuring the function executes at most once per specified time interval, regardless of how many times the event fires.\n- Use Case: Infinite scroll detection, mouse move tracking, throttle game loop rendering.',
            'Frequency regulation; timer reset vs fixed interval rate; debouncing for search inputs; throttling for scroll/resize performance.'
        ),

        # ==========================================
        # 3. DBMS (8 Questions)
        # ==========================================
        (
            'DBMS', 'Easy',
            'What are the differences between Primary Key, Unique Key, and Foreign Key?',
            '1. Primary Key: Uniquely identifies each record in a database table. It cannot accept NULL values, and each table can have only one primary key.\n2. Unique Key: Ensures all values in a column (or set of columns) are distinct. Unlike a primary key, it allows NULL values (one or more depending on RDBMS), and a table can have multiple unique constraints.\n3. Foreign Key: A column that establishes a link between data in two tables by referencing the primary key (or unique key) of another table, enforcing referential integrity.',
            'Primary key (uniqueness, non-null, 1 per table); Unique key (uniqueness, allows NULL, multiple allowed); Foreign key (referential integrity).'
        ),
        (
            'DBMS', 'Easy',
            'What are the differences between DELETE, TRUNCATE, and DROP in SQL?',
            '1. `DELETE`: DML (Data Manipulation Language) command. Removes rows based on a WHERE clause, can be rolled back if in a transaction, activates row-level triggers, and is slower because each row deletion is logged.\n2. `TRUNCATE`: DDL (Data Definition Language) command. Removes all rows by deallocating data pages, cannot be filtered with WHERE, resets identity counters, does not fire row triggers, and is substantially faster.\n3. `DROP`: DDL command. Completely deletes the entire table schema, definitions, indexes, and data from disk.',
            'DML vs DDL classification; transaction logging and rollback capability; WHERE filtering; schema removal (DROP) vs row clearing (TRUNCATE/DELETE).'
        ),
        (
            'DBMS', 'Medium',
            'What are ACID properties in database transactions?',
            'ACID properties guarantee that database transactions are processed reliably:\n1. Atomicity: "All or nothing". Either all operations in a transaction execute successfully, or the entire transaction rolls back.\n2. Consistency: Any transaction will bring the database from one valid state to another, maintaining all schema constraints, triggers, and foreign keys.\n3. Isolation: Concurrent execution of transactions yields the same state that would be obtained if they were executed sequentially.\n4. Durability: Once a transaction commits, its effects are permanent and will not be lost even in the event of a system crash or power failure.',
            'Atomicity (all or nothing rollback); Consistency (constraint integrity); Isolation (concurrency boundaries); Durability (write-ahead log / crash recovery).'
        ),
        (
            'DBMS', 'Medium',
            'Explain Database Normalization (1NF, 2NF, 3NF, BCNF) and why denormalization is used.',
            'Normalization is the process of organizing data in a database to reduce data redundancy and eliminate anomalies (insert, update, delete):\n- 1NF: Atomic column values; no repeating groups; unique rows.\n- 2NF: In 1NF + no partial dependency (all non-key attributes fully depend on the entire primary key).\n- 3NF: In 2NF + no transitive dependency (non-key attributes do not depend on other non-key attributes).\n- BCNF: Stricter 3NF where for every dependency X -> Y, X must be a super key.\n\nDenormalization intentionally introduces controlled redundancy into tables to optimize read query speeds and eliminate complex multi-table JOINs in analytical and high-throughput systems.',
            'Data redundancy reduction; 1NF atomic values; 2NF partial dependencies; 3NF transitive dependencies; BCNF superkey condition; read performance trade-off.'
        ),
        (
            'DBMS', 'Medium',
            'What are the differences between SQL (Relational) and NoSQL databases?',
            '1. Data Model: SQL uses structured relational tables with predefined schemas; NoSQL uses flexible dynamic models (Document, Key-Value, Columnar, Graph).\n2. Scalability: SQL databases typically scale vertically (upgrading server CPU/RAM); NoSQL databases are designed to scale horizontally across distributed clusters (sharding).\n3. Consistency vs Availability: SQL prioritizes ACID transactions and strong consistency; NoSQL often follows BASE (Basically Available, Soft-state, Eventual consistency) adhering to the CAP theorem.\n4. Query Language: SQL uses standardized SQL; NoSQL uses API-based queries (e.g. MongoDB JSON queries).',
            'Relational schema vs schemaless; vertical vs horizontal scaling (sharding); ACID vs BASE/CAP theorem; structured vs unstructured/JSON data.'
        ),
        (
            'DBMS', 'Medium',
            'Explain different types of SQL Joins with use cases.',
            '1. INNER JOIN: Returns only rows that have matching values in both tables.\n2. LEFT (OUTER) JOIN: Returns all rows from the left table and matched rows from the right table (NULL if no match).\n3. RIGHT (OUTER) JOIN: Returns all rows from the right table and matched rows from the left table.\n4. FULL (OUTER) JOIN: Returns all rows when there is a match in either the left or right table.\n5. CROSS JOIN: Produces the Cartesian product of rows from both tables.\n6. SELF JOIN: Joins a table to itself, useful for hierarchical structures like employee-manager relationships.',
            'Inner join intersection; Left outer join inclusion; Right outer join; Full outer join union; Cross join Cartesian product; Self join hierarchies.'
        ),
        (
            'DBMS', 'Hard',
            'What is the difference between Clustered and Non-Clustered Indexes?',
            '1. Clustered Index:\n- Dictates the physical disk order of rows in the table. Because physical rows can only be sorted in one order, a table can have only ONE clustered index (typically on the Primary Key).\n- The leaf nodes of the B-Tree contain the actual data rows.\n\n2. Non-Clustered Index:\n- Defined separately from the physical table data. A table can have MULTIPLE non-clustered indexes.\n- The leaf nodes contain index keys and row locators (pointers/bookmark) pointing to the physical data rows.\n- Lookups may require an additional index bookmark lookup unless it is a covering index.',
            'Physical storage ordering; one clustered index per table; leaf nodes hold actual data vs row pointers; covering index; lookup speed vs write overhead.'
        ),
        (
            'DBMS', 'Hard',
            'Explain Transaction Isolation Levels and Concurrency Anomalies.',
            'Concurrency anomalies occur when multiple transactions access the same data:\n1. Dirty Read: Reading uncommitted changes made by another transaction.\n2. Non-Repeatable Read: Reading a row, which is then updated by another transaction, yielding different values within the same transaction.\n3. Phantom Read: A transaction queries a range of rows, another transaction inserts rows matching that range, and re-querying yields phantom rows.\n\nIsolation Levels (from lowest to highest):\n- Read Uncommitted: Prone to all three anomalies.\n- Read Committed: Prevents dirty reads; prone to non-repeatable & phantom reads.\n- Repeatable Read: Prevents dirty & non-repeatable reads; prone to phantom reads (default in MySQL InnoDB).\n- Serializable: Prevents all anomalies by strictly locking or MVCC serialization.',
            'Dirty Read; Non-repeatable Read; Phantom Read; Read Uncommitted, Read Committed, Repeatable Read, Serializable; MVCC vs locking.'
        ),

        # ==========================================
        # 4. OOPS (8 Questions)
        # ==========================================
        (
            'OOPs', 'Easy',
            'Explain the 4 pillars of Object-Oriented Programming.',
            '1. Encapsulation: Bundling data (attributes) and methods that operate on that data into a single class, while restricting direct access to internal state using private/protected access modifiers.\n2. Abstraction: Concealing internal implementation details and exposing only the essential interface to the user.\n3. Inheritance: The mechanism where a new class (subclass) derives properties and behaviors from an existing class (superclass), promoting code reusability.\n4. Polymorphism: "Many forms". Allows entities such as methods to execute differently based on the object invoking them (via method overloading and method overriding).',
            'Encapsulation (data hiding); Abstraction (essential interface); Inheritance (code reuse); Polymorphism (dynamic method dispatch).'
        ),
        (
            'OOPs', 'Easy',
            'What is the difference between a Class and an Object? Explain Constructors.',
            'A Class is a blueprint or template that defines variables and methods common to all instances. It occupies no memory until instantiated.\n\nAn Object is a concrete instance of a class that holds actual values and occupies memory.\n\nA Constructor is a special method automatically invoked when an object is instantiated. Its primary role is to initialize object attributes and allocate resources. In C++/Java it shares the class name, while in Python it is `__init__`.',
            'Blueprint vs concrete instance; heap memory allocation; constructor lifecycle; default and parameterized constructors.'
        ),
        (
            'OOPs', 'Medium',
            'What is the difference between Method Overloading and Method Overriding?',
            '1. Method Overloading (Compile-Time / Static Polymorphism):\n- Methods in the same class share the same name but have different parameter lists (different number, types, or order of parameters).\n- Resolved at compile time based on method signatures.\n\n2. Method Overriding (Run-Time / Dynamic Polymorphism):\n- A subclass provides a specific implementation of a method that is already defined in its superclass, keeping the exact same name, return type, and parameters.\n- Resolved at runtime using dynamic method dispatch (vtable).',
            'Compile-time vs run-time polymorphism; parameter signature differences vs identical signature in subclass; method dispatch mechanism.'
        ),
        (
            'OOPs', 'Medium',
            'What is the difference between an Abstract Class and an Interface?',
            '1. Abstract Class:\n- Can contain both abstract methods (without body) and concrete methods (with implementation), instance variables, and constructors.\n- Represents an "is-a" relationship.\n- A class can inherit only one abstract class in single-inheritance languages like Java.\n\n2. Interface:\n- Defines a contract. Traditionally contains only abstract method signatures (or default methods in modern Java/C#).\n- Represents a capability or "can-do" relationship.\n- A class can implement multiple interfaces, allowing multiple inheritance of types.',
            'Partial implementation vs pure contract; instance state and constructors; single inheritance vs multiple interface implementation; "is-a" vs "can-do".'
        ),
        (
            'OOPs', 'Medium',
            'Explain Composition vs Inheritance. Why favor composition over inheritance?',
            'Inheritance models an "is-a" relationship (e.g., Dog is an Animal). Subclasses inherit parent methods, tightly coupling the child to the parent\'s internal implementation (white-box reuse).\n\nComposition models a "has-a" relationship (e.g., Car has an Engine). A class achieves functionality by referencing other component objects (black-box reuse).\n\nWhy favor composition:\n1. Loose coupling: Components can be swapped or mocked at runtime.\n2. Avoids fragile base class problem and class hierarchy explosion.\n3. Enables clean dependency injection and modular unit testing.',
            '"is-a" vs "has-a" relationship; loose coupling vs tight coupling; fragile base class problem; runtime flexibility and testability.'
        ),
        (
            'OOPs', 'Medium',
            'What is the Diamond Problem in multiple inheritance and how is it resolved?',
            'The Diamond Problem occurs in languages supporting multiple inheritance when class D inherits from both class B and class C, and both B and C inherit from a common base class A. If A defines a method that both B and C override, ambiguity arises: which version does D inherit?\n\nResolutions:\n- Java / C#: Prohibit multiple class inheritance; classes implement multiple interfaces instead.\n- C++: Solves it using Virtual Inheritance (`virtual public A`), ensuring only one shared instance of base class A exists.\n- Python: Solves it deterministically using the C3 Linearization Method Resolution Order (`MRO`).',
            'Multiple inheritance ambiguity; inheritance diamond structure; Java interface solution; C++ virtual inheritance; Python C3 MRO.'
        ),
        (
            'OOPs', 'Hard',
            'Explain the SOLID Principles in object-oriented software engineering.',
            '1. Single Responsibility Principle (S): A class should have one, and only one, reason to change.\n2. Open/Closed Principle (O): Software entities should be open for extension, but closed for modification.\n3. Liskov Substitution Principle (L): Subtypes must be substitutable for their base types without altering program correctness.\n4. Interface Segregation Principle (I): Clients should not be forced to depend on interfaces they do not use (prefer small, role-specific interfaces).\n5. Dependency Inversion Principle (D): High-level modules should not depend on low-level modules; both should depend on abstractions.',
            'Single Responsibility; Open/Closed; Liskov Substitution; Interface Segregation; Dependency Inversion; software maintainability and decoupling.'
        ),
        (
            'OOPs', 'Hard',
            'Explain Shallow Copy vs Deep Copy in OOP and the role of Copy Constructors.',
            'When cloning objects:\n1. Shallow Copy: Copies all immediate fields as-is. For primitive fields, values are duplicated; for reference fields (pointers, nested objects), only memory addresses are duplicated, meaning both original and copy point to the same underlying heap object.\n2. Deep Copy: Allocates new memory and recursively duplicates both the parent object and all referenced heap objects, ensuring zero shared state.\n\nCopy Constructor:\nA constructor in languages like C++ that initializes a new object using an existing object of the same class (`ClassName(const ClassName& other)`), allowing custom deep copy logic to prevent double-free errors on pointer destruction.',
            'Value vs pointer reference copying; shared heap state side effects; copy constructor implementation; double-free and dangling pointer prevention.'
        ),

        # ==========================================
        # 5. DATA SCIENCE (8 Questions)
        # ==========================================
        (
            'Data Science', 'Easy',
            'What are the core differences between Supervised, Unsupervised, and Reinforcement Learning?',
            '1. Supervised Learning: Trained on labeled data (inputs paired with ground-truth targets). Algorithms learn a mapping function from input features to output labels. Tasks: Regression (predicting continuous price) and Classification (predicting fraud/spam).\n2. Unsupervised Learning: Trained on unlabeled data. Algorithms discover underlying patterns, clusters, or distributions without target guidance. Tasks: Clustering (K-Means, DBSCAN) and Dimensionality Reduction (PCA).\n3. Reinforcement Learning: An agent interacts with an environment through trial and error, taking actions to maximize cumulative numerical rewards governed by a policy (Q-Learning, Policy Gradients).',
            'Labeled vs unlabeled vs reward feedback; Regression/Classification; Clustering/Dimensionality Reduction; Agent-environment reward optimization.'
        ),
        (
            'Data Science', 'Easy',
            'What is Overfitting and Underfitting, and how do you prevent them?',
            '1. Overfitting (High Variance): The model learns noise and specific idiosyncrasies in the training data, performing exceptionally on training data but failing to generalize to unseen test data.\n- Prevention: Regularization (L1 Lasso, L2 Ridge, Dropout), cross-validation, pruning decision trees, gathering more data, early stopping.\n\n2. Underfitting (High Bias): The model is too simple to capture the underlying relationships in the data, performing poorly on both training and test data.\n- Prevention: Increase model complexity, engineer more relevant features, reduce regularization strength.',
            'High variance (overfitting) vs high bias (underfitting); generalization error; L1/L2 regularization; cross-validation and early stopping.'
        ),
        (
            'Data Science', 'Medium',
            'What is the difference between Precision and Recall, and what is the F1-Score?',
            'In classification:\n- Precision = TP / (TP + FP): Proportion of predicted positives that were actually positive. Crucial when false positives are expensive (e.g., spam filter).\n- Recall (Sensitivity) = TP / (TP + FN): Proportion of actual positives identified correctly. Crucial when false negatives are critical (e.g., cancer diagnosis, fraud detection).\n- F1-Score = 2 * (Precision * Recall) / (Precision + Recall): Harmonic mean balancing precision and recall.\n\nUnder severe class imbalance (e.g., 99% non-fraud, 1% fraud), Accuracy is misleading (a naive model predicting all negatives achieves 99% accuracy). PR-AUC (Precision-Recall Curve) and F1-Score provide reliable evaluation.',
            'True Positives, False Positives, False Negatives; precision penalty vs recall penalty; harmonic mean F1-score; class imbalance metric selection.'
        ),
        (
            'Data Science', 'Medium',
            'What is the Bias-Variance Tradeoff in machine learning?',
            'Prediction error consists of three components: Bias^2 + Variance + Irreducible Error.\n\n1. Bias Error: Assumptions made by a model to make the target function easier to learn. High bias leads to underfitting.\n2. Variance Error: The amount by which the model\'s predictions fluctuate if trained on a different training dataset. High variance leads to overfitting.\n\nTradeoff:\nAs model complexity increases, bias decreases while variance increases. The goal is to find the sweet spot of model complexity that minimizes total generalization error on unseen data.',
            'Bias error (underfitting) vs variance error (overfitting); model complexity spectrum; total expected prediction error decomposition.'
        ),
        (
            'Data Science', 'Medium',
            'What are the differences between Bagging and Boosting ensemble methods?',
            '1. Bagging (Bootstrap Aggregating):\n- Trains multiple independent models (typically deep decision trees) in parallel on bootstrap subsets of data with replacement.\n- Combines predictions via majority voting (classification) or averaging (regression).\n- Primary goal: Reduces Variance without increasing bias (Example: Random Forest).\n\n2. Boosting:\n- Trains models sequentially. Each successive model focuses on correcting the errors/residuals made by previous weak learners.\n- Combines predictions via weighted voting.\n- Primary goal: Reduces Bias and variance (Examples: AdaBoost, Gradient Boosting, XGBoost, LightGBM).',
            'Parallel vs sequential model training; bootstrap sampling; variance reduction (Bagging) vs bias reduction (Boosting); Random Forest vs XGBoost.'
        ),
        (
            'Data Science', 'Medium',
            'Explain Feature Scaling: Normalization (Min-Max) vs Standardization (Z-score).',
            'Feature scaling ensures features contribute equally to model optimization.\n\n1. Normalization (Min-Max Scaling):\n- Rescales features to a fixed range, typically [0, 1]. Formula: `(X - X_min) / (X_max - X_min)`.\n- Highly sensitive to outliers.\n\n2. Standardization (Z-Score):\n- Centers values around a mean of 0 with a standard deviation of 1. Formula: `(X - mu) / sigma`.\n- Robust to outliers and preserves normal distributions.\n\nRequired by: Distance-based algorithms (KNN, K-Means), gradient-descent models (Linear/Logistic Regression, Neural Networks), and SVMs. Tree-based algorithms (Random Forest, Decision Trees) are invariant to scaling.',
            'Min-Max scaling [0,1] vs Z-score standardization (mean=0, std=1); gradient descent and distance metrics; tree-based scale invariance.'
        ),
        (
            'Data Science', 'Hard',
            'Explain the ROC Curve and AUC metric. Why is AUC invariant to classification thresholds?',
            '1. ROC Curve (Receiver Operating Characteristic):\n- Plots True Positive Rate (Sensitivity / Recall) on the Y-axis against False Positive Rate (1 - Specificity) on the X-axis across all possible classification probability thresholds from 0 to 1.\n\n2. AUC (Area Under Curve):\n- Represents the probability that a randomly chosen positive instance will be ranked higher by the model than a randomly chosen negative instance.\n- AUC ranges from 0.5 (random guessing) to 1.0 (perfect ranking).\n\nWhy it is threshold-invariant:\nInstead of evaluating at one arbitrary cutoff (like 0.5), AUC measures the global ranking capability of the model across the entire distribution of prediction confidences.',
            'TPR vs FPR plot; probability ranking interpretation; threshold invariance; comparison across varying operating points.'
        ),
        (
            'Data Science', 'Hard',
            'Explain Principal Component Analysis (PCA), Eigenvectors, and Eigenvalues.',
            'PCA is an unsupervised linear dimensionality reduction technique that transforms correlated features into a smaller set of orthogonal, uncorrelated variables called Principal Components, while maximizing variance retention.\n\nMathematical steps:\n1. Standardize the dataset (mean = 0, std = 1).\n2. Compute the Covariance Matrix of features.\n3. Compute Eigenvectors and Eigenvalues of the covariance matrix.\n- Eigenvectors represent the directions of the new orthogonal principal axes.\n- Eigenvalues represent the magnitude of variance captured along each corresponding eigenvector.\n4. Sort eigenvectors by eigenvalues in descending order and project data onto top K components.',
            'Dimensionality reduction; covariance matrix; eigenvectors (directions) and eigenvalues (variance magnitude); orthogonal projection.'
        ),

        # ==========================================
        # 6. HR & BEHAVIORAL (8 Questions)
        # ==========================================
        (
            'HR', 'Medium',
            'Tell me about yourself and your career goals in software engineering.',
            'Structure your answer using the "Present-Past-Future" framework in 90 seconds:\n\n1. Present: Start with your current education and core technical identity (e.g., "I am a final-year Computer Science student specializing in scalable web development and machine learning...").\n2. Past: Highlight 1-2 major technical achievements, hackathons, or impactful projects you engineered with measurable results.\n3. Future: Articulate why this specific company aligns with your ambition to build production-grade, customer-facing software systems.',
            'Present-Past-Future framework; concise 90-sec pitch; concrete technical metrics; clear company alignment.'
        ),
        (
            'HR', 'Easy',
            'What are your greatest technical strengths and what is one real area of improvement?',
            '1. Strengths: Pick strengths backed by examples (e.g., analytical debugging and rapid system ramp-up: "When learning Flask and REST architecture, I built an end-to-end placement intelligence portal in 2 weeks").\n\n2. Area of Improvement: Share a genuine, non-critical weakness and the proactive action you are taking to overcome it (e.g., "Earlier, I used to jump straight into coding before fully architecting data schemas. Recently, I adopted schema diagramming and write unit tests before implementation, which reduced my debugging cycle by 40%").',
            'Authentic strengths with evidence; honest non-fatal weakness; proactive corrective actions already underway.'
        ),
        (
            'HR', 'Medium',
            'Why do you want to join our organization specifically, and where do you see yourself in 3-5 years?',
            '1. Why this company: Demonstrate that you researched the organization\'s engineering culture, core products, or recent tech stack migrations. Connect your technical curiosity with their domain.\n\n2. 3-5 Year Vision: "In 3 years, I see myself as a dependable core software engineer who has taken ownership of mission-critical services, mentoring junior associates and contributing to system design decisions. In 5 years, I aim to lead architectural initiatives while remaining closely connected to hands-on engineering excellence."',
            'Genuine company research; alignment with engineering values; realistic 3-5 year growth path from contributor to technical mentor.'
        ),
        (
            'HR', 'Medium',
            'Describe a challenging project deadline or technical roadblock and how you handled it.',
            'Use the STAR method:\n- Situation: "During our final semester capstone project, our initial database architecture experienced severe query latency 3 days before our sprint demo."\n- Task: "As the backend lead, I had to optimize database performance without delaying sprint deliverables."\n- Action: "I profiled slow queries using SQLite EXPLAIN QUERY PLAN, added compound indexes on foreign keys, and implemented client-side state caching."\n- Result: "We reduced API response times from 1.8s to under 120ms and delivered the sprint demo seamlessly."',
            'STAR framework (Situation, Task, Action, Result); ownership under pressure; measurable performance outcome.'
        ),
        (
            'HR', 'Medium',
            'How do you handle conflict or disagreement with a teammate or team lead on a technical decision?',
            '1. Separate ego from engineering: Focus strictly on the technical problem and user requirements rather than personal pride.\n2. Active listening: Hear the teammate\'s perspective and understand their trade-offs (e.g., speed of delivery vs architectural purity).\n3. Data-driven consensus: Propose a quick spike, benchmark latency/memory benchmarks, or reference established industry design patterns.\n4. Disagree and Commit: Once the team or lead reaches a final decision, support it wholeheartedly to maintain velocity.',
            'Ego-free active listening; data and benchmark driven evaluation; collaborative compromise; disagree and commit principle.'
        ),
        (
            'HR', 'Medium',
            'Tell me about a time you made a mistake or failed in a project. What did you learn?',
            'Structure around accountability and systemic learning:\n1. Acknowledge ownership: "During an internship project, I committed code that broke the build because I hadn\'t run integration tests locally on different Python versions."\n2. Immediate remediation: "I immediately notified my tech lead, rolled back the commit, and fixed the compatibility issue within 30 minutes."\n3. Systemic prevention: "To prevent recurrence, I configured a pre-commit Git hook and added a GitHub Actions CI pipeline that runs automated linting and test suites before any branch merge."',
            'Unconditional accountability; prompt incident remediation; implementing systemic guardrails (CI/CD, pre-commit checks) to prevent recurrence.'
        ),
        (
            'HR', 'Hard',
            'Why should we hire you over other candidates with similar or higher academic GPAs?',
            '"While academic GPA is a commendable indicator of consistency, my competitive edge lies in practical execution and relentless problem-solving. Beyond coursework, I have engineered full-stack applications with authenticated databases, automated ATS resume intelligence, and live AI simulators.\n\nI combine strong computer science fundamentals (data structures, algorithms, system design) with the curiosity to debug production issues independently. I am ready to contribute from day one."',
            'Practical execution vs theoretical grades; portfolio evidence; full-stack problem solving maturity; day-one readiness.'
        ),
        (
            'HR', 'Hard',
            'Do you have any questions for us? (Strategic reverse-interview questions).',
            'Never say "No, everything was clear". Ask strategic questions that demonstrate high engineering engagement:\n\n1. "What does the typical onboarding ramp-up and initial 90-day milestone look like for an associate engineer joining this team?"\n2. "What is the biggest technical or scaling bottleneck your engineering team is actively solving this quarter?"\n3. "How does the engineering team balance shipping rapid product features with paying down technical debt?"',
            'Avoid mundane questions; ask high-level engineering culture, scaling challenges, and 90-day success metrics questions.'
        ),

        # ==========================================
        # 7. DATA STRUCTURES & ALGORITHMS (8 Questions)
        # ==========================================
        (
            'DSA', 'Easy',
            'Explain the Two Sum problem and compare the Brute Force vs Hash Map approach.',
            'Problem: Given an array of integers and a target sum, find indices of two numbers such that they add up to target.\n\n1. Brute Force (O(N^2) Time, O(1) Space): Nested loops compare every pair (i, j). If arr[i] + arr[j] == target, return indices. Inefficient for large arrays.\n\n2. Hash Map (O(N) Time, O(N) Space): Traverse array once. For each element X, compute complement = target - X. Check if complement exists in the Hash Map. If yes, return current index and hash_map[complement]. Otherwise, store hash_map[X] = current index. This reduces time from quadratic to linear by trading space.',
            'Complement calculation (target - X); Hash map O(1) average lookup; O(N) time vs O(N^2) brute force; space-time tradeoff.'
        ),
        (
            'DSA', 'Easy',
            'How do you detect a cycle in a singly linked list? Explain Floyd\'s Cycle-Finding Algorithm.',
            'Floyd\'s Cycle-Finding Algorithm (Tortoise and Hare):\n- Use two pointers: slow moving 1 step at a time, and fast moving 2 steps at a time, both starting at head.\n- If the linked list has no cycle, fast or fast.next reaches NULL.\n- If a cycle exists, fast enters the cycle and reduces the distance to slow by 1 node in each iteration, guaranteeing they collide inside the loop in O(N) time and O(1) auxiliary space.\n\nAlternative: Hash Set storing visited node addresses (O(N) time, O(N) space), but Floyd\'s uses optimal O(1) space.',
            'Two-pointer Tortoise & Hare; slow (1 step) vs fast (2 steps); O(N) time and O(1) space complexity; collision condition.'
        ),
        (
            'DSA', 'Medium',
            'How do you reverse a Singly Linked List iteratively and recursively?',
            '1. Iterative Approach (O(N) Time, O(1) Space):\nMaintain three pointers: prev = None, curr = head, and next_node = None. In a loop while curr is not null:\n- next_node = curr.next\n- curr.next = prev (reverse link)\n- prev = curr\n- curr = next_node\nWhen loop terminates, prev points to the new head.\n\n2. Recursive Approach (O(N) Time, O(N) Call Stack Space):\nBase case: if head is null or head.next is null, return head. Recursively reverse the rest: new_head = reverse(head.next). Set head.next.next = head and head.next = None. Return new_head.',
            'Three pointers (prev, curr, next_node); pointer reversal; O(N) time O(1) space; recursive base case and call stack overhead.'
        ),
        (
            'DSA', 'Medium',
            'How do you validate if a Binary Tree is a valid Binary Search Tree (BST)?',
            'A binary tree is a valid BST if for every node:\n- All nodes in its left subtree have values strictly LESS than the node value.\n- All nodes in its right subtree have values strictly GREATER than the node value.\n\nTechniques:\n1. Recursive Range Invariant (O(N) Time, O(H) Space): Pass acceptable range (min_val, max_val) initialized to (-inf, +inf). At each node, verify min_val < node.val < max_val. Recurse left with (min_val, node.val) and right with (node.val, max_val).\n\n2. Inorder Traversal (O(N) Time, O(H) Space): Inorder traversal of a BST yields values in strictly ascending sorted order. Track prev_val and verify curr.val > prev_val.',
            'Strict inequality invariant; subtree global bounds (min, max); recursive range checking; inorder traversal monotonic property.'
        ),
        (
            'DSA', 'Medium',
            'Explain Breadth-First Search (BFS) vs Depth-First Search (DFS) on graphs with use cases.',
            '1. Breadth-First Search (BFS):\n- Traverses graph level by level using a FIFO Queue.\n- Time: O(V + E), Space: O(V).\n- Use Case: Finding the shortest path in unweighted graphs, peer-to-peer networks, web crawlers.\n\n2. Depth-First Search (DFS):\n- Explores as deep as possible along each branch before backtracking using a LIFO Stack or Recursion.\n- Time: O(V + E), Space: O(V) for recursion stack.\n- Use Case: Topological sorting in DAGs, cycle detection, connected components, solving mazes/backtracking puzzles.',
            'FIFO Queue (BFS) vs LIFO Stack/Recursion (DFS); O(V + E) complexity; shortest path in unweighted graph (BFS); topological sort & cycle detection (DFS).'
        ),
        (
            'DSA', 'Medium',
            'What is the difference between Array, Hash Table, and Binary Search Tree in search performance?',
            '1. Unsorted Array: Search O(N) linear scan; Insertion O(1) at end.\n2. Sorted Array: Search O(log N) via Binary Search; Insertion O(N) due to shifting elements.\n3. Hash Table: Search O(1) average time via hash function; worst-case O(N) under severe hash collisions. Does not maintain sorted order.\n4. Balanced BST (AVL / Red-Black Tree): Search O(log N) guaranteed; Insertion & Deletion O(log N); supports ordered operations (floor, ceiling, range queries).',
            'Time complexities; array shifting vs binary search; hash collision degradation; balanced tree guarantees and range query capabilities.'
        ),
        (
            'DSA', 'Hard',
            'Explain the 0/1 Knapsack problem and how Dynamic Programming solves it.',
            'Problem: Given weights and values of N items and a knapsack of capacity W, find the maximum value that fits in the knapsack without dividing items.\n\nWhy Greedy fails: Greedy approach by value/weight ratio fails for 0/1 knapsack because taking a high-ratio item might leave unused capacity that prevents fitting a superior combination.\n\nDP Solution (O(N * W) Time, O(W) Space):\nDefine dp[w] as maximum value achievable with capacity w.\nFor each item with weight wt and value val:\n  Traverse w backwards from W down to wt:\n    dp[w] = max(dp[w], dp[w - wt] + val)\nReversing the inner loop prevents using the same item multiple times in 0/1 knapsack.',
            'Overlapping subproblems; optimal substructure; failure of greedy approach; DP 2D state vs 1D space-optimized recurrence.'
        ),
        (
            'DSA', 'Hard',
            'How do you design and implement an LRU (Least Recently Used) Cache with O(1) operations?',
            'An LRU Cache requires two data structures working in unison:\n1. Hash Map (Dictionary): Maps keys to Doubly Linked List node references for O(1) key lookups.\n2. Doubly Linked List (DLL): Tracks access recency with sentinel head (most recently used) and tail (least recently used) nodes.\n\nOperations:\n- get(key): If key in map, retrieve node, move it to head (MRU), return value. Else return -1.\n- put(key, value): If key exists, update value and move to head. If key is new: create node, insert at head, and add to map. If cache exceeds capacity: remove tail.prev node from DLL and delete its key from map.',
            'Doubly Linked List + Hash Map combination; O(1) get and put; sentinel head/tail nodes; eviction policy and node detachment.'
        ),

        # ==========================================
        # 8. OPERATING SYSTEMS (8 Questions)
        # ==========================================
        (
            'Operating Systems', 'Easy',
            'What is the difference between a Process and a Thread?',
            '1. Process: An executing instance of a program in its own independent virtual address space (code, data, heap, stack). Managed via a Process Control Block (PCB). High context-switching overhead; IPC required for inter-process communication.\n\n2. Thread: The smallest unit of CPU execution within a process ("lightweight process"). Threads share the parent process\'s address space, open files, and heap, but maintain their own Thread Control Block (TCB), program counter, and stack. Context-switching is fast; communication is direct via shared memory, requiring synchronization (locks/mutexes).',
            'Address space isolation (PCB) vs shared memory (TCB); stack per thread; context switch overhead; IPC vs shared memory synchronization.'
        ),
        (
            'Operating Systems', 'Easy',
            'What is a Deadlock and what are the 4 Coffman Conditions required for a deadlock to occur?',
            'A Deadlock is a situation where a set of processes are permanently blocked because each process holds resources and waits for resources held by others in the set.\n\nCoffman Conditions (all 4 must hold simultaneously):\n1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.\n2. Hold and Wait: A process holds at least one resource while waiting to acquire additional resources.\n3. No Preemption: Resources cannot be forcibly taken; they must be released voluntarily.\n4. Circular Wait: A closed loop chain of processes exists where P0 waits for P1, P1 waits for P2, ..., Pn waits for P0.',
            'Mutual Exclusion; Hold and Wait; No Preemption; Circular Wait; Resource Allocation Graph (RAG); Banker\'s algorithm.'
        ),
        (
            'Operating Systems', 'Medium',
            'Explain Virtual Memory, Paging, and Page Faults.',
            '1. Virtual Memory: An abstraction providing each process with an illusion of contiguous, dedicated physical memory larger than actual RAM, using disk space (swap/pagefile) as an overflow backing store.\n\n2. Paging: Memory management scheme that divides virtual memory into fixed-size blocks called Pages, and physical RAM into blocks of identical size called Page Frames.\n- Memory Management Unit (MMU) translates virtual addresses to physical addresses using Page Tables and a hardware cache called Translation Lookaside Buffer (TLB).\n\n3. Page Fault: A hardware interrupt raised when a program accesses a virtual page whose valid bit in the page table is 0 (not loaded in RAM). The OS fetches the required page from disk into a free frame.',
            'Virtual address translation; MMU and TLB cache; Page vs Page Frame; Page fault interrupt; Demand paging.'
        ),
        (
            'Operating Systems', 'Medium',
            'What are CPU Scheduling Algorithms? Compare FCFS, SJF, and Round Robin.',
            'CPU Scheduling decides which ready process receives the CPU core:\n1. First-Come, First-Served (FCFS): Non-preemptive. Simple FIFO queue. Suffers from the "Convoy Effect" where short processes wait behind long CPU-burst processes.\n2. Shortest Job First (SJF): Non-preemptive or preemptive (SRTF). Provably optimal minimum average waiting time, but suffers from starvation of long processes and requires future CPU burst prediction.\n3. Round Robin (RR): Preemptive. Assigns a fixed Time Quantum to each process cyclically. Ideal for time-sharing systems. If quantum is too large, it degenerates into FCFS; if too small, context-switch overhead dominates.',
            'FCFS convoy effect; SJF optimal waiting time & starvation risk; Round Robin time quantum tuning; preemptive vs non-preemptive.'
        ),
        (
            'Operating Systems', 'Medium',
            'Explain Mutex vs Semaphore and the Critical Section Problem.',
            'The Critical Section is a segment of code where shared resources (memory, files) are accessed, which must not be executed concurrently by multiple threads.\n\n1. Mutex (Mutual Exclusion Object):\n- Locking mechanism with ownership. Only the thread that locks the mutex can unlock it. State is binary (0 or 1). Suitable for serializing access to a single shared object.\n\n2. Semaphore:\n- Signaling mechanism based on an integer counter with wait() (P) and signal() (V) atomic operations. Has no concept of ownership (one thread can increment while another decrements).\n- Binary Semaphore: Value 0 or 1.\n- Counting Semaphore: Value N, used to throttle access to a pool of N identical resources (e.g., connection pool).',
            'Critical section problem; Mutex ownership vs Semaphore signaling; Counting semaphore resource throttling; atomic wait/signal operations.'
        ),
        (
            'Operating Systems', 'Medium',
            'What are Inter-Process Communication (IPC) mechanisms in modern operating systems?',
            'Because processes have isolated address spaces, the OS provides IPC channels:\n1. Pipes & Named Pipes (FIFOs): Half-duplex or full-duplex byte streams between related (or unrelated via FIFO) processes.\n2. Shared Memory: Fastest IPC method. OS maps a common memory segment into the address spaces of multiple processes. Processes read/write directly, requiring semaphores to prevent race conditions.\n3. Message Queues: Linked lists of formatted messages stored in OS kernel space.\n4. Sockets: Bidirectional network endpoints enabling communication between processes on the same machine or across networks.\n5. Signals: Asynchronous software notifications (e.g., SIGINT, SIGKILL, SIGSEGV).',
            'Pipes/FIFOs; Shared Memory (fastest, zero-copy); Message Queues; Sockets (network-capable); Signals (asynchronous interrupts).'
        ),
        (
            'Operating Systems', 'Hard',
            'What is Thrashing in Operating Systems, and how does the Working Set Model prevent it?',
            'Thrashing occurs when a computer\'s CPU spends more time swapping pages into and out of RAM to/from disk than executing actual instructions. It happens when total memory demands of active processes exceed available physical RAM, causing continuous page faults.\n\nWorking Set Model (Peter Denning):\n- Defines the Working Set W(t, delta) of a process as the set of pages referenced by the process during the most recent delta time window.\n- If the sum of working sets of all active processes exceeds physical RAM, the OS suspends one or more entire processes (swapping them out to disk) to allocate adequate frames to remaining processes until thrashing stops.',
            'High page fault frequency; CPU utilization collapse; Working Set Model window (delta); process suspension and degree of multiprogramming control.'
        ),
        (
            'Operating Systems', 'Hard',
            'Explain User Space vs Kernel Space, Context Switching, and System Calls.',
            'Modern CPUs enforce hardware protection rings (Ring 0 = Kernel Space, Ring 3 = User Space):\n1. User Space: Where user applications run with restricted privileges, unable to directly access hardware or arbitrary physical memory.\n2. Kernel Space: Where the OS core, device drivers, and kernel data structures run with full hardware privileges.\n\nSystem Calls:\nWhen an application requires hardware services (e.g., read(), write(), fork(), socket()), it issues a software interrupt or CPU trap instruction (syscall/sysenter). The CPU switches execution privilege from Ring 3 to Ring 0, saves process registers, executes the kernel service routine, and returns to user space.\n\nContext Switch Overhead:\nSaves CPU registers, program counter, and stack pointer; flushes or invalidates TLB page table caches; updates process state in PCB.',
            'Ring 0 vs Ring 3 privileges; software trap / syscall interface; saving and restoring registers; TLB cache invalidation overhead.'
        ),

        # ==========================================
        # 9. SYSTEM DESIGN (8 Questions)
        # ==========================================
        (
            'System Design', 'Easy',
            'What is the difference between Horizontal Scaling and Vertical Scaling?',
            '1. Vertical Scaling (Scale Up):\n- Adding more resources (CPU cores, RAM, SSD storage) to an existing single server.\n- Pros: Simple architecture, zero network latency between services, no distributed data consistency issues.\n- Cons: Hard hardware ceiling, expensive high-end servers, single point of failure (SPOF), downtime required for upgrades.\n\n2. Horizontal Scaling (Scale Out):\n- Adding more commodity servers to a distributed pool coordinated by a Load Balancer.\n- Pros: Theoretically infinite scaling, high availability and fault tolerance (if one server crashes, others absorb traffic).\n- Cons: Architectural complexity, requires load balancers, stateless application design, distributed caching, and eventual consistency challenges.',
            'Scale Up vs Scale Out; Single Point of Failure (SPOF); hardware ceilings; Load balancer requirements; stateless application architecture.'
        ),
        (
            'System Design', 'Easy',
            'Compare Monolithic Architecture vs Microservices Architecture.',
            '1. Monolithic Architecture:\n- Entire application (UI, business logic, data access) is built and deployed as a single unified executable codebase.\n- Pros: Simple development, straightforward testing, fast local function calls, atomic database transactions.\n- Cons: Deployment bottlenecks (any bug can crash whole system), difficult to scale individual components, tight coupling.\n\n2. Microservices Architecture:\n- Decomposes the application into a collection of small, loosely coupled, autonomous services organized around business domains.\n- Each service communicates via lightweight network protocols (REST, gRPC, Message Queues) and typically owns its private database.\n- Pros: Independent deployment, polyglot technology stack, horizontal scaling per service, isolated fault domains.\n- Cons: Network latency, distributed tracing complexity, complex distributed transactions (Saga pattern), operational overhead.',
            'Single deployment unit vs autonomous services; database-per-service pattern; network latency; fault isolation; Saga pattern for distributed transactions.'
        ),
        (
            'System Design', 'Medium',
            'Explain Load Balancing Strategies: Layer 4 vs Layer 7 and common load balancing algorithms.',
            'Load Balancers distribute incoming traffic across multiple backend servers:\n\n1. Layer 4 (Transport Layer) Balancing:\n- Directs traffic based on IP address and TCP/UDP ports without inspecting application payload. Very fast, low CPU overhead, protocol agnostic.\n\n2. Layer 7 (Application Layer) Balancing:\n- Inspects HTTP headers, cookies, URL paths, and query parameters. Enables intelligent routing (e.g., routing /api/video to streaming servers and /api/auth to auth servers), SSL termination, and cookie-based sticky sessions.\n\nAlgorithms:\n- Round Robin: Sequentially distributes requests.\n- Least Connections: Routes to server with fewest active connections.\n- IP Hash: Hashes client IP to ensure same client hits same server.\n- Weighted Round Robin: Distributes proportionally to server CPU/RAM capacities.',
            'Layer 4 (IP/port) vs Layer 7 (HTTP header/path); SSL termination; Round Robin, Least Connections, IP Hash; reverse proxies (Nginx, HAProxy).'
        ),
        (
            'System Design', 'Medium',
            'Explain Caching Strategies: Cache-Aside, Write-Through, and Write-Back.',
            'Caching stores frequently accessed data in fast in-memory stores (Redis, Memcached):\n\n1. Cache-Aside (Lazy Loading):\n- Application checks cache first. On cache hit, returns data. On cache miss, reads from database, writes data into cache, and returns it.\n- Pros: Cache contains only requested data; resilient to cache node failures.\n- Cons: Cache miss penalty on first request; stale data risk if DB updated directly.\n\n2. Write-Through:\n- Application writes to cache, and cache synchronously writes to the database before confirming success.\n- Pros: Data in cache is never stale; read hits are fast.\n- Cons: Higher write latency because every write hits both cache and database.\n\n3. Write-Back (Write-Behind):\n- Application writes only to cache immediately, and cache asynchronously flushes batched writes to database in the background.\n- Pros: Ultra-fast write speeds; reduces database write IOPS.\n- Cons: Risk of permanent data loss if cache crashes before flushing to disk.',
            'Cache-Aside (read-through miss); Write-Through synchronous consistency; Write-Back asynchronous flushing; TTL eviction and cache stampede.'
        ),
        (
            'System Design', 'Medium',
            'Explain Database Sharding vs Database Replication.',
            '1. Database Replication (Read Scaling & Redundancy):\n- Copies identical database data from a primary (master) node to one or more replica (slave) nodes.\n- All write queries (INSERT, UPDATE, DELETE) go to the primary node; read queries (SELECT) are distributed across read replicas.\n- Handles read-heavy workloads and failover, but does not solve write-heavy bottlenecks or storage limits.\n\n2. Database Sharding (Horizontal Partitioning):\n- Splits a large database horizontally across multiple independent database servers based on a Shard Key (e.g., user_id % num_shards or range-based).\n- Each shard holds a unique subset of total rows.\n- Solves write bottlenecks and storage limits, but introduces complexities: cross-shard JOINs, distributed transactions, and re-sharding.',
            'Master-slave replication; read scalability; Sharding key selection; horizontal partitioning; cross-shard joins and rebalancing complexity.'
        ),
        (
            'System Design', 'Medium',
            'Explain Rate Limiting Algorithms: Token Bucket vs Leaky Bucket vs Sliding Window.',
            'Rate Limiting protects backend services from abuse, DDoS, and cascading failures:\n\n1. Token Bucket:\n- A bucket with capacity B holds tokens added at a constant rate R per second. Each request consumes 1 token. If bucket has tokens, request is allowed; if empty, request is rejected (HTTP 429). Allows sudden traffic bursts up to capacity B.\n\n2. Leaky Bucket:\n- Requests enter a FIFO queue of capacity B. Requests are processed and leaked at a constant, smooth rate R. If queue overflows, new requests drop. Smooths traffic and eliminates bursts.\n\n3. Sliding Window Log / Counter:\n- Tracks timestamps or weighted sub-window counters over the recent sliding interval (e.g., last 60 seconds). Accurately prevents boundary burst anomalies present in Fixed Window counters.',
            'Token Bucket (burst tolerance); Leaky Bucket (smooth constant output); Sliding Window Counter (accurate boundary handling); HTTP 429 Too Many Requests.'
        ),
        (
            'System Design', 'Hard',
            'Explain the CAP Theorem and PACELC in Distributed Systems.',
            'CAP Theorem (Eric Brewer):\nIn a distributed asynchronous network, you can guarantee at most TWO out of three properties:\n1. Consistency (C): Every read receives the most recent write or an error.\n2. Availability (A): Every non-failing node returns a non-error response, without guarantee that it contains the most recent write.\n3. Partition Tolerance (P): The system continues to operate despite arbitrary network message loss or delays.\nBecause network partitions (P) are inevitable in physical distributed networks, systems must choose between CP (e.g., HBase, Zookeeper) or AP (e.g., Cassandra, DynamoDB).\n\nPACELC Theorem Extension:\nIf there is a Partition (P), trade off Availability (A) vs Consistency (C); Else (E), trade off Latency (L) vs Consistency (C). Explains normal operation trade-offs.',
            'Consistency vs Availability during Partition; CP systems vs AP systems; Eventual consistency; PACELC extension for normal latency trade-offs.'
        ),
        (
            'System Design', 'Hard',
            'Explain Message Queues and Event-Driven Architecture: Kafka vs RabbitMQ.',
            'Message Queues decouple producers from consumers, buffering spikes and enabling asynchronous processing:\n\n1. RabbitMQ (AMQP Message Broker):\n- Smart broker, dumb consumer model. Routes messages via Exchanges (Direct, Fanout, Topic) into in-memory FIFO Queues.\n- Messages are deleted from the queue once acknowledged by consumers. Ideal for transactional, complex routing, task-queue workloads (Celery).\n\n2. Apache Kafka (Distributed Event Streaming Platform):\n- Dumb broker, smart consumer model. Organizes messages into partitioned, append-only, immutable commit logs on disk.\n- Messages persist for a configurable retention window (e.g., 7 days) regardless of consumption.\n- Consumers track their own read pointer (offset), allowing replayability and massive horizontal throughput for real-time analytics and event sourcing.',
            'Point-to-point queue vs distributed commit log; message acknowledgment vs persistent log retention; Kafka partition offset; RabbitMQ AMQP exchanges.'
        ),

        # ==========================================
        # 10. COMPUTER NETWORKS (8 Questions)
        # ==========================================
        (
            'Computer Networks', 'Easy',
            'Explain the OSI 7-Layer Model and the protocols operating at each layer.',
            'The OSI (Open Systems Interconnection) reference model standardizes network communication:\n1. Physical Layer: Transmits raw bit streams over physical medium (cables, fiber, RF). Protocols: Ethernet physical specs, RS-232.\n2. Data Link Layer: Node-to-node framing, MAC addressing, error detection (CRC). Protocols: Ethernet 802.3, Wi-Fi 802.11, ARP.\n3. Network Layer: Logical packet routing and host-to-host addressing across networks. Protocols: IPv4, IPv6, ICMP, OSPF, BGP.\n4. Transport Layer: End-to-end process-to-process communication, segmentation, flow/error control. Protocols: TCP, UDP.\n5. Session Layer: Establishes, manages, and terminates presentation sessions. Protocols: RPC, NetBIOS.\n6. Presentation Layer: Data format translation, character encoding, encryption, compression. Protocols: SSL/TLS, JPEG, JSON.\n7. Application Layer: High-level network services directly facing user software. Protocols: HTTP/HTTPS, DNS, FTP, SMTP, SSH.',
            '7 OSI layers mnemonic; PDU types (Bits, Frames, Packets, Segments, Data); MAC vs IP addressing; protocols per layer.'
        ),
        (
            'Computer Networks', 'Easy',
            'Compare TCP vs UDP with real-world application examples.',
            '1. TCP (Transmission Control Protocol):\n- Connection-Oriented: Establishes connection via 3-way handshake before transmitting data.\n- Reliable: Guarantees delivery via acknowledgments (ACKs) and retransmission of lost packets.\n- Ordered Delivery: Sequences packets so receiver reassembles them in exact sender order.\n- Flow & Congestion Control: Regulates transmission speed to prevent overwhelming receiver or network.\n- Use Cases: Web browsing (HTTP/HTTPS), file transfer (FTP), email (SMTP), SSH.\n\n2. UDP (User Datagram Protocol):\n- Connectionless: Sends datagrams without prior handshake.\n- Unreliable: No ACKs, no retransmission; best-effort delivery.\n- Low Overhead & Fast: Lightweight 8-byte header (compared to TCP\'s 20-60 bytes).\n- Use Cases: Live video/voice streaming (VoIP, WebRTC), online multiplayer gaming, DNS queries, DHCP.',
            'Connection-oriented vs connectionless; ACK retransmission; ordered vs out-of-order; 20-byte TCP header vs 8-byte UDP header; latency vs reliability.'
        ),
        (
            'Computer Networks', 'Medium',
            'Explain the TCP 3-Way Handshake and 4-Way Connection Teardown.',
            '1. TCP 3-Way Handshake (Connection Establishment):\n- Step 1 (SYN): Client picks random initial sequence number x and sends [SYN, seq=x] to server.\n- Step 2 (SYN-ACK): Server receives SYN, allocates buffers, picks sequence number y, and replies with [SYN-ACK, seq=y, ack=x+1].\n- Step 3 (ACK): Client receives SYN-ACK and responds with [ACK, ack=y+1, seq=x+1]. Connection is now ESTABLISHED.\n\n2. 4-Way Teardown (Connection Termination):\n- Step 1 (FIN): Client finishes sending data and sends [FIN] to server.\n- Step 2 (ACK): Server receives FIN, sends [ACK], enters CLOSE_WAIT state. Client enters FIN_WAIT_2.\n- Step 3 (FIN): Server finishes pending transmissions and sends its own [FIN].\n- Step 4 (ACK): Client responds with [ACK] and enters TIME_WAIT state (typically 2 * Maximum Segment Lifetime) before closing, ensuring final ACK is received.',
            'SYN, SYN-ACK, ACK sequence numbers; half-duplex close; TIME_WAIT state and 2MSL protection; connection termination steps.'
        ),
        (
            'Computer Networks', 'Medium',
            'What happens when you type "https://www.google.com" in a browser and press Enter?',
            'Step-by-step lifecycle:\n1. URL Parsing: Browser extracts protocol (HTTPS), domain (www.google.com), and default port (443).\n2. DNS Lookup: Checks Browser Cache -> OS Cache -> Router Cache -> ISP Resolver -> Root -> TLD -> Authoritative nameserver to resolve IP address.\n3. TCP Connection: Browser initiates TCP 3-way handshake with Google server on port 443.\n4. TLS Handshake: Client and server negotiate cipher suites, verify Google\'s SSL certificate via Root CA, and establish symmetric session keys.\n5. HTTP Request: Browser sends encrypted GET / HTTP/1.1 request with headers.\n6. Server Response: Google server processes request, queries backends, and returns HTTP 200 OK with HTML payload.\n7. Browser Rendering: Browser engine parses HTML (DOM tree), CSS (CSSOM tree), executes JavaScript, and paints the page.',
            'DNS resolution hierarchy; TCP 3-way handshake; TLS cryptographic handshake; HTTP request-response cycle; critical rendering path (DOM/CSSOM).'
        ),
        (
            'Computer Networks', 'Medium',
            'Explain HTTP vs HTTPS and how the SSL/TLS Handshake works.',
            '1. Difference:\n- HTTP (Port 80) transmits plaintext over TCP, susceptible to eavesdropping, packet sniffing, and Man-in-the-Middle (MITM) attacks.\n- HTTPS (Port 443) layers HTTP over TLS (Transport Layer Security), providing Confidentiality (encryption), Integrity (message authentication codes), and Authentication (digital certificates).\n\n2. TLS 1.2/1.3 Handshake:\n- Client Hello: Sends supported TLS version, cipher suites, and a random number (Client Random).\n- Server Hello: Picks cipher suite, sends Server Random, and presents its X.509 Digital Certificate.\n- Certificate Verification: Browser validates the certificate against built-in Trusted Root Certificate Authorities (CAs).\n- Key Exchange: Client and server exchange Diffie-Hellman parameters or pre-master secret to independently derive identical Symmetric Session Keys.\n- Finished: Future HTTP messages are encrypted with symmetric keys (e.g., AES-GCM) for high-speed security.',
            'Port 80 vs 443; CIA triad; asymmetric encryption (handshake key exchange) vs symmetric encryption (bulk data transfer); CA validation.'
        ),
        (
            'Computer Networks', 'Medium',
            'Explain DNS (Domain Name System) Architecture: Recursive vs Iterative resolution.',
            'DNS is the hierarchical, distributed database translating human-readable domain names into machine-routable IP addresses:\n\n1. Hierarchy:\n- Root Nameservers (13 named root authority clusters worldwide).\n- Top-Level Domain (TLD) Nameservers (.com, .org, .in).\n- Authoritative Nameservers (managed by DNS hosts like Cloudflare, Route53 containing actual zone files).\n\n2. Query Types:\n- Recursive Query: Client asks the local ISP/DNS Resolver (e.g., 8.8.8.8) to return the final answer. The resolver assumes full responsibility for discovering the IP.\n- Iterative Query: The resolver queries the Root nameserver (which refers it to the TLD nameserver), then queries the TLD nameserver (which refers it to the Authoritative nameserver), and finally queries the Authoritative nameserver for the A/AAAA record.',
            'DNS hierarchy (Root, TLD, Authoritative); Recursive resolver vs iterative referrals; DNS caching and TTL; A, AAAA, CNAME, MX records.'
        ),
        (
            'Computer Networks', 'Hard',
            'Compare REST APIs vs WebSockets vs gRPC.',
            '1. REST (Representational State Transfer):\n- Protocol: HTTP/1.1 or HTTP/2.\n- Communication: Stateless request-response cycle. Each request requires new TCP/TLS overhead unless keep-alive connection is maintained. Data payload typically JSON.\n- Best for: Public APIs, CRUD web services, standard microservice communication.\n\n2. WebSockets:\n- Protocol: WS/WSS operating over a single persistent TCP socket connection initiated via an HTTP 101 Upgrade header.\n- Communication: Full-duplex bidirectional streaming. Both client and server can send messages at any time with minimal 2-byte frame overhead.\n- Best for: Real-time chat apps, live stock tickers, multiplayer gaming, collaborative documents.\n\n3. gRPC (Google Remote Procedure Call):\n- Protocol: HTTP/2 transport with Protocol Buffers (Protobuf) binary serialization.\n- Communication: Multiplexed bidirectional streaming, strictly typed schema definitions (.proto), high performance.\n- Best for: Low-latency inter-service microservice communication in distributed backends.',
            'Request-response vs full-duplex persistent vs HTTP/2 multiplexing; JSON vs Protocol Buffers binary format; REST vs WebSockets vs gRPC use cases.'
        ),
        (
            'Computer Networks', 'Hard',
            'Explain Network Address Translation (NAT) and IPv4 vs IPv6.',
            '1. IPv4 vs IPv6:\n- IPv4: 32-bit addresses (~4.3 billion unique IPs), represented in dotted-decimal notation (192.168.1.1). Exhausted globally.\n- IPv6: 128-bit addresses (~3.4 * 10^38 unique IPs), represented in hexadecimal notation (2001:0db8:85a3::8a2e:0370:7334). Built-in IPsec, auto-configuration (SLAAC), and no need for NAT.\n\n2. Network Address Translation (NAT / PAT):\n- Technique where a network router modifies network address information in IP packet headers while in transit across a traffic routing device.\n- Port Address Translation (PAT / NAT Overload): Maps thousands of private local IP addresses (e.g., RFC 1918 192.168.x.x, 10.x.x.x) to a single public IP address using unique source port numbers in a NAT Translation Table.\n- Conserves scarce public IPv4 addresses and provides basic inbound security.',
            '32-bit vs 128-bit addressing; RFC 1918 private IP ranges; Port Address Translation (PAT); NAT translation table; IPv6 header simplification.'
        )
    ]
    for q in sample_interviews:
        cursor.execute('''
            INSERT OR IGNORE INTO interview_questions (category, difficulty, question, model_answer, key_points)
            VALUES (?, ?, ?, ?, ?)
        ''', q)

    # Seed sample user skills, jobs, and badges for demo student
    cursor.execute("SELECT id FROM users WHERE username = 'student'")
    student = cursor.fetchone()
    if student:
        user_id = student['id']

        # Skills
        cursor.execute("SELECT COUNT(*) FROM skills WHERE user_id = ?", (user_id,))
        if cursor.fetchone()[0] == 0:
            sample_skills = [
                (user_id, 'Python', 'Programming', 90, 'Mastered'),
                (user_id, 'Data Structures & Algorithms', 'Core CS', 80, 'Proficient'),
                (user_id, 'Flask & REST APIs', 'Backend', 85, 'Mastered'),
                (user_id, 'SQL & Relational DBs', 'Databases', 75, 'Proficient'),
                (user_id, 'Machine Learning & NLP', 'AI/DS', 82, 'Mastered'),
                (user_id, 'JavaScript & DOM', 'Frontend', 70, 'Proficient'),
                (user_id, 'Git & Version Control', 'Tools', 88, 'Mastered')
            ]
            cursor.executemany('''
                INSERT INTO skills (user_id, skill_name, category, proficiency, status)
                VALUES (?, ?, ?, ?, ?)
            ''', sample_skills)

        # Job Applications
        cursor.execute("SELECT COUNT(*) FROM job_applications WHERE user_id = ?", (user_id,))
        if cursor.fetchone()[0] == 0:
            sample_apps = [
                (user_id, 'Google', 'Software Engineer (L3)', 'Bengaluru', 28.0, '2026-09-15', 'Screening', 'Applied through campus placement drive. Coding test cleared.'),
                (user_id, 'Microsoft', 'Associate AI Engineer', 'Hyderabad', 24.5, '2026-09-22', 'Interview', 'Technical Interview scheduled for next Monday.'),
                (user_id, 'Amazon', 'SDE 1', 'Bengaluru', 26.0, '2026-09-10', 'Applied', 'Online Assessment link completed.'),
                (user_id, 'Razorpay', 'Backend Developer', 'Bengaluru / Remote', 18.0, '2026-09-28', 'Offer', 'Offer Letter received! 18 LPA CTC.'),
                (user_id, 'TCS Digital', 'Systems Engineer', 'Pan-India', 7.5, '2026-08-30', 'Offer', 'Campus selection cleared.')
            ]
            cursor.executemany('''
                INSERT INTO job_applications (user_id, company, role, location, salary_lpa, apply_date, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', sample_apps)

        # Roadmap
        cursor.execute("SELECT COUNT(*) FROM roadmaps WHERE user_id = ?", (user_id,))
        if cursor.fetchone()[0] == 0:
            completed_steps = ["Python Core Fundamentals", "Arrays, Trees & Graphs", "SQL Query Optimization"]
            cursor.execute('''
                INSERT INTO roadmaps (user_id, career_role, completed_steps_json, current_milestone, progress_pct)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, 'AI/ML Engineer', json.dumps(completed_steps), 'Supervised Learning & NLP Models', 60))

        # Badges
        cursor.execute("SELECT COUNT(*) FROM badges WHERE user_id = ?", (user_id,))
        if cursor.fetchone()[0] == 0:
            sample_badges = [
                (user_id, 'aptitude_star', 'Aptitude Ace', 'Scored > 80% on timed aptitude tests', 'fa-bolt'),
                (user_id, 'resume_ready', 'ATS Champion', 'Generated an ATS score above 85%', 'fa-file-shield'),
                (user_id, 'skill_polyglot', 'Tech Explorer', 'Logged 5+ verified technical proficiencies', 'fa-code'),
                (user_id, 'mock_master', 'Assessment Pro', 'Completed a Technical Assessment evaluation', 'fa-brain')
            ]
            cursor.executemany('''
                INSERT OR IGNORE INTO badges (user_id, badge_key, badge_name, badge_desc, badge_icon)
                VALUES (?, ?, ?, ?, ?)
            ''', sample_badges)

        # Aptitude Score
        cursor.execute("SELECT COUNT(*) FROM aptitude_scores WHERE user_id = ?", (user_id,))
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                INSERT INTO aptitude_scores (user_id, category, score, total_questions, accuracy_pct, time_spent_sec)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, 'Quantitative', 5, 6, 83.3, 190))
            cursor.execute('''
                INSERT INTO aptitude_scores (user_id, category, score, total_questions, accuracy_pct, time_spent_sec)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, 'Logical', 5, 5, 100.0, 145))

        # Technical Assessment Score
        cursor.execute("SELECT COUNT(*) FROM interview_scores WHERE user_id = ?", (user_id,))
        if cursor.fetchone()[0] == 0:
            feedback_json = json.dumps([
                {"question": "Explain shallow copy vs deep copy", "score": 9.0, "feedback": "Accurate distinction regarding nested objects and memory references."},
                {"question": "What is Python GIL?", "score": 8.5, "feedback": "Well articulated explanation of CPython mutex and multiprocessing."}
            ])
            cursor.execute('''
                INSERT INTO interview_scores (user_id, role_tested, question_count, overall_score, feedback, answers_json)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, 'AI/ML Engineer', 2, 8.75, 'Outstanding technical knowledge and crisp articulation.', feedback_json))

    # Seed 3 additional students for placement tracking
    extra_students = [
        {
            'username': 'priya_sharma',
            'email': 'priya.sharma@careerx.ai',
            'full_name': 'Priya Sharma',
            'college': 'Anna University, Chennai',
            'branch': 'Computer Science & Engineering',
            'grad_year': 2026,
            'target_role': 'Full Stack Developer',
            'bio': 'Passionate Full Stack engineer with expertise in React, Django, REST APIs, and Cloud architecture.',
            'skills': [
                ('React & Redux', 'Frontend', 92, 'Mastered'),
                ('Python & Django', 'Backend', 88, 'Mastered'),
                ('PostgreSQL & Redis', 'Databases', 82, 'Mastered'),
                ('Docker & CI/CD', 'DevOps', 78, 'Proficient'),
                ('Data Structures & Algorithms', 'Core CS', 85, 'Mastered'),
                ('TypeScript', 'Frontend', 80, 'Proficient')
            ],
            'apps': [
                ('Google', 'Software Engineer (L3)', 'Bengaluru', 28.5, '2026-09-18', 'Interview', 'Technical Interview Round 2 scheduled.'),
                ('Atlassian', 'Full Stack Engineer', 'Bengaluru', 24.0, '2026-09-25', 'Screening', 'Resume and assessment shortlisted.'),
                ('Zoho', 'Member Technical Staff', 'Chennai', 12.0, '2026-10-02', 'Offer', 'Offer letter received! CTC 12 LPA.')
            ],
            'aptitude': [
                ('Quantitative', 5, 6, 83.3, 180),
                ('Logical', 9, 10, 90.0, 240),
                ('Verbal', 5, 5, 100.0, 110)
            ],
            'ats': ('Full Stack Developer', 89, 'Python, React, Django, Docker, PostgreSQL, REST APIs', 'GraphQL, Kubernetes', 'High quality technical resume with quantifiable project impact.'),
            'badges': [
                ('aptitude_star', 'Aptitude Ace', 'Scored > 80% on timed aptitude tests', 'fa-bolt'),
                ('resume_ready', 'ATS Champion', 'Generated an ATS score above 85%', 'fa-file-shield'),
                ('first_app', 'Job Hunter', 'Logged your first job application', 'fa-paper-plane'),
                ('offer_received', 'Placement Legend', 'Secured a job offer!', 'fa-champagne-glasses'),
                ('skill_polyglot', 'Tech Explorer', 'Logged 5+ verified technical proficiencies', 'fa-code')
            ],
            'roadmap': ('Full Stack Developer', json.dumps(['Frontend Architecture with React', 'Backend Microservices with Python', 'Database Scaling & Redis Caching']), 'Cloud Deployment with AWS & Docker', 75)
        },
        {
            'username': 'rohan_verma',
            'email': 'rohan.verma@careerx.ai',
            'full_name': 'Rohan Verma',
            'college': 'Vellore Institute of Technology',
            'branch': 'Information Technology',
            'grad_year': 2026,
            'target_role': 'Data Analyst & Engineer',
            'bio': 'Data analyst and pipeline architect focused on ETL pipelines, SQL analytics, and interactive dashboards.',
            'skills': [
                ('SQL & Relational Databases', 'Databases', 95, 'Mastered'),
                ('Python (Pandas/NumPy)', 'AI/DS', 90, 'Mastered'),
                ('PowerBI & Tableau', 'Analytics', 85, 'Mastered'),
                ('Apache Spark & Airflow', 'Data Engg', 75, 'Proficient'),
                ('Probability & Statistics', 'Math', 85, 'Mastered')
            ],
            'apps': [
                ('Amazon', 'Data Engineer I', 'Bengaluru', 26.0, '2026-09-12', 'Interview', 'Virtual on-site interview confirmed.'),
                ('Fractal Analytics', 'Decision Scientist', 'Mumbai / Hybrid', 14.5, '2026-09-29', 'Offer', 'Offer extended for Decision Scientist role!'),
                ('Deloitte', 'Analytics Specialist', 'Hyderabad', 11.0, '2026-10-05', 'Screening', 'Initial technical screening round.')
            ],
            'aptitude': [
                ('Quantitative', 6, 6, 100.0, 160),
                ('Logical', 8, 9, 88.9, 210),
                ('Verbal', 4, 5, 80.0, 130)
            ],
            'ats': ('Data Analyst & Engineer', 84, 'SQL, Python, Pandas, PowerBI, ETL, Statistics', 'PySpark, Snowflake', 'Solid analytics portfolio with demonstrable SQL and visualization competencies.'),
            'badges': [
                ('aptitude_star', 'Aptitude Ace', 'Scored > 80% on timed aptitude tests', 'fa-bolt'),
                ('first_app', 'Job Hunter', 'Logged your first job application', 'fa-paper-plane'),
                ('offer_received', 'Placement Legend', 'Secured a job offer!', 'fa-champagne-glasses'),
                ('skill_polyglot', 'Tech Explorer', 'Logged 5+ verified technical proficiencies', 'fa-code')
            ],
            'roadmap': ('Data Analyst & Engineer', json.dumps(['Advanced SQL & Window Functions', 'Exploratory Data Analysis with Pandas', 'Business Intelligence Dashboards']), 'Distributed Computing with PySpark', 70)
        },
        {
            'username': 'ananya_patel',
            'email': 'ananya.patel@careerx.ai',
            'full_name': 'Ananya Patel',
            'college': 'Prathyusha Engineering College',
            'branch': 'Artificial Intelligence & Data Science',
            'grad_year': 2026,
            'target_role': 'Cloud & DevOps Engineer',
            'bio': 'Cloud enthusiast certified in AWS and Kubernetes. Automating infrastructure as code and secure CI/CD pipelines.',
            'skills': [
                ('Kubernetes & Docker', 'DevOps', 90, 'Mastered'),
                ('Linux & Shell Scripting', 'Systems', 88, 'Mastered'),
                ('AWS & Terraform', 'Cloud', 84, 'Mastered'),
                ('CI/CD Pipelines (GitHub Actions)', 'DevOps', 86, 'Mastered'),
                ('Python & Go Fundamentals', 'Programming', 80, 'Proficient')
            ],
            'apps': [
                ('Microsoft', 'Associate Cloud & AI Engineer', 'Hyderabad', 24.0, '2026-09-20', 'Interview', 'Coding assessment passed. Technical round pending.'),
                ('Cisco', 'Cloud Infrastructure Associate', 'Bengaluru', 17.5, '2026-09-26', 'Screening', 'Application under review by university hiring team.'),
                ('Infosys SP', 'Specialist Programmer', 'Pan-India', 9.5, '2026-10-01', 'Applied', 'HackWithInfy direct interview slot.')
            ],
            'aptitude': [
                ('Quantitative', 5, 6, 83.3, 175),
                ('Logical', 7, 7, 100.0, 190),
                ('Verbal', 4, 5, 80.0, 120)
            ],
            'ats': ('Cloud & DevOps Engineer', 87, 'Kubernetes, Docker, AWS, Linux, Terraform, CI/CD', 'Ansible, Prometheus', 'Very strong cloud infrastructure alignment.'),
            'badges': [
                ('aptitude_star', 'Aptitude Ace', 'Scored > 80% on timed aptitude tests', 'fa-bolt'),
                ('resume_ready', 'ATS Champion', 'Generated an ATS score above 85%', 'fa-file-shield'),
                ('first_app', 'Job Hunter', 'Logged your first job application', 'fa-paper-plane'),
                ('skill_polyglot', 'Tech Explorer', 'Logged 5+ verified technical proficiencies', 'fa-code')
            ],
            'roadmap': ('Cloud & DevOps Engineer', json.dumps(['Linux Internals & Bash Scripting', 'Containerization with Docker', 'Infrastructure as Code with Terraform']), 'Kubernetes Cluster Administration', 65)
        }
    ]

    std_pwd = generate_password_hash("student123")
    for s in extra_students:
        cursor.execute("SELECT id FROM users WHERE username = ?", (s['username'],))
        u_exist = cursor.fetchone()
        if not u_exist:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, role, full_name, college, branch, grad_year, target_role, bio)
                VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, ?)
            ''', (s['username'], s['email'], std_pwd, s['full_name'], s['college'], s['branch'], s['grad_year'], s['target_role'], s['bio']))
            s_uid = cursor.lastrowid
        else:
            s_uid = u_exist[0]

        cursor.execute("SELECT COUNT(*) FROM skills WHERE user_id = ?", (s_uid,))
        if cursor.fetchone()[0] == 0:
            for sk in s['skills']:
                cursor.execute('INSERT INTO skills (user_id, skill_name, category, proficiency, status) VALUES (?, ?, ?, ?, ?)',
                               (s_uid, sk[0], sk[1], sk[2], sk[3]))

        cursor.execute("SELECT COUNT(*) FROM job_applications WHERE user_id = ?", (s_uid,))
        if cursor.fetchone()[0] == 0:
            for ap in s['apps']:
                cursor.execute('INSERT INTO job_applications (user_id, company, role, location, salary_lpa, apply_date, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                               (s_uid, ap[0], ap[1], ap[2], ap[3], ap[4], ap[5], ap[6]))

        cursor.execute("SELECT COUNT(*) FROM aptitude_scores WHERE user_id = ?", (s_uid,))
        if cursor.fetchone()[0] == 0:
            for apt in s['aptitude']:
                cursor.execute('INSERT INTO aptitude_scores (user_id, category, score, total_questions, accuracy_pct, time_spent_sec) VALUES (?, ?, ?, ?, ?, ?)',
                               (s_uid, apt[0], apt[1], apt[2], apt[3], apt[4]))

        cursor.execute("SELECT COUNT(*) FROM ats_scans WHERE user_id = ?", (s_uid,))
        if cursor.fetchone()[0] == 0:
            ats = s['ats']
            cursor.execute('INSERT INTO ats_scans (user_id, target_role, score, matched_skills, missing_skills, feedback) VALUES (?, ?, ?, ?, ?, ?)',
                           (s_uid, ats[0], ats[1], ats[2], ats[3], ats[4]))

        cursor.execute("SELECT COUNT(*) FROM badges WHERE user_id = ?", (s_uid,))
        if cursor.fetchone()[0] == 0:
            for b in s['badges']:
                cursor.execute('INSERT OR IGNORE INTO badges (user_id, badge_key, badge_name, badge_desc, badge_icon) VALUES (?, ?, ?, ?, ?)',
                               (s_uid, b[0], b[1], b[2], b[3]))

        cursor.execute("SELECT COUNT(*) FROM roadmaps WHERE user_id = ?", (s_uid,))
        if cursor.fetchone()[0] == 0:
            rm = s['roadmap']
            cursor.execute('INSERT INTO roadmaps (user_id, career_role, completed_steps_json, current_milestone, progress_pct) VALUES (?, ?, ?, ?, ?)',
                           (s_uid, rm[0], rm[1], rm[2], rm[3]))


    # Seed Upcoming Placement Drives if empty
    cursor.execute("SELECT COUNT(*) FROM placement_drives")
    if cursor.fetchone()[0] == 0:
        sample_drives = [
            ('Google', 'Software Engineer (Campus 2026)', 28.5, 8.0, 'Bengaluru / Hyderabad', '2026-11-15', '2026-11-05', 'Open', 'On-campus recruitment drive for 2026 passing out batch. Core DSA and Systems.'),
            ('Microsoft', 'Associate Cloud & AI Engineer', 24.0, 7.5, 'Hyderabad / Noida', '2026-11-20', '2026-11-10', 'Open', 'Azure Cloud & Applied AI division hiring. Excellent DSA and OS fundamentals required.'),
            ('Amazon', 'SDE-1 (Full-Stack & Distributed Systems)', 26.0, 7.8, 'Bengaluru / Remote', '2026-11-28', '2026-11-14', 'Open', 'Campus pool drive for SDE-1 roles. Coding assessment followed by 3 interview rounds.'),
            ('TCS Digital', 'AI Specialist & Systems Architect', 9.0, 6.5, 'Pan India', '2026-12-05', '2026-11-22', 'Open', 'TCS Digital premium fresher recruitment for top coders and AI practitioners.'),
            ('Infosys SP', 'Specialist Programmer (L3)', 9.5, 6.5, 'Pan India', '2026-12-10', '2026-11-25', 'Open', 'HackWithInfy / Specialist Programmer track for advanced algorithms.')
        ]
        cursor.executemany('''
            INSERT INTO placement_drives (company, role, package_lpa, min_cgpa, location, drive_date, deadline, status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_drives)

    # Seed Placement Cell Notices if empty
    cursor.execute("SELECT COUNT(*) FROM placement_notices")
    if cursor.fetchone()[0] == 0:
        sample_notices = [
            ('Google Campus Recruitment Drive 2026 Announced!', 'Google online coding assessment registrations close on Nov 5. Eligible students (CGPA >= 8.0) must apply through the placement portal.', 'Urgent', 'Central Placement Cell'),
            ('TPO Pre-Placement Assessment Drive', 'Mandatory Technical Assessment round for all final-year students. Ensure your CareerX assessment score is updated.', 'Info', 'Training & Placement Office'),
            ('Resume Verification Deadline: Check ATS Score', 'Recruiters are filtering resumes with ATS score >= 75%. Generate and verify your resume using the CareerX Resume Builder.', 'Warning', 'Placement Coordinator')
        ]
        cursor.executemany('''
            INSERT INTO placement_notices (title, content, priority, posted_by)
            VALUES (?, ?, ?, ?)
        ''', sample_notices)

    conn.commit()

if __name__ == '__main__':
    init_db()
    print("CareerX SQLite database initialized successfully at", DB_PATH)
