import React, { useState } from 'react';
import { X, KeyRound, User, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { Teacher } from '../types';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Teacher) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginId.trim() || !password.trim()) {
      setError('Iltimos, ID raqam va parolingizni kiriting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loginId, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Kirishda xatolik yuz berdi!');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError('Server bilan aloqa uzildi. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            type="button"
            id="close-login-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black font-display tracking-tight">
                O'qituvchi va Admin Kirish
              </h3>
              <p className="text-xs text-slate-400">
                O'quv markazi boshqaruv tizimi
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              ID Raqam (Kirish ID)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="login-id-input"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Masalan: 20090915"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                id="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolingizni kiriting"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="submit-login-btn"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
