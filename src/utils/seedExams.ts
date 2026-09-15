import { db } from '../firebase';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';

export const sampleExamsData = [
  {
    title: 'Data Structures & Algorithms Comprehensive Assessment',
    subject: 'Computer Science',
    topic: 'DSA & Algorithms',
    duration: 30,
    totalMarks: 50,
    passPercentage: 60,
    description: 'Master core algorithmic thinking including binary trees, graphs, sorting efficiency, and time complexity analysis.',
    questions: [
      {
        questionText: 'What is the worst-case time complexity of QuickSort?',
        options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(1)'],
        correctAnswer: 1,
        explanation: 'QuickSort exhibits O(N^2) worst-case performance when the pivot selected is consistently the minimum or maximum element.'
      },
      {
        questionText: 'Which data structure follows the Last-In-First-Out (LIFO) principle?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        correctAnswer: 1,
        explanation: 'Stack operates on LIFO where the last element inserted is the first to be popped.'
      },
      {
        questionText: 'What is the space complexity of Depth First Search (DFS) on a tree of depth D?',
        options: ['O(1)', 'O(D)', 'O(V+E)', 'O(2^D)'],
        correctAnswer: 1,
        explanation: 'DFS uses call stack memory proportional to the maximum tree depth D.'
      },
      {
        questionText: 'Which traversal of a Binary Search Tree (BST) retrieves elements in sorted ascending order?',
        options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
        correctAnswer: 1,
        explanation: 'In-order traversal (Left -> Node -> Right) visits nodes of a BST in ascending numerical order.'
      },
      {
        questionText: 'What is the time complexity to search for an item in a balanced Binary Search Tree?',
        options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'],
        correctAnswer: 2,
        explanation: 'A balanced BST halves the search space at each step, yielding logarithmic O(log N) time.'
      }
    ]
  },
  {
    title: 'Web Development & React 18 Mastery',
    subject: 'Web Technologies',
    topic: 'React, Modern JS & CSS',
    duration: 25,
    totalMarks: 40,
    passPercentage: 50,
    description: 'Comprehensive test covering React 18 concurrent features, Hooks, JSX lifecycle, and responsive CSS Tailwind layout.',
    questions: [
      {
        questionText: 'Which React hook is used to handle side-effects such as data fetching or subscriptions?',
        options: ['useMemo', 'useCallback', 'useEffect', 'useState'],
        correctAnswer: 2,
        explanation: 'useEffect triggers side-effects after DOM renders based on dependency array changes.'
      },
      {
        questionText: 'What is the purpose of React Virtual DOM?',
        options: ['Directly modify HTML file', 'Minimize real DOM manipulation for faster UI rendering', 'Store database passwords', 'Compile TypeScript'],
        correctAnswer: 1,
        explanation: 'Virtual DOM compares light UI trees in memory (diffing algorithm) to batch minimal real DOM updates.'
      },
      {
        questionText: 'What key prop requirement does React enforce when rendering lists of items?',
        options: ['Must be unique across sibling elements', 'Must be a CSS class name', 'Must be an integer only', 'Must be random uuid'],
        correctAnswer: 0,
        explanation: 'Unique keys help React identify added, changed, or removed list items efficiently.'
      },
      {
        questionText: 'What CSS layout module is best suited for 1-dimensional row or column alignment?',
        options: ['Grid', 'Flexbox', 'Float', 'Absolute Positioning'],
        correctAnswer: 1,
        explanation: 'Flexbox is designed for 1D layouts along a main axis, while Grid is designed for 2D layouts.'
      }
    ]
  },
  {
    title: 'Database Management Systems & SQL Fundamentals',
    subject: 'Database Systems',
    topic: 'Relational DB & SQL',
    duration: 20,
    totalMarks: 30,
    passPercentage: 50,
    description: 'Test your understanding of SQL queries, joins, relational normalization (1NF-3NF), indexing, and ACID guarantees.',
    questions: [
      {
        questionText: 'Which SQL clause is used to filter aggregated group records produced by GROUP BY?',
        options: ['WHERE', 'HAVING', 'ORDER BY', 'SELECT'],
        correctAnswer: 1,
        explanation: 'HAVING filters results after GROUP BY aggregation, whereas WHERE filters individual rows prior to grouping.'
      },
      {
        questionText: 'What does the "A" in ACID database transactions stand for?',
        options: ['Availability', 'Atomicity', 'Authentication', 'Algorithm'],
        correctAnswer: 1,
        explanation: 'Atomicity ensures that all operations within a transaction succeed completely or roll back entirely.'
      },
      {
        questionText: 'Which SQL JOIN returns all rows from the left table and matching records from the right table?',
        options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'],
        correctAnswer: 2,
        explanation: 'LEFT JOIN keeps all rows from the left relation, substituting NULL for missing right matches.'
      },
      {
        questionText: 'Normal form 3NF eliminates which type of functional dependency?',
        options: ['Partial dependency', 'Transitive dependency', 'Multivalued dependency', 'Key dependency'],
        correctAnswer: 1,
        explanation: '3NF requires that non-prime attributes strictly depend ONLY on candidate keys, eliminating transitive dependencies.'
      }
    ]
  },
  {
    title: 'Operating Systems & System Architecture',
    subject: 'Computer Science',
    topic: 'OS Concepts',
    duration: 25,
    totalMarks: 40,
    passPercentage: 55,
    description: 'Assessment on process thread scheduling, virtual memory management, deadlock prevention, and system calls.',
    questions: [
      {
        questionText: 'Which condition is NOT one of the 4 necessary conditions for a deadlock to occur?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption', 'Circular Wait'],
        correctAnswer: 2,
        explanation: 'Deadlock requires NO PREEMPTION. If preemption is allowed, deadlocks can be avoided.'
      },
      {
        questionText: 'What is the primary function of Virtual Memory in modern OS?',
        options: ['Increase GPU clock speed', 'Allow execution of processes larger than physical RAM via paging', 'Compress text files', 'Encrypt hard drives'],
        correctAnswer: 1,
        explanation: 'Virtual memory maps process logical addresses to disk swap space when physical RAM is insufficient.'
      },
      {
        questionText: 'What is thrashing in an operating system?',
        options: ['Overheating of CPU', 'High rate of page swapping causing CPU to spend more time paging than executing', 'Network buffer overflow', 'Disk fragmentation'],
        correctAnswer: 1,
        explanation: 'Thrashing occurs when active process working sets exceed physical memory, causing constant page faults.'
      }
    ]
  },
  {
    title: 'Computer Networks & Security Protocols',
    subject: 'Networking',
    topic: 'TCP/IP & Network Security',
    duration: 30,
    totalMarks: 50,
    passPercentage: 60,
    description: 'Evaluate OSI 7-layer architecture, IP addressing, TCP 3-way handshake, TLS/SSL, and firewall filtering.',
    questions: [
      {
        questionText: 'At which layer of the OSI model does the Internet Protocol (IP) operate?',
        options: ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Application Layer'],
        correctAnswer: 1,
        explanation: 'IP operates at Layer 3 (Network Layer), responsible for packet routing and addressing across networks.'
      },
      {
        questionText: 'What is the standard port number for secure HTTP (HTTPS) communication?',
        options: ['80', '21', '443', '8080'],
        correctAnswer: 2,
        explanation: 'Port 443 is default for TLS/SSL encrypted HTTPS web traffic (Port 80 is unencrypted HTTP).'
      },
      {
        questionText: 'What packet flags are exchanged during the TCP 3-way handshake connection establishment?',
        options: ['SYN -> SYN-ACK -> ACK', 'FIN -> ACK -> FIN', 'RST -> SYN -> ACK', 'PING -> PONG -> ACK'],
        correctAnswer: 0,
        explanation: 'TCP connection setup initiates with SYN from client, SYN-ACK response from server, and final ACK from client.'
      }
    ]
  },
  {
    title: 'Artificial Intelligence & Machine Learning Principles',
    subject: 'Data Science',
    topic: 'AI & ML Foundation',
    duration: 30,
    totalMarks: 50,
    passPercentage: 60,
    description: 'Examines supervised vs unsupervised learning, gradient descent, neural network activation functions, and overfitting.',
    questions: [
      {
        questionText: 'Which algorithm is commonly used to train artificial neural networks by computing gradient errors backwards?',
        options: ['K-Means Clustering', 'Backpropagation', 'Linear Regression', 'A* Search'],
        correctAnswer: 1,
        explanation: 'Backpropagation applies the calculus chain rule to calculate loss gradients and update neural net weights.'
      },
      {
        questionText: 'What technique is used to prevent machine learning models from overfitting on training data?',
        options: ['Increasing model capacity indefinitely', 'L1/L2 Regularization and Dropout', 'Removing validation sets', 'Duplicate training rows'],
        correctAnswer: 1,
        explanation: 'Regularization adds penalty parameters to loss functions while Dropout randomly deactivates neurons during training.'
      },
      {
        questionText: 'Which activation function outputs values constrained between 0 and 1, ideal for binary classification probability?',
        options: ['ReLU', 'Sigmoid', 'Linear', 'Leaky ReLU'],
        correctAnswer: 1,
        explanation: 'Sigmoid maps real values into the range (0, 1), representing probability estimates.'
      }
    ]
  },
  {
    title: 'Python Programming & Advanced Data Science',
    subject: 'Programming Languages',
    topic: 'Python 3, Pandas & Data Structures',
    duration: 25,
    totalMarks: 40,
    passPercentage: 50,
    description: 'Test pythonic idioms, list comprehensions, decorators, generators, and Pandas dataframe data manipulation.',
    questions: [
      {
        questionText: 'What keyword turns a Python function into a generator that yields values lazily one at a time?',
        options: ['return', 'yield', 'emit', 'generate'],
        correctAnswer: 1,
        explanation: 'The yield keyword pauses function execution and returns an iterator value without destroying local state.'
      },
      {
        questionText: 'What is the output of `[x**2 for x in range(4) if x % 2 == 0]` in Python?',
        options: ['[0, 1, 4, 9]', '[0, 4]', '[1, 9]', '[0, 2, 4]'],
        correctAnswer: 1,
        explanation: 'range(4) produces 0, 1, 2, 3. Even numbers are 0 and 2. Squaring them gives [0, 4].'
      }
    ]
  },
  {
    title: 'Cloud Computing & DevOps Practices',
    subject: 'Cloud Engineering',
    topic: 'AWS, Docker & CI/CD',
    duration: 20,
    totalMarks: 30,
    passPercentage: 50,
    description: 'Covers containerization with Docker, Kubernetes pod orchestration, infrastructure as code, and CI/CD automated pipelines.',
    questions: [
      {
        questionText: 'What is the primary benefit of containerization (e.g. Docker) over traditional virtual machines?',
        options: ['Requires full guest OS per container', 'Lightweight resource sharing of host OS kernel with fast startup', 'Hardware emulation', 'No networking allowed'],
        correctAnswer: 1,
        explanation: 'Containers share host OS kernel isolated in user space, rendering them much faster and lighter than full hypervisor VMs.'
      },
      {
        questionText: 'Which Kubernetes object is the smallest deployable unit representing one or more containers?',
        options: ['Cluster', 'Pod', 'Deployment', 'Service'],
        correctAnswer: 1,
        explanation: 'A Pod is the foundational execution unit in Kubernetes containing shared storage/network resources.'
      }
    ]
  },
  {
    title: 'Software Engineering & Agile Methodologies',
    subject: 'Software Engineering',
    topic: 'SDLC, Agile & Design Patterns',
    duration: 25,
    totalMarks: 40,
    passPercentage: 50,
    description: 'Covers Agile Scrum sprints, SOLID design principles, Singleton/Factory patterns, and unit testing practices.',
    questions: [
      {
        questionText: 'What does the "S" in SOLID software design principles stand for?',
        options: ['Single Responsibility Principle', 'System Integration', 'Software Security', 'Sequential Execution'],
        correctAnswer: 0,
        explanation: 'Single Responsibility Principle states a class should have one and only one reason to change.'
      },
      {
        questionText: 'In Agile Scrum, what is the maximum recommended duration for a Daily Standup meeting?',
        options: ['15 Minutes', '45 Minutes', '1 Hour', '2 Hours'],
        correctAnswer: 0,
        explanation: 'Daily Standups are brief 15-minute syncs focused on progress, plans, and blockers.'
      }
    ]
  },
  {
    title: 'Cybersecurity & Ethical Hacking Essentials',
    subject: 'Cybersecurity',
    topic: 'Web Vulnerabilities & Cryptography',
    duration: 30,
    totalMarks: 50,
    passPercentage: 60,
    description: 'Test knowledge on OWASP Top 10, SQL Injection, Cross-Site Scripting (XSS), symmetric vs asymmetric encryption, and IAM.',
    questions: [
      {
        questionText: 'What security vulnerability occurs when untrusted user input is injected into database queries without sanitization?',
        options: ['Cross-Site Scripting (XSS)', 'SQL Injection (SQLi)', 'Buffer Overflow', 'CSRF'],
        correctAnswer: 1,
        explanation: 'SQL Injection allows attackers to manipulate raw SQL statements via unescaped string inputs.'
      },
      {
        questionText: 'Which encryption model uses a public key for encryption and a distinct private key for decryption?',
        options: ['Symmetric Encryption', 'Asymmetric (Public Key) Encryption', 'Hashing (SHA-256)', 'Base64 Encoding'],
        correctAnswer: 1,
        explanation: 'Asymmetric cryptography (such as RSA or ECC) relies on mathematically linked public and private keypairs.'
      }
    ]
  }
];

export const seedSampleExamsToFirestore = async (userId: string = 'system-admin') => {
  try {
    const now = new Date();
    const startTime = Timestamp.fromDate(new Date(now.getTime() - 60 * 60 * 1000)); // 1 hour ago
    const endTime = Timestamp.fromDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)); // 30 days in future

    let count = 0;
    for (const examData of sampleExamsData) {
      const { questions, ...examMeta } = examData;
      
      const examDocRef = await addDoc(collection(db, 'exams'), {
        ...examMeta,
        createdBy: userId,
        createdAt: Timestamp.now(),
        startTime,
        endTime,
        isPublished: true
      });

      // Add subcollection questions
      for (const q of questions) {
        await addDoc(collection(db, `exams/${examDocRef.id}/questions`), q);
      }
      count++;
    }
    return { success: true, count };
  } catch (error: any) {
    console.error("Error seeding exams:", error);
    throw error;
  }
};
