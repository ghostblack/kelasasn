import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { sessionService } from '@/services/sessionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Loader2, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

type ActionMode = 'verifyEmail' | 'resetPassword' | 'recoverEmail';

export const EmailActionHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<ActionMode | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const actionCode = searchParams.get('oobCode');
  const actionMode = searchParams.get('mode') as ActionMode;

  useEffect(() => {
    if (!actionCode || !actionMode) {
      setError('Link tidak valid atau sudah kedaluwarsa');
      setLoading(false);
      return;
    }

    setMode(actionMode);

    if (actionMode === 'verifyEmail') {
      handleVerifyEmail();
    } else if (actionMode === 'resetPassword') {
      handleVerifyResetCode();
    }
  }, [actionCode, actionMode]);

  const handleVerifyEmail = async () => {
    try {
      await applyActionCode(auth, actionCode!);

      localStorage.removeItem('pendingUserData');
      localStorage.removeItem('lastResendTime');

      navigate('/waiting-verification', { replace: true });
    } catch (err: any) {
      console.error('Email verification error:', err);
      let errorMessage = 'Gagal memverifikasi email';

      if (err.code === 'auth/invalid-action-code') {
        errorMessage = 'Link verifikasi tidak valid atau sudah digunakan';
      } else if (err.code === 'auth/expired-action-code') {
        errorMessage = 'Link verifikasi sudah kedaluwarsa';
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async () => {
    try {
      await verifyPasswordResetCode(auth, actionCode!);
      setLoading(false);
    } catch (err: any) {
      console.error('Reset code verification error:', err);
      let errorMessage = 'Link reset password tidak valid';

      if (err.code === 'auth/invalid-action-code') {
        errorMessage = 'Link reset password tidak valid atau sudah digunakan';
      } else if (err.code === 'auth/expired-action-code') {
        errorMessage = 'Link reset password sudah kedaluwarsa';
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setResettingPassword(true);
    setError('');

    try {
      await confirmPasswordReset(auth, actionCode!, newPassword);
      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errorMessage = 'Gagal mereset password';

      if (err.code === 'auth/invalid-action-code') {
        errorMessage = 'Link reset password tidak valid atau sudah digunakan';
      } else if (err.code === 'auth/expired-action-code') {
        errorMessage = 'Link reset password sudah kedaluwarsa';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password terlalu lemah';
      }

      setError(errorMessage);
    } finally {
      setResettingPassword(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { delay: 0.2, duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-200">
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
            >
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Memproses Verifikasi
              </h2>
              <p className="text-gray-600 text-sm">
                Mohon tunggu sebentar...
              </p>
            </motion.div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-red-200">
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-10 h-10 text-red-600" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {mode === 'verifyEmail' ? 'Verifikasi Gagal' : 'Link Tidak Valid'}
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm font-medium">
                  {error}
                </p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Kembali ke Login
              </Button>
            </motion.div>
          </div>
        ) : mode === 'verifyEmail' && success ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-green-200">
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email Terverifikasi!
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Mengarahkan Anda ke halaman verifikasi...
              </p>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center justify-center gap-2 text-blue-600"
              >
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              </motion.div>
            </motion.div>
          </div>
        ) : mode === 'resetPassword' && !success ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
            >
              <Lock className="w-10 h-10 text-blue-600" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Reset Password
              </h2>
              <p className="text-gray-600 text-sm mb-8">
                Buat password baru yang aman untuk akun Anda
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password Baru
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    disabled={resettingPassword}
                    className="h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Konfirmasi Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password"
                    required
                    minLength={6}
                    disabled={resettingPassword}
                    className="h-11 rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={resettingPassword}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resettingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        ) : mode === 'resetPassword' && success ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-green-200">
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Password Berhasil Diubah!
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Silakan login menggunakan password baru Anda.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Ke Halaman Login
              </Button>
            </motion.div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};
