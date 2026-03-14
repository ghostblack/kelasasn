import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserSession {
  id: string;
  userId: string;
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    deviceType: string;
    browser: string;
  };
  loginTime: Timestamp;
  lastActivityTime: Timestamp;
  isActive: boolean;
}

function parseUserAgent(userAgent: string) {
  let deviceType = 'Desktop';
  let browser = 'Unknown';

  if (/iPhone|iPad|iPod/.test(userAgent)) {
    deviceType = 'iOS';
  } else if (/Android/.test(userAgent)) {
    deviceType = 'Android';
  } else if (/Windows/.test(userAgent)) {
    deviceType = 'Windows';
  } else if (/Mac/.test(userAgent)) {
    deviceType = 'Mac';
  } else if (/Linux/.test(userAgent)) {
    deviceType = 'Linux';
  }

  if (/Chrome/.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Firefox/.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Safari/.test(userAgent)) {
    browser = 'Safari';
  } else if (/Edge/.test(userAgent)) {
    browser = 'Edge';
  }

  return { deviceType, browser };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const sessionService = {
  createSession: async (userId: string): Promise<string> => {
    const sessionId = generateSessionId();
    const userAgent = navigator.userAgent;
    const { deviceType, browser } = parseUserAgent(userAgent);

    const sessionData: Omit<UserSession, 'id'> = {
      userId,
      sessionId,
      deviceInfo: {
        userAgent,
        deviceType,
        browser,
      },
      loginTime: Timestamp.now(),
      lastActivityTime: Timestamp.now(),
      isActive: true,
    };

    const sessionRef = doc(collection(db, 'userSessions'), sessionId);
    await setDoc(sessionRef, sessionData);

    localStorage.setItem(`session_${userId}`, sessionId);

    return sessionId;
  },

  invalidateOtherSessions: async (userId: string, currentSessionId: string): Promise<void> => {
    const sessionsRef = collection(db, 'userSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    for (const document of querySnapshot.docs) {
      if (document.data().sessionId !== currentSessionId) {
        await updateDoc(doc(db, 'userSessions', document.id), {
          isActive: false,
        });
      }
    }
  },

  getActiveSessions: async (userId: string): Promise<UserSession[]> => {
    const sessionsRef = collection(db, 'userSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as UserSession));
  },

  isSessionValid: async (userId: string, sessionId: string): Promise<boolean> => {
    const sessionsRef = collection(db, 'userSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('sessionId', '==', sessionId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size > 0;
  },

  endSession: async (sessionId: string): Promise<void> => {
    try {
      const sessionRef = doc(db, 'userSessions', sessionId);
      await deleteDoc(sessionRef);
    } catch (error) {
      console.error('Error deleting session:', error);
    }

    const userId = localStorage.getItem('current_user_id');
    if (userId) {
      localStorage.removeItem(`session_${userId}`);
      localStorage.removeItem('current_user_id');
    }
  },

  updateLastActivity: async (sessionId: string): Promise<void> => {
    const sessionRef = doc(db, 'userSessions', sessionId);
    await updateDoc(sessionRef, {
      lastActivityTime: Timestamp.now(),
    });
  },

  onSessionInvalidated: (sessionId: string, callback: () => void) => {
    const sessionRef = doc(db, 'userSessions', sessionId);

    return onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserSession;
        if (!data.isActive) {
          callback();
        }
      }
    });
  },

  cleanupOldSessions: async (userId: string): Promise<void> => {
    const sessionsRef = collection(db, 'userSessions');
    const q = query(sessionsRef, where('userId', '==', userId));

    const querySnapshot = await getDocs(q);
    const now = Date.now();

    for (const document of querySnapshot.docs) {
      const session = document.data() as UserSession;
      const lastActivity = session.lastActivityTime.toMillis();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      if (now - lastActivity > thirtyDaysInMs) {
        await deleteDoc(doc(db, 'userSessions', document.id));
      }
    }
  },
};
