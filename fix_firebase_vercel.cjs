const fs = require('fs');
let code = fs.readFileSync('server/firebase.ts', 'utf8');

const newCode = `import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let config: any = {};
try {
  const configFile = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!process.env.VERCEL && fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  }
} catch (e) {
  console.error('Error reading firebase-applet-config.json:', e);
}

const firebaseConfig = {
  apiKey: config.apiKey || process.env.FIREBASE_API_KEY || 'dummy_api_key',
  authDomain: config.authDomain || process.env.FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
  projectId: config.projectId || process.env.FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',
  messagingSenderId: config.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: config.appId || process.env.FIREBASE_APP_ID || '1:123456789:web:123456'
};

let app;
let firestore: any = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firestore = (config.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID)
    ? getFirestore(app, config.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID)
    : getFirestore(app);
} catch (e) {
  console.error("Firebase init error:", e);
}

export { firestore, config as firebaseConfigData };
`;

fs.writeFileSync('server/firebase.ts', newCode);
console.log("server/firebase.ts fixed for Vercel to prevent crash on init.");
