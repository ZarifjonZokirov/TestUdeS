const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We just want to make sure startLocalServer is closed and called.
const target = `  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`TestSayti server running on http://0.0.0.0:\${PORT}\`);
  });`;

let cutIndex = code.indexOf(target) + target.length;
let newCode = code.substring(0, cutIndex) + '\n}\n\nif (!process.env.VERCEL) {\n  startLocalServer();\n}\n';

fs.writeFileSync('server.ts', newCode);
