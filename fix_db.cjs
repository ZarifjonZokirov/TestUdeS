const fs = require('fs');
const filePath = 'server/db.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Replace the top level mkdirSync
code = code.replace(
  /if \(\!fs\.existsSync\(DATA_DIR\)\) \{\n\s*fs\.mkdirSync\(DATA_DIR, \{ recursive: true \}\);\n\}/,
  `if (!process.env.VERCEL) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn("Could not create DATA_DIR. Vercel environment detected.", e);
  }
}`
);

// In persist, only write if not Vercel
code = code.replace(
  /fs\.writeFileSync\(DB_FILE, JSON\.stringify\(dataToSave, null, 2\), 'utf-8'\);/,
  `if (!process.env.VERCEL) {
        fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      }`
);

fs.writeFileSync(filePath, code);
console.log("server/db.ts fixed for Vercel.");
