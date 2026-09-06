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
  console.log("Code data success:", codeData.success);

  if (!codeData.success) {
    console.error("Failed to generate code:", codeData.error);
    return;
  }
  const code = codeData.code.code;
  console.log("Generated code:", code);

  console.log("\n2. Verifying test code...");
  const verifyRes = await fetch('http://localhost:3000/api/student/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  const verifyData = await verifyRes.json();
  console.log("Verify data success:", verifyData.success);

  console.log("\n3. Starting test...");
  const startRes = await fetch('http://localhost:3000/api/student/start-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, studentName: 'Zarifjon AI Bot' })
  });
  const startData = await startRes.json();
  console.log("Start data success:", startData.success);
  
  if (!startData.success) {
      console.log("Start data:", startData);
      return;
  }
  
  const questions = startData.session.questions;
  console.log("Questions count:", questions ? questions.length : 0);
  
  const answers = {};
  questions.forEach((q, idx) => {
      // Simulate answer - assuming multiple choice type, we need to pass a string matching an option
      if (q.type === 'multiple_choice' && q.options) {
        answers[q.id] = q.options[idx % q.options.length];
      } else {
        answers[q.id] = "AI generated answer";
      }
  });

  console.log("\n4. Submitting test...");
  const submitRes = await fetch('http://localhost:3000/api/student/submit-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: startData.session.sessionId,
      answers,
      durationSpentSeconds: 45,
      terminationReason: 'normal'
    })
  });
  const submitData = await submitRes.json();
  console.log("Submit data:", submitData);
}

run().catch(console.error);
