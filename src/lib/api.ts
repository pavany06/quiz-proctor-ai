import {
  User,
  Quiz,
  Question,
  QuizAttempt,
  PracticeQuiz,
  FacultyActivityLog,
  AuditLog,
  MLModelResult,
  AIInsights,
  LiveSession,
  IntegrityEvent
} from '../types';

async function parseResponse<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      if (text.startsWith('<!DOCTYPE') || text.toLowerCase().includes('the page')) {
        throw new Error(`Server returned HTML error page (${res.status} ${res.statusText}). Please check backend API server.`);
      }
      throw new Error(text.slice(0, 150) || `Server error (${res.status})`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid response received from server.');
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return parseResponse<{ user: User; token: string }>(res);
  },

  registerStudent: async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return parseResponse<{ user: User; token: string }>(res);
  },

  // Faculty Management (Admin)
  getFacultyList: async (): Promise<User[]> => {
    const res = await fetch('/api/admin/faculty');
    return parseResponse<User[]>(res);
  },

  createFaculty: async (payload: any) => {
    const res = await fetch('/api/admin/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return parseResponse<User>(res);
  },

  toggleFacultyStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    const res = await fetch(`/api/admin/faculty/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return parseResponse<User>(res);
  },

  resetFacultyPassword: async (id: string, newPassword: string) => {
    const res = await fetch(`/api/admin/faculty/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    return parseResponse<{ message: string }>(res);
  },

  // Student Management (Admin)
  getStudentsList: async (): Promise<User[]> => {
    const res = await fetch('/api/admin/students');
    return parseResponse<User[]>(res);
  },

  // Quizzes
  getQuizzes: async (facultyId?: string, role?: string): Promise<Quiz[]> => {
    const params = new URLSearchParams();
    if (facultyId) params.append('facultyId', facultyId);
    if (role) params.append('role', role);
    const res = await fetch(`/api/quizzes?${params.toString()}`);
    return parseResponse<Quiz[]>(res);
  },

  getFacultyQuizzes: async (facultyId: string): Promise<Quiz[]> => {
    const res = await fetch(`/api/quizzes?facultyId=${encodeURIComponent(facultyId)}`);
    return parseResponse<Quiz[]>(res);
  },

  getQuizById: async (id: string): Promise<Quiz> => {
    const res = await fetch(`/api/quizzes/${id}`);
    return parseResponse<Quiz>(res);
  },

  getQuizByCode: async (code: string): Promise<Quiz> => {
    const res = await fetch(`/api/quizzes/code/${encodeURIComponent(code)}`);
    return parseResponse<Quiz>(res);
  },

  createQuiz: async (payload: any): Promise<Quiz> => {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return parseResponse<Quiz>(res);
  },

  updateQuiz: async (id: string, payload: any): Promise<Quiz> => {
    const res = await fetch(`/api/quizzes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return parseResponse<Quiz>(res);
  },

  publishQuiz: async (id: string) => {
    const res = await fetch(`/api/quizzes/${id}/publish`, { method: 'POST' });
    return parseResponse<Quiz>(res);
  },

  regenerateQuizCode: async (id: string) => {
    const res = await fetch(`/api/quizzes/${id}/regenerate-code`, { method: 'POST' });
    return parseResponse<{ secretCode: string }>(res);
  },

  deleteQuiz: async (id: string) => {
    const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
    return parseResponse<{ message: string }>(res);
  },

  // CSV Import
  importCSVQuestions: async (quizId: string, csvText: string) => {
    const res = await fetch(`/api/quizzes/${quizId}/csv-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText })
    });
    return parseResponse<any>(res);
  },

  // AI Question Generation
  generateAIQuestions: async (params: { topic: string; numberOfQuestions: number; difficulty: string; additionalInstructions?: string }) => {
    const res = await fetch('/api/ai/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return parseResponse<{ questions: Question[] }>(res);
  },

  // Quiz Engine & Attempts
  submitQuizAttempt: async (payload: any): Promise<QuizAttempt> => {
    const res = await fetch(`/api/attempts/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return parseResponse<QuizAttempt>(res);
  },

  getStudentAttempts: async (studentId: string): Promise<QuizAttempt[]> => {
    const res = await fetch(`/api/attempts/student/${encodeURIComponent(studentId)}`);
    return parseResponse<QuizAttempt[]>(res);
  },

  getFacultyQuizResults: async (): Promise<QuizAttempt[]> => {
    const res = await fetch(`/api/faculty/quiz-results`);
    return parseResponse<QuizAttempt[]>(res);
  },

  getIntegrityEvents: async (): Promise<IntegrityEvent[]> => {
    const res = await fetch(`/api/faculty/integrity-events`);
    return parseResponse<IntegrityEvent[]>(res);
  },

  logIntegrityEvent: async (payload: any) => {
    const res = await fetch(`/api/attempts/integrity-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return parseResponse<any>(res);
  },

  // Live Sessions & Exam Integrity
  getLiveQuizSessions: async (facultyId?: string): Promise<LiveSession[]> => {
    const params = new URLSearchParams();
    if (facultyId) params.append('facultyId', facultyId);
    const res = await fetch(`/api/faculty/live-sessions?${params.toString()}`);
    return parseResponse<LiveSession[]>(res);
  },

  // Analytics
  getSystemAnalytics: async () => {
    const res = await fetch('/api/analytics/system');
    return parseResponse<any>(res);
  },

  getFacultyDashboardStats: async (facultyId: string) => {
    const res = await fetch(`/api/analytics/faculty-stats?facultyId=${encodeURIComponent(facultyId)}`);
    return parseResponse<any>(res);
  },

  getMLModelComparison: async (): Promise<{ models: MLModelResult[]; bestModelName: string; totalSamples: number }> => {
    const res = await fetch('/api/analytics/ml-model-comparison');
    return parseResponse<{ models: MLModelResult[]; bestModelName: string; totalSamples: number }>(res);
  },

  predictStudentPerformance: async (payload: any) => {
    const res = await fetch('/api/analytics/predict-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return parseResponse<any>(res);
  },

  getAIQuizAnalysis: async (attemptsData: any[]) => {
    const res = await fetch('/api/analytics/ai-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempts: attemptsData })
    });
    return parseResponse<AIInsights>(res);
  },

  // Practice Quizzes
  getPracticeQuizzes: async (): Promise<PracticeQuiz[]> => {
    const res = await fetch('/api/practice-quizzes');
    return parseResponse<PracticeQuiz[]>(res);
  },

  getPracticeQuizById: async (id: string): Promise<PracticeQuiz> => {
    const res = await fetch(`/api/practice-quizzes/${id}`);
    return parseResponse<PracticeQuiz>(res);
  },

  // Logs
  getFacultyActivityLogs: async (): Promise<FacultyActivityLog[]> => {
    const res = await fetch('/api/logs/faculty-activity');
    return parseResponse<FacultyActivityLog[]>(res);
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch('/api/logs/audit');
    return parseResponse<AuditLog[]>(res);
  }
};
