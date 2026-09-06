import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let config: any = {};
try {
  const configFile = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  }
} catch (e) {
  console.error('Error reading firebase-applet-config.json:', e);
}

const firebaseConfig = {
  apiKey: config.apiKey || process.env.FIREBASE_API_KEY,
  authDomain: config.authDomain || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: config.projectId || process.env.FIREBASE_PROJECT_ID,
  storageBucket: config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.appId || process.env.FIREBASE_APP_ID
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firestore: Firestore = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export { config as firebaseConfigData };
