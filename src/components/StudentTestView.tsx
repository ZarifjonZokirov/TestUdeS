import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Maximize2,
  HelpCircle,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { TestSession, TestResult } from '../types';

interface StudentTestViewProps {
  session: TestSession;
  onFinishTest: (result: TestResult) => void;
}

export const StudentTestView: React.FC<StudentTestViewProps> = ({
  session,
  onFinishTest
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [remainingTime, setRemainingTime] = useState<number>(() => {
    return Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  });

  // Green welcome banner
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Esc / Fullscreen exit warning & 5-second countdown
  const [escWarningActive, setEscWarningActive] = useState(false);
  const [escCountdown, setEscCountdown] = useState(5);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Confirm finish modal
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;

  const escWarningActiveRef = useRef(escWarningActive);
  escWarningActiveRef.current = escWarningActive;

  const questions = session.questions;
  const currentQuestion = questions[currentIndex];

  const handleFinalSubmit = useCallback(async (reason: 'normal' | 'esc_key' | 'time_expired' = 'normal') => {
    if (isSubmittingRef.current) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const currentAnswers = answersRef.current;
      const res = await fetch('/api/student/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          answers: currentAnswers,
          terminationReason: reason
        })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('Response was not JSON:', jsonErr);
      }

      if (res.ok && data?.success && data?.result) {
        setEscWarningActive(false);
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
          }
        } catch (fsErr) {
          // Ignore fullscreen exit errors
        }
        onFinishTest(data.result);
      } else {
        const errorMsg = data?.error || 'Natijalarni saqlashda xatolik yuz berdi!';
        setSubmitError(errorMsg);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error submitting test:', err);
      setSubmitError(err?.message || 'Server bilan aloqa uzildi. Qayta urinib ko‘ring.');
      setIsSubmitting(false);
    }
  }, [session.sessionId, onFinishTest]);

  const handleFinalSubmitRef = useRef(handleFinalSubmit);
  handleFinalSubmitRef.current = handleFinalSubmit;

  // Request fullscreen on start
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen request bypassed or denied by browser:', err);
      }
    };
    enterFullscreen();

    // Hide welcome banner after 6 seconds
    const timer = setTimeout(() => {
      setShowWelcomeBanner(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Main test countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setRemainingTime(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(interval);
        handleFinalSubmitRef.current('time_expired');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.expiresAt]);

  // Dedicated 5-Second Countdown effect when escWarningActive becomes true
  useEffect(() => {
    if (!escWarningActive) return;

    setEscCountdown(5);
    setSubmitError(null);

    const interval = setInterval(() => {
      setEscCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmitRef.current('esc_key');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [escWarningActive]);

  // Listen to Escape keydown, fullscreenchange, visibilitychange, and window resize
  useEffect(() => {
    const triggerWarning = () => {
      if (!isSubmittingRef.current && !escWarningActiveRef.current) {
        setEscWarningActive(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerWarning();
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerWarning();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerWarning();
      }
    };

    // Also detect if the browser screen is resized/shrunk away from full screen
    const handleResize = () => {
      // If user shrinks window significantly (e.g. exiting full screen or resizing window)
      if (window.innerWidth < 640 || (window.screen && window.outerWidth < window.screen.availWidth * 0.8)) {
        if (!document.fullscreenElement) {
          triggerWarning();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleResumeFullscreen = async () => {
    setEscWarningActive(false);
    setSubmitError(null);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Failed to re-enter fullscreen:', e);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleWrittenInput = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '').length;

  // Format MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col select-none relative pb-8">
      {/* 1. Top Green Banner: "Test boshlandi, omad!" */}
      {showWelcomeBanner && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 shadow-sm flex items-center justify-between transition-all animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm font-extrabold tracking-wide">
              <Sparkles className="w-5 h-5 text-emerald-200 animate-spin" />
              <span>Test boshlandi, omad tilaymiz!</span>
              <span className="hidden sm:inline-block text-xs font-normal opacity-90">
                — {session.studentName} ({session.categoryName})
              </span>
            </div>
            <button
              onClick={() => setShowWelcomeBanner(false)}
              className="text-emerald-100 hover:text-white text-xs font-bold px-2 py-0.5 rounded-sm hover:bg-emerald-700/50 transition-colors"
            >
              Yopish ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Container: Left card (narrow tall) & Center card (main) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 flex-1 flex flex-col md:flex-row gap-6 items-start">
        {/* LEFT CARD: Tall, compact, metrics and question navigator */}
        <aside className="w-full md:w-80 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col gap-5 shrink-0 sticky top-4">
          {/* Header Info */}
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block">
              O'quvchi
            </span>
            <h3 className="text-base font-black text-slate-900 truncate font-display">
              {session.studentName}
            </h3>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block mt-1.5 border border-indigo-100">
              {session.categoryName}
            </span>
          </div>

          <hr className="border-slate-100" />

          {/* Metric 1: Umumiy Vaqt Ko'rsatkichi */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            remainingTime < 120
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${remainingTime < 120 ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`} />
                Umumiy Vaqt
              </span>
              {remainingTime < 120 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-rose-200 text-rose-900">
                  Kam qoldi!
                </span>
              )}
            </div>
            <div className="text-3xl font-mono font-black tracking-tight">
              {formatTime(remainingTime)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Vaqt tugaganda natijalar avtomatik saqlanadi
            </p>
          </div>

          {/* Metric 2 & 3: Nechanchi testda ketyapti va Nechta testdan o'tildi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-500 block uppercase">
                Joriy Savol
              </span>
              <span className="text-xl font-black text-slate-900 font-display">
                {currentIndex + 1}
                <span className="text-xs font-medium text-slate-400"> / {questions.length}</span>
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-800 block uppercase">
                O'tildi (Javob)
              </span>
              <span className="text-xl font-black text-emerald-700 font-display">
                {answeredCount}
                <span className="text-xs font-medium text-emerald-600"> / {questions.length}</span>
              </span>
            </div>
          </div>

          {/* Question Grid Navigator */}
          <div>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
              Savollar ro'yxati
            </span>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl text-xs font-black transition-all flex items-center justify-center relative cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2 shadow-xs'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                    {isAnswered && !isCurrent && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-600 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Finish Button */}
          <button
            type="button"
            id="finish-test-btn"
            onClick={() => setShowConfirmFinish(true)}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold shadow-sm shadow-rose-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Testni Yakunlash</span>
          </button>
        </aside>

        {/* CENTER MAIN CARD: Question Text, Options, and Controls */}
        <main className="flex-1 w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[520px]">
          {currentQuestion ? (
            <div>
              {/* Question Header Card Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black tracking-wide">
                    Savol {currentIndex + 1} / {questions.length}
                  </span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    currentQuestion.type === 'multiple_choice'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {currentQuestion.type === 'multiple_choice' ? 'Variantli test' : 'Yozma test'}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-500">
                  {answers[currentQuestion.id] !== undefined && answers[currentQuestion.id] !== '' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Javob belgilangan
                    </span>
                  ) : (
                    <span className="text-slate-400">Javob belgilanmagan</span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed font-sans">
                  {currentQuestion.questionText}
                </h2>
              </div>

              {/* Options or Written Input */}
              {currentQuestion.type === 'multiple_choice' ? (
                <div className="space-y-3">
                  {(currentQuestion.options || []).map((optionText, optIdx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const isSelected = answers[currentQuestion.id] === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {letters[optIdx] || optIdx + 1}
                        </span>
                        <span className={`text-sm sm:text-base font-medium pt-1 ${
                          isSelected ? 'text-indigo-950 font-semibold' : 'text-slate-800'
                        }`}>
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Javobingizni kiriting:
                  </label>
                  <textarea
                    rows={4}
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleWrittenInput(e.target.value)}
                    placeholder="Javobingizni shu yerga yozing..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                  />
                  <p className="text-xs text-slate-500">
                    * Yozma savolda aniq va qisqa javob yozish tavsiya etiladi.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Savol yuklanmadi
            </div>
          )}

          {/* Bottom Navigation Controls */}
          <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Oldingi</span>
            </button>

            <div className="text-xs font-semibold text-slate-500 hidden sm:block">
              {currentIndex + 1} - savol ({questions.length} tadan)
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm shadow-indigo-100 cursor-pointer"
              >
                <span>Keyingi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmFinish(true)}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm shadow-emerald-200 cursor-pointer"
              >
                <span>Testni Yakunlash</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </main>
      </div>

      {/* 2. ESC WARNING MODAL: 5-Second Countdown Termination */}
      {escWarningActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-500 text-center animate-bounce-short">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <ShieldAlert className="w-9 h-9 animate-pulse" />
            </div>

            <h3 className="text-xl font-black text-slate-900 font-display mb-2">
              DIQQAT: Test Rejimidan Chiqildi!
            </h3>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Siz <strong>ESC</strong> tugmasini bosdingiz yoki to'liq ekran rejimidan chiqdingiz.
              Qoidaga ko'ra, <strong>5 soniya</strong> ichida test to'xtatiladi va natijalar bazaga avtomatik saqlanib, adminga yuboriladi!
            </p>

            {/* Countdown Badge */}
            <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-600/30">
              <span className="text-3xl font-black font-mono animate-ping-short">
                {escCountdown}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleResumeFullscreen}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Davom ettirish (Qaytish)</span>
              </button>

              <button
                type="button"
                id="esc-submit-now-btn"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit('esc_key')}
                className="py-3.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-rose-200 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Yakunlanmoqda...</span>
                  </>
                ) : (
                  <span>Hozir yakunlash</span>
                )}
              </button>
            </div>

            {submitError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {submitError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CONFIRM FINISH MODAL */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-2 font-display">
              Testni yakunlashni tasdiqlaysizmi?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Siz {questions.length} ta savoldan {answeredCount} tasiga javob berdingiz.
              {answeredCount < questions.length && (
                <span className="text-amber-600 font-bold block mt-1">
                  ⚠️ {questions.length - answeredCount} ta savol javobsiz qolmoqda!
                </span>
              )}
            </p>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Qaytish va davom etish
              </button>
              <button
                type="button"
                id="confirm-submit-btn"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit('normal')}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Baholanmoqda...</span>
                  </>
                ) : (
                  <span>Ha, yakunlash</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
