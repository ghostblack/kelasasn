import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, initializeAuthPersistence } from '@/lib/firebase';
import { sessionService } from '@/services/sessionService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  sessionId: string | null;
  showSessionConflict: boolean;
  setShowSessionConflict: (show: boolean) => void;
  conflictDeviceInfo?: {
    deviceType: string;
    browser: string;
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  sessionId: null,
  showSessionConflict: false,
  setShowSessionConflict: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showSessionConflict, setShowSessionConflict] = useState(false);
  const [conflictDeviceInfo, setConflictDeviceInfo] = useState<{
    deviceType: string;
    browser: string;
  }>();
  let sessionUnsubscribe: (() => void) | null = null;

  useEffect(() => {
    let isMounted = true;
    console.log('AuthContext: Initializing');

    const initAuth = async () => {
      try {
        await initializeAuthPersistence();
        console.log('AuthContext: Persistence ready, setting up listener');

        if (!isMounted) return;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (!isMounted) return;

          console.log('AuthContext: Auth state changed', {
            hasUser: !!currentUser,
            uid: currentUser?.uid,
            email: currentUser?.email
          });

          if (currentUser) {
            try {
              const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
              const isAdmin = adminDoc.exists() && adminDoc.data()?.role === 'admin';

              if (isAdmin) {
                console.log('AuthContext: Admin user detected');
                if (isMounted) {
                  setUser(currentUser);
                  setSessionId(null);
                  setLoading(false);
                }
                return;
              }

              // Simplify: Just check if we have a user. Google users are the priority.
              // We no longer enforce emailVerified here.
              console.log('AuthContext: User authenticated', { uid: currentUser.uid, email: currentUser.email });

              const storedSessionId = localStorage.getItem(`session_${currentUser.uid}`);

              if (storedSessionId) {
                if (isMounted) {
                  setSessionId(storedSessionId);
                }

                if (sessionUnsubscribe) {
                  sessionUnsubscribe();
                }

                sessionUnsubscribe = sessionService.onSessionInvalidated(storedSessionId, async () => {
                  const activeSessions = await sessionService.getActiveSessions(currentUser.uid);
                  if (activeSessions.length > 0) {
                    const newSession = activeSessions[0];
                    if (isMounted) {
                      setConflictDeviceInfo({
                        deviceType: newSession.deviceInfo.deviceType,
                        browser: newSession.deviceInfo.browser,
                      });
                    }
                  }
                  if (isMounted) {
                    setShowSessionConflict(true);
                  }
                  setTimeout(() => {
                    if (isMounted) {
                      setUser(null);
                      setSessionId(null);
                    }
                    localStorage.removeItem(`session_${currentUser.uid}`);
                    localStorage.removeItem('current_user_id');
                  }, 2000);
                });
              } else {
                if (isMounted) {
                  setSessionId(null);
                }
              }

              if (isMounted) {
                setUser(currentUser);
              }
              localStorage.setItem('current_user_id', currentUser.uid);
            } catch (error) {
              console.error('AuthContext: Error checking user status:', error);
              if (isMounted) {
                setUser(currentUser);
                setSessionId(null);
              }
            } finally {
              console.log('AuthContext: Loading complete');
              if (isMounted) {
                setLoading(false);
              }
            }
          } else {
            console.log('AuthContext: No user logged in');
            if (isMounted) {
              setUser(null);
              setSessionId(null);
              setLoading(false);
            }

            if (sessionUnsubscribe) {
              sessionUnsubscribe();
            }
          }
        }, (error) => {
          console.error('AuthContext: Auth state change error:', error);
          if (isMounted) {
            setLoading(false);
          }
        });

        return () => {
          console.log('AuthContext: Cleaning up auth listener');
          isMounted = false;
          unsubscribe();
          if (sessionUnsubscribe) {
            sessionUnsubscribe();
          }
        };
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const cleanup = initAuth();

    return () => {
      isMounted = false;
      cleanup.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
      });
    };
  }, []);

  const logout = async () => {
    try {
      if (sessionId) {
        await sessionService.endSession(sessionId);
      }

      const userId = localStorage.getItem('current_user_id');
      if (userId) {
        localStorage.removeItem(`session_${userId}`);
        localStorage.removeItem('current_user_id');
      }

      await signOut(auth);
      setSessionId(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        sessionId,
        showSessionConflict,
        setShowSessionConflict,
        conflictDeviceInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
