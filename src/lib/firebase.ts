import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD-OlIkgVVU46Zf4yGNFjO4GUTlMsO-iVY",
  authDomain: "kelasasn2026.firebaseapp.com",
  projectId: "kelasasn2026",
  storageBucket: "kelasasn2026.firebasestorage.app",
  messagingSenderId: "392575914615",
  appId: "1:392575914615:web:6ce24a89616b15d7d7ec72",
  measurementId: "G-WGDEB4EF9B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

let persistenceInitialized = false;
let persistencePromise: Promise<void> | null = null;

export const initializeAuthPersistence = async () => {
  if (persistenceInitialized) {
    return;
  }

  if (persistencePromise) {
    return persistencePromise;
  }

  persistencePromise = setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase: Auth persistence initialized');
      persistenceInitialized = true;
    })
    .catch((error) => {
      console.error("Firebase: Error setting persistence:", error);
      persistenceInitialized = true;
    });

  return persistencePromise;
};

export const waitForAuthReady = (): Promise<void> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  });
};
