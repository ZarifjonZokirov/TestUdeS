import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { TestResult, Teacher } from '../types';

interface StudentResultViewProps {
  result: TestResult;
  onGoHome: () => void;
  onGoToAdmin?: () => void;
  currentUser?: Teacher | null;
}

export const StudentResultView: React.FC<StudentResultViewProps> = ({
  result,
  onGoHome,
  onGoToAdmin,
  currentUser
}) => {
  const isPassed = result.isPassed;
  const minutes = Math.floor(result.durationSpentSeconds / 60);
  const seconds = result.durationSpentSeconds % 60;

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-[#F1F5F9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left Result Info */}
            <div className="flex items-center gap-5 text-center md:text-left">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border ${
                isPassed
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                {isPassed ? (
                  <Award className="w-10 h-10" />
                ) : (
                  <AlertTriangle className="w-10 h-10" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                    isPassed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isPassed ? 'Muvaffaqiyatli O‘tdi' : 'Minimal Ball Yetmadi'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Minimal: 75%
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                  {result.studentName}
                </h1>
                <p className="text-sm text-slate-500">
                  {result.categoryName} imtihoni natijalari
                </p>
              </div>
            </div>

            {/* Big Percentage Metric */}
            <div className="text-center md:text-right bg-slate-50 border border-slate-200 rounded-2xl p-5 min-w-[180px]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Yakuniy Natija
              </span>
              <div className={`text-4xl sm:text-5xl font-black font-display tracking-tight ${
                isPassed ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {result.scorePercent}%
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">
                {result.correctCount} / {result.totalQuestions} ta to'g'ri
              </span>
            </div>
          </div>

          {/* Status Message Banner */}
          <div className={`mt-6 p-4 rounded-2xl border flex items-center gap-3 ${
            isPassed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {isPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div className="text-xs sm:text-sm font-semibold">
              {isPassed ? (
                <span>
                  <strong>Tabriklaymiz!</strong> Siz 75% minimal o'tish ko'rsatkichidan oshib, ushbu sinovdan muvaffaqiyatli o'tdingiz.
                </span>
              ) : (
                <span>
                  <strong>Afsus!</strong> O'tish uchun kamida 75% ball kerak edi. Mavzularni takrorlab, qaytadan urinib ko'ring.
                </span>
              )}
            </div>
          </div>

          {/* Telegram bot status */}
          <div className="mt-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Telegram Bot (Admin: 7877695886): <strong>Natija va hisobot adminga yuborildi</strong></span>
            </div>
            {result.terminationReason === 'esc_key' && (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-200">
                ⚠️ Esc bosilishi tufayli to'xtatildi
              </span>
            )}
          </div>
        </div>

        {/* Detailed Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              To'g'ri Javoblar
            </span>
            <span className="text-2xl font-black text-emerald-600 font-display">
              {result.correctCount} ta
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Xato Javoblar
            </span>
            <span className="text-2xl font-black text-rose-600 font-display">
              {result.totalQuestions - result.correctCount} ta
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Sarflangan Vaqt
            </span>
            <span className="text-xl font-black text-slate-800 font-mono">
              {minutes}m {seconds}s
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              O'tish Chegarasi
            </span>
            <span className="text-2xl font-black text-indigo-600 font-display">
              75%
            </span>
          </div>
        </div>

        {/* Question-by-Question Analysis (Taxlil Oynasi) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-display">
                Savollar Tahlili (Variantlar va To'g'ri Javoblar)
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Jami {result.answersBreakdown.length} ta savol
            </span>
          </div>

          <div className="space-y-4">
            {result.answersBreakdown.map((item, idx) => {
              const isCorrect = item.isCorrect;

              return (
                <div
                  key={item.questionId || idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center text-white ${
                        isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCorrect ? 'To‘g‘ri' : 'Xato'}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      {item.type === 'multiple_choice' ? 'Variantli test' : 'Yozma test'}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-4 leading-snug">
                    {item.questionText}
                  </h4>

                  {/* Multiple Choice Review */}
                  {item.type === 'multiple_choice' && item.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {item.options.map((optText, optIdx) => {
                        const isStudentChoice = item.studentAnswer === optIdx;
                        const isRightAnswer = item.correctAnswer === optIdx;

                        let optClass = 'bg-white border-slate-200 text-slate-700';
                        if (isRightAnswer) {
                          optClass = 'bg-emerald-100/80 border-emerald-300 text-emerald-950 font-bold';
                        } else if (isStudentChoice && !isRightAnswer) {
                          optClass = 'bg-rose-100/80 border-rose-300 text-rose-950 font-bold';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${optClass}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold opacity-75">{letters[optIdx]}:</span>
                              <span>{optText}</span>
                            </div>
                            <div className="shrink-0">
                              {isRightAnswer && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-sm font-bold">
                                  To'g'ri
                                </span>
                              )}
                              {isStudentChoice && !isRightAnswer && (
                                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded-sm font-bold">
                                  Sizning javob
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Written Question Review */}
                  {item.type === 'written' && (
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div>
                        <span className="font-bold text-slate-500">Sizning javobingiz: </span>
                        <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                          {item.studentAnswer || '(Javob yozilmadi)'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">To'g'ri javob: </span>
                        <span className="text-emerald-800 font-bold">{item.correctAnswer}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            type="button"
            id="back-home-btn"
            onClick={onGoHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-2xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Yangi test topshirish (Bosh sahifa)</span>
          </button>

          <button
            type="button"
            id="go-to-admin-btn"
            onClick={onGoToAdmin || onGoHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {currentUser ? "Boshqaruv paneliga o'tish" : "O'qituvchi / Boshqaruv paneli"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
