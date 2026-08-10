import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';

// Admin Views
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { FirebaseCloudAdmin } from './pages/admin/FirebaseCloudAdmin';
import { FacultyManagement } from './pages/admin/FacultyManagement';
import { StudentManagement } from './pages/admin/StudentManagement';
import { PracticeQuizAdmin } from './pages/admin/PracticeQuizAdmin';
import { AIMLAnalyticsAdmin } from './pages/admin/AIMLAnalyticsAdmin';
import { FacultyActivityLogs } from './pages/admin/FacultyActivityLogs';
import { AuditLogsView } from './pages/admin/AuditLogsView';

// Faculty Views
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { MyQuizzes } from './pages/faculty/MyQuizzes';
import { CreateQuizWizard } from './pages/faculty/CreateQuizWizard';
import { LiveSessions } from './pages/faculty/LiveSessions';
import { ExamIntegrityView } from './pages/faculty/ExamIntegrityView';
import { QuizResultsFaculty } from './pages/faculty/QuizResultsFaculty';

// Student Views
import { StudentPortal } from './pages/student/StudentPortal';
import { QuizTakingScreen } from './pages/student/QuizTakingScreen';
import { QuizResultScreen } from './pages/student/QuizResultScreen';

import { Quiz, PracticeQuiz, Attempt } from './types';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | PracticeQuiz | null>(null);
  const [isPractice, setIsPractice] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<Attempt | null>(null);
  const [directCode, setDirectCode] = useState<string | undefined>(undefined);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100 text-xs font-semibold">
        Initializing QUIZ PROCTOR AI...
      </div>
    );
  }

  // Active Quiz taking mode bypasses normal dashboard chrome
  if (activeQuiz) {
    return (
      <QuizTakingScreen
        quiz={activeQuiz}
        isPractice={isPractice}
        onFinish={attempt => {
          setActiveQuiz(null);
          setCompletedAttempt(attempt);
        }}
        onCancel={() => setActiveQuiz(null)}
      />
    );
  }

  // Quiz Results mode
  if (completedAttempt) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <QuizResultScreen
          attempt={completedAttempt}
          onBackToPortal={() => setCompletedAttempt(null)}
        />
      </div>
    );
  }

  // Unauthenticated user screen
  if (!user) {
    return (
      <Login
        onJoinDirectByCode={code => {
          setDirectCode(code);
        }}
      />
    );
  }

  // Student Role layout
  if (user.role === 'STUDENT') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="px-4 py-6 sm:px-6">
          <StudentPortal
            directQuizCode={directCode}
            onStartQuiz={q => {
              setActiveQuiz(q);
              setIsPractice(false);
            }}
            onStartPracticeQuiz={pq => {
              setActiveQuiz(pq);
              setIsPractice(true);
            }}
          />
        </main>
      </div>
    );
  }

  // Admin & Faculty Layout with Navbar + Sidebar
  const renderContent = () => {
    if (user.role === 'ADMIN') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'firebase-cloud':
          return <FirebaseCloudAdmin />;
        case 'faculty-management':
          return <FacultyManagement />;
        case 'student-management':
          return <StudentManagement />;
        case 'practice-quizzes':
          return <PracticeQuizAdmin />;
        case 'quiz-management':
          return <MyQuizzes onNavigateToCreate={() => setActiveTab('create-quiz')} />;
        case 'ai-ml-analytics':
          return <AIMLAnalyticsAdmin />;
        case 'system-analytics':
          return <AdminDashboard />;
        case 'faculty-activity-logs':
          return <FacultyActivityLogs />;
        case 'session-logs':
        case 'audit-logs':
          return <AuditLogsView />;
        default:
          return <AdminDashboard />;
      }
    } else {
      // Faculty Role
      switch (activeTab) {
        case 'dashboard':
          return <FacultyDashboard onNavigate={tab => setActiveTab(tab)} />;
        case 'my-quizzes':
        case 'share-quiz':
          return <MyQuizzes onNavigateToCreate={() => setActiveTab('create-quiz')} />;
        case 'create-quiz':
          return <CreateQuizWizard onSuccess={() => setActiveTab('my-quizzes')} />;
        case 'participants':
          return <StudentManagement />;
        case 'live-sessions':
          return <LiveSessions />;
        case 'analytics':
        case 'results':
          return <QuizResultsFaculty />;
        case 'exam-integrity':
          return <ExamIntegrityView />;
        default:
          return <FacultyDashboard onNavigate={tab => setActiveTab(tab)} />;
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
