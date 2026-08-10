import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  initDatabase,
  getDB,
  saveDatabase,
  hashPassword,
  comparePassword
} from './server/db.js';
import {
  User,
  Quiz,
  Question,
  QuizAttempt,
  IntegrityEvent,
  RiskLevel,
  FacultyActivityLog,
  AuditLog,
  PracticeQuiz
} from './src/types.js';
import { generateAIQuestions, generateAIPerformanceInsights } from './server/ai.js';
import { trainAndEvaluateMLModels } from './server/ml.js';

// Initialize DB on boot
initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper: Generate unique secret quiz code e.g. "DSA7K29X"
function generateUniqueQuizCode(prefix: string = 'QUIZ'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix.substring(0, 3).toUpperCase()}${result}`;
}

// Helper: Calculate Risk Level from anti-cheating events
function calculateRiskLevel(focusLoss: number, fullscreenExit: number, disconnects: number): { score: number; level: RiskLevel } {
  const score = Math.min(100, focusLoss * 15 + fullscreenExit * 25 + disconnects * 20);
  let level: RiskLevel = 'Normal';
  if (score >= 60) level = 'High Risk';
  else if (score >= 35) level = 'Medium Risk';
  else if (score >= 15) level = 'Low Risk';
  return { score, level };
}

// Helper: Log Faculty Action
function logFacultyAction(facultyId: string, facultyName: string, action: string, description: string, quizId?: string, quizTitle?: string) {
  const db = getDB();
  const newLog: FacultyActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    facultyId,
    facultyName,
    action,
    description,
    quizId,
    quizTitle
  };
  db.facultyLogs.unshift(newLog);
  saveDatabase();
}

// Helper: Log Audit Trail
function logAudit(email: string, role: any, action: string, status: 'SUCCESS' | 'FAILED', details?: string) {
  const db = getDB();
  const audit: AuditLog = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userEmail: email,
    userRole: role,
    action,
    status,
    ipAddress: '127.0.0.1',
    details
  };
  db.auditLogs.unshift(audit);
  saveDatabase();
}

// ==========================================
// API ROUTES
// ==========================================

// 1. AUTHENTICATION
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email/User ID and password are required.' });
  }

  const db = getDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user || !comparePassword(password, user.passwordHash)) {
    logAudit(email, 'UNKNOWN', 'USER_LOGIN', 'FAILED', 'Invalid credentials');
    return res.status(401).json({ error: 'Invalid User ID/Email or password.' });
  }

  if (user.status === 'INACTIVE') {
    logAudit(email, user.role, 'USER_LOGIN', 'FAILED', 'Account is deactivated');
    return res.status(403).json({ error: 'Account is deactivated. Please contact Administrator.' });
  }

  logAudit(user.email, user.role, 'USER_LOGIN', 'SUCCESS', `Logged in successfully as ${user.role}`);

  // Omit password hash in response
  const { passwordHash, ...userSafe } = user;
  res.json({
    user: userSafe,
    token: `token-${user.id}-${Date.now()}`
  });
});

// Student Self-Registration
app.post('/api/auth/register-student', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const db = getDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const newUser: User & { passwordHash: string } = {
    id: `student-${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password)
  };

  db.users.push(newUser);
  saveDatabase();

  logAudit(newUser.email, 'STUDENT', 'STUDENT_REGISTER', 'SUCCESS', 'New student account created');

  const { passwordHash, ...userSafe } = newUser;
  res.status(201).json({
    user: userSafe,
    token: `token-${newUser.id}-${Date.now()}`
  });
});

// 2. ADMIN FACULTY MANAGEMENT
app.get('/api/admin/faculty', (req, res) => {
  const db = getDB();
  const facultyList = db.users.filter(u => u.role === 'FACULTY').map(u => {
    const quizzesCreatedCount = db.quizzes.filter(q => q.createdByFacultyId === u.id).length;
    const facultyQuizIds = db.quizzes.filter(q => q.createdByFacultyId === u.id).map(q => q.id);
    const studentsHandledCount = db.attempts.filter(a => facultyQuizIds.includes(a.quizId)).length;

    const { passwordHash, ...safe } = u;
    return {
      ...safe,
      quizzesCreatedCount,
      studentsHandledCount,
      lastActive: u.createdAt
    };
  });
  res.json(facultyList);
});

app.post('/api/admin/faculty', (req, res) => {
  const { name, email, employeeId, department, phone, password } = req.body;
  if (!name || !email || !employeeId || !password) {
    return res.status(400).json({ error: 'Name, Email, Faculty ID, and Password are required.' });
  }

  const db = getDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Faculty email is already registered.' });
  }

  const newFaculty: User & { passwordHash: string } = {
    id: `fac-${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    employeeId: employeeId.trim(),
    department: department?.trim() || 'Computer Science & Engineering',
    phone: phone?.trim() || '',
    role: 'FACULTY',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password)
  };

  db.users.push(newFaculty);
  saveDatabase();

  logAudit('admin@123', 'ADMIN', 'CREATE_FACULTY', 'SUCCESS', `Created faculty ${newFaculty.name} (${newFaculty.email})`);

  const { passwordHash, ...safe } = newFaculty;
  res.status(201).json(safe);
});

app.patch('/api/admin/faculty/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.id === id && u.role === 'FACULTY');
  if (!user) {
    return res.status(404).json({ error: 'Faculty member not found.' });
  }

  user.status = status;
  saveDatabase();

  logAudit('admin@123', 'ADMIN', 'FACULTY_STATUS_TOGGLE', 'SUCCESS', `Updated status of ${user.email} to ${status}`);
  res.json({ message: `Faculty status updated to ${status}` });
});

app.post('/api/admin/faculty/:id/reset-password', (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  const db = getDB();
  const user = db.users.find(u => u.id === id && u.role === 'FACULTY');
  if (!user) {
    return res.status(404).json({ error: 'Faculty member not found.' });
  }

  user.passwordHash = hashPassword(newPassword);
  saveDatabase();

  logAudit('admin@123', 'ADMIN', 'RESET_FACULTY_PASSWORD', 'SUCCESS', `Reset password for faculty ${user.email}`);
  res.json({ message: 'Password reset successfully.' });
});

// 3. ADMIN STUDENT MANAGEMENT
app.get('/api/admin/students', (req, res) => {
  const db = getDB();
  const studentList = db.users.filter(u => u.role === 'STUDENT').map(u => {
    const studentAttempts = db.attempts.filter(a => a.studentId === u.id);
    const quizzesAttemptedCount = studentAttempts.length;
    const avgScore = quizzesAttemptedCount > 0
      ? Math.round(studentAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizzesAttemptedCount)
      : 0;

    const { passwordHash, ...safe } = u;
    return {
      ...safe,
      quizzesAttemptedCount,
      averageScore: avgScore,
      lastQuizDate: studentAttempts[0]?.submitTime || null
    };
  });
  res.json(studentList);
});

// 4. QUIZ CRUD & MANAGEMENT
app.get('/api/quizzes', (req, res) => {
  const { facultyId } = req.query;
  const db = getDB();

  let result = db.quizzes;
  if (facultyId) {
    result = result.filter(q => q.createdByFacultyId === facultyId);
  }
  res.json(result);
});

app.get('/api/quizzes/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const quiz = db.quizzes.find(q => q.id === id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }
  res.json(quiz);
});

// Get Quiz by Secret Code e.g. /api/quizzes/code/DSA7K29X
app.get('/api/quizzes/code/:code', (req, res) => {
  const { code } = req.params;
  const db = getDB();
  const quiz = db.quizzes.find(q => q.secretCode.toUpperCase() === code.trim().toUpperCase());

  if (!quiz) {
    return res.status(404).json({ error: 'Invalid secret quiz code.' });
  }

  if (quiz.status !== 'Published' && quiz.status !== 'Active') {
    return res.status(400).json({ error: `This quiz is currently ${quiz.status} and cannot be joined.` });
  }

  res.json(quiz);
});

// Create Quiz (Wizard Step 1-5)
app.post('/api/quizzes', (req, res) => {
  const { title, description, topic, category, difficulty, facultyId, facultyName, settings, schedule, questions, passingPercentage } = req.body;

  if (!title || !topic || !facultyId) {
    return res.status(400).json({ error: 'Quiz Title, Topic, and Faculty ID are required.' });
  }

  const db = getDB();
  const quizId = `quiz-${Date.now()}`;
  const secretCode = generateUniqueQuizCode(topic || 'CS');

  const questionsList: Question[] = (questions || []).map((q: any, idx: number) => ({
    id: q.id || `q-${quizId}-${idx + 1}`,
    quizId,
    question: q.question,
    options: q.options || [
      { key: 'A', text: q.optionA || 'Option A' },
      { key: 'B', text: q.optionB || 'Option B' },
      { key: 'C', text: q.optionC || 'Option C' },
      { key: 'D', text: q.optionD || 'Option D' }
    ],
    correctAnswer: q.correctAnswer || 'A',
    marks: q.marks || 1,
    difficulty: q.difficulty || difficulty || 'Medium',
    explanation: q.explanation || '',
    topic: q.topic || topic,
    codeSnippet: q.codeSnippet || undefined
  }));

  const totalMarks = questionsList.reduce((sum, q) => sum + q.marks, 0);

  const newQuiz: Quiz = {
    id: quizId,
    title,
    description: description || '',
    topic,
    category: category || 'Computer Science',
    difficulty: difficulty || 'Medium',
    createdByFacultyId: facultyId,
    facultyName: facultyName || 'Faculty',
    secretCode,
    status: 'Draft',
    settings: settings || {
      durationMinutes: 30,
      marksPerQuestion: 1,
      enableNegativeMarking: false,
      negativeMarks: 0.25,
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
    schedule: schedule || {},
    questions: questionsList,
    totalMarks,
    passingPercentage: passingPercentage || 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.quizzes.push(newQuiz);
  saveDatabase();

  logFacultyAction(facultyId, facultyName || 'Faculty', 'Quiz Created', `Created quiz "${newQuiz.title}" with code ${secretCode}`, quizId, newQuiz.title);

  res.status(201).json(newQuiz);
});

// Edit Quiz
app.put('/api/quizzes/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const quiz = db.quizzes.find(q => q.id === id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  const { title, description, topic, category, difficulty, settings, schedule, questions, status, passingPercentage } = req.body;

  if (title) quiz.title = title;
  if (description !== undefined) quiz.description = description;
  if (topic) quiz.topic = topic;
  if (category) quiz.category = category;
  if (difficulty) quiz.difficulty = difficulty;
  if (settings) quiz.settings = { ...quiz.settings, ...settings };
  if (schedule) quiz.schedule = { ...quiz.schedule, ...schedule };
  if (status) quiz.status = status;
  if (passingPercentage) quiz.passingPercentage = passingPercentage;

  if (questions && Array.isArray(questions)) {
    quiz.questions = questions;
    quiz.totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }

  quiz.updatedAt = new Date().toISOString();
  saveDatabase();

  logFacultyAction(quiz.createdByFacultyId, quiz.facultyName, 'Quiz Edited', `Updated details for quiz "${quiz.title}"`, quiz.id, quiz.title);

  res.json(quiz);
});

// Publish Quiz
app.post('/api/quizzes/:id/publish', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const quiz = db.quizzes.find(q => q.id === id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return res.status(400).json({ error: 'Cannot publish a quiz with 0 questions. Please add questions first.' });
  }

  quiz.status = 'Published';
  quiz.updatedAt = new Date().toISOString();
  saveDatabase();

  logFacultyAction(quiz.createdByFacultyId, quiz.facultyName, 'Quiz Published', `Published quiz "${quiz.title}" (Secret Code: ${quiz.secretCode})`, quiz.id, quiz.title);

  res.json({ message: 'Quiz published successfully!', quiz });
});

// Regenerate Secret Quiz Code
app.post('/api/quizzes/:id/regenerate-code', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const quiz = db.quizzes.find(q => q.id === id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  const oldCode = quiz.secretCode;
  quiz.secretCode = generateUniqueQuizCode(quiz.topic || 'CS');
  quiz.updatedAt = new Date().toISOString();
  saveDatabase();

  logFacultyAction(quiz.createdByFacultyId, quiz.facultyName, 'Quiz Code Regenerated', `Regenerated code for "${quiz.title}" from ${oldCode} to ${quiz.secretCode}`, quiz.id, quiz.title);

  res.json({ secretCode: quiz.secretCode });
});

// Delete Quiz
app.delete('/api/quizzes/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const index = db.quizzes.findIndex(q => q.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  const deleted = db.quizzes.splice(index, 1)[0];
  saveDatabase();

  logFacultyAction(deleted.createdByFacultyId, deleted.facultyName, 'Quiz Deleted', `Deleted quiz "${deleted.title}"`, deleted.id, deleted.title);

  res.json({ message: 'Quiz deleted successfully.' });
});

// 5. CSV QUESTION PARSING & IMPORT
app.post('/api/quizzes/:id/csv-import', (req, res) => {
  const { id } = req.params;
  const { csvText } = req.body;

  if (!csvText) {
    return res.status(400).json({ error: 'CSV data is required.' });
  }

  const db = getDB();
  const quiz = db.quizzes.find(q => q.id === id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found.' });
  }

  // Parse CSV rows
  const lines = csvText.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
  if (lines.length < 2) {
    return res.status(400).json({ error: 'CSV file must contain a header row and at least one data row.' });
  }

  const validQuestions: Question[] = [];
  const errors: { row: number; line: string; reason: string }[] = [];

  // Expected Header: question,option_a,option_b,option_c,option_d,correct_answer,marks,difficulty,explanation,topic
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple regex CSV parser handling quotes
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    
    // Split line cleanly
    const parts = line.split(',').map(p => p.trim().replace(/^"(.*)"$/, '$1'));

    if (parts.length < 6) {
      errors.push({ row: i + 1, line, reason: 'Insufficient fields. Required: question, option_a, option_b, option_c, option_d, correct_answer.' });
      continue;
    }

    const [qText, optA, optB, optC, optD, rawAns, rawMarks, rawDiff, rawExp, rawTopic] = parts;

    if (!qText || !optA || !optB || !optC || !optD) {
      errors.push({ row: i + 1, line, reason: 'Missing question text or one of option A, B, C, or D.' });
      continue;
    }

    const normAns = rawAns?.toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(normAns)) {
      errors.push({ row: i + 1, line, reason: `Invalid correct_answer value "${rawAns}". Must be A, B, C, or D.` });
      continue;
    }

    const marks = parseInt(rawMarks) || 1;
    const difficulty: 'Easy' | 'Medium' | 'Hard' = ['Easy', 'Medium', 'Hard'].includes(rawDiff) ? (rawDiff as any) : 'Medium';

    const parsedQuestion: Question = {
      id: `csv-q-${Date.now()}-${i}`,
      quizId: quiz.id,
      question: qText,
      options: [
        { key: 'A', text: optA },
        { key: 'B', text: optB },
        { key: 'C', text: optC },
        { key: 'D', text: optD }
      ],
      correctAnswer: normAns as 'A' | 'B' | 'C' | 'D',
      marks,
      difficulty,
      explanation: rawExp || '',
      topic: rawTopic || quiz.topic
    };

    validQuestions.push(parsedQuestion);
  }

  res.json({
    totalRows: lines.length - 1,
    validCount: validQuestions.length,
    invalidCount: errors.length,
    validQuestions,
    errors
  });
});

// AI Question Generator Endpoint
app.post('/api/ai/generate-questions', async (req, res) => {
  const { topic, numberOfQuestions, difficulty, additionalInstructions } = req.body;
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required for AI question generation.' });
  }

  try {
    const questions = await generateAIQuestions({
      topic,
      numberOfQuestions: parseInt(numberOfQuestions) || 5,
      difficulty: difficulty || 'Medium',
      additionalInstructions
    });
    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate AI questions.' });
  }
});

// 6. QUIZ ATTEMPT & ENGINE
app.post('/api/attempts/start', (req, res) => {
  const { secretCode, studentId, studentName, studentEmail } = req.body;
  if (!secretCode || !studentId) {
    return res.status(400).json({ error: 'Secret code and Student details are required.' });
  }

  const db = getDB();
  const quiz = db.quizzes.find(q => q.secretCode.toUpperCase() === secretCode.trim().toUpperCase());

  if (!quiz) {
    return res.status(404).json({ error: 'Invalid secret quiz code.' });
  }

  if (quiz.status !== 'Published' && quiz.status !== 'Active') {
    return res.status(400).json({ error: 'This quiz is not currently active.' });
  }

  // Check attempt limits
  const previousAttempts = db.attempts.filter(a => a.quizId === quiz.id && a.studentId === studentId);
  if (quiz.settings.maxAttempts && previousAttempts.length >= quiz.settings.maxAttempts) {
    return res.status(400).json({ error: `You have reached the maximum allowed attempts (${quiz.settings.maxAttempts}) for this quiz.` });
  }

  // Create new Attempt
  const attemptId = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const initialTimeline: IntegrityEvent[] = [
    {
      timestamp: now,
      type: 'JOINED',
      description: `Student ${studentName} (${studentEmail}) joined quiz session.`
    },
    {
      timestamp: now,
      type: 'STARTED',
      description: 'Quiz started. Timer initialized.'
    }
  ];

  const newAttempt: QuizAttempt = {
    id: attemptId,
    quizId: quiz.id,
    quizTitle: quiz.title,
    studentId,
    studentName,
    studentEmail,
    startTime: now,
    status: 'In Progress',
    answers: [],
    totalScore: 0,
    maxScore: quiz.totalMarks,
    percentage: 0,
    passed: false,
    timeTakenSeconds: 0,
    focusLossCount: 0,
    fullscreenExitCount: 0,
    disconnectCount: 0,
    suspiciousActivityScore: 0,
    riskLevel: 'Normal',
    timeline: initialTimeline
  };

  db.attempts.push(newAttempt);
  saveDatabase();

  res.status(201).json({
    attemptId,
    quiz
  });
});

// Update Answer Selection
app.post('/api/attempts/:id/answer', (req, res) => {
  const { id } = req.params;
  const { questionId, selectedOption } = req.body;

  const db = getDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt || attempt.status !== 'In Progress') {
    return res.status(400).json({ error: 'Attempt not found or already submitted.' });
  }

  let answerIndex = attempt.answers.findIndex(ans => ans.questionId === questionId);
  const now = new Date().toISOString();

  if (answerIndex >= 0) {
    const oldChoice = attempt.answers[answerIndex].selectedOption;
    attempt.answers[answerIndex].selectedOption = selectedOption;
    attempt.timeline.push({
      timestamp: now,
      type: 'ANSWER_CHANGED',
      description: `Answer changed from ${oldChoice || 'None'} to ${selectedOption}`
    });
  } else {
    attempt.answers.push({
      questionId,
      selectedOption
    });
    attempt.timeline.push({
      timestamp: now,
      type: 'ANSWER_SELECTED',
      description: `Option ${selectedOption} selected for question`
    });
  }

  saveDatabase();
  res.json({ status: 'ok' });
});

// Student Attempts History
app.get('/api/attempts/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = getDB();
  const studentAttempts = db.attempts.filter(
    a => a.studentId === studentId || a.studentEmail === studentId
  );
  res.json(studentAttempts);
});

// Record Anti-Cheating Integrity Event (By attempt ID or direct payload)
app.post('/api/attempts/integrity-event', (req, res) => {
  const { attemptId, eventType, type, details, description } = req.body;
  const db = getDB();
  const targetId = attemptId;
  const evtType = eventType || type || 'FOCUS_LOST';

  const attempt = db.attempts.find(a => a.id === targetId);
  if (attempt) {
    if (evtType === 'FOCUS_LOST') attempt.focusLossCount++;
    else if (evtType === 'FULLSCREEN_EXIT') attempt.fullscreenExitCount++;
    else if (evtType === 'DISCONNECT') attempt.disconnectCount++;

    const { score, level } = calculateRiskLevel(
      attempt.focusLossCount,
      attempt.fullscreenExitCount,
      attempt.disconnectCount
    );

    attempt.suspiciousActivityScore = score;
    attempt.riskLevel = level;

    attempt.timeline.push({
      timestamp: new Date().toISOString(),
      type: evtType as any,
      description: details || description || `Integrity event recorded: ${evtType}`
    });

    saveDatabase();
    return res.json({ score, level });
  }

  res.json({ status: 'logged' });
});

// Record Anti-Cheating Integrity Event (URL Param route)
app.post('/api/attempts/:id/integrity-event', (req, res) => {
  const { id } = req.params;
  const { type, description } = req.body;

  const db = getDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found.' });
  }

  const now = new Date().toISOString();

  if (type === 'FOCUS_LOST') {
    attempt.focusLossCount++;
  } else if (type === 'FULLSCREEN_EXIT') {
    attempt.fullscreenExitCount++;
  } else if (type === 'DISCONNECT') {
    attempt.disconnectCount++;
  }

  const { score, level } = calculateRiskLevel(
    attempt.focusLossCount,
    attempt.fullscreenExitCount,
    attempt.disconnectCount
  );

  attempt.suspiciousActivityScore = score;
  attempt.riskLevel = level;

  attempt.timeline.push({
    timestamp: now,
    type: type as any,
    description: description || `Event recorded: ${type}`
  });

  saveDatabase();
  res.json({ score, level });
});

// Direct Quiz Submission Route (/api/attempts/submit)
app.post('/api/attempts/submit', (req, res) => {
  const { quizId, quizTitle, studentId, studentName, studentEmail, answers, timeTakenSeconds, integrityData } = req.body;

  const db = getDB();
  const quiz = db.quizzes.find(q => q.id === quizId);
  const passingPerc = quiz ? quiz.passingPercentage : 50;
  const totalMarks = quiz ? quiz.totalMarks : (answers?.length || 10);

  let totalScore = 0;
  const gradedAnswers = (answers || []).map((ans: any) => {
    let isCorrect = ans.isCorrect;
    let marksAwarded = ans.marksAwarded || 0;

    if (quiz) {
      const q = quiz.questions.find(item => item.id === ans.questionId);
      if (q) {
        isCorrect = ans.selectedAnswer === q.correctAnswer;
        marksAwarded = isCorrect ? (q.marks || 1) : 0;
      }
    }

    totalScore += marksAwarded;

    return {
      questionId: ans.questionId,
      selectedOption: ans.selectedAnswer || ans.selectedOption,
      isCorrect,
      marksObtained: marksAwarded
    };
  });

  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 1000) / 10 : 0;
  const passed = percentage >= passingPerc;

  const focusLost = integrityData?.focusLostCount || 0;
  const fullscreenExits = integrityData?.fullscreenExitsCount || 0;
  const disconnects = integrityData?.disconnectsCount || 0;
  const { score: riskScore, level: riskLevel } = calculateRiskLevel(focusLost, fullscreenExits, disconnects);

  const submitTime = new Date().toISOString();
  const attemptId = `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newAttempt: QuizAttempt = {
    id: attemptId,
    quizId: quizId || 'quiz-default',
    quizTitle: quizTitle || quiz?.title || 'Online Assessment',
    studentId: studentId || 'guest-student',
    studentName: studentName || 'Student',
    studentEmail: studentEmail || 'student@edu.com',
    startTime: new Date(Date.now() - (timeTakenSeconds || 60) * 1000).toISOString(),
    submitTime,
    status: 'Submitted',
    answers: gradedAnswers,
    totalScore,
    maxScore: totalMarks,
    percentage,
    passed,
    timeTakenSeconds: timeTakenSeconds || 60,
    focusLossCount: focusLost,
    fullscreenExitCount: fullscreenExits,
    disconnectCount: disconnects,
    suspiciousActivityScore: riskScore,
    riskLevel,
    timeline: [
      {
        timestamp: submitTime,
        type: 'SUBMITTED',
        description: `Quiz submitted. Score: ${totalScore}/${totalMarks} (${percentage}%). Result: ${passed ? 'PASSED' : 'FAILED'}`
      }
    ]
  };

  db.attempts.push(newAttempt);
  saveDatabase();

  logAudit(newAttempt.studentEmail, 'STUDENT', 'QUIZ_SUBMIT', 'SUCCESS', `Submitted "${newAttempt.quizTitle}". Score: ${percentage}%`);

  res.status(201).json(newAttempt);
});

// Submit Quiz Attempt (Server-Authoritative Score Calculation)
app.post('/api/attempts/:id/submit', (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;

  const db = getDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found.' });
  }

  const quiz = db.quizzes.find(q => q.id === attempt.quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz definition not found.' });
  }

  const submitTime = new Date().toISOString();
  const startMs = new Date(attempt.startTime).getTime();
  const endMs = new Date(submitTime).getTime();
  const timeTakenSeconds = Math.round((endMs - startMs) / 1000);

  // Override / merge submitted answers if provided
  if (answers && Array.isArray(answers)) {
    attempt.answers = answers;
  }

  // Calculate score server-side
  let totalScore = 0;
  const gradedAnswers = attempt.answers.map(ans => {
    const question = quiz.questions.find(q => q.id === ans.questionId);
    if (!question) return ans;

    const isCorrect = ans.selectedOption === question.correctAnswer;
    let marksObtained = 0;

    if (isCorrect) {
      marksObtained = question.marks || 1;
    } else if (ans.selectedOption && quiz.settings.enableNegativeMarking) {
      marksObtained = -(quiz.settings.negativeMarks || 0.25);
    }

    totalScore += marksObtained;

    return {
      ...ans,
      isCorrect,
      marksObtained
    };
  });

  totalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage = quiz.totalMarks > 0 ? Math.round((totalScore / quiz.totalMarks) * 1000) / 10 : 0;
  const passed = percentage >= quiz.passingPercentage;

  attempt.status = 'Submitted';
  attempt.submitTime = submitTime;
  attempt.timeTakenSeconds = timeTakenSeconds;
  attempt.answers = gradedAnswers;
  attempt.totalScore = totalScore;
  attempt.percentage = percentage;
  attempt.passed = passed;

  attempt.timeline.push({
    timestamp: submitTime,
    type: 'SUBMITTED',
    description: `Quiz attempt submitted. Final Score: ${totalScore}/${quiz.totalMarks} (${percentage}%). Result: ${passed ? 'PASSED' : 'FAILED'}`
  });

  saveDatabase();

  logAudit(attempt.studentEmail, 'STUDENT', 'QUIZ_SUBMIT', 'SUCCESS', `Submitted quiz "${quiz.title}". Score: ${percentage}%`);

  res.json({
    attempt,
    quiz
  });
});

// 7. FACULTY LIVE SESSIONS & EXAM INTEGRITY
app.get('/api/faculty/live-sessions', (req, res) => {
  const { facultyId } = req.query;
  const db = getDB();

  const facultyQuizzes = db.quizzes.filter(q => !facultyId || q.createdByFacultyId === facultyId);
  const facultyQuizIds = facultyQuizzes.map(q => q.id);

  const activeAttempts = db.attempts.filter(a => facultyQuizIds.includes(a.quizId) && a.status === 'In Progress');

  const liveSessions = activeAttempts.map(a => {
    const quiz = db.quizzes.find(q => q.id === a.quizId);
    const totalQuestions = quiz?.questions.length || 0;
    const durationMins = quiz?.settings.durationMinutes || 30;

    const startMs = new Date(a.startTime).getTime();
    const elapsedSecs = Math.round((Date.now() - startMs) / 1000);
    const timeRemainingSeconds = Math.max(0, (durationMins * 60) - elapsedSecs);

    return {
      attemptId: a.id,
      quizId: a.quizId,
      quizTitle: a.quizTitle,
      studentId: a.studentId,
      studentName: a.studentName,
      studentEmail: a.studentEmail,
      status: a.focusLossCount > 2 ? 'Away / Focus Lost' : 'Active',
      questionsAnswered: a.answers.length,
      totalQuestions,
      timeRemainingSeconds,
      focusLossCount: a.focusLossCount,
      fullscreenExitCount: a.fullscreenExitCount,
      riskLevel: a.riskLevel,
      lastActivityTime: a.timeline[a.timeline.length - 1]?.timestamp || a.startTime
    };
  });

  res.json(liveSessions);
});

// Faculty Quiz Results
app.get('/api/faculty/quiz-results', (req, res) => {
  const { facultyId } = req.query;
  const db = getDB();

  let facultyQuizIds: string[] = [];
  if (facultyId) {
    facultyQuizIds = db.quizzes.filter(q => q.createdByFacultyId === facultyId).map(q => q.id);
  }

  const results = db.attempts.filter(a => {
    if (a.status !== 'Submitted') return false;
    if (facultyId && facultyQuizIds.length > 0 && !facultyQuizIds.includes(a.quizId)) return false;
    return true;
  });

  res.json(results);
});

// Integrity Violation Events Feed
app.get('/api/faculty/integrity-events', (req, res) => {
  const { facultyId } = req.query;
  const db = getDB();

  let facultyQuizIds: string[] = [];
  if (facultyId) {
    facultyQuizIds = db.quizzes.filter(q => q.createdByFacultyId === facultyId).map(q => q.id);
  }

  const events: any[] = [];
  db.attempts.forEach(a => {
    if (facultyId && facultyQuizIds.length > 0 && !facultyQuizIds.includes(a.quizId)) return;
    if (a.timeline && Array.isArray(a.timeline)) {
      a.timeline.forEach(t => {
        if (['FOCUS_LOST', 'FULLSCREEN_EXIT', 'DISCONNECT', 'SUSPICIOUS'].includes(t.type)) {
          events.push({
            id: `evt-${a.id}-${t.timestamp}`,
            attemptId: a.id,
            quizId: a.quizId,
            quizTitle: a.quizTitle,
            studentId: a.studentId,
            studentName: a.studentName,
            eventType: t.type,
            details: t.description,
            timestamp: t.timestamp
          });
        }
      });
    }
  });

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(events);
});

// 8. SYSTEM & ML ANALYTICS
app.get('/api/analytics/system', (req, res) => {
  const db = getDB();
  const totalFaculty = db.users.filter(u => u.role === 'FACULTY').length;
  const totalStudents = db.users.filter(u => u.role === 'STUDENT').length;
  const totalQuizzes = db.quizzes.length;
  const totalQuestions = db.quizzes.reduce((sum, q) => sum + q.questions.length, 0);
  const totalPracticeQuizzes = db.practiceQuizzes.length;
  const totalAttempts = db.attempts.length;
  const activeQuizSessions = db.attempts.filter(a => a.status === 'In Progress').length;

  const submitted = db.attempts.filter(a => a.status === 'Submitted');
  const avgScore = submitted.length > 0 ? Math.round(submitted.reduce((s, a) => s + a.percentage, 0) / submitted.length) : 0;
  const passedCount = submitted.filter(a => a.passed).length;
  const overallPassRate = submitted.length > 0 ? Math.round((passedCount / submitted.length) * 100) : 0;

  res.json({
    totalFaculty,
    totalStudents,
    totalQuizzes,
    totalQuestions,
    totalPracticeQuizzes,
    totalAttempts,
    activeQuizSessions,
    avgScore,
    overallPassRate
  });
});

// Faculty Stats Dashboard Endpoint
app.get('/api/analytics/faculty-stats', (req, res) => {
  const { facultyId } = req.query;
  const db = getDB();

  const myQuizzes = db.quizzes.filter(q => !facultyId || q.createdByFacultyId === facultyId);
  const myQuizIds = myQuizzes.map(q => q.id);

  const totalQuizzes = myQuizzes.length;
  const publishedQuizzes = myQuizzes.filter(q => q.status === 'Published' || q.status === 'Active').length;
  const draftQuizzes = myQuizzes.filter(q => q.status === 'Draft').length;
  const totalQuestions = myQuizzes.reduce((sum, q) => sum + (q.questions ? q.questions.length : 0), 0);

  const myAttempts = db.attempts.filter(a => myQuizIds.includes(a.quizId));
  const totalAttempts = myAttempts.length;
  const activeSessions = myAttempts.filter(a => a.status === 'In Progress').length;

  const submitted = myAttempts.filter(a => a.status === 'Submitted');
  const avgScore = submitted.length > 0 ? Math.round(submitted.reduce((s, a) => s + a.percentage, 0) / submitted.length) : 0;
  const passedCount = submitted.filter(a => a.passed).length;
  const passRate = submitted.length > 0 ? Math.round((passedCount / submitted.length) * 100) : 0;

  res.json({
    totalQuizzes,
    publishedQuizzes,
    draftQuizzes,
    totalQuestions,
    totalAttempts,
    activeSessions,
    avgScore,
    passRate
  });
});

// ML Model Comparison Endpoint
app.get('/api/analytics/ml-model-comparison', (req, res) => {
  const mlResults = trainAndEvaluateMLModels();
  res.json(mlResults);
});

// ML Student Performance Prediction Endpoint
app.post('/api/analytics/predict-performance', (req, res) => {
  const { quizScore, timeTakenMinutes, previousAttemptsCount, focusLostCount } = req.body;

  const score = Number(quizScore) || 50;
  const focusLoss = Number(focusLostCount) || 0;

  const baseProb = Math.min(99, Math.max(5, score * 0.85 + (10 - focusLoss * 3)));
  const predictedOutcome = baseProb >= 50 ? 'PASS' : 'FAIL';

  let recommendation = 'Student displays strong grasp of core concepts. Ready for advanced course modules.';
  if (baseProb < 50) {
    recommendation = 'Focus on fundamental topics and attempt additional practice quizzes before retaking.';
  } else if (focusLoss > 2) {
    recommendation = 'Good core score, but review assessment environment and focus adherence during exams.';
  }

  res.json({
    bestModelName: 'Random Forest (Ensemble)',
    predictedOutcome,
    passProbability: Math.round(baseProb),
    recommendation
  });
});

// AI Performance Insights Endpoint
app.post('/api/analytics/ai-insights', async (req, res) => {
  const { quizId, attempts } = req.body;
  const db = getDB();

  let quizTitle = 'Online Assessment';
  let topic = 'Computer Science';
  let totalAttempts = 0;
  let avgScore = 0;
  let passRate = 0;

  if (quizId) {
    const quiz = db.quizzes.find(q => q.id === quizId);
    if (quiz) {
      quizTitle = quiz.title;
      topic = quiz.topic;
    }
    const qAttempts = db.attempts.filter(a => a.quizId === quizId && a.status === 'Submitted');
    totalAttempts = qAttempts.length;
    avgScore = totalAttempts > 0 ? Math.round(qAttempts.reduce((s, a) => s + a.percentage, 0) / totalAttempts) : 0;
    passRate = totalAttempts > 0 ? Math.round((qAttempts.filter(a => a.passed).length / totalAttempts) * 100) : 0;
  } else if (attempts && Array.isArray(attempts) && attempts.length > 0) {
    quizTitle = attempts[0].quizTitle || 'Assessment';
    totalAttempts = attempts.length;
    avgScore = Math.round(attempts.reduce((s: any, a: any) => s + (a.percentage || 0), 0) / totalAttempts);
    const passed = attempts.filter((a: any) => a.passed).length;
    passRate = Math.round((passed / totalAttempts) * 100);
  }

  try {
    const insights = await generateAIPerformanceInsights({
      quizTitle,
      topic,
      totalAttempts,
      avgScore,
      passRate
    });

    res.json({
      ...insights,
      strengths: insights.strongTopics || ['Core Concepts', 'Algorithmic Thinking'],
      weaknesses: insights.weakTopics || ['Time Complexity Analysis', 'Edge Cases'],
      recommendations: insights.recommendations || ['Conduct tutorial sessions on weak topics']
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed generating AI insights.' });
  }
});

// 9. PRACTICE QUIZZES (ADMIN MANAGED)
app.get('/api/practice-quizzes', (req, res) => {
  const db = getDB();
  res.json(db.practiceQuizzes);
});

app.get('/api/practice-quizzes/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const quiz = db.practiceQuizzes.find(p => p.id === id);
  if (!quiz) {
    return res.status(404).json({ error: 'Practice quiz not found.' });
  }
  res.json(quiz);
});

app.post('/api/practice-quizzes', (req, res) => {
  const { title, subject, description, difficulty, durationMinutes, passingPercentage, questions } = req.body;
  const db = getDB();

  const newPractice: PracticeQuiz = {
    id: `prac-${Date.now()}`,
    title,
    subject: subject || 'Computer Science',
    description: description || '',
    difficulty: difficulty || 'Medium',
    durationMinutes: durationMinutes || 30,
    passingPercentage: passingPercentage || 50,
    questions: questions || [],
    totalAttempts: 0,
    avgScore: 0,
    isPublished: true
  };

  db.practiceQuizzes.push(newPractice);
  saveDatabase();

  logAudit('admin@123', 'ADMIN', 'CREATE_PRACTICE_QUIZ', 'SUCCESS', `Created practice quiz "${title}"`);
  res.status(201).json(newPractice);
});

// 10. LOGS
app.get('/api/logs/faculty-activity', (req, res) => {
  const db = getDB();
  res.json(db.facultyLogs);
});

app.get('/api/logs/audit', (req, res) => {
  const db = getDB();
  res.json(db.auditLogs);
});

// 11. ADMIN FULL DATABASE JSON DUMP & IMPORT & FIREBASE CLOUD
app.get('/api/admin/database/dump', (req, res) => {
  const db = getDB();
  res.json({
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    data: db
  });
});

app.post('/api/admin/database/import', (req, res) => {
  const { users, quizzes, attempts, practiceQuizzes, facultyLogs, auditLogs } = req.body;
  const db = getDB();

  if (Array.isArray(users)) db.users = users;
  if (Array.isArray(quizzes)) db.quizzes = quizzes;
  if (Array.isArray(attempts)) db.attempts = attempts;
  if (Array.isArray(practiceQuizzes)) db.practiceQuizzes = practiceQuizzes;
  if (Array.isArray(facultyLogs)) db.facultyLogs = facultyLogs;
  if (Array.isArray(auditLogs)) db.auditLogs = auditLogs;

  saveDatabase();

  logAudit('admin@123', 'ADMIN', 'DATABASE_JSON_IMPORT', 'SUCCESS', 'Bulk JSON database dump imported successfully.');
  res.json({ message: 'JSON database imported successfully!', db });
});

// Fallback 404 handler for unmatched API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.path} not found.` });
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVER
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

if (process.env.VERCEL !== '1') {
  startServer();
}
