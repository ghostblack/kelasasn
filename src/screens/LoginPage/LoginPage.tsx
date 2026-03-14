import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { CircleAlert as AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { sessionService } from '@/services/sessionService';
import { userService } from '@/services/userService';
import { LoadingScreen } from '@/components/ui/spinner';

export const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const isGoogleUser = user.providerData.some(
        provider => provider.providerId === 'google.com'
      );

      if (isGoogleUser || user.emailVerified) {
        checkUserProfile();
      }
    }
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      let userData = await userService.getUserData(user.uid);

      if (!userData || !userData.username || !userData.displayName) {
        navigate('/setup-profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      let userData = await userService.getUserData(user.uid);

      if (!userData) {
        await userService.createMinimalUserProfile(
          user.uid,
          user.email || ''
        );
      }

      const sessionId = await sessionService.createSession(user.uid);
      await sessionService.invalidateOtherSessions(user.uid, sessionId);

      localStorage.setItem(`session_${user.uid}`, sessionId);
      localStorage.setItem('current_user_id', user.uid);

      userData = await userService.getUserData(user.uid);

      if (!userData || !userData.username || !userData.displayName) {
        navigate('/setup-profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      let errorMessage = 'Terjadi kesalahan saat login dengan Google';

      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login dibatalkan. Silakan coba lagi.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup diblokir oleh browser. Silakan izinkan popup dan coba lagi.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Email sudah terdaftar dengan metode login lain';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Koneksi internet bermasalah. Silakan coba lagi.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan login. Silakan coba lagi nanti.';
      } else if (err.message) {
        errorMessage = `Terjadi kesalahan: ${err.message}`;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <LoadingScreen
          message="Memproses login dengan Google..."
          type="orbit"
          fullScreen={true}
          overlay={true}
        />
      )}
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <img
              src="/Frame 1321314500.svg"
              alt="Kelas ASN Logo"
              className="h-20 w-20"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang
          </h1>
          <p className="text-sm text-gray-600 text-center">
            Login dengan akun Google Anda untuk melanjutkan
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-medium flex items-center justify-center gap-3 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Lanjutkan dengan Google</span>
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              disabled={loading}
            >
              Kembali ke beranda
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Dengan login, Anda menyetujui syarat dan ketentuan serta kebijakan privasi Kelas ASN
          </p>
        </div>
      </motion.div>
    </div>
    </>
  );
};
