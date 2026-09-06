async function run() {
  console.log("=== AI FULL SYSTEM TEST (VERCEL MOSLASHUV) ===");

  const catRes = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Vercel Test Category', description: 'System Test via AI for Vercel', defaultDurationMinutes: 10, targetQuestionCount: 2 })
  });
  const catData = await catRes.json();
  const catId = catData.category.id;
  console.log("[+] Categoriya yaratildi: " + catId);

  const q1Id = "q-" + Math.random().toString(36).substring(2);
  const q2Id = "q-" + Math.random().toString(36).substring(2);

  await fetch(`http://localhost:3000/api/categories/${catId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questions: [
        { id: q1Id, categoryId: catId, questionText: "Vercel qaysi til va frameworklar uchun juda mashhur?", type: "multiple_choice", options: ["React/Next.js", "Python/Django", "PHP/Laravel", "Java/Spring"], correctOptionIndex: 0 },
        { id: q2Id, categoryId: catId, questionText: "Frontend uchun mashhur build tool (V bilan boshlanadi)?", type: "written", correctWrittenAnswer: "Vite", exactMatchRequired: false }
      ]
    })
  });
  console.log("[+] Savollar qo'shildi");

  const codeRes = await fetch('http://localhost:3000/api/codes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId: catId, durationMinutes: 5, questionCount: 2, createdBy: '20090915' })
  });
  const codeData = await codeRes.json();
  const code = codeData.code.code;
  console.log("[+] Tasdiqlash kodi olindi: " + code);

  await fetch('http://localhost:3000/api/student/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });

  const startRes = await fetch('http://localhost:3000/api/student/start-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, studentName: 'Zarifjon AI (Vercel Test)' })
  });
  const startData = await startRes.json();
  const session = startData.session;
  console.log("[+] Test boshlandi, sessiya: " + session.sessionId);

  const answers = {};
  for (const q of session.questions) {
    if (q.questionText.includes("Vercel")) answers[q.id] = 0;
    else if (q.questionText.includes("Vite") || q.questionText.includes("Frontend")) answers[q.id] = "Vite";
  }

  const submitRes = await fetch('http://localhost:3000/api/student/submit-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: session.sessionId, answers, durationSpentSeconds: 45, terminationReason: 'normal' })
  });
  const submitData = await submitRes.json();
  console.log("\n=== TEST RESULT ===");
  console.log(submitData.result);
}

run().catch(console.error);
