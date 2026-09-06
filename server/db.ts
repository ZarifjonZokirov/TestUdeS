import fs from 'fs';
import path from 'path';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { firestore } from './firebase.ts';
import {
  Teacher,
  Category,
  Question,
  PublicQuestion,
  AccessCode,
  TestSession,
  TestResult,
  QuestionResultItem
} from '../src/types.ts';
import { sendTelegramTestResult } from './telegram.ts';

interface TestSaytiDatabase {
  teachers: Teacher[];
  categories: Category[];
  questions: Question[];
  accessCodes: AccessCode[];
  sessions: Record<string, TestSession & { questionIds: string[] }>;
  results: TestResult[];
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'test_sayti.json');

// Ensure directory exists
if (!process.env.VERCEL) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn("Could not create DATA_DIR. Vercel environment detected.", e);
  }
}

// Helper to remove/convert undefined values for Firestore compatibility
export function sanitizeForFirestore<T>(data: T): any {
  if (data === undefined) return null;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (value === undefined) {
        return null;
      }
      return value;
    })
  );
}

function getInitialData(): TestSaytiDatabase {
  const initialTeachers: Teacher[] = [
    {
      id: '20090915',
      fullName: 'Zarifjon Zokirov (Bosh Admin)',
      role: 'admin',
      password: 'ZZOKIROV2009@z',
      createdAt: Date.now(),
    },
    {
      id: 'teacher101',
      fullName: 'Malika Karimova (Frontend O\'qituvchi)',
      role: 'teacher',
      password: 'Ustoz2026@Teacher',
      createdAt: Date.now(),
    }
  ];

  const initialCategories: Category[] = [
    {
      id: 'cat-js',
      name: 'JavaScript testlari',
      description: 'O\'zgaruvchilar, funksiyalar, sikllar, massivlar va DOM asoslari',
      defaultDurationMinutes: 15,
      questionCountTarget: 10,
      createdAt: Date.now(),
    },
    {
      id: 'cat-backend',
      name: 'Backend testlari',
      description: 'Node.js, Express.js, REST API, JSON va server arxitekturasi',
      defaultDurationMinutes: 15,
      questionCountTarget: 10,
      createdAt: Date.now(),
    },
    {
      id: 'cat-web-kids',
      name: 'Kompyuter va Web Savodxonligi',
      description: 'Internet, HTML asoslari va xavfsiz kompyuter foydalanish',
      defaultDurationMinutes: 10,
      questionCountTarget: 10,
      createdAt: Date.now(),
    }
  ];

  const initialQuestions: Question[] = [
    // JavaScript Questions (10)
    {
      id: 'q-js-1',
      categoryId: 'cat-js',
      orderIndex: 1,
      type: 'multiple_choice',
      questionText: 'JavaScript tilida o‘zgaruvchi e‘lon qilish uchun qaysi kalit so‘zlardan foydalaniladi?',
      options: ['let, const, var', 'int, float, double', 'def, lambda, dim', 'make, new, class'],
      correctOptionIndex: 0
    },
    {
      id: 'q-js-2',
      categoryId: 'cat-js',
      orderIndex: 2,
      type: 'multiple_choice',
      questionText: 'console.log(typeof "Salom Dunyo") buyrug‘i konsolga qanday natija chiqaradi?',
      options: ['number', 'string', 'boolean', 'undefined'],
      correctOptionIndex: 1
    },
    {
      id: 'q-js-3',
      categoryId: 'cat-js',
      orderIndex: 3,
      type: 'multiple_choice',
      questionText: 'JavaScriptda massiv (array) elementlari qaysi qavslar orasida yoziladi?',
      options: ['( ) dumaloq qavs', '{ } jingalak qavs', '[ ] to‘rtburchak qavs', '< > burchakli qavs'],
      correctOptionIndex: 2
    },
    {
      id: 'q-js-4',
      categoryId: 'cat-js',
      orderIndex: 4,
      type: 'multiple_choice',
      questionText: '5 === "5" ifodasi qanday natija qaytaradi?',
      options: ['true', 'false', 'undefined', 'NaN'],
      correctOptionIndex: 1
    },
    {
      id: 'q-js-5',
      categoryId: 'cat-js',
      orderIndex: 5,
      type: 'multiple_choice',
      questionText: 'Massivning oxiriga yangi element qo‘shish uchun qaysi metod ishlatiladi?',
      options: ['pop()', 'shift()', 'push()', 'unshift()'],
      correctOptionIndex: 2
    },
    {
      id: 'q-js-6',
      categoryId: 'cat-js',
      orderIndex: 6,
      type: 'multiple_choice',
      questionText: 'Quyidagilardan qaysi biri JavaScriptda takrorlanish (loop) operatori hisoblanadi?',
      options: ['for', 'if', 'switch', 'return'],
      correctOptionIndex: 0
    },
    {
      id: 'q-js-7',
      categoryId: 'cat-js',
      orderIndex: 7,
      type: 'multiple_choice',
      questionText: 'Funksiya qiymat qaytarishi uchun qaysi kalit so‘zdan foydalaniladi?',
      options: ['send', 'return', 'give', 'output'],
      correctOptionIndex: 1
    },
    {
      id: 'q-js-8',
      categoryId: 'cat-js',
      orderIndex: 8,
      type: 'multiple_choice',
      questionText: 'Math.max(10, 45, 12, 88, 3) ifodasi qanday sonni qaytaradi?',
      options: ['10', '45', '88', '3'],
      correctOptionIndex: 2
    },
    {
      id: 'q-js-9',
      categoryId: 'cat-js',
      orderIndex: 9,
      type: 'multiple_choice',
      questionText: 'HTML elementini ID orqali tanlab olish uchun qaysi DOM metodi ishlatiladi?',
      options: ['document.getElementById()', 'document.selectId()', 'window.findNode()', 'element.find()'],
      correctOptionIndex: 0
    },
    {
      id: 'q-js-10',
      categoryId: 'cat-js',
      orderIndex: 10,
      type: 'written',
      questionText: 'JavaScriptda mantiqiy "VA" (AND) operatori qaysi belgi orqali yoziladi? (Masalan: && yoki ||)',
      correctWrittenAnswer: '&&'
    },

    // Backend Questions (10)
    {
      id: 'q-be-1',
      categoryId: 'cat-backend',
      orderIndex: 1,
      type: 'multiple_choice',
      questionText: 'Node.js nima vazifani bajaradi?',
      options: [
        'Brauzerdan tashqarida JavaScript kodini ishga tushiruvchi runtime muhit',
        'Faqat veb-sayt dizaynini bezash uchun kutubxona',
        'Relyatsion SQL ma\'lumotlar bazasi',
        'Mobil telefonlar uchun operatsion tizim'
      ],
      correctOptionIndex: 0
    },
    {
      id: 'q-be-2',
      categoryId: 'cat-backend',
      orderIndex: 2,
      type: 'multiple_choice',
      questionText: 'Express.js da GET so‘rovlarini qabul qilish uchun qaysi metod ishlatiladi?',
      options: ['app.get()', 'app.post()', 'app.listen()', 'app.use()'],
      correctOptionIndex: 0
    },
    {
      id: 'q-be-3',
      categoryId: 'cat-backend',
      orderIndex: 3,
      type: 'multiple_choice',
      questionText: 'Frontend va Backend o‘rtasida ma\'lumot uzatishda eng keng tarqalgan format qaysi?',
      options: ['XML', 'JSON', 'CSV', 'YAML'],
      correctOptionIndex: 1
    },
    {
      id: 'q-be-4',
      categoryId: 'cat-backend',
      orderIndex: 4,
      type: 'multiple_choice',
      questionText: 'HTTP 200 status kodi nimani bildiradi?',
      options: ['Xatolik yuz berdi', 'Resurs topilmadi', 'So‘rov muvaffaqiyatli bajarildi (OK)', 'Server vaqtincha ishlamayapti'],
      correctOptionIndex: 2
    },
    {
      id: 'q-be-5',
      categoryId: 'cat-backend',
      orderIndex: 5,
      type: 'multiple_choice',
      questionText: 'Mijoz so‘ragan sahifa yoki resurs serverda topilmasa, qaysi HTTP status kodi qaytariladi?',
      options: ['404 Not Found', '500 Internal Error', '200 OK', '301 Moved'],
      correctOptionIndex: 0
    },
    {
      id: 'q-be-6',
      categoryId: 'cat-backend',
      orderIndex: 6,
      type: 'multiple_choice',
      questionText: 'Serverga yangi ma\'lumot jo‘natish yoki resurs yaratishda qaysi HTTP metodi qo‘llaniladi?',
      options: ['GET', 'POST', 'DELETE', 'HEAD'],
      correctOptionIndex: 1
    },
    {
      id: 'q-be-7',
      categoryId: 'cat-backend',
      orderIndex: 7,
      type: 'multiple_choice',
      questionText: 'Node.js loyihalarida tashqi paketlar va kutubxonalarni boshqaruvchi tizim nima deb ataladi?',
      options: ['npm (Node Package Manager)', 'pip', 'composer', 'cargo'],
      correctOptionIndex: 0
    },
    {
      id: 'q-be-8',
      categoryId: 'cat-backend',
      orderIndex: 8,
      type: 'multiple_choice',
      questionText: 'Nozik ma\'lumotlar (masalan, API kalitlar, DB parollari) qayerda xavfsiz saqlanishi kerak?',
      options: ['index.html faylida', '.env faylida va environment o‘zgaruvchilarida', 'Ochiq GitHub repoda', 'Brauzer konsolida'],
      correctOptionIndex: 1
    },
    {
      id: 'q-be-9',
      categoryId: 'cat-backend',
      orderIndex: 9,
      type: 'multiple_choice',
      questionText: 'Express middleware funksiyasida navbatdagi qadamga o‘tish uchun qaysi funksiya chaqiriladi?',
      options: ['next()', 'forward()', 'continue()', 'proceed()'],
      correctOptionIndex: 0
    },
    {
      id: 'q-be-10',
      categoryId: 'cat-backend',
      orderIndex: 10,
      type: 'written',
      questionText: 'Xavfsiz, shifrlangan HTTP protokolining qisqartmasi nima? (Masalan: HTTPS)',
      correctWrittenAnswer: 'HTTPS'
    },

    // Web & Kids Questions (10)
    {
      id: 'q-web-1',
      categoryId: 'cat-web-kids',
      orderIndex: 1,
      type: 'multiple_choice',
      questionText: 'HTML so‘zining to‘liq yozilishi nima?',
      options: [
        'HyperText Markup Language',
        'High Tech Modern Language',
        'Home Tool Markup Language',
        'Hyperlink Text Main Layout'
      ],
      correctOptionIndex: 0
    },
    {
      id: 'q-web-2',
      categoryId: 'cat-web-kids',
      orderIndex: 2,
      type: 'multiple_choice',
      questionText: 'Veb-sahifaga rasm joylashtirish uchun qaysi HTML tegi ishlatiladi?',
      options: ['<image>', '<img>', '<picture>', '<src>'],
      correctOptionIndex: 1
    },
    {
      id: 'q-web-3',
      categoryId: 'cat-web-kids',
      orderIndex: 3,
      type: 'multiple_choice',
      questionText: 'CSS nimani boshqarish uchun xizmat qiladi?',
      options: [
        'Veb-sahifaning dizayni, ranglari va ko‘rinishi',
        'Faqat ma\'lumotlar bazasini',
        'Kompyuterning protsessor tezligini',
        'Internet kabellarini'
      ],
      correctOptionIndex: 0
    },
    {
      id: 'q-web-4',
      categoryId: 'cat-web-kids',
      orderIndex: 4,
      type: 'multiple_choice',
      questionText: 'Veb-saytlarni ko‘rish uchun ishlatiladigan dastur qanday ataladi?',
      options: ['Brauzer', 'Kompilyator', 'Operatsion tizim', 'Drayver'],
      correctOptionIndex: 0
    },
    {
      id: 'q-web-5',
      categoryId: 'cat-web-kids',
      orderIndex: 5,
      type: 'multiple_choice',
      questionText: 'Eng katta sarlavha uchun qaysi HTML tegi ishlatiladi?',
      options: ['<h6>', '<h1>', '<head>', '<header>'],
      correctOptionIndex: 1
    },
    {
      id: 'q-web-6',
      categoryId: 'cat-web-kids',
      orderIndex: 6,
      type: 'multiple_choice',
      questionText: 'Havola (link) yaratish uchun qaysi HTML tegi ishlatiladi?',
      options: ['<a>', '<link>', '<href>', '<url>'],
      correctOptionIndex: 0
    },
    {
      id: 'q-web-7',
      categoryId: 'cat-web-kids',
      orderIndex: 7,
      type: 'multiple_choice',
      questionText: 'Matnni qalin (bold) qilish uchun qaysi teg ishlatiladi?',
      options: ['<b> yoki <strong>', '<i> yoki <em>', '<u>', '<p>'],
      correctOptionIndex: 0
    },
    {
      id: 'q-web-8',
      categoryId: 'cat-web-kids',
      orderIndex: 8,
      type: 'multiple_choice',
      questionText: 'Internetda xavfsiz bo‘lish uchun qaysi qoidaga amal qilish kerak?',
      options: [
        'Parollarni hech kimga aytmaslik va murakkab parol qo‘yish',
        'Barcha saytlarda bitta bir xil parol ishlatish',
        'Notanish havolalarni darhol ochish',
        'Parolni do‘stlarga ulashish'
      ],
      correctOptionIndex: 0
    },
    {
      id: 'q-web-9',
      categoryId: 'cat-web-kids',
      orderIndex: 9,
      type: 'multiple_choice',
      questionText: 'Kompyuter klaviaturasida oxirgi harakatni bekor qilish (Undo) kombinatsiyasi qaysi?',
      options: ['Ctrl + Z', 'Ctrl + C', 'Ctrl + V', 'Ctrl + A'],
      correctOptionIndex: 0
    },
    {
      id: 'q-web-10',
      categoryId: 'cat-web-kids',
      orderIndex: 10,
      type: 'written',
      questionText: 'Veb-sahifaning fon rangini o‘zgartiruvchi CSS xossasi nima deb ataladi? (Masalan: background-color)',
      correctWrittenAnswer: 'background-color'
    }
  ];

  return {
    teachers: initialTeachers,
    categories: initialCategories,
    questions: initialQuestions,
    accessCodes: [],
    sessions: {},
    results: []
  };
}

class TestSaytiDB {
  private data: TestSaytiDatabase;
  public isFirebaseConnected: boolean = false;

  constructor() {
    this.data = this.loadData();
    // Synchronize and seed with Firestore
    this.initFirestoreSync().catch(err => {
      console.error('[Firebase] Init sync error:', err);
    });
  }

  private async initFirestoreSync() {
    try {
      console.log('[Firebase] Connecting to Firestore...');
      
      // 1. Sync & Seed Teachers
      const teachersSnap = await getDocs(collection(firestore, 'teachers'));
      if (teachersSnap.empty) {
        console.log('[Firebase] Seeding initial teachers to Firestore...');
        for (const t of this.data.teachers) {
          await setDoc(doc(firestore, 'teachers', t.id), sanitizeForFirestore(t));
        }
      } else {
        const fsTeachers: Teacher[] = [];
        teachersSnap.forEach(d => fsTeachers.push(d.data() as Teacher));
        // Guarantee master admin exists
        if (!fsTeachers.some(t => t.id === '20090915')) {
          const admin = getInitialData().teachers[0];
          fsTeachers.unshift(admin);
          await setDoc(doc(firestore, 'teachers', admin.id), sanitizeForFirestore(admin));
        }
        this.data.teachers = fsTeachers;
      }

      // 2. Sync & Seed Categories
      const categoriesSnap = await getDocs(collection(firestore, 'categories'));
      if (categoriesSnap.empty) {
        console.log('[Firebase] Seeding initial categories to Firestore...');
        for (const c of this.data.categories) {
          await setDoc(doc(firestore, 'categories', c.id), sanitizeForFirestore(c));
        }
      } else {
        const fsCats: Category[] = [];
        categoriesSnap.forEach(d => fsCats.push(d.data() as Category));
        this.data.categories = fsCats;
      }

      // 3. Sync & Seed Questions
      const questionsSnap = await getDocs(collection(firestore, 'questions'));
      if (questionsSnap.empty) {
        console.log('[Firebase] Seeding initial questions to Firestore...');
        for (const q of this.data.questions) {
          await setDoc(doc(firestore, 'questions', q.id), sanitizeForFirestore(q));
        }
      } else {
        const fsQuestions: Question[] = [];
        questionsSnap.forEach(d => fsQuestions.push(d.data() as Question));
        this.data.questions = fsQuestions;
      }

      // 4. Sync Results
      const resultsSnap = await getDocs(collection(firestore, 'results'));
      if (!resultsSnap.empty) {
        const fsResults: TestResult[] = [];
        resultsSnap.forEach(d => fsResults.push(d.data() as TestResult));
        fsResults.sort((a, b) => b.submittedAt - a.submittedAt);
        this.data.results = fsResults;
      } else if (this.data.results.length > 0) {
        for (const r of this.data.results) {
          await setDoc(doc(firestore, 'results', r.id), sanitizeForFirestore(r));
        }
      }

      this.isFirebaseConnected = true;
      this.persist();
      console.log('[Firebase] Firestore synchronization and seeding completed successfully!');
    } catch (err) {
      console.error('[Firebase] Firestore sync error:', err);
    }
  }

  private loadData(): TestSaytiDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        // Ensure master admin 20090915 always exists
        const hasAdmin = parsed.teachers?.some((t: Teacher) => t.id === '20090915');
        if (!hasAdmin) {
          const init = getInitialData();
          parsed.teachers = [init.teachers[0], ...(parsed.teachers || [])];
        }
        return {
          teachers: parsed.teachers || [],
          categories: parsed.categories || [],
          questions: parsed.questions || [],
          accessCodes: parsed.accessCodes || [],
          sessions: parsed.sessions || {},
          results: parsed.results || []
        };
      }
    } catch (e) {
      console.error('Error loading DB file, re-initializing:', e);
    }
    const initial = getInitialData();
    this.persist(initial);
    return initial;
  }

  private persist(dataToSave = this.data) {
    try {
      if (!process.env.VERCEL) {
        fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // Teachers
  public getTeachers(): Teacher[] {
    return this.data.teachers;
  }

  public getTeacher(id: string): Teacher | undefined {
    return this.data.teachers.find(t => t.id === id);
  }

  public createTeacher(teacher: Teacher): { success: boolean; error?: string } {
    if (this.data.teachers.some(t => t.id === teacher.id)) {
      return { success: false, error: 'Bunday ID raqamli o‘qituvchi allaqachon mavjud' };
    }
    this.data.teachers.push(teacher);
    this.persist();
    // Persist to Firebase
    try {
      setDoc(doc(firestore, 'teachers', teacher.id), sanitizeForFirestore(teacher)).catch(err => {
        console.error('[Firebase] Error persisting teacher:', err);
      });
    } catch (e) {
      console.error('[Firebase] Error serializing teacher:', e);
    }
    return { success: true };
  }

  public deleteTeacher(id: string): { success: boolean; error?: string } {
    const cleanId = String(id || '').trim();
    if (cleanId === '20090915') {
      return { success: false, error: 'Bosh admin hisobini o‘chirib bo‘lmaydi!' };
    }
    const index = this.data.teachers.findIndex(t => String(t.id).trim() === cleanId);
    if (index === -1) {
      return { success: false, error: 'O‘qituvchi topilmadi' };
    }
    const removedTeacher = this.data.teachers[index];
    this.data.teachers.splice(index, 1);
    this.persist();
    // Delete from Firebase
    try {
      deleteDoc(doc(firestore, 'teachers', removedTeacher.id)).catch(err => {
        console.error('[Firebase] Error deleting teacher:', err);
      });
    } catch (fsErr) {
      console.error('[Firebase] Exception during deleteDoc for teacher:', fsErr);
    }
    return { success: true };
  }

  // Categories
  public getCategories(): Category[] {
    return this.data.categories;
  }

  public getCategory(id: string): Category | undefined {
    return this.data.categories.find(c => c.id === id);
  }

  public createCategory(category: Category): Category {
    this.data.categories.push(category);
    this.persist();
    // Persist to Firebase
    try {
      setDoc(doc(firestore, 'categories', category.id), sanitizeForFirestore(category)).catch(err => {
        console.error('[Firebase] Error persisting category:', err);
      });
    } catch (e) {
      console.error('[Firebase] Error serializing category:', e);
    }
    return category;
  }

  public deleteCategory(id: string): boolean {
    const deletedQuestions = this.data.questions.filter(q => q.categoryId === id);
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.data.questions = this.data.questions.filter(q => q.categoryId !== id);
    this.persist();
    // Delete from Firebase
    deleteDoc(doc(firestore, 'categories', id)).catch(err => {
      console.error('[Firebase] Error deleting category:', err);
    });
    for (const q of deletedQuestions) {
      deleteDoc(doc(firestore, 'questions', q.id)).catch(() => {});
    }
    return true;
  }

  // Questions
  public getQuestionsForCategory(categoryId: string, includeSecrets = false): (Question | PublicQuestion)[] {
    const list = this.data.questions.filter(q => q.categoryId === categoryId);
    list.sort((a, b) => a.orderIndex - b.orderIndex);
    if (includeSecrets) {
      return list;
    }
    // CRITICAL SECURITY: Never leak correctOptionIndex or correctWrittenAnswer to students!
    return list.map(q => ({
      id: q.id,
      categoryId: q.categoryId,
      questionText: q.questionText,
      type: q.type,
      options: q.options,
      orderIndex: q.orderIndex
    }));
  }

  public saveCategoryQuestions(categoryId: string, questions: Question[], targetCount?: number, durationMinutes?: number): boolean {
    const oldQuestions = this.data.questions.filter(q => q.categoryId === categoryId);
    // Replace questions for this category
    this.data.questions = this.data.questions.filter(q => q.categoryId !== categoryId);
    this.data.questions.push(...questions);

    const category = this.data.categories.find(c => c.id === categoryId);
    if (category) {
      if (targetCount !== undefined) category.questionCountTarget = targetCount;
      if (durationMinutes !== undefined) category.defaultDurationMinutes = durationMinutes;
      // Update category in Firebase
      try {
        setDoc(doc(firestore, 'categories', category.id), sanitizeForFirestore(category)).catch(err => {
          console.error('[Firebase] Error updating category:', err);
        });
      } catch (e) {
        console.error('[Firebase] Error serializing category:', e);
      }
    }
    this.persist();

    // Sync questions in Firebase
    for (const oldQ of oldQuestions) {
      if (!questions.some(q => q.id === oldQ.id)) {
        deleteDoc(doc(firestore, 'questions', oldQ.id)).catch(() => {});
      }
    }
    for (const newQ of questions) {
      try {
        setDoc(doc(firestore, 'questions', newQ.id), sanitizeForFirestore(newQ)).catch(err => {
          console.error('[Firebase] Error setting question:', err);
        });
      } catch (e) {
        console.error('[Firebase] Error serializing question:', e);
      }
    }

    return true;
  }

  // Access Codes (2 minutes lifetime)
  public generateCode(categoryId: string, durationMinutes?: number, questionCount?: number, createdBy?: string): AccessCode {
    this.cleanExpiredCodes();

    const category = this.getCategory(categoryId);
    const categoryName = category ? category.name : 'Noma\'lum bo‘lim';
    const finalDuration = (durationMinutes && durationMinutes > 0) ? durationMinutes : (category?.defaultDurationMinutes || 15);
    const finalCount = (questionCount && questionCount > 0) ? questionCount : (category?.questionCountTarget || 10);

    // 6-digit easy to type code
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = now + (2 * 60 * 1000); // exactly 2 minutes

    const codeObj: AccessCode = {
      code: randomDigits,
      categoryId,
      categoryName,
      durationMinutes: finalDuration,
      questionCount: finalCount,
      createdAt: now,
      expiresAt,
      isUsed: false,
      createdBy: createdBy || '20090915'
    };

    this.data.accessCodes.push(codeObj);
    this.persist();

    // Persist to Firebase
    try {
      setDoc(doc(firestore, 'accessCodes', codeObj.code), sanitizeForFirestore(codeObj)).catch(err => {
        console.error('[Firebase] Error saving access code:', err);
      });
    } catch (e) {
      console.error('[Firebase] Error serializing access code:', e);
    }

    return codeObj;
  }

  public cleanExpiredCodes() {
    const now = Date.now();
    const beforeCount = this.data.accessCodes.length;
    const expiredCodes = this.data.accessCodes.filter(c => c.isUsed || c.expiresAt <= now);
    this.data.accessCodes = this.data.accessCodes.filter(c => !c.isUsed && c.expiresAt > now);
    if (this.data.accessCodes.length !== beforeCount) {
      this.persist();
      for (const exp of expiredCodes) {
        deleteDoc(doc(firestore, 'accessCodes', exp.code)).catch(() => {});
      }
    }
  }

  public getActiveCodes(): (AccessCode & { remainingSeconds: number })[] {
    this.cleanExpiredCodes();
    const now = Date.now();
    return this.data.accessCodes.map(c => ({
      ...c,
      remainingSeconds: Math.max(0, Math.floor((c.expiresAt - now) / 1000))
    }));
  }

  public deleteCode(code: string): boolean {
    const prev = this.data.accessCodes.length;
    this.data.accessCodes = this.data.accessCodes.filter(c => c.code !== code);
    if (this.data.accessCodes.length !== prev) {
      this.persist();
      deleteDoc(doc(firestore, 'accessCodes', code)).catch(() => {});
      return true;
    }
    return false;
  }

  // Student verification and Session
  public verifyCode(code: string): { valid: boolean; error?: string; codeObj?: AccessCode } {
    this.cleanExpiredCodes();
    const found = this.data.accessCodes.find(c => c.code === code.trim());
    if (!found) {
      return { valid: false, error: 'Kiritilgan kod mavjud emas yoki 2 daqiqalik muddati tugab o‘chib ketgan!' };
    }
    if (found.isUsed) {
      return { valid: false, error: 'Bu koddan allaqachon foydalanilgan!' };
    }
    if (Date.now() > found.expiresAt) {
      this.deleteCode(found.code);
      return { valid: false, error: 'Kiritilgan kodning 2 daqiqalik muddati tugagan!' };
    }
    return { valid: true, codeObj: found };
  }

  public startStudentSession(code: string, studentName: string): { success: boolean; error?: string; session?: TestSession } {
    const verify = this.verifyCode(code);
    if (!verify.valid || !verify.codeObj) {
      return { success: false, error: verify.error };
    }

    const codeObj = verify.codeObj;
    codeObj.isUsed = true; // Mark as consumed
    this.persist();

    // Get available questions
    const allQuestions = this.data.questions.filter(q => q.categoryId === codeObj.categoryId);
    // Take requested questionCount
    const selectedQuestions = allQuestions.slice(0, codeObj.questionCount);
    if (selectedQuestions.length === 0) {
      return { success: false, error: 'Ushbu bo‘limda hozircha savollar mavjud emas!' };
    }

    const sessionId = 'sess-' + Math.random().toString(36).substring(2, 11);
    const now = Date.now();
    const durationMs = codeObj.durationMinutes * 60 * 1000;

    // Sanitize questions: strip correct answers
    const publicQuestions: PublicQuestion[] = selectedQuestions.map((q, idx) => ({
      id: q.id,
      categoryId: q.categoryId,
      questionText: q.questionText,
      type: q.type,
      options: q.options,
      orderIndex: idx + 1
    }));

    const session: TestSession = {
      sessionId,
      accessCode: codeObj.code,
      studentName: studentName.trim(),
      categoryId: codeObj.categoryId,
      categoryName: codeObj.categoryName,
      questions: publicQuestions,
      durationMinutes: codeObj.durationMinutes,
      startedAt: now,
      expiresAt: now + durationMs,
      status: 'in_progress'
    };

    this.data.sessions[sessionId] = {
      ...session,
      questionIds: selectedQuestions.map(q => q.id)
    };
    this.persist();

    return { success: true, session };
  }

  public async submitSession(
    sessionId: string,
    answers: Record<string, any>,
    terminationReason: 'normal' | 'esc_key' | 'time_expired'
  ): Promise<{ success: boolean; error?: string; result?: TestResult }> {
    const sessionRecord = this.data.sessions[sessionId];
    if (!sessionRecord) {
      return { success: false, error: 'Sessiya topilmadi yoki muddati o‘tgan' };
    }

    if (sessionRecord.status !== 'in_progress') {
      // Return existing result
      const existing = this.data.results.find(r => r.sessionId === sessionId);
      if (existing) {
        return { success: true, result: existing };
      }
    }

    const now = Date.now();
    const durationSpentSeconds = Math.max(1, Math.round((now - sessionRecord.startedAt) / 1000));

    // Fetch master questions to evaluate
    const questions = sessionRecord.questionIds
      .map(id => this.data.questions.find(q => q.id === id))
      .filter((q): q is Question => Boolean(q));

    let correctCount = 0;
    let multipleChoiceCount = 0;
    let writtenCount = 0;

    const answersBreakdown: QuestionResultItem[] = [];

    for (const q of questions) {
      const studentAns = answers[q.id];
      let isCorrect = false;

      if (q.type === 'multiple_choice') {
        multipleChoiceCount++;
        const parsedStudentAns = (studentAns !== undefined && studentAns !== null && studentAns !== '')
          ? Number(studentAns)
          : null;
        if (parsedStudentAns !== null && parsedStudentAns === q.correctOptionIndex) {
          isCorrect = true;
          correctCount++;
        }
        answersBreakdown.push({
          questionId: q.id,
          questionText: q.questionText,
          type: q.type,
          options: q.options || [],
          studentAnswer: parsedStudentAns,
          correctAnswer: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
          isCorrect
        });
      } else {
        writtenCount++;
        // Clean and normalize strings for written answer
        const expected = (q.correctWrittenAnswer || '').trim().toLowerCase();
        const actual = (typeof studentAns === 'string' ? studentAns : '').trim().toLowerCase();
        if (actual.length > 0 && (actual === expected || actual.includes(expected))) {
          isCorrect = true;
          correctCount++;
        }
        answersBreakdown.push({
          questionId: q.id,
          questionText: q.questionText,
          type: q.type,
          studentAnswer: (typeof studentAns === 'string') ? studentAns : '',
          correctAnswer: q.correctWrittenAnswer || '',
          isCorrect
        });
      }
    }

    const totalQuestions = questions.length || 1;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = scorePercent >= 75; // strictly 75% minimal pass criteria

    sessionRecord.status = terminationReason === 'esc_key' ? 'terminated_esc' : 'completed';

    const result: TestResult = {
      id: 'res-' + Math.random().toString(36).substring(2, 10),
      sessionId,
      studentName: sessionRecord.studentName,
      categoryId: sessionRecord.categoryId,
      categoryName: sessionRecord.categoryName,
      totalQuestions,
      multipleChoiceCount,
      writtenCount,
      correctCount,
      scorePercent,
      isPassed,
      terminationReason,
      submittedAt: now,
      durationSpentSeconds,
      answersBreakdown
    };

    this.data.results.unshift(result);
    this.persist();

    // Persist result to Firebase safely with sanitizeForFirestore
    try {
      const sanitizedResult = sanitizeForFirestore(result);
      setDoc(doc(firestore, 'results', result.id), sanitizedResult).catch(err => {
        console.error('[Firebase] Error saving result:', err);
      });
    } catch (fsErr) {
      console.error('[Firebase] Failed to sanitize/save result:', fsErr);
    }

    // Trigger Telegram notification
    try {
      await sendTelegramTestResult({
        studentName: result.studentName,
        categoryName: result.categoryName,
        totalQuestions: result.totalQuestions,
        correctCount: result.correctCount,
        scorePercent: result.scorePercent,
        isPassed: result.isPassed,
        terminationReason: result.terminationReason,
        durationSpentSeconds: result.durationSpentSeconds,
        answersBreakdown: result.answersBreakdown
      });
    } catch (e) {
      console.error('Error in sendTelegramTestResult:', e);
    }

    return { success: true, result };
  }

  public getAllResults(): TestResult[] {
    return this.data.results;
  }
}

export const dbInstance = new TestSaytiDB();
