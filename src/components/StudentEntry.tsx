import React, { useState } from 'react';
import { KeyRound, User, ArrowRight, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';
import { TestSession } from '../types';

interface StudentEntryProps {
  onStartTest: (session: TestSession) => void;
}

export const StudentEntry: React.FC<StudentEntryProps> = ({
  onStartTest
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [step, setStep] = useState<'enter_code' | 'enter_name'>('enter_code');
  const [verifiedInfo, setVerifiedInfo] = useState<{
    categoryName: string;
    questionCount: number;
    durationMinutes: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const trimmedCode = accessCode.trim();
    if (!trimmedCode) {
      setError('Iltimos, o‘qituvchingiz bergan 6 xonali kirish kodini kiriting!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/student/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Kirish kodi noto‘g‘ri yoki muddati o‘tgan!');
        setLoading(false);
        return;
      }

      setVerifiedInfo({
        categoryName: data.categoryName,
        questionCount: data.questionCount,
        durationMinutes: data.durationMinutes
      });
      setStep('enter_name');
    } catch (err) {
      setError('Server bilan bog‘lanishda xatolik. Qaytadan urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = studentName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setError('Iltimos, to‘liq ism va familiyangizni kiriting (kamida 3 ta belgi)!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/student/start-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: accessCode.trim(),
          studentName: trimmedName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Testni boshlashda xatolik yuz berdi!');
        setLoading(false);
        return;
      }

      onStartTest(data.session);
    } catch (err) {
      setError('Server bilan aloqa uzildi. Iltimos, qaytadan urinib ko‘ring.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Welcome Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            O'quvchilar uchun online imtihon
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight mb-2">
            Bilimingizni Sinab Ko'ring
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            O'qituvchingiz taqdim etgan 2 daqiqalik kirish kodini kiriting va testni boshlang.
          </p>
        </div>

        {/* Entry Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50 rounded-full blur-2xl pointer-events-none"></div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {step === 'enter_code' ? (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Test Kirish Kodi (6 xonali)
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="student-access-code-input"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/\s+/g, ''))}
                    placeholder="Masalan: 482910"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  ⚠️ Eslatma: O'qituvchi bergan 6 xonali kod faqat 2 daqiqa amal qiladi.
                </p>
              </div>

              <button
                type="submit"
                id="verify-code-btn"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  'Tekshirilmoqda...'
                ) : (
                  <>
                    <span>Davom etish</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStartExam} className="space-y-5">
              {/* Category Info Banner */}
              {verifiedInfo && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">
                      Tanlangan Imtihon
                    </span>
                    <h4 className="text-base font-bold text-slate-900 font-display">
                      {verifiedInfo.categoryName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">
                      {verifiedInfo.questionCount} ta savol
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {verifiedInfo.durationMinutes} daqiqa
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Ism va Familiyangiz
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="student-fullname-input"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Masalan: Zarifjon Zokirov"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Test yakunlangach, natijangiz va tahlilingiz ushbu ism bilan saqlanadi hamda o'qituvchiga yuboriladi.
                </p>
              </div>

              {/* Security notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  <strong>Qoida:</strong> Test to'liq ekran (Fullscreen) rejimida o'tadi. Agar <strong>Esc</strong> tugmasi bosilsa yoki ekrandan chiqilsa, 5 soniya ichida test to'xtatiladi!
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('enter_code')}
                  className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Orqaga
                </button>
                <button
                  type="submit"
                  id="start-exam-now-btn"
                  disabled={loading}
                  className="w-2/3 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    'Tayyorlanmoqda...'
                  ) : (
                    <>
                      <span>Testni Boshlash</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
