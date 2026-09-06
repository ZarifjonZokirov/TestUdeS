async function run() {
  console.log("=== AI FULL SYSTEM TEST 2 ===");

  // 1. Create a Category
  const catRes = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Mukammal Test',
      description: 'System Test via AI',
      defaultDurationMinutes: 10,
      targetQuestionCount: 5
    })
  });
  const catData = await catRes.json();
  const catId = catData.category.id;

  // 2. Add Questions
  const qRes = await fetch(`http://localhost:3000/api/categories/${catId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questions: [
        {
          categoryId: catId,
          questionText: "O'zbekistonning poytaxti qayer?",
          type: "multiple_choice",
          options: ["Toshkent", "Samarqand", "Buxoro", "Xiva"],
          correctOptionIndex: 0
        },
        {
          categoryId: catId,
          questionText: "Al Xorazmiy qachon tug'ilgan?",
          type: "written",
          correctWrittenAnswer: "783",
          exactMatchRequired: false
        }
      ]
    })
  });

  // 3. Generate Code
  const codeRes = await fetch('http://localhost:3000/api/codes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      categoryId: catId,
      durationMinutes: 5,
      questionCount: 2,
      createdBy: '20090915'
    })
  });
  const codeData = await codeRes.json();
  const code = codeData.code.code;

  // 4. Verify Code
  const verifyRes = await fetch('http://localhost:3000/api/student/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });

  // 5. Start Test
  const startRes = await fetch('http://localhost:3000/api/student/start-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, studentName: 'Zarifjon AI Test Bot (Alochi)' })
  });
  const startData = await startRes.json();
  const session = startData.session;

  // 6. Answer Test
  const answers = {};
  for (const q of session.questions) {
    if (q.questionText.includes("poytaxti")) {
      answers[q.id] = 0; // correct option index
    } else if (q.questionText.includes("Xorazmiy")) {
      answers[q.id] = "783";
    }
  }

  // 7. Submit Test
  const submitRes = await fetch('http://localhost:3000/api/student/submit-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session.sessionId,
      answers,
      durationSpentSeconds: 65,
      terminationReason: 'normal'
    })
  });
  const submitData = await submitRes.json();
  console.log("\n=== TEST RESULT ===");
  console.log(submitData.result);
}

run().catch(console.error);
