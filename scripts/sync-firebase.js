import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read Firebase config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('firebase-applet-config.json not found');
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

const firestore = getFirestore(app, dbId);

console.log('Syncing to Firebase Firestore Project:', firebaseConfig.projectId, 'DB ID:', dbId || '(default)');

// Read local DB
const dbPath = path.join(process.cwd(), 'data', 'db.json');
let dbData = {};

if (fs.existsSync(dbPath)) {
  dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
} else {
  console.log('data/db.json not found yet.');
}

async function syncCollection(colName, items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    console.log(`Collection ${colName}: 0 items to sync.`);
    return;
  }

  const batch = writeBatch(firestore);
  let count = 0;

  for (const item of items) {
    const docId = String(item.id || `${colName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    const docRef = doc(firestore, colName, docId);
    const cleanItem = JSON.parse(JSON.stringify(item));
    batch.set(docRef, cleanItem, { merge: true });
    count++;
  }

  await batch.commit();
  console.log(`✅ Successfully synced ${count} items into collection '${colName}'`);
}

async function runSync() {
  const collections = ['users', 'quizzes', 'attempts', 'practiceQuizzes', 'facultyLogs', 'auditLogs'];
  for (const col of collections) {
    if (dbData[col]) {
      await syncCollection(col, dbData[col]);
    }
  }
  console.log('🎉 Firebase sync finished!');
}

runSync().catch(err => {
  console.error('Error syncing to Firebase:', err);
  process.exit(1);
});
