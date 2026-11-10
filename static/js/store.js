/**
 * CareerX - Data Store (store.js)
 * Manages students, test questions, campus drives, and applications using browser localStorage.
 */

(function (window) {
    'use strict';

    const INITIAL_USERS = [
        {
            id: 1,
            username: 'student',
            password: 'student123',
            role: 'student',
            full_name: 'Rahul Sharma',
            email: 'rahul.sharma@nit.edu',
            college: 'NIT Trichy',
            branch: 'AI & Data Science',
            grad_year: 2025,
            target_role: 'AI/ML Engineer',
            bio: 'Aspiring AI/ML Engineer passionate about deep learning, neural networks, MLOps, and scalable software systems.'
        },
        {
            id: 2,
            username: 'priya',
            password: 'priya123',
            role: 'student',
            full_name: 'Priya Patel',
            email: 'priya.patel@iitm.ac.in',
            college: 'IIT Madras',
            branch: 'Computer Science & Engineering',
            grad_year: 2025,
            target_role: 'Software Engineer',
            bio: 'Passionate coder and competitive programmer with expertise in Data Structures, Algorithms, and Distributed Systems.'
        },
        {
            id: 3,
            username: 'ananya',
            password: 'ananya123',
            role: 'student',
            full_name: 'Ananya Iyer',
            email: 'ananya.iyer@pilani.bits.edu',
            college: 'BITS Pilani',
            branch: 'Information Technology',
            grad_year: 2025,
            target_role: 'Full Stack Developer',
            bio: 'Full Stack enthusiast specializing in modern web architecture, React, Node.js, and high-performance cloud applications.'
        },
        {
            id: 4,
            username: 'rohan',
            password: 'rohan123',
            role: 'student',
            full_name: 'Rohan Verma',
            email: 'rohan.v@nits.edu',
            college: 'NIT Surathkal',
            branch: 'Cloud Systems Engineering',
            grad_year: 2025,
            target_role: 'Cloud / DevOps Engineer',
            bio: 'DevOps practitioner focused on Docker containerization, Kubernetes orchestration, CI/CD pipelines, and AWS infrastructure.'
        },
        {
            id: 5,
            username: 'siddharth',
            password: 'sid123',
            role: 'student',
            full_name: 'Siddharth Nair',
            email: 'sid.nair@vit.ac.in',
            college: 'VIT Vellore',
            branch: 'Data Analytics & Statistics',
            grad_year: 2025,
            target_role: 'Data Analyst',
            bio: 'Analytical problem-solver skilled in SQL data extraction, Python Pandas modeling, Tableau dashboards, and business insights.'
        },
        {
            id: 6,
            username: 'sneha',
            password: 'sneha123',
            role: 'student',
            full_name: 'Sneha Reddy',
            email: 'sneha.reddy@psgtech.edu',
            college: 'PSG Tech',
            branch: 'Information Security & Networks',
            grad_year: 2025,
            target_role: 'Cybersecurity Analyst',
            bio: 'Cybersecurity researcher dedicated to network penetration testing, cryptography, secure API development, and threat analysis.'
        },
        {
            id: 7,
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            full_name: 'Dr. K. Ramanathan',
            email: 'admin@careerx.ai',
            college: 'NIT Trichy',
            branch: 'TPO Placement Cell',
            grad_year: 2024,
            target_role: 'Lead Placement Officer',
            bio: 'Head of Campus Placement Operations and Corporate University Relations.'
        }
    ];

    const INITIAL_DRIVES = [
        {
            id: 1,
            company: 'Google',
            role: 'Associate Software Engineer',
            package_lpa: 28.0,
            min_cgpa: 8.0,
            location: 'Bengaluru / Hyderabad',
            drive_date: '2026-11-15',
            deadline: '2026-11-05',
            status: 'Open',
            description: 'Campus hiring for cloud infrastructure, core systems, and software engineering teams.'
        },
        {
            id: 2,
            company: 'Microsoft',
            role: 'Software Engineer (SDE-1)',
            package_lpa: 24.5,
            min_cgpa: 7.5,
            location: 'Hyderabad / Noida',
            drive_date: '2026-11-20',
            deadline: '2026-11-10',
            status: 'Open',
            description: 'Recruiting for Azure Cloud Core, Office 365, and AI platform developer divisions.'
        },
        {
            id: 3,
            company: 'Amazon',
            role: 'Software Development Engineer',
            package_lpa: 22.0,
            min_cgpa: 7.0,
            location: 'Chennai / Bengaluru',
            drive_date: '2026-11-25',
            deadline: '2026-11-12',
            status: 'Open',
            description: 'Hiring for AWS Cloud Services, eCommerce Platform, and Prime Video distributed systems.'
        },
        {
            id: 4,
            company: 'Goldman Sachs',
            role: 'Operations & Systems Engineer',
            package_lpa: 20.0,
            min_cgpa: 7.5,
            location: 'Bengaluru',
            drive_date: '2026-12-01',
            deadline: '2026-11-18',
            status: 'Open',
            description: 'Fintech algorithmic systems, high-frequency trading platforms, and quantitative computing.'
        },
        {
            id: 5,
            company: 'TCS Digital',
            role: 'Digital Specialist Engineer',
            package_lpa: 9.0,
            min_cgpa: 6.5,
            location: 'Pan India / Remote',
            drive_date: '2026-12-05',
            deadline: '2026-11-25',
            status: 'Open',
            description: 'Specialist development track in Cloud, Machine Learning, and Enterprise Microservices.'
        },
        {
            id: 6,
            company: 'Cognizant',
            role: 'GenC Elevate Full Stack',
            package_lpa: 6.5,
            min_cgpa: 6.0,
            location: 'Coimbatore / Chennai',
            drive_date: '2026-12-10',
            deadline: '2026-11-30',
            status: 'Open',
            description: 'Modern web, React, Node.js, and Java Spring cloud engineering roles.'
        }
    ];

    const INITIAL_APPLICATIONS = [
        {
            id: 1,
            company: 'Google',
            role: 'Associate Software Engineer',
            location: 'Bengaluru',
            salary_lpa: 28.0,
            apply_date: '2026-10-20',
            status: 'Applied',
            notes: 'Submitted resume via campus placement portal. ATS Match: 92%.'
        },
        {
            id: 2,
            company: 'Microsoft',
            role: 'Software Engineer (SDE-1)',
            location: 'Hyderabad',
            salary_lpa: 24.5,
            apply_date: '2026-10-18',
            status: 'Screening',
            notes: 'Online Coding Assessment cleared (2/2 questions solved).'
        },
        {
            id: 3,
            company: 'Amazon',
            role: 'Software Development Engineer',
            location: 'Chennai',
            salary_lpa: 22.0,
            apply_date: '2026-10-15',
            status: 'Interview',
            notes: 'Technical Interview Round 1 scheduled for next Tuesday.'
        },
        {
            id: 4,
            company: 'Goldman Sachs',
            role: 'Systems Engineer',
            location: 'Bengaluru',
            salary_lpa: 20.0,
            apply_date: '2026-10-12',
            status: 'Screening',
            notes: 'Math & Aptitude test completed.'
        },
        {
            id: 5,
            company: 'TCS Digital',
            role: 'Digital Specialist Engineer',
            location: 'Pan India',
            salary_lpa: 9.0,
            apply_date: '2026-10-08',
            status: 'Offer',
            notes: 'Official campus placement offer letter received with joining bonus!'
        }
    ];

    const INITIAL_SKILLS = [
        { id: 1, skill_name: 'Python', category: 'Technical', proficiency: 92, status: 'Mastered' },
        { id: 2, skill_name: 'Data Structures & Algorithms', category: 'Technical', proficiency: 88, status: 'Mastered' },
        { id: 3, skill_name: 'PyTorch & Deep Learning', category: 'Technical', proficiency: 84, status: 'Proficient' },
        { id: 4, skill_name: 'SQL & Database Architecture', category: 'Technical', proficiency: 85, status: 'Proficient' },
        { id: 5, skill_name: 'React.js & Modern Web', category: 'Technical', proficiency: 78, status: 'Proficient' },
        { id: 6, skill_name: 'System Design & Scalability', category: 'Technical', proficiency: 72, status: 'Learning' },
        { id: 7, skill_name: 'Git, GitHub & CI/CD', category: 'Technical', proficiency: 82, status: 'Proficient' },
        { id: 8, skill_name: 'Docker & Containerization', category: 'Technical', proficiency: 70, status: 'Learning' }
    ];

    const INITIAL_BADGES = [
        { id: 1, badge_key: 'fast_solver', badge_name: 'Fast Solver', badge_desc: 'Completed timed aptitude test with >85% accuracy in record time.', badge_icon: 'fa-bolt' },
        { id: 2, badge_key: 'ats_elite', badge_name: 'ATS 90+ Club', badge_desc: 'Engineered an elite ATS resume scored above 90% alignment.', badge_icon: 'fa-file-shield' },
        { id: 3, badge_key: 'python_champ', badge_name: 'Python Champion', badge_desc: 'Demonstrated mastery in advanced Python OOPs, decorators, and data structures.', badge_icon: 'fa-code' },
        { id: 4, badge_key: 'interview_ace', badge_name: 'Interview Ace', badge_desc: 'Scored 8.5+ on technical assessment challenge evaluations.', badge_icon: 'fa-medal' },
        { id: 5, badge_key: 'placement_star', badge_name: 'Day-1 Placement Ready', badge_desc: 'Achieved Tier 1 Placement Readiness Composite Score > 85%.', badge_icon: 'fa-trophy' }
    ];

    const INITIAL_NOTICES = [
        {
            id: 1,
            title: 'Welcome to Placement Season 2026',
            content: 'All final year candidates must complete profile details, verify ATS resume compatibility, and practice with timed aptitude modules.',
            priority: 'Urgent',
            posted_by: 'TPO Placement Cell Head'
        },
        {
            id: 2,
            title: 'Google & Microsoft Campus Drive Schedule',
            content: 'Registration window closing on Nov 5. Ensure your resume and coding challenges meet the eligibility benchmark.',
            priority: 'High',
            posted_by: 'Corporate Relations Officer'
        },
        {
            id: 3,
            title: 'Technical Mock Assessments Commencing',
            content: 'Practice key domain tracks using the Technical Assessment module to get instant AI critique and model answers.',
            priority: 'Normal',
            posted_by: 'Placement Training Lead'
        }
    ];

    const INITIAL_ROADMAPS = {
        'AI/ML Engineer': [
            "Master Python, NumPy, Pandas & Vectorized Math",
            "Linear Algebra, Calculus & Probability for Machine Learning",
            "Classical Machine Learning (Regression, Random Forests, XGBoost)",
            "Deep Learning Foundations (PyTorch, Neural Networks, Backprop)",
            "NLP (Transformers, HuggingFace, Tokenizers) or Computer Vision (OpenCV, CNNs)",
            "Deploy Production ML Models using FastAPI, Docker & Cloud Endpoints"
        ],
        'Software Engineer': [
            "Master Data Structures & Algorithms in Python/Java/C++",
            "Object Oriented Programming & SOLID Design Principles",
            "System Architecture & Relational Database Design",
            "Build 2 Scalable Full Stack Web Applications",
            "Master Linux, Git, CI/CD, Containerization and Unit Testing",
            "High-Level & Low-Level System Design (Caching, Queues, Load Balancing)"
        ],
        'Full Stack Developer': [
            "HTML5, CSS3, Flexbox, Grid & Responsive UI Design",
            "Modern JavaScript (ES6+, Async/Await, DOM manipulation)",
            "Frontend Component Framework (React.js, Next.js, Redux)",
            "Backend REST APIs with Node.js / Express or Python Flask",
            "Database Architecture (PostgreSQL, MongoDB, Prisma ORM)",
            "Deployment on Cloud Platforms (Vercel, AWS, Docker containers)"
        ],
        'Data Analyst': [
            "Advanced Excel, Pivot Tables & Data Modeling",
            "SQL Mastery (Window Functions, Aggregations, Joins, CTEs)",
            "Python for Analytics (Pandas, NumPy, Matplotlib, Seaborn)",
            "Business Intelligence Dashboards (Tableau & PowerBI)",
            "Statistical Hypothesis Testing & A/B Experimentation",
            "Storytelling with Data & Executive Business Presentations"
        ],
        'Cloud / DevOps Engineer': [
            "Linux Systems Administration & Bash Shell Scripting",
            "Computer Networking (TCP/IP, DNS, Subnets, Firewalls)",
            "Cloud Infrastructure with AWS (EC2, S3, RDS, IAM, VPC)",
            "Containerization with Docker & Orchestration with Kubernetes",
            "Infrastructure as Code with Terraform & Ansible",
            "Continuous Integration & Continuous Deployment (GitHub Actions, Jenkins)"
        ],
        'Cybersecurity Analyst': [
            "Networking Fundamentals, Wireshark & Packet Analysis",
            "Operating System Security (Linux, Windows Hardening)",
            "Web Security & OWASP Top 10 Vulnerabilities",
            "Penetration Testing Tools (Burp Suite, Nmap, Metasploit)",
            "Cryptography, PKI & Secure Communications Protocols",
            "Incident Response, SIEM Logging & Security Operations (SOC)"
        ]
    };

    const INITIAL_APTITUDE_QUESTIONS = [
        {
            id: 1,
            category: 'Quantitative',
            question: 'A train running at 54 km/hr crosses a pole in 20 seconds. What is the length of the train in meters?',
            options: { A: '250 m', B: '300 m', C: '350 m', D: '200 m' },
            correct: 'B',
            explanation: 'Speed in m/s = 54 * (5/18) = 15 m/s. Length of train = Speed * Time = 15 * 20 = 300 meters.'
        },
        {
            id: 2,
            category: 'Quantitative',
            question: 'If 12 developers complete a project in 8 days, how many days will 16 developers take to finish the same project at equal efficiency?',
            options: { A: '5 days', B: '6 days', C: '7 days', D: '8 days' },
            correct: 'B',
            explanation: 'Total work = 12 * 8 = 96 developer-days. Days required = 96 / 16 = 6 days.'
        },
        {
            id: 3,
            category: 'Quantitative',
            question: 'A tech workstation listed at $1,200 is sold with a 15% campus placement discount. What is the final selling price?',
            options: { A: '$1,020', B: '$1,050', C: '$980', D: '$1,080' },
            correct: 'A',
            explanation: 'Discount = 15% of 1200 = $180. Selling price = 1200 - 180 = $1,020.'
        },
        {
            id: 4,
            category: 'Logical',
            question: 'Identify the next number in the series: 4, 9, 19, 39, 79, ?',
            options: { A: '159', B: '149', C: '169', D: '155' },
            correct: 'A',
            explanation: 'Recurrence relation is * 2 + 1: 4*2+1=9, 9*2+1=19, 19*2+1=39, 39*2+1=79, 79*2+1=159.'
        },
        {
            id: 5,
            category: 'Logical',
            question: 'If BINARY is coded in reverse as YRANIB, how will ALGORITHM be coded under the exact same cipher?',
            options: { A: 'MHTIROGLA', B: 'MIHTROGLA', C: 'MHTIROGIA', D: 'MTHIROGLA' },
            correct: 'A',
            explanation: 'The letters in ALGORITHM are strictly inverted: A-L-G-O-R-I-T-H-M reversed is M-H-T-I-R-O-G-L-A.'
        },
        {
            id: 6,
            category: 'Verbal',
            question: 'Choose the most accurate synonym for the word "METICULOUS":',
            options: { A: 'Careless', B: 'Thorough and highly precise', C: 'Hasty and fast', D: 'Vague' },
            correct: 'B',
            explanation: 'Meticulous refers to showing exceptional attention to precise details and quality standards.'
        },
        {
            id: 7,
            category: 'Verbal',
            question: 'Select the precise antonym of "MITIGATE":',
            options: { A: 'Aggravate / Worsen', B: 'Alleviate', C: 'Soothe', D: 'Diminish' },
            correct: 'A',
            explanation: 'To mitigate means to soften or make less severe. Its direct opposite is to aggravate or worsen.'
        }
    ];

    const INITIAL_INTERVIEW_QUESTIONS = [
    {
        "id": 1,
        "category": "Python",
        "difficulty": "Medium",
        "question": "What is the architectural difference between shallow copy and deep copy in Python?",
        "model_answer": "A shallow copy constructs a new collection object and populates it with references to the child objects of the original. A deep copy recursively constructs a new collection object and recursively copies all nested objects, creating completely independent memory allocations.",
        "key_points": "copy.copy vs copy.deepcopy, reference sharing, recursion, mutation isolation"
    },
    {
        "id": 2,
        "category": "Python",
        "difficulty": "Easy",
        "question": "Explain the core distinctions between lists and tuples in Python.",
        "model_answer": "Lists are mutable sequences defined using square brackets [], allowing in-place appending, inserting, and deleting. Tuples are immutable sequences defined using parentheses (), consume less memory overhead, and can serve as dictionary keys when containing hashable elements.",
        "key_points": "mutability, memory footprint, hashability, dictionary keys"
    },
    {
        "id": 3,
        "category": "Python",
        "difficulty": "Medium",
        "question": "How do Python decorators work behind the scenes?",
        "model_answer": "Decorators are higher-order functions that take a function as an argument, wrap it with additional functionality (such as logging, timing, or access control), and return the callable wrapper without altering the source code of the wrapped function.",
        "key_points": "closures, higher-order functions, @ syntactic sugar, wrapper functions"
    },
    {
        "id": 4,
        "category": "Python",
        "difficulty": "Hard",
        "question": "What is the Global Interpreter Lock (GIL) and how does it affect CPU-bound multithreading?",
        "model_answer": "The GIL is a mutex in CPython that prevents multiple native threads from executing Python bytecode simultaneously. While it ensures memory safety for reference counting, it restricts multi-core parallelism for CPU-bound tasks, making the multiprocessing module necessary for parallel computation.",
        "key_points": "CPython mutex, thread safety, reference counting, multiprocessing vs threading"
    },
    {
        "id": 5,
        "category": "Python",
        "difficulty": "Medium",
        "question": "What are Python generators and why are they memory efficient?",
        "model_answer": "Generators are functions that produce a sequence of results lazily using the yield statement instead of returning a complete list. They maintain state between iterations and generate items on demand, avoiding large memory allocations for large datasets.",
        "key_points": "yield keyword, lazy evaluation, iterator protocol, memory optimization"
    },
    {
        "id": 6,
        "category": "Python",
        "difficulty": "Easy",
        "question": "What is the purpose of *args and **kwargs in Python functions?",
        "model_answer": "*args allows a function to accept any number of positional arguments as a tuple. **kwargs allows a function to accept any number of keyword arguments as a dictionary, providing flexibility in function signatures and subclassing.",
        "key_points": "variable positional arguments (tuple), keyword arguments (dict), unpacking"
    },
    {
        "id": 7,
        "category": "Python",
        "difficulty": "Hard",
        "question": "How does Python manage memory and perform garbage collection?",
        "model_answer": "Python primarily uses reference counting to deallocate objects immediately when their reference count reaches zero. To handle cyclic references, Python includes a generational cyclic garbage collector with three generations (Gen 0, 1, 2) that detects and clears circular references.",
        "key_points": "reference counting, cyclic garbage collection, three generations, sys.getrefcount"
    },
    {
        "id": 8,
        "category": "Python",
        "difficulty": "Medium",
        "question": "What is the difference between __init__ and __new__ in Python classes?",
        "model_answer": "__new__ is a static method responsible for creating and returning a new instance of a class. __init__ is an initializer method called after the instance is created to set up its initial attributes and state.",
        "key_points": "__new__ creates instance, __init__ initializes state, Singleton pattern"
    },
    {
        "id": 9,
        "category": "Python",
        "difficulty": "Easy",
        "question": "Compare list comprehensions with generator expressions in Python.",
        "model_answer": "List comprehensions use brackets [x for x in data] and construct the entire list in memory immediately. Generator expressions use parentheses (x for x in data) and return an iterator that yields one item at a time, saving memory on large streams.",
        "key_points": "syntax ([ ] vs ( )), eager vs lazy evaluation, memory usage"
    },
    {
        "id": 10,
        "category": "Python",
        "difficulty": "Medium",
        "question": "Explain the control flow in a try-except-else-finally block.",
        "model_answer": "The try block contains code that might raise an exception. The except block catches specific errors. The else block executes only if no exception was raised in the try block. The finally block always executes regardless of whether an exception occurred, making it ideal for cleanup.",
        "key_points": "try error isolation, except handling, else on success, finally guaranteed cleanup"
    },
    {
        "id": 11,
        "category": "Python",
        "difficulty": "Easy",
        "question": "What is the difference between the \"is\" and \"==\" operators in Python?",
        "model_answer": "\"==\" checks for value equality, comparing whether two objects have equivalent contents by calling __eq__. \"is\" checks for identity equality, verifying whether two variables reference the exact same memory address using their id().",
        "key_points": "value equality vs identity equality, id() comparison, __eq__ method"
    },
    {
        "id": 12,
        "category": "Python",
        "difficulty": "Hard",
        "question": "What are metaclasses in Python and when are they used?",
        "model_answer": "A metaclass is a \"class of a class\" that defines how a class itself is constructed and behaves (by default, \"type\"). Metaclasses are used in frameworks like Django ORM and Pydantic to inspect, register, or validate class attributes at definition time.",
        "key_points": "type as default metaclass, class factories, attribute validation, ORMs"
    },
    {
        "id": 13,
        "category": "Python",
        "difficulty": "Medium",
        "question": "Differentiate between @staticmethod and @classmethod in Python.",
        "model_answer": "@classmethod receives the class itself (\"cls\") as its first parameter and can access or modify class state, often used as alternative constructors. @staticmethod does not receive \"self\" or \"cls\", behaving as a regular utility function scoped within the class namespace.",
        "key_points": "cls parameter, factory methods, static namespace scoping"
    },
    {
        "id": 14,
        "category": "Python",
        "difficulty": "Medium",
        "question": "What is monkey patching in Python and what are its risks?",
        "model_answer": "Monkey patching refers to dynamically modifying or replacing modules, classes, or methods at runtime without altering the original source code. While useful for mock testing and hot-fixing bugs, it can lead to debugging issues and unexpected side effects across codebases.",
        "key_points": "runtime modification, unit test mocking, unpredictable side effects"
    },
    {
        "id": 15,
        "category": "Python",
        "difficulty": "Hard",
        "question": "Explain Method Resolution Order (MRO) and the C3 linearization algorithm.",
        "model_answer": "MRO determines the order in which Python searches base classes for attributes and methods in multiple inheritance hierarchies. Python uses the C3 Linearization algorithm to ensure monotonicity and preserve local precedence order without ambiguity.",
        "key_points": "multiple inheritance, C3 linearization, super() lookup, Class.__mro__"
    },
    {
        "id": 16,
        "category": "Python",
        "difficulty": "Medium",
        "question": "How do Context Managers and the \"with\" statement function in Python?",
        "model_answer": "Context managers ensure that setup and teardown resources (like file descriptors, database connections, and locks) are properly handled. They implement the __enter__ method (setup/acquire) and __exit__ method (teardown/release, handling any exceptions).",
        "key_points": "__enter__ and __exit__, deterministic resource cleanup, contextlib module"
    },
    {
        "id": 17,
        "category": "Python",
        "difficulty": "Easy",
        "question": "What are lambda functions in Python and what are their limitations?",
        "model_answer": "Lambda functions are small anonymous functions defined using the lambda keyword: lambda args: expression. They are limited to a single expression (cannot contain statements, loops, or complex annotations) and should be used sparingly where named functions improve readability.",
        "key_points": "anonymous functions, single expression limit, map/filter/sorted usage"
    },
    {
        "id": 18,
        "category": "Python",
        "difficulty": "Medium",
        "question": "How does Python maintain insertion order in dictionaries (Python 3.7+)?",
        "model_answer": "Modern Python dictionaries separate sparse hash table arrays from dense entries arrays. Hash keys index into a compact indices table that points to an array of (hash, key, value) tuples stored in chronological insertion order, reducing memory by up to 25% while preserving order.",
        "key_points": "sparse indices table, dense key-value array, insertion order guarantee"
    },
    {
        "id": 19,
        "category": "Python",
        "difficulty": "Hard",
        "question": "Compare multiprocessing with multithreading in Python for concurrent execution.",
        "model_answer": "Multithreading runs multiple threads within the same memory space under the GIL, making it suitable for I/O-bound operations (network requests, disk access). Multiprocessing spawns separate OS processes with independent memory and GIL instances, enabling true multi-core parallel execution for CPU-heavy tasks.",
        "key_points": "I/O-bound vs CPU-bound, shared memory vs IPC, multi-core CPU utilization"
    },
    {
        "id": 20,
        "category": "Python",
        "difficulty": "Medium",
        "question": "What is the purpose of __slots__ in Python class definitions?",
        "model_answer": "__slots__ explicitly declares data members and prevents the automatic creation of the dynamic __dict__ dictionary for each class instance. This significantly reduces memory overhead when creating millions of small objects and slightly improves attribute access speed.",
        "key_points": "__dict__ suppression, memory footprint reduction, fixed attribute schema"
    },
    {
        "id": 21,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "What is the time complexity of searching, insertion, and deletion in an AVL or Red-Black Tree?",
        "model_answer": "All three operations take strictly O(log N) time in both worst-case and average-case. This is because self-balancing BSTs perform tree rotations during insertions and deletions to guarantee that the tree height remains bounded logarithmically relative to the number of nodes.",
        "key_points": "O(log N) bound, tree rotations, height balance, worst-case protection"
    },
    {
        "id": 22,
        "category": "DSA",
        "difficulty": "Easy",
        "question": "Compare Array and Linked List data structures with respect to memory and time tradeoffs.",
        "model_answer": "Arrays offer O(1) random access by index and high cache locality due to contiguous memory, but insertions/deletions take O(N). Linked Lists provide O(1) insertions/deletions at known nodes and dynamic sizing, but require O(N) sequential search and extra memory for node pointers.",
        "key_points": "contiguous memory vs pointer overhead, O(1) index access vs O(N) traversal"
    },
    {
        "id": 23,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "Explain Floyd’s Cycle-Finding Algorithm (Tortoise and Hare) for linked lists.",
        "model_answer": "Use two pointers: a slow pointer moving 1 step at a time and a fast pointer moving 2 steps. If a cycle exists, the fast pointer will eventually catch up and meet the slow pointer in O(N) time and O(1) space. Resetting one pointer to head and moving both 1 step locates the cycle start.",
        "key_points": "slow and fast pointers, O(N) time, O(1) auxiliary space, cycle entry point"
    },
    {
        "id": 24,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "How do Hash Tables resolve collisions? Contrast Separate Chaining with Open Addressing.",
        "model_answer": "Separate Chaining places colliding elements into a linked list or balanced tree at the target hash bucket. Open Addressing searches for alternate empty slots within the hash table itself using probing techniques like Linear Probing, Quadratic Probing, or Double Hashing.",
        "key_points": "hash collisions, separate chaining (buckets), open addressing (probing)"
    },
    {
        "id": 25,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "Explain QuickSort pivot strategies and how to avoid the O(N^2) worst-case time complexity.",
        "model_answer": "QuickSort partitions elements around a pivot. If an extreme element (smallest/largest) is always picked, time degrades to O(N^2). Picking the pivot randomly or using the \"Median-of-Three\" (first, middle, last) strategy guarantees O(N log N) expected time complexity on sorted data.",
        "key_points": "partitioning, O(N log N) average, O(N^2) worst case, Median-of-Three"
    },
    {
        "id": 26,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "Why is MergeSort stable and often preferred for sorting Linked Lists over QuickSort?",
        "model_answer": "MergeSort is a stable divide-and-conquer algorithm with guaranteed O(N log N) time in all cases. It is ideal for linked lists because nodes can be spliced and reconnected by updating pointers without requiring the auxiliary array space overhead that MergeSort requires for arrays.",
        "key_points": "stability, guaranteed O(N log N), O(1) extra space for linked lists"
    },
    {
        "id": 27,
        "category": "DSA",
        "difficulty": "Easy",
        "question": "Compare Breadth-First Search (BFS) and Depth-First Search (DFS) in graphs.",
        "model_answer": "BFS explores neighbor nodes level-by-level using a FIFO Queue, finding the shortest path in unweighted graphs in O(V + E) time. DFS explores deeply down each path using a LIFO Stack or recursion, suitable for cycle detection, topological sorting, and maze exploration.",
        "key_points": "Queue (BFS) vs Stack/Recursion (DFS), shortest path in unweighted graph"
    },
    {
        "id": 28,
        "category": "DSA",
        "difficulty": "Hard",
        "question": "Explain Dijkstra’s Shortest Path Algorithm and its time complexity with a Min-Heap.",
        "model_answer": "Dijkstra finds the shortest path from a source to all vertices in a weighted graph with non-negative edge weights using a greedy approach. With an adjacency list and Min-Heap (priority queue), the time complexity is O((V + E) log V).",
        "key_points": "greedy choice, priority queue, non-negative edge weights, O((V+E) log V)"
    },
    {
        "id": 29,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "Compare Memoization (Top-Down) with Tabulation (Bottom-Up) in Dynamic Programming.",
        "model_answer": "Memoization solves the problem recursively starting from the main problem, caching subproblem solutions in a hash map or array. Tabulation solves all base cases first and builds up answers iteratively using a table, avoiding recursive stack overflow overhead.",
        "key_points": "top-down recursion with cache vs bottom-up iterative table, stack safety"
    },
    {
        "id": 30,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "What is a Binary Heap and why does the buildHeap operation take O(N) time instead of O(N log N)?",
        "model_answer": "A Binary Heap is a complete binary tree satisfying the heap-order property (Min or Max). Inserting N elements one-by-one takes O(N log N), but bottom-up buildHeap starts heapifying from leaf nodes up; because most nodes are near the bottom with small subtree heights, the sum converges to O(N).",
        "key_points": "complete binary tree, min/max heap, O(N) bottom-up heapification proof"
    },
    {
        "id": 31,
        "category": "DSA",
        "difficulty": "Hard",
        "question": "How do you find the Longest Increasing Subsequence (LIS) in O(N log N) time?",
        "model_answer": "Maintain an array \"tails\" where tails[i] stores the smallest tail of all increasing subsequences of length i+1. For each number in the input, use binary search (bisect_left) to find its position in tails and update or append it. The final length of tails is the LIS length.",
        "key_points": "patience sorting, binary search, O(N log N) vs O(N^2) DP approach"
    },
    {
        "id": 32,
        "category": "DSA",
        "difficulty": "Easy",
        "question": "Explain the Two Pointers technique and contrasting it with the Sliding Window technique.",
        "model_answer": "The Two Pointers technique uses two indices moving towards each other (e.g., finding pairs in a sorted array) or in parallel. The Sliding Window technique maintains a contiguous dynamic range [left, right] to track subarray properties like maximum sum or unique characters.",
        "key_points": "converging pointers vs expanding/contracting contiguous subsegment"
    },
    {
        "id": 33,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "What is a Trie (Prefix Tree) and what are its search and insertion time complexities?",
        "model_answer": "A Trie is an N-ary tree data structure used to store associative keys (typically strings) where each node represents a character. Insertion and lookup take O(L) time where L is the length of the string, making it optimal for autocomplete and dictionary prefix searches.",
        "key_points": "character path nodes, O(L) search and insert, prefix matching, autocomplete"
    },
    {
        "id": 34,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "Explain Kahn’s Algorithm for Topological Sorting on a Directed Acyclic Graph (DAG).",
        "model_answer": "Kahn’s algorithm computes the in-degree of all vertices. It pushes all vertices with in-degree 0 into a queue. Vertices are dequeued, added to the topological ordering, and their outgoing edges are removed (decrementing neighbors in-degrees). If not all nodes are visited, a cycle exists.",
        "key_points": "in-degree counting, BFS queue, cycle detection in directed graphs"
    },
    {
        "id": 35,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "How does Disjoint Set Union (Union-Find) achieve near O(1) amortized time complexity?",
        "model_answer": "DSU groups elements into non-overlapping sets. By combining \"Union by Rank\" (attaching smaller trees under larger roots) and \"Path Compression\" (flattening tree nodes directly to the root during find), the amortized time per operation becomes O(α(N)), the inverse Ackermann function.",
        "key_points": "path compression, union by rank, inverse Ackermann function O(α(N))"
    },
    {
        "id": 36,
        "category": "DSA",
        "difficulty": "Easy",
        "question": "Explain Kadane’s Algorithm for the Maximum Subarray Problem.",
        "model_answer": "Kadane’s algorithm iterates through the array while maintaining current_sum and max_so_far. At each element, it decides whether to add the element to the existing subarray or start a new subarray: current_sum = max(num, current_sum + num), achieving O(N) time and O(1) space.",
        "key_points": "local vs global optimum, O(N) single pass, O(1) space complexity"
    },
    {
        "id": 37,
        "category": "DSA",
        "difficulty": "Hard",
        "question": "How can you find the Median of Two Sorted Arrays in O(log(min(N, M))) time?",
        "model_answer": "Perform binary search on the partition of the smaller array. Partition both arrays into left and right halves such that the left half has equal or +1 element and all left elements are <= right elements (maxLeftA <= minRightB and maxLeftB <= minRightA). Compute the median from the boundary values.",
        "key_points": "binary search on partition, partition symmetry, boundary checks"
    },
    {
        "id": 38,
        "category": "DSA",
        "difficulty": "Easy",
        "question": "How do you design a Min-Stack that supports push, pop, top, and getMin in O(1) time?",
        "model_answer": "Maintain two stacks: a main data stack and a min-tracker stack (or store pairs (val, current_min) in a single stack). When pushing a value, push the minimum of the new value and the current minimum onto the min stack. Both push, pop, and getMin execute in strict O(1) time.",
        "key_points": "auxiliary min stack, O(1) time guarantee for getMin, space tradeoff"
    },
    {
        "id": 39,
        "category": "DSA",
        "difficulty": "Hard",
        "question": "What is Morris Traversal for Binary Trees and how does it achieve O(1) space complexity?",
        "model_answer": "Morris Traversal visits binary tree nodes in inorder sequence without recursion or an explicit stack. It uses threaded binary trees: it finds the inorder predecessor of the current node and sets its right child pointer to current. Once visited, it removes the temporary thread, restoring the tree.",
        "key_points": "threaded binary tree, inorder predecessor temporary links, O(1) space"
    },
    {
        "id": 40,
        "category": "DSA",
        "difficulty": "Medium",
        "question": "How is the 0/1 Knapsack Problem optimized from 2D space to a 1D array?",
        "model_answer": "The standard DP table dp[i][w] depends only on the previous row dp[i-1]. By iterating the weight capacity w backwards from W down to weight[i], we can use a single 1D array dp[w] = max(dp[w], dp[w - weight[i]] + value[i]) without overwriting values needed for the current iteration.",
        "key_points": "1D DP space reduction, backward capacity iteration, no duplicate item usage"
    },
    {
        "id": 41,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "Explain the ACID properties of relational database transactions.",
        "model_answer": "ACID ensures transaction reliability: Atomicity (all changes succeed or all are rolled back), Consistency (all database constraints and rules remain valid), Isolation (concurrent transactions execute independently without interference), and Durability (committed changes persist permanently even after hardware crashes).",
        "key_points": "Atomicity, Consistency, Isolation, Durability, WAL commit"
    },
    {
        "id": 42,
        "category": "SQL",
        "difficulty": "Easy",
        "question": "What is the operational difference between the WHERE and HAVING clauses in SQL?",
        "model_answer": "WHERE filters individual rows before grouping or aggregation occurs and cannot use aggregate functions directly. HAVING filters summarized groups after the GROUP BY clause has been evaluated and is specifically designed to work with aggregate functions like COUNT, SUM, and AVG.",
        "key_points": "row-level pre-filter vs group-level post-filter, aggregate functions"
    },
    {
        "id": 43,
        "category": "SQL",
        "difficulty": "Easy",
        "question": "Explain the four fundamental SQL JOIN types with examples.",
        "model_answer": "INNER JOIN returns records with matching keys in both tables. LEFT JOIN returns all records from the left table and matched records from the right table (with NULLs for unmatched). RIGHT JOIN returns all from right. FULL OUTER JOIN returns all rows from both tables, filling NULLs where matches are absent.",
        "key_points": "INNER (intersection), LEFT (all left + matches), RIGHT, FULL OUTER (union)"
    },
    {
        "id": 44,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "What is Database Normalization and what are 1NF, 2NF, and 3NF rules?",
        "model_answer": "Normalization minimizes data redundancy and update anomalies. 1NF requires atomic column values and unique row identifiers. 2NF requires 1NF and no partial dependencies on composite primary keys. 3NF requires 2NF and no transitive functional dependencies between non-key columns.",
        "key_points": "data redundancy reduction, 1NF atomic, 2NF partial key, 3NF transitive dependency"
    },
    {
        "id": 45,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "Differentiate between Clustered and Non-Clustered Indexes in relational databases.",
        "model_answer": "A Clustered Index determines the physical order of table rows on disk; a table can have only one clustered index (usually the primary key). A Non-Clustered Index is a separate B+ tree structure containing index keys and pointers to the physical data rows, and a table can have multiple non-clustered indexes.",
        "key_points": "physical data sorting, single clustered per table, B+ tree leaf pointers"
    },
    {
        "id": 46,
        "category": "SQL",
        "difficulty": "Easy",
        "question": "Compare the DELETE, TRUNCATE, and DROP commands in SQL.",
        "model_answer": "DELETE is a DML statement that removes rows conditionally, fires triggers, and logs each deleted row (can be rolled back). TRUNCATE is a DDL statement that deallocates all data pages in a table quickly without logging individual rows. DROP removes the entire table structure and data permanently.",
        "key_points": "DML vs DDL, transaction rollback, triggers, table schema removal"
    },
    {
        "id": 47,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "Explain SQL Window Functions: ROW_NUMBER(), RANK(), and DENSE_RANK().",
        "model_answer": "Window functions calculate values across partitions without collapsing rows. ROW_NUMBER() assigns a unique sequential integer to each row. RANK() assigns identical ranks to tied rows and skips subsequent numbers (1, 2, 2, 4). DENSE_RANK() assigns identical ranks to ties without skipping numbers (1, 2, 2, 3).",
        "key_points": "PARTITION BY, OVER clause, tie handling, gap skipping"
    },
    {
        "id": 48,
        "category": "SQL",
        "difficulty": "Hard",
        "question": "Explain Transaction Isolation Levels and the concurrency phenomena they prevent.",
        "model_answer": "Four standard ANSI SQL isolation levels: Read Uncommitted (allows dirty reads), Read Committed (prevents dirty reads), Repeatable Read (prevents non-repeatable reads using snapshot reads or row locks), and Serializable (highest level, prevents phantom reads by locking ranges or using two-phase locking).",
        "key_points": "Dirty Read, Non-Repeatable Read, Phantom Read, Serializable"
    },
    {
        "id": 49,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "What is a Database Deadlock and how does an RDBMS detect and resolve it?",
        "model_answer": "A deadlock occurs when two or more transactions hold locks that the other transactions need, creating a circular wait where none can proceed. RDBMS engines run background deadlock detection algorithms using wait-for graphs; when a cycle is detected, one transaction is chosen as the victim and rolled back.",
        "key_points": "circular wait, lock contention, wait-for graphs, victim rollback"
    },
    {
        "id": 50,
        "category": "SQL",
        "difficulty": "Easy",
        "question": "Compare Primary Key, Unique Constraint, and Foreign Key constraints.",
        "model_answer": "A Primary Key uniquely identifies each row in a table and cannot contain NULL values (one per table). A Unique Constraint enforces uniqueness across a column or set of columns but allows one or more NULL values. A Foreign Key enforces referential integrity by referencing the primary key of another table.",
        "key_points": "uniqueness, NULL tolerance, referential integrity, table constraints"
    },
    {
        "id": 51,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "How do you analyze query performance using EXPLAIN or EXPLAIN ANALYZE?",
        "model_answer": "EXPLAIN displays the query execution plan chosen by the optimizer, showing whether the query uses Index Scans, Index Only Scans, or Sequential Scans. EXPLAIN ANALYZE executes the query and compares estimated startup/total costs with actual execution times and buffer hits.",
        "key_points": "query planner, Seq Scan vs Index Scan, execution cost, actual execution time"
    },
    {
        "id": 52,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "What are Common Table Expressions (CTEs) and Recursive CTEs used for?",
        "model_answer": "A CTE (WITH cte_name AS (...)) creates a temporary named result set defined within the execution of a single query, improving readability. Recursive CTEs self-reference the CTE, making them ideal for hierarchical data like organizational charts and tree structures.",
        "key_points": "WITH clause, query readability, recursion for tree/graph hierarchies"
    },
    {
        "id": 53,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "Compare OLTP and OLAP systems in database architecture.",
        "model_answer": "OLTP (Online Transaction Processing) systems handle high-frequency, simple read/write transactions for operational applications, optimized for low latency and normalized schemas. OLAP (Online Analytical Processing) systems handle complex aggregation queries across massive historical data warehouse warehouses.",
        "key_points": "row-oriented operational transactions vs columnar analytical data warehouses"
    },
    {
        "id": 54,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "Differentiate between standard Views and Materialized Views in SQL.",
        "model_answer": "A standard View is a virtual table containing a saved SQL query; it stores no physical data on disk and re-runs the underlying query every time it is referenced. A Materialized View physically caches the query results on disk for rapid access and must be periodically refreshed.",
        "key_points": "virtual query alias vs physical disk cache, REFRESH MATERIALIZED VIEW"
    },
    {
        "id": 55,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "What is a Correlated Subquery and why can it cause performance bottlenecks?",
        "model_answer": "A standard subquery executes once independently of the outer query. A correlated subquery references columns from the outer query table, requiring the database engine to re-evaluate the subquery for every single candidate row processed by the outer query, often resulting in O(N^2) complexity.",
        "key_points": "outer query reference, repeated per-row execution, rewrite with JOINs"
    },
    {
        "id": 56,
        "category": "SQL",
        "difficulty": "Hard",
        "question": "Compare Database Sharding with Database Partitioning.",
        "model_answer": "Partitioning divides a large table into smaller physical pieces (e.g., by range or list) on the same database server instance. Sharding is a horizontal partitioning strategy that distributes chunks of data across multiple independent database servers and network nodes.",
        "key_points": "single-server partitioning vs multi-server distributed sharding"
    },
    {
        "id": 57,
        "category": "SQL",
        "difficulty": "Easy",
        "question": "What is SQL Injection and how do Parameterized Queries eliminate the risk?",
        "model_answer": "SQL Injection occurs when untrusted user input is directly concatenated into a dynamic SQL string, allowing attackers to alter query logic. Parameterized queries precompile the SQL statement template with placeholders, ensuring inputs are strictly treated as literal data, never executable code.",
        "key_points": "input concatenation vulnerability, query precompilation, literal parameter binding"
    },
    {
        "id": 58,
        "category": "SQL",
        "difficulty": "Easy",
        "question": "Explain the function of COALESCE() and NULLIF() in SQL queries.",
        "model_answer": "COALESCE(val1, val2, ...) evaluates arguments in order and returns the first non-NULL value, frequently used to provide fallback defaults. NULLIF(val1, val2) returns NULL if both arguments are equal; otherwise it returns val1, commonly used to prevent division by zero errors.",
        "key_points": "COALESCE first non-null fallback, NULLIF equality check, zero-division safeguard"
    },
    {
        "id": 59,
        "category": "SQL",
        "difficulty": "Hard",
        "question": "What is Write-Ahead Logging (WAL) and how does it guarantee durability?",
        "model_answer": "Write-Ahead Logging dictates that changes must be written and synced to sequential disk log files before the corresponding modified data pages are flushed to actual table storage. In the event of an abrupt system power loss, the database replays the WAL logs to restore committed data.",
        "key_points": "sequential append-only logging, crash recovery, checkpointing, durability"
    },
    {
        "id": 60,
        "category": "SQL",
        "difficulty": "Medium",
        "question": "When should an engineering team choose NoSQL over a Relational RDBMS?",
        "model_answer": "Choose NoSQL (Document, Key-Value, Columnar) when dealing with unstructured/polymorphic schemas, massive horizontal scale-out requirements, extreme write velocities, or denormalized document access. Choose Relational SQL for strong ACID consistency, complex multi-table joins, and financial transactions.",
        "key_points": "flexible schema, horizontal sharding, high write throughput vs ACID relational joins"
    },
    {
        "id": 61,
        "category": "System Design",
        "difficulty": "Hard",
        "question": "How do you architect a web system to handle 100,000 concurrent requests per second?",
        "model_answer": "Use DNS Geo-routing and CDN edge caching for static assets. Place stateless application servers behind auto-scaling Load Balancers (like Nginx/HAProxy). Implement distributed in-memory caching (Redis cluster) for hot reads. Use database primary-replica setups with sharding, and decouple write paths using Kafka message queues.",
        "key_points": "CDN edge, stateless API layers, Redis caching, DB read replicas, Kafka queues"
    },
    {
        "id": 62,
        "category": "System Design",
        "difficulty": "Easy",
        "question": "Compare Horizontal Scaling (Scale-Out) with Vertical Scaling (Scale-Up).",
        "model_answer": "Vertical scaling upgrades the compute specifications (CPU, RAM, NVMe disk) of a single server; it has strict hardware ceilings and introduces a single point of failure. Horizontal scaling adds more commodity servers to the cluster pool, offering elastic scale and fault tolerance through redundancy.",
        "key_points": "single machine upgrade vs multi-machine cluster, hardware ceiling, fault tolerance"
    },
    {
        "id": 63,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "Explain common Load Balancing algorithms and when to use each.",
        "model_answer": "Round Robin distributes requests sequentially across servers. Weighted Round Robin accounts for server capacity. Least Connections routes traffic to the server currently handling the fewest active connections, ideal for long-lived sessions. IP Hash routes traffic based on client IP for session persistence.",
        "key_points": "Round Robin, Least Connections, IP Hash for sticky sessions, health checks"
    },
    {
        "id": 64,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "What are the architectural tradeoffs between Monolithic and Microservices architectures?",
        "model_answer": "Monoliths offer simpler deployments, lower network overhead, and straightforward end-to-end debugging, but can become cumbersome to scale independently. Microservices enable independent team deployment, technology flexibility, and isolated scaling, but introduce distributed tracing, network latency, and eventual consistency challenges.",
        "key_points": "deployment simplicity vs independent scalability, network latency, distributed systems"
    },
    {
        "id": 65,
        "category": "System Design",
        "difficulty": "Hard",
        "question": "Explain the CAP Theorem and its implications for distributed databases.",
        "model_answer": "The CAP theorem states that a distributed data system across a network can guarantee at most two of: Consistency (every read receives the most recent write), Availability (every non-failing node returns a response), and Partition Tolerance (system functions despite dropped network packets). Under network partition, a system must choose between CP or AP.",
        "key_points": "Consistency, Availability, Partition Tolerance, CP vs AP trade-off under network split"
    },
    {
        "id": 66,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "How does Primary-Replica (Master-Slave) database replication work and what is replication lag?",
        "model_answer": "All write operations are executed on the primary database node, which writes to its transaction log. Replica nodes stream this log asynchronously or semi-synchronously to update their local copies for read scaling. Replication lag is the delay between a write committing on primary and appearing on replicas.",
        "key_points": "write to primary, read from replicas, asynchronous log streaming, replication lag"
    },
    {
        "id": 67,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "How do in-memory caches work and what are standard cache eviction policies?",
        "model_answer": "In-memory caches (Redis, Memcached) store frequently accessed key-value objects in RAM for sub-millisecond retrieval. When memory is full, eviction policies discard items: LRU (Least Recently Used) removes the oldest accessed item; LFU (Least Frequently Used) removes items with lowest access count; FIFO evicts oldest inserted.",
        "key_points": "sub-millisecond RAM access, LRU, LFU, FIFO, TTL expiration"
    },
    {
        "id": 68,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "Compare Cache-Aside, Write-Through, and Write-Back caching strategies.",
        "model_answer": "In Cache-Aside, the app reads from cache; on miss, it reads DB and populates cache. In Write-Through, data is written to cache and DB synchronously, ensuring strong consistency but higher write latency. In Write-Back, data is written to cache and acknowledged immediately, then flushed to DB asynchronously for maximum write throughput.",
        "key_points": "Cache-Aside (lazy load), Write-Through (synchronous), Write-Back (async batch)"
    },
    {
        "id": 69,
        "category": "System Design",
        "difficulty": "Easy",
        "question": "What is a Content Delivery Network (CDN) and how does Edge Caching reduce user latency?",
        "model_answer": "A CDN is a geographically distributed network of proxy edge servers (PoPs). By caching static media (images, videos, JS, CSS) close to end-users geographically, requests avoid traveling to origin servers, drastically decreasing round-trip time (RTT) and offloading origin bandwidth.",
        "key_points": "Points of Presence (PoPs), geographical proximity, RTT reduction, origin offloading"
    },
    {
        "id": 70,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "How would you design a scalable URL Shortener service (like Bitly)?",
        "model_answer": "Generate unique 64-bit integer IDs (using a distributed counter or Snowflake ID generator), then encode the integer into a 7-character string using Base62 encoding ([a-zA-Z0-9]). Store (short_key, original_url) in a distributed database and cache hot URLs in Redis with an HTTP 301/302 redirect endpoint.",
        "key_points": "Base62 encoding, unique ID generation, Redis cache, HTTP 301 vs 302"
    },
    {
        "id": 71,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "Why are Asynchronous Message Queues (Kafka / RabbitMQ) essential in distributed architectures?",
        "model_answer": "Message queues decouple producer services from consumers, smoothing out sudden traffic spikes via rate buffering. They allow asynchronous background processing (emails, order fulfillment, video encoding) and ensure that consumers can process jobs at their own pace without failing the caller.",
        "key_points": "service decoupling, traffic spike smoothing, asynchronous workers, fault isolation"
    },
    {
        "id": 72,
        "category": "System Design",
        "difficulty": "Hard",
        "question": "What is Consistent Hashing and why is it used in distributed caching and database sharding?",
        "model_answer": "Traditional modulo hashing (hash(key) % N) requires remapping nearly all keys when a server node is added or removed. Consistent Hashing maps both servers and keys onto a circular 360-degree hash ring. When a server joins or leaves, only K/N keys are moved on average, minimizing cache churn.",
        "key_points": "hash ring, virtual nodes for uniform distribution, minimal key remapping (K/N)"
    },
    {
        "id": 73,
        "category": "System Design",
        "difficulty": "Hard",
        "question": "Explain API Rate Limiting algorithms: Token Bucket vs Leaky Bucket vs Sliding Window.",
        "model_answer": "Token Bucket adds tokens to a bucket at a constant rate; requests consume tokens and allows bursts up to bucket capacity. Leaky Bucket processes requests at a strictly constant rate from a FIFO queue, smoothing out bursts. Sliding Window Log records timestamps in Redis sorted sets, offering precise rate control.",
        "key_points": "Token Bucket (allows bursts), Leaky Bucket (smooth constant rate), Sliding Window Log"
    },
    {
        "id": 74,
        "category": "System Design",
        "difficulty": "Hard",
        "question": "What are the challenges of Database Sharding and how are cross-shard queries handled?",
        "model_answer": "Sharding distributes data across database instances. Challenges include handling cross-shard joins (which require distributed query scatter-gather coordinators), transaction coordination across nodes (requiring 2-Phase Commit), rebalancing hotspots, and maintaining referential integrity.",
        "key_points": "shard key selection, scatter-gather queries, two-phase commit, resharding hotspots"
    },
    {
        "id": 75,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "Compare WebSockets, Server-Sent Events (SSE), and Long Polling for real-time systems.",
        "model_answer": "Long Polling keeps HTTP requests open until data is available, incurring high header overhead on reconnect. SSE provides a unidirectional persistent HTTP connection from server to client, ideal for live feeds and stock tickers. WebSockets establish a full-duplex, bidirectional TCP connection for chats and gaming.",
        "key_points": "Long Polling (HTTP overhead), SSE (unidirectional stream), WebSockets (full-duplex TCP)"
    },
    {
        "id": 76,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "What is the Circuit Breaker pattern and how does it prevent cascading failures in microservices?",
        "model_answer": "The Circuit Breaker monitors calls to external dependencies. In \"Closed\" state, calls pass through. When errors exceed a threshold, it trips to \"Open\", failing immediately without waiting for timeouts. After a cooldown, it enters \"Half-Open\", testing if dependency recovered before returning to Closed.",
        "key_points": "Closed, Open, Half-Open states, fail-fast protection, cascading failure prevention"
    },
    {
        "id": 77,
        "category": "System Design",
        "difficulty": "Medium",
        "question": "How do you design an Idempotent API endpoint for payment transactions?",
        "model_answer": "The client generates a unique UUID \"Idempotency-Key\" and sends it in the HTTP request header. The server checks Redis; if the key exists, it returns the cached response or rejects the duplicate. If new, it executes the payment inside an atomic transaction, caches the result, and returns success.",
        "key_points": "Idempotency-Key header, distributed atomic lock, cached response return"
    },
    {
        "id": 78,
        "category": "System Design",
        "difficulty": "Easy",
        "question": "What is a Single Point of Failure (SPOF) and how do you achieve High Availability (HA)?",
        "model_answer": "A SPOF is any component whose failure halts the entire system. High Availability eliminates SPOFs through redundancy at every layer: multi-region deployments, active-passive/active-active load balancer pairs, automated database failover, and self-healing container orchestrators.",
        "key_points": "redundancy at all layers, active-passive failover, multi-AZ deployment, N+1 redundancy"
    },
    {
        "id": 79,
        "category": "System Design",
        "difficulty": "Hard",
        "question": "Explain Strong Consistency vs Eventual Consistency in distributed systems.",
        "model_answer": "Strong consistency guarantees that any read returns the latest committed write immediately, but sacrifices write latency and availability under network partitions. Eventual consistency allows temporary stale reads while updates propagate across replicas asynchronously, reaching convergence over time.",
        "key_points": "synchronous replica coordination vs asynchronous propagation, PACELC theorem"
    },
    {
        "id": 80,
        "category": "System Design",
        "difficulty": "Hard",
        "question": "How do you generate globally unique, sortable IDs in a distributed system (like Twitter Snowflake)?",
        "model_answer": "Use a 64-bit integer composed of: 1 sign bit, 41 timestamp bits (giving ~69 years of millisecond precision), 10 worker/datacenter machine bits, and 12 sequence counter bits (allowing 4,096 IDs per millisecond per node). The IDs are naturally time-sortable and generated without database locks.",
        "key_points": "64-bit binary format, 41-bit timestamp, 10-bit machine ID, 12-bit sequence counter"
    }
];

    const INITIAL_LEADERBOARD = [
        { id: 1, rank: 1, full_name: 'Rahul Sharma', username: 'student', college: 'NIT Trichy', target_role: 'AI/ML Engineer', avg_aptitude: 92.5, avg_interview: 8.8, composite_score: 89.2 },
        { id: 2, rank: 2, full_name: 'Priya Patel', username: 'priya', college: 'IIT Madras', target_role: 'Software Engineer', avg_aptitude: 90.0, avg_interview: 8.6, composite_score: 87.5 },
        { id: 3, rank: 3, full_name: 'Ananya Iyer', username: 'ananya', college: 'BITS Pilani', target_role: 'Full Stack Developer', avg_aptitude: 88.0, avg_interview: 8.4, composite_score: 85.8 },
        { id: 4, rank: 4, full_name: 'Rohan Verma', username: 'rohan', college: 'NIT Surathkal', target_role: 'Cloud / DevOps Engineer', avg_aptitude: 86.5, avg_interview: 8.2, composite_score: 84.1 },
        { id: 5, rank: 5, full_name: 'Siddharth Nair', username: 'siddharth', college: 'VIT Vellore', target_role: 'Data Analyst', avg_aptitude: 84.0, avg_interview: 8.0, composite_score: 82.2 },
        { id: 6, rank: 6, full_name: 'Sneha Reddy', username: 'sneha', college: 'PSG Tech', target_role: 'Cybersecurity Analyst', avg_aptitude: 81.5, avg_interview: 7.9, composite_score: 80.4 }
    ];

    // -------------------------------------------------------------
    // STORE DEFINITION
    // -------------------------------------------------------------
    const CareerXStore = {
        init: function () {
            const currentUsers = this.getAllUsers();
            const storedQuestions = JSON.parse(localStorage.getItem('careerx_interview_q') || '[]');
            if (storedQuestions.length < 80) {
                localStorage.setItem('careerx_interview_q', JSON.stringify(INITIAL_INTERVIEW_QUESTIONS));
            }
            if (!localStorage.getItem('careerx_initialized_v3') || currentUsers.length < 7) {
                localStorage.setItem('careerx_users', JSON.stringify(INITIAL_USERS));
                if (!localStorage.getItem('careerx_user')) {
                    localStorage.setItem('careerx_user', JSON.stringify(INITIAL_USERS[0]));
                }
                localStorage.setItem('careerx_drives', JSON.stringify(INITIAL_DRIVES));
                localStorage.setItem('careerx_applications', JSON.stringify(INITIAL_APPLICATIONS));
                localStorage.setItem('careerx_skills', JSON.stringify(INITIAL_SKILLS));
                localStorage.setItem('careerx_badges', JSON.stringify(INITIAL_BADGES));
                localStorage.setItem('careerx_notices', JSON.stringify(INITIAL_NOTICES));
                localStorage.setItem('careerx_roadmaps', JSON.stringify(INITIAL_ROADMAPS));
                localStorage.setItem('careerx_completed_steps', JSON.stringify([
                    "Master Python, NumPy, Pandas & Vectorized Math",
                    "Linear Algebra, Calculus & Probability for Machine Learning",
                    "Classical Machine Learning (Regression, Random Forests, XGBoost)"
                ]));
                localStorage.setItem('careerx_aptitude_q', JSON.stringify(INITIAL_APTITUDE_QUESTIONS));
                localStorage.setItem('careerx_interview_q', JSON.stringify(INITIAL_INTERVIEW_QUESTIONS));
                localStorage.setItem('careerx_leaderboard', JSON.stringify(INITIAL_LEADERBOARD));
                if (!localStorage.getItem('careerx_diagnostics')) {
                    localStorage.setItem('careerx_diagnostics', JSON.stringify({
                        cgpa: 8.5,
                        aptitude: 85,
                        ats: 86,
                        mock: 8.4,
                        skills_logged: 8,
                        target_role: 'AI/ML Engineer'
                    }));
                }
                localStorage.setItem('careerx_initialized_v3', 'true');
            }
        },

        // --- AUTH & USER MANAGEMENT ---
        getUser: function () {
            try {
                const u = localStorage.getItem('careerx_user');
                return u ? JSON.parse(u) : INITIAL_USERS[0];
            } catch (e) {
                return INITIAL_USERS[0];
            }
        },

        setUser: function (userData) {
            localStorage.setItem('careerx_user', JSON.stringify(userData));
            const users = this.getAllUsers();
            const idx = users.findIndex(u => u.username === userData.username || u.id === userData.id);
            if (idx >= 0) {
                users[idx] = { ...users[idx], ...userData };
            } else {
                users.push(userData);
            }
            localStorage.setItem('careerx_users', JSON.stringify(users));
        },

        getAllUsers: function () {
            try {
                const u = localStorage.getItem('careerx_users');
                return u ? JSON.parse(u) : INITIAL_USERS;
            } catch (e) {
                return INITIAL_USERS;
            }
        },

        login: function (username, password) {
            const users = this.getAllUsers();
            const cleanUser = (username || '').trim().toLowerCase();
            const found = users.find(u =>
                (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) &&
                (!password || u.password === password)
            );

            if (found) {
                localStorage.setItem('careerx_user', JSON.stringify(found));
                // Sync target role in diagnostics if student
                if (found.role === 'student' && found.target_role) {
                    this.updateDiagnostics({ target_role: found.target_role });
                }
                return { success: true, user: found };
            }

            // Quick demo aliases matching
            const aliasMap = {
                'student': INITIAL_USERS[0],
                'rahul': INITIAL_USERS[0],
                'priya': INITIAL_USERS[1],
                'ananya': INITIAL_USERS[2],
                'rohan': INITIAL_USERS[3],
                'siddharth': INITIAL_USERS[4],
                'sid': INITIAL_USERS[4],
                'sneha': INITIAL_USERS[5],
                'admin': INITIAL_USERS[6]
            };

            if (aliasMap[cleanUser]) {
                const u = aliasMap[cleanUser];
                localStorage.setItem('careerx_user', JSON.stringify(u));
                if (u.role === 'student' && u.target_role) {
                    this.updateDiagnostics({ target_role: u.target_role });
                }
                return { success: true, user: u };
            }

            return { success: false, error: 'Invalid credentials. Please click any demo profile above.' };
        },

        register: function (data) {
            const users = this.getAllUsers();
            if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
                return { success: false, error: 'Username already exists. Please pick another.' };
            }

            const newUser = {
                id: Date.now(),
                username: data.username,
                password: data.password,
                role: data.role || 'student',
                full_name: data.full_name || data.username,
                email: data.email,
                college: data.college || 'Engineering Institute',
                branch: data.branch || 'Computer Science',
                grad_year: parseInt(data.grad_year || 2025),
                target_role: data.target_role || 'Software Engineer',
                bio: data.bio || 'Placement candidate.'
            };

            users.push(newUser);
            localStorage.setItem('careerx_users', JSON.stringify(users));
            localStorage.setItem('careerx_user', JSON.stringify(newUser));
            return { success: true, user: newUser };
        },

        logout: function () {
            // Revert to demo student state
            localStorage.setItem('careerx_user', JSON.stringify(INITIAL_USERS[0]));
        },

        // --- DRIVES & APPLICATIONS ---
        getDrives: function () {
            try {
                const stored = localStorage.getItem('careerx_drives');
                const list = stored ? JSON.parse(stored) : null;
                return (list && list.length > 0) ? list : INITIAL_DRIVES;
            } catch (e) {
                return INITIAL_DRIVES;
            }
        },

        addDrive: function (drive) {
            const drives = this.getDrives();
            drive.id = Date.now();
            drive.status = drive.status || 'Open';
            drives.unshift(drive);
            localStorage.setItem('careerx_drives', JSON.stringify(drives));
            return drive;
        },

        applyToDrive: function (driveId, company, role, package_lpa, location) {
            const driveIdStr = String(driveId);
            const user = this.getUser();
            const userKey = user && user.username ? user.username : 'student';
            localStorage.setItem('careerx_applied_' + userKey + '_' + driveIdStr, 'true');
            localStorage.setItem('careerx_applied_' + driveIdStr, 'true');

            // Find drive details from store
            const drives = this.getDrives();
            const drive = drives.find(d => String(d.id) === driveIdStr) || {};
            const comp = company || drive.company || 'Campus Recruiter';
            const r = role || drive.role || 'Graduate Engineer Trainee';
            const pkg = parseFloat(package_lpa || drive.package_lpa || 15.0);
            const loc = location || drive.location || 'Campus Selection';

            // Add to applications
            const apps = this.getApplications();
            const exists = apps.find(a => 
                (a.drive_id && String(a.drive_id) === driveIdStr) ||
                (a.company.toLowerCase() === comp.toLowerCase() && a.role.toLowerCase() === r.toLowerCase())
            );

            if (!exists) {
                const newApp = {
                    id: Date.now(),
                    drive_id: driveId,
                    student_username: userKey,
                    student_name: user ? user.full_name : 'Rahul Sharma',
                    company: comp,
                    role: r,
                    location: loc,
                    salary_lpa: pkg,
                    apply_date: new Date().toISOString().split('T')[0],
                    status: 'Applied',
                    notes: 'Submitted via 1-Click Campus Drive portal.'
                };
                apps.unshift(newApp);
                localStorage.setItem('careerx_applications', JSON.stringify(apps));
            }
            return true;
        },

        isDriveApplied: function (driveId) {
            const driveIdStr = String(driveId);
            const user = this.getUser();
            const userKey = user && user.username ? user.username : 'student';
            if (localStorage.getItem('careerx_applied_' + userKey + '_' + driveIdStr) === 'true') {
                return true;
            }
            if (localStorage.getItem('careerx_applied_' + driveIdStr) === 'true') {
                return true;
            }
            const apps = this.getApplications();
            return apps.some(a => String(a.drive_id) === driveIdStr);
        },

        deleteDrive: function (driveId) {
            let drives = this.getDrives();
            drives = drives.filter(d => String(d.id) !== String(driveId));
            localStorage.setItem('careerx_drives', JSON.stringify(drives));
            return drives;
        },

        getApplications: function () {
            try {
                const stored = localStorage.getItem('careerx_applications');
                const list = stored ? JSON.parse(stored) : null;
                return (list && list.length > 0) ? list : INITIAL_APPLICATIONS;
            } catch (e) {
                return INITIAL_APPLICATIONS;
            }
        },

        addApplication: function (app) {
            const apps = this.getApplications();
            app.id = Date.now();
            apps.unshift(app);
            localStorage.setItem('careerx_applications', JSON.stringify(apps));
            return app;
        },

        updateApplicationStatus: function (id, newStatus) {
            const apps = this.getApplications();
            const target = apps.find(a => String(a.id) === String(id));
            if (target) {
                target.status = newStatus;
                localStorage.setItem('careerx_applications', JSON.stringify(apps));
                return true;
            }
            return false;
        },

        deleteApplication: function (id) {
            let apps = this.getApplications();
            apps = apps.filter(a => String(a.id) !== String(id));
            localStorage.setItem('careerx_applications', JSON.stringify(apps));
            return true;
        },

        // --- SKILLS & BADGES ---
        getSkills: function () {
            try {
                const stored = localStorage.getItem('careerx_skills');
                const list = stored ? JSON.parse(stored) : null;
                return (list && list.length > 0) ? list : INITIAL_SKILLS;
            } catch (e) {
                return INITIAL_SKILLS;
            }
        },

        addSkill: function (skill) {
            const skills = this.getSkills();
            skill.id = Date.now();
            skills.push(skill);
            localStorage.setItem('careerx_skills', JSON.stringify(skills));
            return skill;
        },

        deleteSkill: function (id) {
            let skills = this.getSkills();
            skills = skills.filter(s => String(s.id) !== String(id));
            localStorage.setItem('careerx_skills', JSON.stringify(skills));
            return true;
        },

        getBadges: function () {
            try {
                const stored = localStorage.getItem('careerx_badges');
                const list = stored ? JSON.parse(stored) : null;
                return (list && list.length > 0) ? list : INITIAL_BADGES;
            } catch (e) {
                return INITIAL_BADGES;
            }
        },

        // --- NOTICES ---
        getNotices: function () {
            try {
                const stored = localStorage.getItem('careerx_notices');
                const list = stored ? JSON.parse(stored) : null;
                return (list && list.length > 0) ? list : INITIAL_NOTICES;
            } catch (e) {
                return INITIAL_NOTICES;
            }
        },

        addNotice: function (notice) {
            const notices = this.getNotices();
            notice.id = Date.now();
            notices.unshift(notice);
            localStorage.setItem('careerx_notices', JSON.stringify(notices));
            return notice;
        },

        // --- ROADMAPS ---
        getRoadmaps: function () {
            try {
                const stored = localStorage.getItem('careerx_roadmaps');
                const list = stored ? JSON.parse(stored) : null;
                return list || INITIAL_ROADMAPS;
            } catch (e) {
                return INITIAL_ROADMAPS;
            }
        },

        getCompletedSteps: function (role) {
            try {
                const stored = localStorage.getItem('careerx_roadmap_' + role);
                if (stored) return JSON.parse(stored);
                return JSON.parse(localStorage.getItem('careerx_completed_steps') || '[]');
            } catch (e) {
                return [];
            }
        },

        saveRoadmapProgress: function (role, completedSteps) {
            localStorage.setItem('careerx_roadmap_' + role, JSON.stringify(completedSteps));
            localStorage.setItem('careerx_completed_steps', JSON.stringify(completedSteps));
        },

        // --- QUESTIONS & TESTS ---
        getAptitudeQuestions: function (category) {
            try {
                const stored = localStorage.getItem('careerx_aptitude_q');
                let all = stored ? JSON.parse(stored) : null;
                if (!all || all.length === 0) all = INITIAL_APTITUDE_QUESTIONS;
                if (!category || category === 'All') return all;
                return all.filter(q => q.category.toLowerCase() === category.toLowerCase());
            } catch (e) {
                return INITIAL_APTITUDE_QUESTIONS;
            }
        },

        addAptitudeQuestion: function (q) {
            const list = this.getAptitudeQuestions('All');
            q.id = Date.now();
            list.push(q);
            localStorage.setItem('careerx_aptitude_q', JSON.stringify(list));
            return q;
        },

        getInterviewQuestions: function (category) {
            try {
                const stored = localStorage.getItem('careerx_interview_q');
                let all = stored ? JSON.parse(stored) : null;
                if (!all || all.length === 0) all = INITIAL_INTERVIEW_QUESTIONS;
                if (!category || category === 'All') return all;
                return all.filter(q => q.category.toLowerCase() === category.toLowerCase());
            } catch (e) {
                return INITIAL_INTERVIEW_QUESTIONS;
            }
        },

        addInterviewQuestion: function (q) {
            const list = this.getInterviewQuestions('All');
            q.id = Date.now();
            list.push(q);
            localStorage.setItem('careerx_interview_q', JSON.stringify(list));
            return q;
        },

        // --- LEADERBOARD & DIAGNOSTICS ---
        getLeaderboard: function () {
            try {
                const stored = localStorage.getItem('careerx_leaderboard');
                const list = stored ? JSON.parse(stored) : null;
                return (list && list.length > 0) ? list : INITIAL_LEADERBOARD;
            } catch (e) {
                return INITIAL_LEADERBOARD;
            }
        },

        getDiagnostics: function () {
            try {
                const diag = localStorage.getItem('careerx_diagnostics');
                if (diag) return JSON.parse(diag);
            } catch (e) { }
            return {
                cgpa: 8.5,
                aptitude: 85,
                ats: 86,
                mock: 8.4,
                skills_logged: 8,
                target_role: 'AI/ML Engineer'
            };
        },

        updateDiagnostics: function (newVals) {
            const current = this.getDiagnostics();
            const updated = { ...current, ...newVals };
            localStorage.setItem('careerx_diagnostics', JSON.stringify(updated));
            return updated;
        }
    };

    // Auto-initialize store on load
    CareerXStore.init();
    window.CareerXStore = CareerXStore;

})(window);

