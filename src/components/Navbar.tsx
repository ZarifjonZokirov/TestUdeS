import React from 'react';
import { ShieldCheck, UserCheck, LogOut, BookOpen, Clock, Award } from 'lucide-react';
import { Teacher } from '../types';

interface NavbarProps {
  currentUser: Teacher | null;
  currentView: 'student' | 'admin';
  onSwitchView: (view: 'student' | 'admin') => void;
  onLogout: () => void;
  onOpenLoginModal: () => void;
  isTestActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onSwitchView,
  onLogout,
  onOpenLoginModal,
  isTestActive
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-100">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
                EduTest<span className="text-indigo-600">Pro</span>
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Firebase Firestore
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              O'quv markazlari va bolalar uchun xavfsiz test platformasi
            </p>
          </div>
        </div>

        {/* View Switchers & Auth */}
        {!isTestActive && (
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      ID: <code className="font-mono text-indigo-600 bg-slate-50 px-1 py-0.5 rounded border border-slate-200">{currentUser.id}</code> ({currentUser.role === 'admin' ? 'Super Admin' : 'O‘qituvchi'})
                    </span>
                  </div>
                  <div className="w-9 h-9 bg-slate-100 border-2 border-white rounded-full shadow-xs flex items-center justify-center text-slate-700 font-bold text-xs">
                    {currentUser.fullName.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
                  <button
                    type="button"
                    id="admin-dashboard-tab-btn"
                    onClick={() => onSwitchView('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentView === 'admin'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Boshqaruv Paneli
                  </button>

                  <button
                    type="button"
                    id="student-view-tab-btn"
                    onClick={() => onSwitchView('student')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentView === 'student'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    O'quvchi oynasi
                  </button>
                </div>

                <button
                  type="button"
                  id="logout-btn"
                  onClick={onLogout}
                  title="Chiqish"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="open-teacher-login-btn"
                  onClick={onOpenLoginModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-white" />
                  O'qituvchi / Admin kirish
                </button>
              </div>
            )}
          </div>
        )}

        {isTestActive && (
          <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Faol test sessiyasi
          </div>
        )}
      </div>
    </header>
  );
};
