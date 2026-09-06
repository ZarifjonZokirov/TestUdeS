const fs = require('fs');
let code = fs.readFileSync('server/firebase.ts', 'utf8');

code = code.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `const firebaseConfig = {
  apiKey: config.apiKey || process.env.FIREBASE_API_KEY,
  authDomain: config.authDomain || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: config.projectId || process.env.FIREBASE_PROJECT_ID,
  storageBucket: config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.appId || process.env.FIREBASE_APP_ID
};`
);

fs.writeFileSync('server/firebase.ts', code);
console.log("firebase.ts fixed to use ENV variables.");
