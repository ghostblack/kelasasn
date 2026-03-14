import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { CircleCheck as CheckCircle2, Circle as XCircle, Loader as Loader2, Mail, AlertCircle } from 'lucide-react';
import { createUserProfile } from '@/services/userService';

export const VerifyEmailPage = () => {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const oobCode = urlParams.get('oobCode');

      // Jika tidak ada parameter, tampilkan instruksi
      if (!mode && !oobCode) {
        setShowInstructions(true);
        setVerifying(false);
        return;
      }

      // Jika mode bukan verifyEmail, redirect
      if (mode && mode !== 'verifyEmail') {
        setError('Mode tidak valid. Halaman ini hanya untuk verifikasi email.');
        setVerifying(false);
        return;
      }

      if (!oobCode) {
        setError('Link verifikasi tidak valid atau sudah kadaluarsa');
        setVerifying(false);
        return;
      }

      try {
        // Cek validitas kode terlebih dahulu
        await checkActionCode(auth, oobCode);

        // Jika valid, apply action code
        await applyActionCode(auth, oobCode);

        // Ambil data user yang belum tersimpan dari localStorage
        const pendingUserData = localStorage.getItem('pendingUserData');
        if (pendingUserData) {
          const userData = JSON.parse(pendingUserData);
          // Simpan data user ke database setelah email diverifikasi
          await createUserProfile(
            userData.uid,
            userData.email,
            userData.displayName,
            userData.phoneNumber
          );
          // Hapus data dari localStorage setelah disimpan
          localStorage.removeItem('pendingUserData');
        }

        setVerified(true);
        setVerifying(false);

        // Auto redirect setelah 3 detik
        setTimeout(() => {
          navigate('/waiting-verification');
        }, 3000);
      } catch (err: any) {
        console.error('Verification error:', err);
        let errorMessage = 'Terjadi kesalahan saat verifikasi email';

        if (err.code === 'auth/invalid-action-code') {
          errorMessage = 'Link verifikasi tidak valid atau sudah digunakan';
        } else if (err.code === 'auth/expired-action-code') {
          errorMessage = 'Link verifikasi sudah kadaluarsa. Silakan minta kirim ulang email verifikasi.';
        } else if (err.code === 'auth/user-disabled') {
          errorMessage = 'Akun Anda telah dinonaktifkan';
        } else if (err.code === 'auth/user-not-found') {
          errorMessage = 'Akun tidak ditemukan';
        } else {
          errorMessage = `Verifikasi gagal: ${err.message}`;
        }

        setError(errorMessage);
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <img
              src="/Frame 1321314500.svg"
              alt="Kelas ASN Logo"
              className="h-16 w-16"
            />
          </div>

          {verifying && (
            <div className="text-center w-full">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Memverifikasi Email
              </h1>
              <p className="text-sm text-gray-600">
                Mohon tunggu sebentar...
              </p>
            </div>
          )}

          {!verifying && verified && (
            <div className="text-center w-full">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Berhasil Diverifikasi!
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Akun Anda telah berhasil diverifikasi. Anda akan dialihkan ke halaman login dalam beberapa detik...
              </p>
              <Button
                onClick={() => navigate('/waiting-verification')}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium transition-colors"
              >
                Lanjutkan
              </Button>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Kembali ke beranda
                </button>
              </div>
            </div>
          )}

          {showInstructions && (
            <div className="text-center w-full">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-12 h-12 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifikasi Email Anda
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Untuk melanjutkan, silakan verifikasi alamat email Anda dengan mengklik link yang telah dikirim ke inbox email Anda.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Langkah-langkah Verifikasi:
                </h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="font-semibold text-blue-600 flex-shrink-0">1.</span>
                    <span>Buka aplikasi email Anda</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-blue-600 flex-shrink-0">2.</span>
                    <span>Cari email dari <strong>noreply@kelasasn2026.firebaseapp.com</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-blue-600 flex-shrink-0">3.</span>
                    <span>Jika tidak ada di inbox, cek folder <strong>Spam/Junk</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-blue-600 flex-shrink-0">4.</span>
                    <span>Klik link verifikasi yang ada di email</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-blue-600 flex-shrink-0">5.</span>
                    <span>Anda akan otomatis kembali ke halaman ini untuk konfirmasi</span>
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium transition-colors"
                >
                  Sudah Verifikasi? Login Sekarang
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  variant="outline"
                  className="w-full h-12 rounded-full font-medium border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Belum Dapat Email? Daftar Ulang
                </Button>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    Kembali ke beranda
                  </button>
                </div>
              </div>
            </div>
          )}

          {!verifying && !verified && error && !showInstructions && (
            <div className="text-center w-full">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifikasi Gagal
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium transition-colors"
                >
                  Kembali ke Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  variant="outline"
                  className="w-full h-12 rounded-full font-medium border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Daftar Ulang
                </Button>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    Kembali ke beranda
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
