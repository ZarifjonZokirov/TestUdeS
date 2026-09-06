const fetch = require('node-fetch');

async function run() {
  console.log("1. Generating test code...");
  const catRes = await fetch('http://localhost:3000/api/categories');
  const catData = await catRes.json();
  const catId = catData.categories[0].id;

  const codeRes = await fetch('http://localhost:3000/api/codes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      categoryId: catId,
      durationMinutes: 1,
      questionCount: 5,
      createdBy: '20090915'
    })
  });
  const codeData = await codeRes.json();
  console.log("Code data:", codeData);

  if (!codeData.success) {
    console.error("Failed to generate code:", codeData.error);
    return;
  }
  const code = codeData.code.code;

  console.log("\n2. Verifying test code...");
  const verifyRes = await fetch('http://localhost:3000/api/codes/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  const verifyData = await verifyRes.json();
  console.log("Verify data:", verifyData);

  console.log("\n3. Fetching questions...");
  const questionsRes = await fetch(`http://localhost:3000/api/codes/${code}/questions`);
  const questionsData = await questionsRes.json();
  console.log("Questions data fetched.");
  
  const questions = questionsData.questions;
  const answers = questions.map((q, idx) => ({
    questionId: q.id,
    selectedOptionIndex: 1, // just picking something
    isCorrect: idx % 2 === 0 // some correct, some wrong
  }));

  console.log("\n4. Submitting test...");
  const submitRes = await fetch('http://localhost:3000/api/tests/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: 'Zarifjon Zokirov (AI Bot Test)',
      code,
      answers,
      durationSpentSeconds: 30,
      terminationReason: 'normal'
    })
  });
  const submitData = await submitRes.json();
  console.log("Submit data:", submitData);
}

run().catch(console.error);
