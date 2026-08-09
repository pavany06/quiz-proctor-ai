export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  department?: string;
  employeeId?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FacultyProfile extends User {
  quizzesCreatedCount: number;
  studentsHandledCount: number;
  lastActive: string;
}

export interface StudentProfile extends User {
  quizzesAttemptedCount: number;
  averageScore: number;
  lastQuizDate?: string;
}

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  quizId?: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation?: string;
  topic: string;
  codeSnippet?: string; // Optional code block in C, C++, Java, Python, SQL, etc.
}

export type QuizStatus = 'Draft' | 'Scheduled' | 'Published' | 'Active' | 'Completed' | 'Archived';

export interface QuizSettings {
  durationMinutes: number;
  marksPerQuestion: number;
  enableNegativeMarking: boolean;
  negativeMarks: number; // e.g. 0.25 or 0.5
  maxAttempts: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  allowPreviousNavigation: boolean;
  allowMarkForReview: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  enableAntiCheating: boolean;
}

export interface QuizSchedule {
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: string;
  category: string; // e.g. "Data Structures", "DBMS", "Operating Systems", "Computer Networks"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  createdByFacultyId: string;
  facultyName: string;
  secretCode: string; // e.g. "DSA7K29X"
  status: QuizStatus;
  settings: QuizSettings;
  schedule: QuizSchedule;
  questions: Question[];
  totalMarks: number;
  passingPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect?: boolean;
  marksObtained?: number;
  timeSpentSeconds?: number;
}

export interface IntegrityEvent {
  timestamp: string;
  type: 'JOINED' | 'STARTED' | 'QUESTION_VIEW' | 'ANSWER_SELECTED' | 'ANSWER_CHANGED' | 'MARK_REVIEW' | 'FOCUS_LOST' | 'FOCUS_RESTORED' | 'FULLSCREEN_EXIT' | 'DISCONNECT' | 'RECONNECT' | 'SUBMITTED' | 'TIMEOUT';
  description: string;
  details?: Record<string, any>;
}

export type RiskLevel = 'Normal' | 'Low Risk' | 'Medium Risk' | 'High Risk';

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  startTime: string;
  submitTime?: string;
  status: 'In Progress' | 'Submitted' | 'Timed Out' | 'Terminated';
  answers: StudentAnswer[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds: number;
  focusLossCount: number;
  fullscreenExitCount: number;
  disconnectCount: number;
  suspiciousActivityScore: number; // 0 - 100
  riskLevel: RiskLevel;
  timeline: IntegrityEvent[];
}

export type Attempt = QuizAttempt;

export interface LiveSession {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'Active' | 'Away / Focus Lost' | 'Submitted' | 'Timed Out' | 'Disconnected';
  questionsAnswered: number;
  totalQuestions: number;
  timeRemainingSeconds: number;
  focusLossCount: number;
  fullscreenExitCount: number;
  riskLevel: RiskLevel;
  lastActivityTime: string;
}

export interface PracticeQuiz {
  id: string;
  title: string;
  subject: string; // e.g. "Data Structures & Algorithms", "DBMS", "Operating Systems", "Computer Networks"
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  durationMinutes: number;
  passingPercentage: number;
  questions: Question[];
  totalAttempts: number;
  avgScore: number;
  isPublished: boolean;
}

export interface FacultyActivityLog {
  id: string;
  timestamp: string;
  facultyId: string;
  facultyName: string;
  action: string; // "Quiz Created", "CSV Uploaded", "AI Questions Generated", "Quiz Published", etc.
  description: string;
  quizId?: string;
  quizTitle?: string;
  ipAddress?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  status: 'SUCCESS' | 'FAILED';
  ipAddress?: string;
  details?: string;
}

export interface ConfusionMatrix {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface FeatureImportance {
  featureName: string;
  importance: number;
}

export interface MLModelResult {
  algorithmName: 'Logistic Regression' | 'Decision Tree' | 'Random Forest' | 'Support Vector Machine (SVM)' | 'K-Nearest Neighbors (KNN)';
  accuracy: number; // 0-100
  precision: number; // 0-100
  recall: number; // 0-100
  f1Score: number; // 0-100
  confusionMatrix: ConfusionMatrix;
  featureImportances?: FeatureImportance[];
  trainingSize: number;
  testSize: number;
}

export interface AIInsights {
  strongTopics: string[];
  weakTopics: string[];
  strengths?: string[];
  weaknesses?: string[];
  difficultyAnalysis: string;
  performanceTrends: string;
  recommendations: string[];
  generatedAt: string;
}
