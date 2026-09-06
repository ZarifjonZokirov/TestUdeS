import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  PlusCircle,
  KeyRound,
  Users,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Award,
  Layers,
  Sparkles,
  BookOpen,
  FileQuestion,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { Teacher, Category, Question, TestResult } from '../types';

interface AdminDashboardProps {
  currentUser: Teacher;
  activeCodes: Array<{
    code: string;
    categoryName: string;
    durationMinutes: number;
    questionCount: number;
    remainingSeconds: number;
    createdAt: number;
  }>;
  onRefreshCodes: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  activeCodes,
  onRefreshCodes
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'codes' | 'teachers'>('categories');

  // Categories & Questions state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryQuestions, setCategoryQuestions] = useState<Question[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatDuration, setNewCatDuration] = useState('15');
  const [newCatTarget, setNewCatTarget] = useState('10');
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Question editor setup state
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(10);
  const [examDurationMinutes, setExamDurationMinutes] = useState<number>(15);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(0);
  const [editorSetupOpen, setEditorSetupOpen] = useState(false);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Teachers state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [newTeacherRole, setNewTeacherRole] = useState<'teacher' | 'admin'>('teacher');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);
  const [teacherActionMsg, setTeacherActionMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Code Generation
  const [genCategoryId, setGenCategoryId] = useState('');
  const [genDuration, setGenDuration] = useState('15');
  const [genQuestionCount, setGenQuestionCount] = useState('10');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial categories & teachers
  useEffect(() => {
    fetchCategories();
    fetchTeachers();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        if (data.categories.length > 0 && !genCategoryId) {
          setGenCategoryId(data.categories[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  // Open Category in Editor
  const handleOpenCategory = async (cat: Category) => {
    setSelectedCategory(cat);
    setTargetQuestionCount(cat.questionCountTarget || 10);
    setExamDurationMinutes(cat.defaultDurationMinutes || 15);
    setEditorSetupOpen(true);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch(`/api/categories/${cat.id}/questions?asTeacher=true`);
      const data = await res.json();
      if (data.success) {
        const loaded: Question[] = data.questions;
        setCategoryQuestions(loaded);
        setEditingQuestionIndex(0);
      }
    } catch (err) {
      console.error('Error fetching category questions:', err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setLoadingAction(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          defaultDurationMinutes: Number(newCatDuration) || 15,
          questionCountTarget: Number(newCatTarget) || 10
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCreatingCategory(false);
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
      }
    } catch (err) {
      console.error('Error creating category:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const promptDeleteCategory = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToDelete(cat);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    try {
      await fetch(`/api/categories/${encodeURIComponent(categoryToDelete.id)}`, { method: 'DELETE' });
      await fetchCategories();
      if (selectedCategory?.id === categoryToDelete.id) {
        setSelectedCategory(null);
        setEditorSetupOpen(false);
      }
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Question editing helpers
  const handleSetTargetCount = (count: number) => {
    setTargetQuestionCount(count);
    // Ensure categoryQuestions has at least `count` items
    const updated = [...categoryQuestions];
    while (updated.length < count) {
      const idx = updated.length;
      updated.push({
        id: 'q-' + Math.random().toString(36).substring(2, 9),
        categoryId: selectedCategory?.id || '',
        orderIndex: idx + 1,
        type: 'multiple_choice',
        questionText: `Yangi savol #${idx + 1}`,
        options: ['Variant A', 'Variant B', 'Variant C', 'Variant D'],
        correctOptionIndex: 0
      });
    }
    setCategoryQuestions(updated);
  };

  const handleUpdateCurrentQuestion = (updates: Partial<Question>) => {
    setCategoryQuestions((prev) => {
      const copy = [...prev];
      if (!copy[editingQuestionIndex]) {
        // Create if missing
        copy[editingQuestionIndex] = {
          id: 'q-' + Math.random().toString(36).substring(2, 9),
          categoryId: selectedCategory?.id || '',
          orderIndex: editingQuestionIndex + 1,
          type: 'multiple_choice',
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0
        };
      }
      copy[editingQuestionIndex] = {
        ...copy[editingQuestionIndex],
        ...updates
      };
      return copy;
    });
  };

  const handleSaveQuestions = async () => {
    if (!selectedCategory) return;
    setIsSavingQuestions(true);
    setSaveSuccessMsg(null);

    // Make sure all target questions exist
    const finalQuestions: Question[] = [];
    for (let i = 0; i < targetQuestionCount; i++) {
      const existing = categoryQuestions[i];
      if (existing) {
        finalQuestions.push({
          ...existing,
          categoryId: selectedCategory.id,
          orderIndex: i + 1
        });
      } else {
        finalQuestions.push({
          id: 'q-' + Math.random().toString(36).substring(2, 9),
          categoryId: selectedCategory.id,
          orderIndex: i + 1,
          type: 'multiple_choice',
          questionText: `Savol #${i + 1}`,
          options: ['Variant A', 'Variant B', 'Variant C', 'Variant D'],
          correctOptionIndex: 0
        });
      }
    }

    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: finalQuestions,
          targetCount: targetQuestionCount,
          durationMinutes: examDurationMinutes
        })
      });

      const data = await res.json();
      if (data.success) {
        setCategoryQuestions(data.questions);
        setSaveSuccessMsg('Barcha savollar va parametrlar muvaffaqiyatli saqlandi!');
        fetchCategories();
      }
    } catch (err) {
      console.error('Error saving questions:', err);
    } finally {
      setIsSavingQuestions(false);
    }
  };

  // 2-minute Code Generation
  const handleGenerateCode = async () => {
    if (!genCategoryId) return;
    setErrorMsg(null);
    setLoadingAction(true);

    try {
      const res = await fetch('/api/codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: genCategoryId,
          durationMinutes: Number(genDuration) || 15,
          questionCount: Number(genQuestionCount) || 10,
          createdBy: currentUser.id
        })
      });

      const data = await res.json();
      if (data.success && data.code) {
        setGeneratedCode(data.code.code);
        onRefreshCodes();
      } else {
        setErrorMsg(data.error || 'Kod yaratishda xatolik yuz berdi');
      }
    } catch (err) {
      setErrorMsg('Server bilan aloqa uzildi');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDeleteCode = async (code: string) => {
    await fetch(`/api/codes/${code}`, { method: 'DELETE' });
    onRefreshCodes();
    if (generatedCode === code) setGeneratedCode(null);
  };

  // Teachers Management
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherActionMsg(null);
    if (!newTeacherId.trim() || !newTeacherName.trim() || !newTeacherPassword.trim()) {
      setTeacherActionMsg({ type: 'error', text: 'Iltimos, barcha maydonlarni to‘ldiring!' });
      return;
    }

    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newTeacherId.trim(),
          fullName: newTeacherName.trim(),
          password: newTeacherPassword.trim(),
          role: newTeacherRole
        })
      });

      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers);
        setNewTeacherId('');
        setNewTeacherName('');
        setNewTeacherPassword('');
        setTeacherActionMsg({ type: 'success', text: 'Yangi o‘qituvchi muvaffaqiyatli qo‘shildi!' });
        setTimeout(() => setTeacherActionMsg(null), 4000);
      } else {
        setTeacherActionMsg({ type: 'error', text: data.error || 'Xatolik yuz berdi!' });
      }
    } catch (err: any) {
      console.error('Error adding teacher:', err);
      setTeacherActionMsg({ type: 'error', text: err?.message || 'Server bilan aloqa uzildi' });
    }
  };

  const promptDeleteTeacher = (t: Teacher) => {
    if (t.id === '20090915') {
      setTeacherActionMsg({ type: 'error', text: 'Bosh admin hisobini o‘chirib bo‘lmaydi!' });
      return;
    }
    setTeacherActionMsg(null);
    setTeacherToDelete(t);
  };

  const handleConfirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    setIsDeletingTeacher(true);
    setTeacherActionMsg(null);

    try {
      const res = await fetch(`/api/teachers/${encodeURIComponent(teacherToDelete.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTeachers(data.teachers);
        setTeacherActionMsg({ type: 'success', text: `«${teacherToDelete.fullName}» o‘qituvchisi muvaffaqiyatli o‘chirildi!` });
        setTeacherToDelete(null);
        setTimeout(() => setTeacherActionMsg(null), 4000);
      } else {
        setTeacherActionMsg({ type: 'error', text: data.error || 'O‘chirishda xatolik!' });
      }
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
      setTeacherActionMsg({ type: 'error', text: err?.message || 'Server bilan aloqa uzildi' });
    } finally {
      setIsDeletingTeacher(false);
    }
  };

  const togglePasswordVisible = (id: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const currentQ = categoryQuestions[editingQuestionIndex] || {
    id: 'temp',
    categoryId: selectedCategory?.id || '',
    orderIndex: editingQuestionIndex + 1,
    type: 'multiple_choice' as const,
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner with Role Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase tracking-wide">
              {currentUser.role === 'admin' ? 'Bosh Admin Paneli' : 'O‘qituvchi Kabineti'}
            </span>
            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">ID: {currentUser.id}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-display">
            {currentUser.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test bo'limlarini boshqarish, savollar tuzish va 2 daqiqalik kirish kodlari yaratish markazi.
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => { setActiveTab('categories'); setEditorSetupOpen(false); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Test Bo'limlari</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'codes'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>2 Daqiqalik Kodlar</span>
            {activeCodes.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            id="admin-tab-teachers"
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>O'qituvchilar</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CATEGORIES & QUESTION EDITOR */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {!editorSetupOpen ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-display">
                    Mavjud Test Bo'limlari
                  </h2>
                  <p className="text-xs text-slate-500">
                    O'zingiz xohlagan yangi bo'limlar (masalan: JavaScript testlari, Backend testlari) ochishingiz mumkin.
                  </p>
                </div>

                <button
                  type="button"
                  id="open-create-category-btn"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Yangi Bo'lim Qo'shish</span>
                </button>
              </div>

              {/* Create Category Inline Form */}
              {isCreatingCategory && (
                <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-lg mb-6 animate-in fade-in duration-200">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-indigo-600" />
                    Yangi Test Bo'limi Yaratish
                  </h3>
                  <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bo'lim Nomi *
                      </label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Masalan: JavaScript testlari yoki Backend testlari"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Qisqacha Tavsif
                      </label>
                      <input
                        type="text"
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        placeholder="Masalan: O'zgaruvchilar, funksiyalar va algoritmlar"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Standart Savollar Soni
                      </label>
                      <input
                        type="number"
                        value={newCatTarget}
                        onChange={(e) => setNewCatTarget(e.target.value)}
                        min={1}
                        max={100}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Standart Test Vaqti (Daqiqa)
                      </label>
                      <input
                        type="number"
                        value={newCatDuration}
                        onChange={(e) => setNewCatDuration(e.target.value)}
                        min={1}
                        max={180}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        disabled={loadingAction}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {loadingAction ? 'Yaratilmoqda...' : 'Bo‘limni Yaratish'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((cat, idx) => {
                  const colors = [
                    { bg: 'bg-indigo-50', text: 'text-indigo-600', badge: 'JS' },
                    { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'BE' },
                    { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'TS' }
                  ];
                  const scheme = colors[idx % colors.length];

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleOpenCategory(cat)}
                      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer group relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className={`w-12 h-12 rounded-2xl ${scheme.bg} ${scheme.text} flex items-center justify-center font-extrabold text-lg group-hover:scale-105 transition-transform`}>
                            {cat.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {cat.questionCountTarget || 10} Savol
                            </span>
                            <button
                              type="button"
                              onClick={(e) => promptDeleteCategory(cat, e)}
                              title="Bo'limni o'chirish"
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-display mb-1.5">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                          {cat.description || 'Ushbu bo‘limda test savollari jamlangan.'}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                          <FileQuestion className="w-4 h-4" />
                          {cat.questionCountTarget || 10} ta savol
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-4 h-4" />
                          {cat.defaultDurationMinutes || 15} daqiqa
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* QUESTION EDITOR INTERFACE WITH REQUESTED TOP CARD NUMBERS & SWITCH */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back to list and category info */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
                <div>
                  <button
                    type="button"
                    onClick={() => setEditorSetupOpen(false)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-1 block"
                  >
                    ← Bo'limlar ro'yxatiga qaytish
                  </button>
                  <h2 className="text-xl font-black text-slate-900 font-display">
                    {selectedCategory?.name} — Savollar Tahrirlash
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveQuestions}
                    disabled={isSavingQuestions}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSavingQuestions ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}</span>
                  </button>
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Minimalist Question Count & Time Setup:
                  Styled using the rich deep indigo geometric featured card from Geometric Balance design */}
              <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Test Sozlamalari</h3>
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full text-indigo-200">
                      Minimalistik Panel
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Test soni tanlash: 10, 20, 30 va qo'lda kiritish */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-70 mb-2">
                        Savollar Soni (Tanlang yoki qo'lda kiriting)
                      </label>
                      <div className="flex gap-2 mb-3">
                        {[10, 20, 30].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleSetTargetCount(num)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                              targetQuestionCount === num
                                ? 'bg-white text-indigo-900 shadow-sm'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-75">Qo'lda kiritish:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={targetQuestionCount}
                          onChange={(e) => handleSetTargetCount(Number(e.target.value) || 1)}
                          className="w-24 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:bg-white/20"
                        />
                        <span className="text-xs opacity-75">ta savol</span>
                      </div>
                    </div>

                    {/* Test vaqti belgilash */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase opacity-70 mb-2">
                        Vaqt (Daqiqa)
                      </label>
                      <div className="flex gap-2 mb-3">
                        {[10, 15, 20, 30].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setExamDurationMinutes(mins)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                              examDurationMinutes === mins
                                ? 'bg-white text-indigo-900 shadow-sm'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-75">Qo'lda kiritish:</span>
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={examDurationMinutes}
                          onChange={(e) => setExamDurationMinutes(Number(e.target.value) || 1)}
                          className="w-24 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:bg-white/20"
                        />
                        <span className="text-xs opacity-75">daqiqa</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
              </div>

              {/* MAIN EDITOR CARD:
                  "Test uchun oyna ochilganida nechta raqamdan iborat test ochgan bolsam hammasi tepada yani osha ortadagi card tepasida soni korinib tursin va hohlaganimga otkaza olay" */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                {/* TOP QUESTION NUMBERS BAR DIRECTLY ON CARD */}
                <div className="pb-6 mb-6 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Savollar Navigatori (Jami {targetQuestionCount} ta) — Istalganiga bosing:
                    </span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      Hozirda: {editingQuestionIndex + 1}-savol
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: targetQuestionCount }).map((_, idx) => {
                      const qObj = categoryQuestions[idx];
                      const isFilled = qObj && qObj.questionText && qObj.questionText.trim().length > 0;
                      const isCurrent = idx === editingQuestionIndex;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditingQuestionIndex(idx)}
                          className={`w-10 h-10 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center relative cursor-pointer ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-400 ring-offset-2 scale-105'
                              : isFilled
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {idx + 1}
                          {isFilled && !isCurrent && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Switch between: Variantli test va Yozma test with Geometric Balance pill switch */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Savol turi:</span>
                  <div className="inline-flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrentQuestion({ type: 'multiple_choice' })}
                      className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                        currentQ.type === 'multiple_choice'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Variantli test (4 ta variant)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrentQuestion({ type: 'written' })}
                      className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                        currentQ.type === 'written'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Yozma test
                    </button>
                  </div>
                </div>

                {/* 1 Ta Joy: Question Text */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Savol Matni #{editingQuestionIndex + 1}
                  </label>
                  <textarea
                    rows={3}
                    value={currentQ.questionText || ''}
                    onChange={(e) => handleUpdateCurrentQuestion({ questionText: e.target.value })}
                    placeholder="Savol matnini bu yerga yozing..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                  />
                </div>

                {/* 4 Ta Joy: Variantli test uchun 4 ta variant ochiladi */}
                {currentQ.type === 'multiple_choice' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Javob Variantlari (4 ta variant) va To'g'ri javobni belgilang:
                      </label>
                      <span className="text-[11px] text-indigo-600 font-bold">
                        * Harf doirachasini bosib to'g'ri javobni tanlang
                      </span>
                    </div>

                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                      const optVal = currentQ.options ? currentQ.options[optIdx] || '' : '';
                      const isCorrect = (currentQ.correctOptionIndex ?? 0) === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                            isCorrect ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/30' : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleUpdateCurrentQuestion({ correctOptionIndex: optIdx })}
                            title="To'g'ri javob deb belgilash"
                            className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isCorrect
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-500 ring-offset-2'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {letter}
                          </button>

                          <input
                            type="text"
                            value={optVal}
                            onChange={(e) => {
                              const newOpts = [...(currentQ.options || ['', '', '', ''])];
                              newOpts[optIdx] = e.target.value;
                              handleUpdateCurrentQuestion({ options: newOpts });
                            }}
                            placeholder={`${letter} varianti matni...`}
                            className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />

                          {isCorrect && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                              ✓ To'g'ri javob
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Written question expected answer */
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      To'g'ri Yozma Javob (Kalit so'z yoki ifoda)
                    </label>
                    <input
                      type="text"
                      value={currentQ.correctWrittenAnswer || ''}
                      onChange={(e) => handleUpdateCurrentQuestion({ correctWrittenAnswer: e.target.value })}
                      placeholder="Masalan: HTTPS yoki let, const, var"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                    />
                    <p className="text-[11px] text-slate-500">
                      O'quvchi yozgan javob ushbu kalitga mos kelsa to'g'ri deb baholanadi.
                    </p>
                  </div>
                )}

                {/* Quick Prev / Next Navigator for editing */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={editingQuestionIndex === 0}
                    onClick={() => setEditingQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    ← Oldingi savol
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveQuestions}
                    disabled={isSavingQuestions}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {isSavingQuestions ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>

                  <button
                    type="button"
                    disabled={editingQuestionIndex >= targetQuestionCount - 1}
                    onClick={() => setEditingQuestionIndex((prev) => Math.min(targetQuestionCount - 1, prev + 1))}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Keyingi savol →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 2-MINUTE CODE GENERATION AS EXPLICITLY REQUESTED
          "Va adminga yana bitta joy qosh oquvchilar kirishi uchun 2 daqiqalik kod generatsiya qilish bolsin kod generatsiya qilinganda 2 daqiqa amal qilsin va admindan ochib ketsin oquvchilar u kod orqali tesga kira olamasin" */}
      {activeTab === 'codes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">
                  2 Daqiqalik Kod Generatsiya Qilish
                </h3>
                <p className="text-xs text-slate-500">
                  Ushbu kod yaratilgan paytdan boshlab 2 daqiqa amal qiladi va so'ng avtomatik o'chadi.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Qaysi Test Bo'limi Uchun?
                </label>
                <select
                  value={genCategoryId}
                  onChange={(e) => setGenCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.questionCountTarget} ta savol)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Savollar Soni
                  </label>
                  <input
                    type="number"
                    value={genQuestionCount}
                    onChange={(e) => setGenQuestionCount(e.target.value)}
                    min={1}
                    max={50}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Test Vaqti (Daqiqa)
                  </label>
                  <input
                    type="number"
                    value={genDuration}
                    onChange={(e) => setGenDuration(e.target.value)}
                    min={1}
                    max={120}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="generate-code-btn"
                  onClick={handleGenerateCode}
                  disabled={loadingAction}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loadingAction ? 'Generatsiya qilinmoqda...' : '2 Daqiqalik Kod Yaratish'}</span>
                </button>
              </div>
            </div>

            {/* Generated Code Spotlight */}
            {generatedCode && (
              <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-3xl text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 block mb-1">
                  Yangi Kirish Kodi (2 daqiqa amal qiladi)
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-slate-900 my-2">
                  {generatedCode}
                </div>
                <p className="text-xs text-amber-900 mb-4">
                  O'quvchilarga ushbu kodni ayting. Ular kirib ismini kiritishi bilanoq test boshlanadi!
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyCode(generatedCode)}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Nusxa olindi!' : 'Kodni nusxalash'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Codes List with Real-time Countdowns */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-slate-900 font-display">
                  Faol Kirish Kodlari ({activeCodes.length} ta)
                </h3>
                <span className="text-xs text-slate-500">2 daqiqadan so'ng avto-o'chadi</span>
              </div>

              {activeCodes.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 text-xs">
                  Hozirda faol 2 daqiqalik kirish kodi yo'q. Yangi kod generatsiya qiling.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCodes.map((item) => {
                    const mins = Math.floor(item.remainingSeconds / 60);
                    const secs = item.remainingSeconds % 60;
                    const isExpiringSoon = item.remainingSeconds < 30;

                    return (
                      <div
                        key={item.code}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                          isExpiringSoon ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-mono font-black tracking-wider text-slate-900">
                              {item.code}
                            </span>
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                              {item.categoryName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {item.questionCount} ta savol • {item.durationMinutes} daqiqa test
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className={`text-sm font-mono font-black block ${
                              isExpiringSoon ? 'text-rose-600 animate-pulse' : 'text-indigo-600'
                            }`}>
                              {mins}:{secs < 10 ? '0' : ''}{secs}
                            </span>
                            <span className="text-[10px] text-slate-600">amal qiladi</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteCode(item.code)}
                            title="Kodni bekor qilish"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
              💡 <strong>Xavfsizlik eslatmasi:</strong> 2 daqiqa o'tgach kod ro'yxatdan va backend bazasidan to'liq o'chib ketadi. O'quvchilar ushbu kod orqali qayta kira olmaydi.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHERS MANAGEMENT AS EXPLICITLY REQUESTED */}
      {activeTab === 'teachers' && (
        <div className="space-y-8">
          {/* Teacher Action Alert / Notification */}
          {teacherActionMsg && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
              teacherActionMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {teacherActionMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{teacherActionMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setTeacherActionMsg(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add Teacher Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">
                  Yangi O'qituvchi Qo'shish
                </h3>
                <p className="text-xs text-slate-500">
                  O'qituvchilar test yaratishi va o'z o'quvchilariga kirish kodlari berishi mumkin.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Login ID (Masalan: 202601) *
                </label>
                <input
                  type="text"
                  value={newTeacherId}
                  onChange={(e) => setNewTeacherId(e.target.value)}
                  placeholder="ID raqam"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  To'liq Ism-Familiya *
                </label>
                <input
                  type="text"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="Masalan: Nodir Aliyev"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Parol *
                </label>
                <input
                  type="text"
                  value={newTeacherPassword}
                  onChange={(e) => setNewTeacherPassword(e.target.value)}
                  placeholder="Parolni kiriting"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  + O'qituvchini Qo'shish
                </button>
              </div>
            </form>
          </div>

          {/* Teachers List Table: Displaying Login ID, Password, Name, and Delete */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <h3 className="text-base font-black text-slate-900 font-display mb-4">
              O'qituvchilar Ro'yxati (ID va Parollari bilan)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider bg-slate-50/60">
                    <th className="py-3 px-4">Login ID</th>
                    <th className="py-3 px-4">Ism-Familiya</th>
                    <th className="py-3 px-4">Parol</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {teachers.map((t) => {
                    const isPwVisible = showPasswords[t.id];
                    const isMasterAdmin = t.id === '20090915';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {t.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-semibold">
                          {t.fullName}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <span className="font-mono text-slate-800">
                              {isPwVisible ? t.password : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisible(t.id)}
                              title={isPwVisible ? 'Yashirish' : 'Ko‘rish'}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {isPwVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.role === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t.role === 'admin' ? 'Bosh Admin' : 'O‘qituvchi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isMasterAdmin ? (
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                              Asosiy Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => promptDeleteTeacher(t)}
                              className="text-rose-600 hover:text-rose-800 font-bold p-1 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="O‘qituvchini o‘chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER DELETION CONFIRMATION MODAL */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900 font-display mb-2">
              O'qituvchini o'chirish
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Haqiqatan ham «<strong>{teacherToDelete.fullName}</strong>» (Login ID: <span className="font-mono font-bold text-slate-800">{teacherToDelete.id}</span>) hisobini tizimdan o'chirmoqchimisiz?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeletingTeacher}
                onClick={() => setTeacherToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                id="confirm-delete-teacher-btn"
                disabled={isDeletingTeacher}
                onClick={handleConfirmDeleteTeacher}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeletingTeacher ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>O'chirilmoqda...</span>
                  </>
                ) : (
                  <span>Ha, o'chirish</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY DELETION CONFIRMATION MODAL */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900 font-display mb-2">
              Bo'limni o'chirish
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Haqiqatan ham «<strong>{categoryToDelete.name}</strong>» bo'limini va undagi barcha savollarni butunlay o'chirmoqchimisiz?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                id="confirm-delete-category-btn"
                disabled={isDeletingCategory}
                onClick={handleConfirmDeleteCategory}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeletingCategory ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>O'chirilmoqda...</span>
                  </>
                ) : (
                  <span>Ha, o'chirish</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
