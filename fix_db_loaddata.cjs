const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

// The Vercel runtime might crash if fs.existsSync throws.
code = code.replace(/if \(fs\.existsSync\(DB_FILE\)\) \{/, `if (!process.env.VERCEL && fs.existsSync(DB_FILE)) {`);

fs.writeFileSync('server/db.ts', code);
console.log("server/db.ts fixed for Vercel in loadData.");
