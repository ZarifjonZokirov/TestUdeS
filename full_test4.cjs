async function run() {
  console.log("=== AI FULL SYSTEM TEST 4 ===");

  const catRes = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Mukammal Test 4', description: 'System Test via AI', defaultDurationMinutes: 10, targetQuestionCount: 2 })
  });
  const catData = await catRes.json();
  const catId = catData.category.id;

  const q1Id = "q-" + Math.random().toString(36).substring(2);
  const q2Id = "q-" + Math.random().toString(36).substring(2);

  await fetch(`http://localhost:3000/api/categories/${catId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questions: [
        { id: q1Id, categoryId: catId, questionText: "O'zbekistonning poytaxti qayer?", type: "multiple_choice", options: ["Toshkent", "Samarqand", "Buxoro", "Xiva"], correctOptionIndex: 0 },
        { id: q2Id, categoryId: catId, questionText: "Al Xorazmiy qachon tug'ilgan?", type: "written", correctWrittenAnswer: "783", exactMatchRequired: false }
      ]
    })
  });

  const codeRes = await fetch('http://localhost:3000/api/codes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId: catId, durationMinutes: 5, questionCount: 2, createdBy: '20090915' })
  });
  const codeData = await codeRes.json();
  const code = codeData.code.code;

  await fetch('http://localhost:3000/api/student/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });

  const startRes = await fetch('http://localhost:3000/api/student/start-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, studentName: 'Zarifjon AI Test Bot (Alochi)' })
  });
  const startData = await startRes.json();
  const session = startData.session;

  const answers = {};
  for (const q of session.questions) {
    if (q.questionText.includes("poytaxti")) answers[q.id] = 0;
    else if (q.questionText.includes("Xorazmiy")) answers[q.id] = "783";
  }

  const submitRes = await fetch('http://localhost:3000/api/student/submit-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: session.sessionId, answers, durationSpentSeconds: 65, terminationReason: 'normal' })
  });
  const submitData = await submitRes.json();
  console.log("\n=== TEST RESULT ===");
  console.log(submitData.result);
}

run().catch(console.error);
