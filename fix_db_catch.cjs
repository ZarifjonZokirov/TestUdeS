const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

// Also catch any errors in loadData
code = code.replace(/private loadData\(\): TestSaytiDatabase \{/, `private loadData(): TestSaytiDatabase {
    try {`);

code = code.replace(/return initial;\n\s*\}/, `return initial;
    } catch (e) {
      console.error("Critical error in loadData:", e);
      return { teachers: [], categories: [], questions: [], accessCodes: [], sessions: {}, results: [] };
    }
  }`);

fs.writeFileSync('server/db.ts', code);
console.log("server/db.ts catch added.");
