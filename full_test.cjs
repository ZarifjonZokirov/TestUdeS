

async function run() {
  console.log("=== AI FULL SYSTEM TEST ===");

  // 1. Create a Category
  console.log("\n[1] Creating a new category...");
  const catRes = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'AI tomonidan yaratilgan test',
      description: 'System Test via AI',
      defaultDurationMinutes: 10,
      targetQuestionCount: 5
    })
  });
  const catData = await catRes.json();
  if (!catData.success) throw new Error("Failed to create category");
  const catId = catData.category.id;
  console.log("Category created:", catId);

  // 2. Add Questions
  console.log("\n[2] Adding questions to category...");
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
  const qData = await qRes.json();
  if (!qData.success) throw new Error("Failed to add questions");
  console.log("Questions added successfully.");

  // 3. Generate Code
  console.log("\n[3] Generating access code...");
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
  if (!codeData.success) throw new Error("Failed to generate code");
  const code = codeData.code.code;
  console.log("Access Code:", code);

  // 4. Verify Code
  console.log("\n[4] Student verifying code...");
  const verifyRes = await fetch('http://localhost:3000/api/student/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success) throw new Error("Failed to verify code");
  console.log("Code verified.");

  // 5. Start Test
  console.log("\n[5] Student starting test...");
  const startRes = await fetch('http://localhost:3000/api/student/start-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, studentName: 'Zarifjon AI Test Bot' })
  });
  const startData = await startRes.json();
  if (!startData.success) throw new Error("Failed to start test");
  const session = startData.session;
  console.log("Session created. Session ID:", session.sessionId);

  // 6. Answer Test
  console.log("\n[6] Answering questions...");
  const answers = {};
  for (const q of session.questions) {
    if (q.questionText.includes("poytaxti")) {
      answers[q.id] = "Toshkent";
    } else if (q.questionText.includes("Xorazmiy")) {
      answers[q.id] = "783";
    }
  }

  // 7. Submit Test
  console.log("\n[7] Submitting test...");
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
