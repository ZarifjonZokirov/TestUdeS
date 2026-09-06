import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentEntry } from './components/StudentEntry';
import { StudentTestView } from './components/StudentTestView';
import { StudentResultView } from './components/StudentResultView';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { Teacher, TestSession, TestResult } from './types';
import { ShieldCheck, UserCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Teacher | null>(() => {
    // Optionally restore from sessionStorage
    try {
      const saved = sessionStorage.getItem('test_sayti_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Student test states
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Active codes with countdowns
  const [activeCodes, setActiveCodes] = useState<Array<{
    code: string;
    categoryName: string;
    durationMinutes: number;
    questionCount: number;
    remainingSeconds: number;
    createdAt: number;
  }>>([]);

  // Fetch active codes periodically only for logged-in teachers/admins
  const fetchActiveCodes = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/codes/active');
      if (!res.ok) return;
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.success && Array.isArray(data.codes)) {
          setActiveCodes(data.codes);
        }
      } catch {
        // Ignored if server returned HTML during reboot
      }
    } catch (err) {
      console.error('Error fetching active codes:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchActiveCodes();
      const interval = setInterval(fetchActiveCodes, 2500);
      return () => clearInterval(interval);
    } else {
      setActiveCodes([]);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: Teacher) => {
    setCurrentUser(user);
    try {
      sessionStorage.setItem('test_sayti_user', JSON.stringify(user));
    } catch {}
    setTestResult(null);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('test_sayti_user');
    } catch {}
    setTestResult(null);
    setCurrentView('student');
  };

  const handleStartTest = (session: TestSession) => {
    setTestResult(null);
    setActiveSession(session);
  };

  const handleFinishTest = (result: TestResult) => {
    setActiveSession(null);
    setTestResult(result);
    setCurrentView('student');
  };

  const handleGoHome = () => {
    setActiveSession(null);
    setTestResult(null);
    setCurrentView('student');
    fetchActiveCodes();
  };

  const handleSwitchView = (view: 'student' | 'admin') => {
    setCurrentView(view);
    if (view === 'admin') {
      setTestResult(null);
      if (!currentUser) {
        setIsLoginModalOpen(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onSwitchView={handleSwitchView}
        onLogout={handleLogout}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isTestActive={Boolean(activeSession)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'admin' ? (
          currentUser ? (
            /* Admin / Teacher Dashboard */
            <AdminDashboard
              currentUser={currentUser}
              activeCodes={activeCodes}
              onRefreshCodes={fetchActiveCodes}
            />
          ) : (
            /* Admin prompt if not logged in */
            <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-display mb-2">
                O'qituvchi yoki Admin Kirish
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mb-6">
                Boshqaruv paneliga kirish uchun ID raqam va parolingizni kiriting.
              </p>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                Kirish Oynasini Ochish
              </button>
            </div>
          )
        ) : activeSession ? (
          /* Active Student Test Screen with Fullscreen & Esc monitoring */
          <StudentTestView
            session={activeSession}
            onFinishTest={handleFinishTest}
          />
        ) : testResult ? (
          /* Student Test Analysis Screen */
          <StudentResultView
            result={testResult}
            currentUser={currentUser}
            onGoHome={handleGoHome}
            onGoToAdmin={() => handleSwitchView('admin')}
          />
        ) : (
          /* Student Entry Screen */
          <StudentEntry
            onStartTest={handleStartTest}
          />
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLogin
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
