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

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    return data;
  },

  registerStudent: async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    return data;
  },

  // Faculty Management (Admin)
  getFacultyList: async (): Promise<User[]> => {
    const res = await fetch('/api/admin/faculty');
    return res.json();
  },

  createFaculty: async (payload: any) => {
    const res = await fetch('/api/admin/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed creating faculty.');
    return data;
  },

  toggleFacultyStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    const res = await fetch(`/api/admin/faculty/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed updating status.');
    return data;
  },

  resetFacultyPassword: async (id: string, newPassword: string) => {
    const res = await fetch(`/api/admin/faculty/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed resetting password.');
    return data;
  },

  // Student Management (Admin)
  getStudentsList: async (): Promise<User[]> => {
    const res = await fetch('/api/admin/students');
    return res.json();
  },

  // Quizzes
  getQuizzes: async (facultyId?: string, role?: string): Promise<Quiz[]> => {
    const params = new URLSearchParams();
    if (facultyId) params.append('facultyId', facultyId);
    if (role) params.append('role', role);
    const res = await fetch(`/api/quizzes?${params.toString()}`);
    return res.json();
  },

  getFacultyQuizzes: async (facultyId: string): Promise<Quiz[]> => {
    const res = await fetch(`/api/quizzes?facultyId=${encodeURIComponent(facultyId)}`);
    return res.json();
  },

  getQuizById: async (id: string): Promise<Quiz> => {
    const res = await fetch(`/api/quizzes/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Quiz not found.');
    return data;
  },

  getQuizByCode: async (code: string): Promise<Quiz> => {
    const res = await fetch(`/api/quizzes/code/${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid quiz code.');
    return data;
  },

  createQuiz: async (payload: any): Promise<Quiz> => {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed creating quiz.');
    return data;
  },

  updateQuiz: async (id: string, payload: any): Promise<Quiz> => {
    const res = await fetch(`/api/quizzes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed updating quiz.');
    return data;
  },

  publishQuiz: async (id: string) => {
    const res = await fetch(`/api/quizzes/${id}/publish`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed publishing quiz.');
    return data;
  },

  regenerateQuizCode: async (id: string) => {
    const res = await fetch(`/api/quizzes/${id}/regenerate-code`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed regenerating code.');
    return data;
  },

  deleteQuiz: async (id: string) => {
    const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed deleting quiz.');
    return data;
  },

  // CSV Import
  importCSVQuestions: async (quizId: string, csvText: string) => {
    const res = await fetch(`/api/quizzes/${quizId}/csv-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'CSV import failed.');
    return data;
  },

  // AI Question Generation
  generateAIQuestions: async (params: { topic: string; numberOfQuestions: number; difficulty: string; additionalInstructions?: string }) => {
    const res = await fetch('/api/ai/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI generation failed.');
    return data;
  },

  // Quiz Engine & Attempts
  submitQuizAttempt: async (payload: any): Promise<QuizAttempt> => {
    const res = await fetch(`/api/attempts/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed submitting quiz.');
    return data;
  },

  getStudentAttempts: async (studentId: string): Promise<QuizAttempt[]> => {
    const res = await fetch(`/api/attempts/student/${encodeURIComponent(studentId)}`);
    return res.json();
  },

  getFacultyQuizResults: async (): Promise<QuizAttempt[]> => {
    const res = await fetch(`/api/faculty/quiz-results`);
    return res.json();
  },

  getIntegrityEvents: async (): Promise<IntegrityEvent[]> => {
    const res = await fetch(`/api/faculty/integrity-events`);
    return res.json();
  },

  logIntegrityEvent: async (payload: any) => {
    const res = await fetch(`/api/attempts/integrity-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Live Sessions & Exam Integrity
  getLiveQuizSessions: async (facultyId?: string): Promise<LiveSession[]> => {
    const params = new URLSearchParams();
    if (facultyId) params.append('facultyId', facultyId);
    const res = await fetch(`/api/faculty/live-sessions?${params.toString()}`);
    return res.json();
  },

  // Analytics
  getSystemAnalytics: async () => {
    const res = await fetch('/api/analytics/system');
    return res.json();
  },

  getFacultyDashboardStats: async (facultyId: string) => {
    const res = await fetch(`/api/analytics/faculty-stats?facultyId=${encodeURIComponent(facultyId)}`);
    return res.json();
  },

  getMLModelComparison: async (): Promise<{ models: MLModelResult[]; bestModelName: string; totalSamples: number }> => {
    const res = await fetch('/api/analytics/ml-model-comparison');
    return res.json();
  },

  predictStudentPerformance: async (payload: any) => {
    const res = await fetch('/api/analytics/predict-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed running ML prediction.');
    return data;
  },

  getAIQuizAnalysis: async (attemptsData: any[]) => {
    const res = await fetch('/api/analytics/ai-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempts: attemptsData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed generating AI analysis.');
    return data;
  },

  // Practice Quizzes
  getPracticeQuizzes: async (): Promise<PracticeQuiz[]> => {
    const res = await fetch('/api/practice-quizzes');
    return res.json();
  },

  getPracticeQuizById: async (id: string): Promise<PracticeQuiz> => {
    const res = await fetch(`/api/practice-quizzes/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Practice quiz not found.');
    return data;
  },

  // Logs
  getFacultyActivityLogs: async (): Promise<FacultyActivityLog[]> => {
    const res = await fetch('/api/logs/faculty-activity');
    return res.json();
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch('/api/logs/audit');
    return res.json();
  }
};
