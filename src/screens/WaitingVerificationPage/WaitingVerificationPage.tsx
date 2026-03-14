import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, getAuth, onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Mail, Clock, AlertCircle, CheckCircle as CheckCircle2, Loader2 } from 'lucide-react';

export const WaitingVerificationPage = () => {
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const pendingUserData = localStorage.getItem('pendingUserData');
    if (!pendingUserData) {
      navigate('/register');
      return;
    }

    try {
      const userData = JSON.parse(pendingUserData);
      setEmail(userData.email);
    } catch (err) {
      navigate('/register');
    }

    const lastResendTime = localStorage.getItem('lastResendTime');
    if (lastResendTime) {
      const timePassed = Math.floor((Date.now() - parseInt(lastResendTime)) / 1000);
      if (timePassed < 120) {
        setResendCountdown(120 - timePassed);
      }
    } else {
      setResendCountdown(120);
      localStorage.setItem('lastResendTime', Date.now().toString());
    }
  }, [navigate]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();

        if (user.emailVerified) {
          setCheckingVerification(true);
          setSuccessMessage('Email terverifikasi! Mengarahkan ke halaman login...');

          localStorage.removeItem('pendingUserData');
          localStorage.removeItem('lastResendTime');

          setTimeout(() => {
            navigate('/login?verified=true', { replace: true });
          }, 1500);
        }
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleResendVerification = async () => {
    if (!auth.currentUser || resendCountdown > 0) return;

    setResendLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: false,
      });

      localStorage.setItem('lastResendTime', Date.now().toString());
      setResendCountdown(120);
      setSuccessMessage('Email verifikasi berhasil dikirim ulang! Silakan cek inbox Anda.');
    } catch (err: any) {
      console.error('Resend verification error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Silakan tunggu beberapa saat sebelum mengirim ulang.');
      } else {
        setError('Gagal mengirim email verifikasi. Silakan coba lagi.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {checkingVerification ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Email Terverifikasi!
            </h1>
            <p className="text-gray-600 mb-6">
              Mengarahkan ke halaman login...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Verifikasi Email
              </h1>
              <p className="text-gray-600 mb-4">
                Email verifikasi telah dikirim ke:
              </p>
              <p className="text-lg font-semibold text-gray-900 mb-6">
                {email}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Silakan klik link verifikasi di email Anda. Anda akan otomatis login setelah verifikasi berhasil.
              </p>
            </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Cek folder Spam/Junk jika tidak ada di inbox</li>
            <li>• Email dikirim dari noreply@kelasasn2026.firebaseapp.com</li>
            <li>• Link verifikasi berlaku selama 24 jam</li>
          </ul>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resendCountdown > 0 && !error && (
          <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4 border border-amber-200">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>Tunggu {resendCountdown} detik sebelum mengirim ulang</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={resendLoading || resendCountdown > 0}
                className={`w-full h-12 rounded-lg font-medium transition-all ${
                  resendCountdown > 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {resendCountdown > 0
                  ? `Kirim Ulang (${resendCountdown}s)`
                  : 'Kirim Ulang Email'}
              </Button>

              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full h-12 rounded-lg font-medium border-gray-300 hover:bg-gray-50"
              >
                Ke Halaman Login
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
