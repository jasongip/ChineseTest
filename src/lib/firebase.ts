import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  Firestore,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { LeaderboardUser } from '../types/battle';

let db: Firestore | null = null;
let auth: Auth | null = null;
let isInitialized = false;

export function initFirebase() {
  if (isInitialized) return { db, auth };

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Firestore instance with database ID if configured
    if (firebaseConfig.firestoreDatabaseId) {
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }

    // Anonymous authentication for security rules compliance
    auth = getAuth(app);
    signInAnonymously(auth).catch((err) => {
      console.warn('Anonymous auth note (fallback to public rule):', err);
    });

    isInitialized = true;
    console.log('✅ Firebase Firestore connected successfully. Project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }

  return { db, auth };
}

// Sync player document to Firestore
export async function syncPlayerToFirestore(player: LeaderboardUser): Promise<boolean> {
  try {
    const { db: firestoreDb } = initFirebase();
    if (!firestoreDb || !player.id) return false;

    const playerRef = doc(firestoreDb, 'players', player.id);
    const dataToSave = {
      id: player.id,
      name: player.name || '精靈學員',
      avatarBg: player.avatarBg || 'from-amber-400 to-orange-500',
      badge: player.badge || '🌟 粵語之星',
      allTimeAnswered: Number(player.allTimeAnswered) || 0,
      allTimeCorrect: Number(player.allTimeCorrect) || 0,
      accuracy: Number(player.accuracy) || 100,
      cardsCount: Number(player.cardsCount) || 0,
      weeklyAnswered: Number(player.weeklyAnswered) || 0,
      weeklyCorrect: Number(player.weeklyCorrect) || 0,
      battleWins: Number(player.battleWins) || 0,
      battleScore: Number(player.battleScore) || 1000,
      deckCardIds: Array.isArray(player.deckCardIds) && player.deckCardIds.length > 0
        ? player.deckCardIds.slice(0, 4)
        : [25, 6, 9, 3],
      isCustomDeck: Boolean(player.isCustomDeck),
      unlockedCardIds: Array.isArray(player.unlockedCardIds) ? player.unlockedCardIds : [],
      lastUpdated: Date.now(),
    };

    await setDoc(playerRef, dataToSave, { merge: true });
    return true;
  } catch (err) {
    console.warn('Sync to Firestore skipped or failed:', err);
    return false;
  }
}

// Subscribe to real-time players list from Firestore
export function subscribeToCloudPlayers(
  onUpdate: (players: LeaderboardUser[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const { db: firestoreDb } = initFirebase();
    if (!firestoreDb) {
      onUpdate([]);
      return () => {};
    }

    const playersCollection = collection(firestoreDb, 'players');
    const q = query(playersCollection, limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudPlayers: LeaderboardUser[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.id && d.name) {
            cloudPlayers.push({
              id: d.id,
              name: d.name,
              avatarBg: d.avatarBg || 'from-indigo-500 to-purple-600',
              badge: d.badge || '🎓 實時學員',
              allTimeAnswered: Number(d.allTimeAnswered) || 0,
              allTimeCorrect: Number(d.allTimeCorrect) || 0,
              accuracy: Number(d.accuracy) || 100,
              cardsCount: Number(d.cardsCount) || 0,
              weeklyAnswered: Number(d.weeklyAnswered) || 0,
              weeklyCorrect: Number(d.weeklyCorrect) || 0,
              battleWins: Number(d.battleWins) || 0,
              battleScore: Number(d.battleScore) || 1000,
              deckCardIds: Array.isArray(d.deckCardIds) && d.deckCardIds.length > 0 ? d.deckCardIds : [25, 6, 9, 3],
              isCustomDeck: Boolean(d.isCustomDeck),
              unlockedCardIds: Array.isArray(d.unlockedCardIds) ? d.unlockedCardIds : [],
              lastUpdated: d.lastUpdated || Date.now(),
            });
          }
        });
        onUpdate(cloudPlayers);
      },
      (error) => {
        console.warn('Firestore snapshot listener note:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('Cloud subscribe error:', e);
    return () => {};
  }
}
