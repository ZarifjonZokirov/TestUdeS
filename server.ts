import express from 'express';
import path from 'path';
import { dbInstance } from './server/db.ts';

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check & Firebase status
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/firebase/status', (req, res) => {
    res.json({
      success: true,
      connected: dbInstance.isFirebaseConnected,
      projectId: 'gen-lang-client-0391742872',
      firestoreDatabaseId: 'ai-studio-testsaytioquvmar-bb38f73a-ce01-4442-8437-969f01653c8e'
    });
  });

  // 2. Auth: Teacher / Admin Login
  app.post('/api/auth/login', (req, res) => {
    const { id, password } = req.body;
    if (!id || !password) {
      return res.status(400).json({ error: 'ID raqam va parol kiritilishi shart' });
    }

    const teacher = dbInstance.getTeacher(id.toString().trim());
    if (!teacher || teacher.password !== password.toString().trim()) {
      return res.status(401).json({ error: 'Noto‘g‘ri ID raqam yoki parol!' });
    }

    // Return teacher profile (masking password in response if needed, but admin is allowed to see credentials)
    res.json({
      success: true,
      user: {
        id: teacher.id,
        fullName: teacher.fullName,
        role: teacher.role,
      }
    });
  });

  // 3. Teachers Management
  app.get('/api/teachers', (req, res) => {
    const teachers = dbInstance.getTeachers();
    res.json({ success: true, teachers });
  });

  app.post('/api/teachers', (req, res) => {
    const { id, fullName, password, role } = req.body;
    if (!id || !fullName || !password) {
      return res.status(400).json({ error: 'Barcha maydonlarni to‘ldiring (ID, ism, parol)' });
    }

    const result = dbInstance.createTeacher({
      id: id.toString().trim(),
      fullName: fullName.trim(),
      password: password.trim(),
      role: role === 'admin' ? 'admin' : 'teacher',
      createdAt: Date.now()
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, teachers: dbInstance.getTeachers() });
  });

  app.delete('/api/teachers/:id', (req, res) => {
    try {
      const result = dbInstance.deleteTeacher(req.params.id);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      res.json({ success: true, teachers: dbInstance.getTeachers() });
    } catch (err: any) {
      console.error('Error deleting teacher in server.ts:', err);
      res.status(500).json({ error: err?.message || 'O‘qituvchini o‘chirishda server xatoligi' });
    }
  });

  // 4. Categories Management
  app.get('/api/categories', (req, res) => {
    const categories = dbInstance.getCategories();
    res.json({ success: true, categories });
  });

  app.post('/api/categories', (req, res) => {
    const { name, description, defaultDurationMinutes, questionCountTarget } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Bo‘lim nomi kiritilishi shart' });
    }

    const newCategory = dbInstance.createCategory({
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      description: description?.trim() || '',
      defaultDurationMinutes: Number(defaultDurationMinutes) || 15,
      questionCountTarget: Number(questionCountTarget) || 10,
      createdAt: Date.now()
    });

    res.json({ success: true, category: newCategory });
  });

  app.delete('/api/categories/:id', (req, res) => {
    dbInstance.deleteCategory(req.params.id);
    res.json({ success: true });
  });

  // 5. Questions Management (Admin view vs Public)
  app.get('/api/categories/:id/questions', (req, res) => {
    const isTeacher = req.query.asTeacher === 'true';
    const questions = dbInstance.getQuestionsForCategory(req.params.id, isTeacher);
    res.json({ success: true, questions });
  });

  app.post('/api/categories/:id/questions', (req, res) => {
    const { questions, targetCount, durationMinutes } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Savollar ro‘yxati yuborilishi shart' });
    }

    dbInstance.saveCategoryQuestions(req.params.id, questions, targetCount, durationMinutes);
    res.json({
      success: true,
      questions: dbInstance.getQuestionsForCategory(req.params.id, true)
    });
  });

  // 6. Access Codes (2-minute expiration)
  app.post('/api/codes/generate', (req, res) => {
    const { categoryId, durationMinutes, questionCount, createdBy } = req.body;
    if (!categoryId) {
      return res.status(400).json({ error: 'Bo‘lim tanlanishi shart' });
    }

    const category = dbInstance.getCategory(categoryId);
    const finalDuration = (durationMinutes !== undefined && Number(durationMinutes) > 0)
      ? Number(durationMinutes)
      : (category?.defaultDurationMinutes || 15);
    const finalQuestionCount = (questionCount !== undefined && Number(questionCount) > 0)
      ? Number(questionCount)
      : (category?.questionCountTarget || 10);

    const code = dbInstance.generateCode(
      categoryId,
      finalDuration,
      finalQuestionCount,
      createdBy || '20090915'
    );

    res.json({ success: true, code });
  });

  app.get('/api/codes/active', (req, res) => {
    try {
      const codes = dbInstance.getActiveCodes();
      res.json({ success: true, codes });
    } catch (err: any) {
      console.error('Error in /api/codes/active:', err);
      res.status(500).json({ success: false, error: err?.message || 'Server xatoligi' });
    }
  });

  app.delete('/api/codes/:code', (req, res) => {
    try {
      dbInstance.deleteCode(req.params.code);
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error in /api/codes/:code:', err);
      res.status(500).json({ success: false, error: err?.message || 'Server xatoligi' });
    }
  });

  // 7. Student Flow
  app.post('/api/student/verify-code', (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Testga kirish kodi kiritilmadi' });
      }

      const verify = dbInstance.verifyCode(code.toString());
      if (!verify.valid || !verify.codeObj) {
        return res.status(400).json({ error: verify.error });
      }

      res.json({
        success: true,
        categoryName: verify.codeObj.categoryName,
        questionCount: verify.codeObj.questionCount,
        durationMinutes: verify.codeObj.durationMinutes,
        expiresAt: verify.codeObj.expiresAt
      });
    } catch (err: any) {
      console.error('Error in /api/student/verify-code:', err);
      res.status(500).json({ error: err?.message || 'Server xatoligi' });
    }
  });

  app.post('/api/student/start-test', (req, res) => {
    try {
      const { code, studentName } = req.body;
      if (!code || !studentName || !studentName.trim()) {
        return res.status(400).json({ error: 'Kod hamda ism-familiya kiritilishi shart' });
      }

      const result = dbInstance.startStudentSession(code.toString(), studentName);
      if (!result.success || !result.session) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ success: true, session: result.session });
    } catch (err: any) {
      console.error('Error in /api/student/start-test:', err);
      res.status(500).json({ error: err?.message || 'Server xatoligi' });
    }
  });

  app.post('/api/student/submit-test', async (req, res) => {
    try {
      const { sessionId, answers, terminationReason } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'Sessiya ID ko‘rsatilmadi' });
      }

      const reason = terminationReason === 'esc_key' ? 'esc_key'
        : terminationReason === 'time_expired' ? 'time_expired'
        : 'normal';

      const result = await dbInstance.submitSession(sessionId, answers || {}, reason);
      if (!result.success || !result.result) {
        return res.status(400).json({ error: result.error || 'Natijani hisoblashda xatolik yuz berdi' });
      }

      res.json({ success: true, result: result.result });
    } catch (err: any) {
      console.error('Error in /api/student/submit-test:', err);
      res.status(500).json({ error: err?.message || 'Natijani qabul qilishda server xatoligi yuz berdi' });
    }
  });

  // 8. Results (Admin view)
  app.get('/api/results', (req, res) => {
    try {
      const results = dbInstance.getAllResults();
      res.json({ success: true, results });
    } catch (err: any) {
      console.error('Error in /api/results:', err);
      res.status(500).json({ success: false, error: err?.message || 'Server xatoligi' });
    }
  });

  

export default app; // Vercel API uchun asosiy eksport

// Lokal va oddiy server (Render/Local) uchun ishga tushirish qismi
async function startLocalServer() {
// Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TestSayti server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startLocalServer();
}
