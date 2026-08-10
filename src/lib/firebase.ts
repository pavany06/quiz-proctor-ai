import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if specified
export const firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

export const getFirebaseConfigSummary = () => {
  return {
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    appId: firebaseConfig.appId,
    authDomain: firebaseConfig.authDomain
  };
};

/**
 * Dump JSON data directly into a Firestore collection from the client/admin
 */
export async function dumpJsonCollectionToFirebase(collectionName: string, items: any[]) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('JSON data must be a non-empty array of objects.');
  }

  const batch = writeBatch(firestore);
  let count = 0;

  for (const item of items) {
    const docId = item.id || `${collectionName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docRef = doc(firestore, collectionName, String(docId));
    
    // Clean undefined fields for Firestore compatibility
    const cleanItem = JSON.parse(JSON.stringify(item));
    batch.set(docRef, cleanItem, { merge: true });
    count++;

    // Firestore batch limit is 500
    if (count % 400 === 0) {
      await batch.commit();
    }
  }

  await batch.commit();
  return { collection: collectionName, count };
}

/**
 * Fetch document count from Firestore collection
 */
export async function fetchCollectionDocs(collectionName: string) {
  try {
    const colRef = collection(firestore, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err: any) {
    console.error(`Error fetching collection ${collectionName}:`, err);
    throw err;
  }
}
