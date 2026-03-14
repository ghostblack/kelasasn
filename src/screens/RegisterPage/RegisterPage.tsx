import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, fetchSignInMethodsForEmail, updateProfile, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, CircleAlert as AlertCircle, User, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const isGoogleUser = user.providerData.some(
        provider => provider.providerId === 'google.com'
      );

      // Google users are already verified
      if (isGoogleUser || user.emailVerified) {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Nama lengkap harus diisi');
      setLoading(false);
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Nomor handphone harus diisi');
      setLoading(false);
      return;
    }

    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      setError('Format nomor handphone tidak valid (contoh: 081234567890)');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    try {
      // Cek apakah email sudah terdaftar
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length > 0) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);

          if (!userCredential.user.emailVerified) {
            await deleteUser(userCredential.user);
            setError('');
          } else {
            await auth.signOut();
            setError('Email sudah terdaftar dan terverifikasi. Silakan login.');
            return;
          }
        } catch (loginErr: any) {
          if (loginErr.code === 'auth/wrong-password' || loginErr.code === 'auth/invalid-credential') {
            setError('Email sudah terdaftar dengan password berbeda');
          } else {
            setError('Email sudah terdaftar');
          }
          return;
        }
      }

      // Email belum terdaftar, buat akun baru
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Simpan data di localStorage untuk digunakan saat verifikasi email
      localStorage.setItem('pendingUserData', JSON.stringify({
        uid: userCredential.user.uid,
        email: email.trim(),
        displayName: name.trim(),
        phoneNumber: phoneNumber.trim()
      }));

      // Update profile dengan nama
      await updateProfile(userCredential.user, {
        displayName: name.trim()
      });

      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: false,
      });
      setName('');
      setEmail('');
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');
      navigate('/waiting-verification');
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'Terjadi kesalahan saat mendaftar';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email sudah terdaftar';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password minimal 6 karakter';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Koneksi internet bermasalah. Silakan coba lagi.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
      } else {
        errorMessage = `Terjadi kesalahan: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="mb-6">
            <img
              src="/Frame 1321314500.svg"
              alt="Kelas ASN Logo"
              className="h-16 w-16"
            />
          </div>
          <p className="text-sm text-gray-600">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Masuk Disini
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
            <Input
              type="text"
              placeholder="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="pl-12 bg-indigo-50 border-indigo-100 h-12 rounded-xl focus:bg-white transition-colors"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
            <Input
              type="email"
              placeholder="Email Terdaftar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-12 bg-indigo-50 border-indigo-100 h-12 rounded-xl focus:bg-white transition-colors"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
            <Input
              type="tel"
              placeholder="No. Handphone (contoh: 081234567890)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={loading}
              className="pl-12 bg-indigo-50 border-indigo-100 h-12 rounded-xl focus:bg-white transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="pl-12 bg-indigo-50 border-indigo-100 h-12 rounded-xl focus:bg-white transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
            <Input
              type="password"
              placeholder="Konfirmasi Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="pl-12 bg-indigo-50 border-indigo-100 h-12 rounded-xl focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}


          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium"
          >
            {loading ? 'Memproses...' : 'Daftar'}
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
        </form>
      </div>
    </div>
  );
};
