import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  FacultyProfile,
  StudentProfile,
  Quiz,
  Question,
  QuizAttempt,
  LiveSession,
  PracticeQuiz,
  FacultyActivityLog,
  AuditLog
} from '../src/types.js';

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'db.json');

// Password Hash Helper using Crypto
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_quiz_salt_2026').digest('hex');
}

export function comparePassword(inputPassword: string, storedHash: string): boolean {
  return hashPassword(inputPassword) === storedHash;
}

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  practiceQuizzes: PracticeQuiz[];
  facultyLogs: FacultyActivityLog[];
  auditLogs: AuditLog[];
}

// Initial seed data
function createInitialSeedData(): DatabaseSchema {
  const adminPasswordHash = hashPassword('1234');
  const userPasswordHash = hashPassword('1234');

  const adminUser: User & { passwordHash: string } = {
    id: 'user-admin-01',
    email: 'admin@123',
    name: 'System Administrator',
    role: 'ADMIN',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    status: 'ACTIVE',
    passwordHash: adminPasswordHash
  };

  const faculty1: User & { passwordHash: string } = {
    id: 'fac-101',
    email: 'fac@123',
    name: 'Dr. Ramesh Kumar',
    employeeId: 'FAC-CSE-01',
    department: 'Computer Science & Engineering',
    phone: '+91 9876543210',
    role: 'FACULTY',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    passwordHash: userPasswordHash
  };

  const faculty2: User & { passwordHash: string } = {
    id: 'fac-102',
    email: 'sunita@faculty.edu',
    name: 'Prof. Sunita Sharma',
    employeeId: 'FAC-CSE-02',
    department: 'Information Technology',
    phone: '+91 9876543211',
    role: 'FACULTY',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    passwordHash: userPasswordHash
  };

  // 10 Student Test Cases
  const studentNames = [
    { name: 'Rahul Sharma', email: 'rahul@student.edu', id: 'student-01' },
    { name: 'Priya Patel', email: 'priya@student.edu', id: 'student-02' },
    { name: 'Amit Verma', email: 'amit@student.edu', id: 'student-03' },
    { name: 'Sneha Reddy', email: 'sneha@student.edu', id: 'student-04' },
    { name: 'Vikram Singh', email: 'vikram@student.edu', id: 'student-05' },
    { name: 'Ananya Gupta', email: 'ananya@student.edu', id: 'student-06' },
    { name: 'Karthik Nair', email: 'karthik@student.edu', id: 'student-07' },
    { name: 'Pooja Joshi', email: 'pooja@student.edu', id: 'student-08' },
    { name: 'Rohan Mehta', email: 'rohan@student.edu', id: 'student-09' },
    { name: 'Divya Rao', email: 'divya@student.edu', id: 'student-10' },
    { name: 'Pavan', email: 'pavan@123', id: 'student-pavan' }
  ];

  const studentUsers: (User & { passwordHash: string })[] = studentNames.map((s, idx) => ({
    id: s.id,
    email: s.email,
    name: s.name,
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - (15 - idx) * 86400000).toISOString(),
    passwordHash: userPasswordHash
  }));

  // Initial Published Quizzes created by Faculty
  const seededQuizzes: Quiz[] = [
    {
      id: 'quiz-dsa-101',
      title: 'Data Structures & Algorithms Midterm Exam',
      description: 'Midterm assessment on Binary Trees, Recursion, Time Complexity, and Merge Sort.',
      topic: 'Data Structures',
      category: 'Computer Science',
      difficulty: 'Medium',
      secretCode: 'DSA7K29X',
      totalMarks: 5,
      passingPercentage: 50,
      createdByFacultyId: 'fac-101',
      facultyName: 'Dr. Ramesh Kumar',
      status: 'Published',
      settings: {
        durationMinutes: 30,
        marksPerQuestion: 1,
        enableNegativeMarking: false,
        negativeMarks: 0,
        maxAttempts: 1,
        randomizeQuestions: true,
        randomizeOptions: true,
        allowPreviousNavigation: true,
        allowMarkForReview: true,
        showResultsImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        enableAntiCheating: true
      },
      schedule: {},
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
      questions: [
        {
          id: 'q-dsa-1',
          question: 'What is the worst-case time complexity of searching in a balanced Binary Search Tree?',
          options: [
            { key: 'A', text: 'O(1)' },
            { key: 'B', text: 'O(log n)' },
            { key: 'C', text: 'O(n)' },
            { key: 'D', text: 'O(n log n)' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          topic: 'Trees'
        },
        {
          id: 'q-dsa-2',
          question: 'What is the output of compute(4) for recursive factorial function?',
          codeSnippet: `int compute(int n) {\n    if (n <= 1) return 1;\n    return n * compute(n - 1);\n}`,
          options: [
            { key: 'A', text: '10' },
            { key: 'B', text: '16' },
            { key: 'C', text: '24' },
            { key: 'D', text: '12' }
          ],
          correctAnswer: 'C',
          marks: 1,
          difficulty: 'Easy',
          topic: 'Recursion'
        },
        {
          id: 'q-dsa-3',
          question: 'Which sorting algorithm guarantees a worst-case time complexity of O(n log n)?',
          options: [
            { key: 'A', text: 'Quick Sort' },
            { key: 'B', text: 'Merge Sort' },
            { key: 'C', text: 'Bubble Sort' },
            { key: 'D', text: 'Insertion Sort' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Medium',
          topic: 'Sorting'
        },
        {
          id: 'q-dsa-4',
          question: 'What data structure is fundamentally used for Breadth-First Search (BFS)?',
          options: [
            { key: 'A', text: 'Stack' },
            { key: 'B', text: 'Queue' },
            { key: 'C', text: 'Priority Queue' },
            { key: 'D', text: 'Hash Table' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          topic: 'Graphs'
        },
        {
          id: 'q-dsa-5',
          question: 'In Floyd-Warshall algorithm, what is the time complexity?',
          options: [
            { key: 'A', text: 'O(V³)' },
            { key: 'B', text: 'O(V²)' },
            { key: 'C', text: 'O(E log V)' },
            { key: 'D', text: 'O(V + E)' }
          ],
          correctAnswer: 'A',
          marks: 1,
          difficulty: 'Hard',
          topic: 'Graphs'
        }
      ]
    },
    {
      id: 'quiz-dbms-102',
      title: 'DBMS Relational Algebra & SQL Assessment',
      description: 'Assessment covering Normalization, SQL Left Joins, and ACID Properties.',
      topic: 'DBMS',
      category: 'Computer Science',
      difficulty: 'Medium',
      secretCode: 'DBMS101',
      totalMarks: 2,
      passingPercentage: 50,
      createdByFacultyId: 'fac-102',
      facultyName: 'Prof. Sunita Sharma',
      status: 'Published',
      settings: {
        durationMinutes: 25,
        marksPerQuestion: 1,
        enableNegativeMarking: false,
        negativeMarks: 0,
        maxAttempts: 1,
        randomizeQuestions: true,
        randomizeOptions: true,
        allowPreviousNavigation: true,
        allowMarkForReview: true,
        showResultsImmediately: true,
        showCorrectAnswers: true,
        showExplanations: true,
        enableAntiCheating: true
      },
      schedule: {},
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      questions: [
        {
          id: 'q-dbms-1',
          question: 'Which Normal Form eliminates Transitive Dependency?',
          options: [
            { key: 'A', text: '1NF' },
            { key: 'B', text: '2NF' },
            { key: 'C', text: '3NF' },
            { key: 'D', text: 'BCNF' }
          ],
          correctAnswer: 'C',
          marks: 1,
          difficulty: 'Medium',
          topic: 'Normalization'
        },
        {
          id: 'q-dbms-2',
          question: 'What does LEFT JOIN in SQL return?',
          options: [
            { key: 'A', text: 'Only matched rows' },
            { key: 'B', text: 'All rows from left table with NULLs for non-matches' },
            { key: 'C', text: 'All rows from right table' },
            { key: 'D', text: 'Cross product' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          topic: 'SQL'
        }
      ]
    }
  ];

  // Seed Attempts for all 10 students
  const seedAttempts: QuizAttempt[] = [
    {
      id: 'att-01',
      quizId: 'quiz-dsa-101',
      quizTitle: 'Data Structures & Algorithms Midterm Exam',
      studentId: 'student-01',
      studentName: 'Rahul Sharma',
      studentEmail: 'rahul@student.edu',
      startTime: new Date(Date.now() - 2 * 3600000).toISOString(),
      submitTime: new Date(Date.now() - 1.8 * 3600000).toISOString(),
      status: 'Submitted',
      answers: [
        { questionId: 'q-dsa-1', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-2', selectedOption: 'C', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-3', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-4', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-5', selectedOption: 'A', isCorrect: true, marksObtained: 1 }
      ],
      totalScore: 5,
      maxScore: 5,
      percentage: 100,
      passed: true,
      timeTakenSeconds: 720,
      focusLossCount: 0,
      fullscreenExitCount: 0,
      disconnectCount: 0,
      suspiciousActivityScore: 0,
      riskLevel: 'Normal',
      timeline: [{ timestamp: new Date(Date.now() - 1.8 * 3600000).toISOString(), type: 'SUBMITTED', description: 'Exam submitted flawlessly.' }]
    },
    {
      id: 'att-02',
      quizId: 'quiz-dsa-101',
      quizTitle: 'Data Structures & Algorithms Midterm Exam',
      studentId: 'student-02',
      studentName: 'Priya Patel',
      studentEmail: 'priya@student.edu',
      startTime: new Date(Date.now() - 3 * 3600000).toISOString(),
      submitTime: new Date(Date.now() - 2.5 * 3600000).toISOString(),
      status: 'Submitted',
      answers: [
        { questionId: 'q-dsa-1', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-2', selectedOption: 'C', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-3', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-4', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-5', selectedOption: 'B', isCorrect: false, marksObtained: 0 }
      ],
      totalScore: 4,
      maxScore: 5,
      percentage: 80,
      passed: true,
      timeTakenSeconds: 900,
      focusLossCount: 1,
      fullscreenExitCount: 0,
      disconnectCount: 0,
      suspiciousActivityScore: 15,
      riskLevel: 'Normal',
      timeline: [{ timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(), type: 'SUBMITTED', description: 'Exam submitted.' }]
    },
    {
      id: 'att-03',
      quizId: 'quiz-dsa-101',
      quizTitle: 'Data Structures & Algorithms Midterm Exam',
      studentId: 'student-03',
      studentName: 'Amit Verma',
      studentEmail: 'amit@student.edu',
      startTime: new Date(Date.now() - 4 * 3600000).toISOString(),
      submitTime: new Date(Date.now() - 3.6 * 3600000).toISOString(),
      status: 'Submitted',
      answers: [
        { questionId: 'q-dsa-1', selectedOption: 'C', isCorrect: false, marksObtained: 0 },
        { questionId: 'q-dsa-2', selectedOption: 'A', isCorrect: false, marksObtained: 0 },
        { questionId: 'q-dsa-3', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-4', selectedOption: 'A', isCorrect: false, marksObtained: 0 },
        { questionId: 'q-dsa-5', selectedOption: 'B', isCorrect: false, marksObtained: 0 }
      ],
      totalScore: 1,
      maxScore: 5,
      percentage: 20,
      passed: false,
      timeTakenSeconds: 1100,
      focusLossCount: 4,
      fullscreenExitCount: 1,
      disconnectCount: 0,
      suspiciousActivityScore: 85,
      riskLevel: 'High Risk',
      timeline: [
        { timestamp: new Date(Date.now() - 3.8 * 3600000).toISOString(), type: 'FOCUS_LOST', description: 'Tab switched 4 times during exam' },
        { timestamp: new Date(Date.now() - 3.6 * 3600000).toISOString(), type: 'SUBMITTED', description: 'Exam submitted.' }
      ]
    },
    {
      id: 'att-04',
      quizId: 'quiz-dsa-101',
      quizTitle: 'Data Structures & Algorithms Midterm Exam',
      studentId: 'student-04',
      studentName: 'Sneha Reddy',
      studentEmail: 'sneha@student.edu',
      startTime: new Date(Date.now() - 5 * 3600000).toISOString(),
      submitTime: new Date(Date.now() - 4.5 * 3600000).toISOString(),
      status: 'Submitted',
      answers: [
        { questionId: 'q-dsa-1', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-2', selectedOption: 'C', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-3', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-4', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-5', selectedOption: 'C', isCorrect: false, marksObtained: 0 }
      ],
      totalScore: 4,
      maxScore: 5,
      percentage: 80,
      passed: true,
      timeTakenSeconds: 850,
      focusLossCount: 0,
      fullscreenExitCount: 0,
      disconnectCount: 0,
      suspiciousActivityScore: 0,
      riskLevel: 'Normal',
      timeline: [{ timestamp: new Date(Date.now() - 4.5 * 3600000).toISOString(), type: 'SUBMITTED', description: 'Exam submitted.' }]
    },
    {
      id: 'att-05',
      quizId: 'quiz-dsa-101',
      quizTitle: 'Data Structures & Algorithms Midterm Exam',
      studentId: 'student-05',
      studentName: 'Vikram Singh',
      studentEmail: 'vikram@student.edu',
      startTime: new Date(Date.now() - 6 * 3600000).toISOString(),
      submitTime: new Date(Date.now() - 5.4 * 3600000).toISOString(),
      status: 'Submitted',
      answers: [
        { questionId: 'q-dsa-1', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-2', selectedOption: 'C', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-3', selectedOption: 'A', isCorrect: false, marksObtained: 0 },
        { questionId: 'q-dsa-4', selectedOption: 'B', isCorrect: true, marksObtained: 1 },
        { questionId: 'q-dsa-5', selectedOption: 'A', isCorrect: true, marksObtained: 1 }
      ],
      totalScore: 4,
      maxScore: 5,
      percentage: 80,
      passed: true,
      timeTakenSeconds: 980,
      focusLossCount: 2,
      fullscreenExitCount: 0,
      disconnectCount: 0,
      suspiciousActivityScore: 30,
      riskLevel: 'Low Risk',
      timeline: [{ timestamp: new Date(Date.now() - 5.4 * 3600000).toISOString(), type: 'SUBMITTED', description: 'Exam submitted.' }]
    }
  ];

  // Seed 4 CSE B.Tech Practice Quizzes with rich, high-quality questions
  const practiceQuizzes: PracticeQuiz[] = [
    {
      id: 'prac-dsa-01',
      title: 'Data Structures & Algorithms Practice Test',
      subject: 'Data Structures & Algorithms',
      description: 'Comprehensive practice quiz covering Linked Lists, Trees, Dynamic Programming, Sorting, and Time Complexity.',
      difficulty: 'Medium',
      durationMinutes: 30,
      passingPercentage: 50,
      totalAttempts: 12,
      avgScore: 68.5,
      isPublished: true,
      questions: [
        {
          id: 'q-dsa-1',
          question: 'What is the time complexity of searching for an element in a balanced Binary Search Tree (BST) with n nodes?',
          options: [
            { key: 'A', text: 'O(1)' },
            { key: 'B', text: 'O(log n)' },
            { key: 'C', text: 'O(n)' },
            { key: 'D', text: 'O(n log n)' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'In a balanced BST, height is O(log n), so search operation takes O(log n) time.',
          topic: 'Trees'
        },
        {
          id: 'q-dsa-2',
          question: 'What is the output of the following C++ recursive function when called as compute(4)?',
          codeSnippet: `int compute(int n) {\n    if (n <= 1) return 1;\n    return n * compute(n - 1);\n}`,
          options: [
            { key: 'A', text: '10' },
            { key: 'B', text: '16' },
            { key: 'C', text: '24' },
            { key: 'D', text: '12' }
          ],
          correctAnswer: 'C',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'compute(4) calculates 4 * 3 * 2 * 1 = 24 (Factorial of 4).',
          topic: 'Recursion'
        },
        {
          id: 'q-dsa-3',
          question: 'Which sorting algorithm guarantees a worst-case time complexity of O(n log n)?',
          options: [
            { key: 'A', text: 'Quick Sort' },
            { key: 'B', text: 'Merge Sort' },
            { key: 'C', text: 'Bubble Sort' },
            { key: 'D', text: 'Insertion Sort' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Medium',
          explanation: 'Merge Sort divides the array into halves recursively and merges them in O(n log n) time in all cases.',
          topic: 'Sorting'
        },
        {
          id: 'q-dsa-4',
          question: 'In a Floyd-Warshall algorithm for All-Pairs Shortest Path, what is the space and time complexity?',
          options: [
            { key: 'A', text: 'Time: O(V³), Space: O(V²)' },
            { key: 'B', text: 'Time: O(V²), Space: O(V)' },
            { key: 'C', text: 'Time: O(V log V), Space: O(E)' },
            { key: 'D', text: 'Time: O(V * E), Space: O(V²)' }
          ],
          correctAnswer: 'A',
          marks: 2,
          difficulty: 'Hard',
          explanation: 'Floyd-Warshall uses a 3D/2D dynamic programming matrix requiring O(V³) time and O(V²) space.',
          topic: 'Graphs & DP'
        },
        {
          id: 'q-dsa-5',
          question: 'What data structure is fundamentally used to implement Breadth-First Search (BFS) traversal on a Graph?',
          options: [
            { key: 'A', text: 'Stack' },
            { key: 'B', text: 'Queue' },
            { key: 'C', text: 'Priority Queue' },
            { key: 'D', text: 'Hash Table' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'BFS uses a FIFO Queue to visit neighbors level by level.',
          topic: 'Graphs'
        }
      ]
    },
    {
      id: 'prac-dbms-02',
      title: 'Database Management Systems (DBMS) Practice Test',
      subject: 'DBMS',
      description: 'Practice assessment on SQL, Joins, Normalization, Relational Algebra, and ACID properties.',
      difficulty: 'Medium',
      durationMinutes: 30,
      passingPercentage: 50,
      totalAttempts: 15,
      avgScore: 71.2,
      isPublished: true,
      questions: [
        {
          id: 'q-dbms-1',
          question: 'Which Normal Form eliminates Transitive Dependency in a relational database table?',
          options: [
            { key: 'A', text: 'First Normal Form (1NF)' },
            { key: 'B', text: 'Second Normal Form (2NF)' },
            { key: 'C', text: 'Third Normal Form (3NF)' },
            { key: 'D', text: 'Boyce-Codd Normal Form (BCNF)' }
          ],
          correctAnswer: 'C',
          marks: 1,
          difficulty: 'Medium',
          explanation: '3NF requires that no non-prime attribute is transitively dependent on the primary key.',
          topic: 'Normalization'
        },
        {
          id: 'q-dbms-2',
          question: 'Consider the following SQL Query. What result set does it produce?',
          codeSnippet: `SELECT E.Name, D.DeptName\nFROM Employees E\nLEFT JOIN Departments D ON E.DeptID = D.ID;`,
          options: [
            { key: 'A', text: 'Only employees who are assigned to an existing department' },
            { key: 'B', text: 'All employees, including those without a matching department (with NULL for DeptName)' },
            { key: 'C', text: 'Only departments that have employees assigned' },
            { key: 'D', text: 'A Cartesian product of Employees and Departments' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'LEFT JOIN returns all rows from the left table (Employees) regardless of matching right table rows.',
          topic: 'SQL'
        },
        {
          id: 'q-dbms-3',
          question: 'In ACID properties of Database Transactions, what does "Isolation" ensure?',
          options: [
            { key: 'A', text: 'Changes are permanently saved after commit' },
            { key: 'B', text: 'Concurrent execution of transactions leaves the database in the same state as sequential execution' },
            { key: 'C', text: 'All operations succeed or none are executed' },
            { key: 'D', text: 'Database constraints are maintained at all times' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Medium',
          explanation: 'Isolation guarantees that transaction executions are isolated from one another without interfering dirty reads.',
          topic: 'Transactions'
        },
        {
          id: 'q-dbms-4',
          question: 'Which SQL constraint guarantees that every value in a foreign key column exists in the referenced primary key column?',
          options: [
            { key: 'A', text: 'UNIQUE' },
            { key: 'B', text: 'CHECK' },
            { key: 'C', text: 'Referential Integrity Constraint' },
            { key: 'D', text: 'DEFAULT' }
          ],
          correctAnswer: 'C',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'Foreign keys enforce referential integrity between child and parent relational tables.',
          topic: 'Keys & Constraints'
        },
        {
          id: 'q-dbms-5',
          question: 'What is the Relational Algebra operator symbol used for the Projection operation?',
          options: [
            { key: 'A', text: 'σ (Sigma)' },
            { key: 'B', text: 'π (Pi)' },
            { key: 'C', text: 'ρ (Rho)' },
            { key: 'D', text: '⋈ (Bowtie)' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'π (Pi) is used for Projection (selecting specific columns), while σ (Sigma) is used for Selection (rows).',
          topic: 'Relational Algebra'
        }
      ]
    },
    {
      id: 'prac-os-03',
      title: 'Operating Systems Practice Test',
      subject: 'Operating Systems',
      description: 'Practice quiz covering Process Management, CPU Scheduling, Deadlocks, Paging, and Virtual Memory.',
      difficulty: 'Medium',
      durationMinutes: 30,
      passingPercentage: 50,
      totalAttempts: 10,
      avgScore: 65.0,
      isPublished: true,
      questions: [
        {
          id: 'q-os-1',
          question: 'Which of the following conditions is NOT one of Coffman\'s four necessary conditions for Deadlock?',
          options: [
            { key: 'A', text: 'Mutual Exclusion' },
            { key: 'B', text: 'Hold and Wait' },
            { key: 'C', text: 'Preemption' },
            { key: 'D', text: 'Circular Wait' }
          ],
          correctAnswer: 'C',
          marks: 1,
          difficulty: 'Medium',
          explanation: 'The condition is "No Preemption". Allowing preemption actually prevents deadlocks.',
          topic: 'Deadlocks'
        },
        {
          id: 'q-os-2',
          question: 'Calculate the Average Waiting Time for 3 processes under Shortest Job First (SJF) non-preemptive scheduling:\nP1 (Burst=6, Arrival=0), P2 (Burst=2, Arrival=0), P3 (Burst=8, Arrival=0)',
          options: [
            { key: 'A', text: '2.67 units' },
            { key: 'B', text: '3.33 units' },
            { key: 'C', text: '4.00 units' },
            { key: 'D', text: '5.33 units' }
          ],
          correctAnswer: 'A',
          marks: 2,
          difficulty: 'Hard',
          explanation: 'Order: P2 (runs 0-2, wait=0), P1 (runs 2-8, wait=2), P3 (runs 8-16, wait=8). Total wait = 0+2+8 = 10. Avg = 10 / 3 = 3.33? Wait: P2 wait=0, P1 wait=2, P3 wait=8. Avg = 10/3 = 3.33 units.',
          topic: 'CPU Scheduling'
        },
        {
          id: 'q-os-3',
          question: 'In Virtual Memory with Paging, what occurs when a process accesses a page that is not currently loaded in physical RAM?',
          options: [
            { key: 'A', text: 'Segmentation Fault' },
            { key: 'B', text: 'Page Fault' },
            { key: 'C', text: 'Deadlock' },
            { key: 'D', text: 'System Crash' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'A Page Fault trap is generated by MMU to prompt OS to bring the missing page from disk swap space.',
          topic: 'Virtual Memory'
        },
        {
          id: 'q-os-4',
          question: 'What is Belady\'s Anomaly in page replacement algorithms?',
          options: [
            { key: 'A', text: 'Increasing frame allocation leads to more page faults in FIFO' },
            { key: 'B', text: 'LRU performs worse than Random Replacement' },
            { key: 'C', text: 'Thrashing occurs when memory utilization reaches 100%' },
            { key: 'D', text: 'Optimal page replacement cannot be implemented in hardware' }
          ],
          correctAnswer: 'A',
          marks: 1,
          difficulty: 'Medium',
          explanation: 'Belady\'s Anomaly shows that under FIFO, allocating more page frames can counterintuitively increase page fault count.',
          topic: 'Paging'
        },
        {
          id: 'q-os-5',
          question: 'Which synchronization primitive uses atomic operations wait() and signal() to manage concurrent process access?',
          options: [
            { key: 'A', text: 'Mutex Lock' },
            { key: 'B', text: 'Semaphore' },
            { key: 'C', text: 'Spinlock' },
            { key: 'D', text: 'Condition Variable' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'Semaphores use wait() [P] and signal() [V] integer operations for process synchronization.',
          topic: 'Synchronization'
        }
      ]
    },
    {
      id: 'prac-cn-04',
      title: 'Computer Networks Practice Test',
      subject: 'Computer Networks',
      description: 'Practice test covering OSI & TCP/IP models, IP Subnetting, TCP/UDP protocols, DNS, and Routing.',
      difficulty: 'Medium',
      durationMinutes: 30,
      passingPercentage: 50,
      totalAttempts: 18,
      avgScore: 74.0,
      isPublished: true,
      questions: [
        {
          id: 'q-cn-1',
          question: 'Which OSI layer is responsible for end-to-end flow control, error checking, and port segmentation?',
          options: [
            { key: 'A', text: 'Network Layer' },
            { key: 'B', text: 'Transport Layer' },
            { key: 'C', text: 'Data Link Layer' },
            { key: 'D', text: 'Session Layer' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'The Transport Layer (Layer 4 - TCP/UDP) handles end-to-end communication, port addressing, and reliability.',
          topic: 'OSI Model'
        },
        {
          id: 'q-cn-2',
          question: 'Given an IP address 192.168.1.0/26, what is the Subnet Mask and maximum usable host addresses count per subnet?',
          options: [
            { key: 'A', text: 'Mask: 255.255.255.128, Usable Hosts: 126' },
            { key: 'B', text: 'Mask: 255.255.255.192, Usable Hosts: 62' },
            { key: 'C', text: 'Mask: 255.255.255.224, Usable Hosts: 30' },
            { key: 'D', text: 'Mask: 255.255.255.240, Usable Hosts: 14' }
          ],
          correctAnswer: 'B',
          marks: 2,
          difficulty: 'Hard',
          explanation: '/26 leaves 6 host bits. 2^6 = 64 total addresses, minus 2 (Network & Broadcast) = 62 usable hosts. Mask = 255.255.255.192.',
          topic: 'Subnetting'
        },
        {
          id: 'q-cn-3',
          question: 'How does TCP establish a connection between a client and a server before transmitting data packets?',
          options: [
            { key: 'A', text: 'Two-Way Handshake (SYN -> ACK)' },
            { key: 'B', text: 'Three-Way Handshake (SYN -> SYN-ACK -> ACK)' },
            { key: 'C', text: 'Four-Way Wave (FIN -> ACK -> FIN -> ACK)' },
            { key: 'D', text: 'Direct UDP datagram stream' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'TCP connection establishment uses SYN, SYN-ACK, and ACK 3-way handshake.',
          topic: 'TCP/IP'
        },
        {
          id: 'q-cn-4',
          question: 'Which protocol dynamically translates human-readable domain names (e.g. google.com) into IP addresses?',
          options: [
            { key: 'A', text: 'DHCP' },
            { key: 'B', text: 'ARP' },
            { key: 'C', text: 'DNS' },
            { key: 'D', text: 'ICMP' }
          ],
          correctAnswer: 'C',
          marks: 1,
          difficulty: 'Easy',
          explanation: 'Domain Name System (DNS) resolves domain names into numeric IP addresses.',
          topic: 'Protocols'
        },
        {
          id: 'q-cn-5',
          question: 'Which routing protocol uses the Dijkstra algorithm to calculate shortest paths based on link state bandwidth?',
          options: [
            { key: 'A', text: 'RIP (Routing Information Protocol)' },
            { key: 'B', text: 'OSPF (Open Shortest Path First)' },
            { key: 'C', text: 'BGP (Border Gateway Protocol)' },
            { key: 'D', text: 'EIGRP' }
          ],
          correctAnswer: 'B',
          marks: 1,
          difficulty: 'Medium',
          explanation: 'OSPF is a link-state protocol that uses Dijkstra\'s Shortest Path First algorithm.',
          topic: 'Routing'
        }
      ]
    }
  ];

  const facultyLogs: FacultyActivityLog[] = [
    {
      id: 'log-01',
      timestamp: new Date().toISOString(),
      facultyId: 'fac-init-01',
      facultyName: 'Dr. Ramesh Kumar',
      action: 'System Initialized',
      description: 'System database created with seed administrator profile.'
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit-01',
      timestamp: new Date().toISOString(),
      userEmail: 'admin@123',
      userRole: 'ADMIN',
      action: 'ADMIN_ACCOUNT_SEEDED',
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      details: 'Admin account initialized securely.'
    }
  ];

  return {
    users: [adminUser, faculty1, faculty2, ...studentUsers],
    quizzes: seededQuizzes,
    attempts: seedAttempts,
    practiceQuizzes,
    facultyLogs,
    auditLogs
  };
}

// Global in-memory database instance
let db: DatabaseSchema;

export function initDatabase(): DatabaseSchema {
  const dataDir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      db = JSON.parse(raw);
      
      const seed = createInitialSeedData();

      // Ensure 10 student test cases and faculty exist
      seed.users.forEach(su => {
        if (!db.users.some(u => u.email.toLowerCase() === su.email.toLowerCase())) {
          db.users.push(su);
        }
      });

      // Ensure initial quizzes exist
      seed.quizzes.forEach(sq => {
        if (!db.quizzes.some(q => q.id === sq.id || q.secretCode === sq.secretCode)) {
          db.quizzes.push(sq);
        }
      });

      // Ensure seed attempts exist
      seed.attempts.forEach(sa => {
        if (!db.attempts.some(a => a.id === sa.id)) {
          db.attempts.push(sa);
        }
      });

      saveDatabase();
      return db;
    } catch (err) {
      console.warn("Failed reading db.json, creating new database file:", err);
      db = createInitialSeedData();
      saveDatabase();
      return db;
    }
  } else {
    db = createInitialSeedData();
    saveDatabase();
    return db;
  }
}

export function saveDatabase() {
  if (!db) return;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving db.json:", err);
  }
}

export function getDB(): DatabaseSchema {
  if (!db) {
    return initDatabase();
  }
  return db;
}
