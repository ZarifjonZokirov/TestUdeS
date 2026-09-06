const fs = require('fs');
let code = fs.readFileSync('backend/db.ts', 'utf8');

// The rename earlier did `sed -i "s/'server', 'data'/'backend', 'data'/g" backend/db.ts`
// Let's make sure it's correct.
