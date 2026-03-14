import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CircleAlert as AlertCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { userService } from '@/services/userService';
import { LoadingScreen } from '@/components/ui/spinner';

export const SetupProfilePage = () => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const suggestedName = user.displayName || user.email?.split('@')[0] || '';
      setDisplayName(suggestedName);

      const baseUsername = suggestedName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      setUsername(baseUsername);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('Anda harus login terlebih dahulu');
      setLoading(false);
      return;
    }

    const trimmedDisplayName = displayName.trim();
    const trimmedUsername = username.trim();

    if (!trimmedDisplayName) {
      setError('Nama lengkap harus diisi');
      setLoading(false);
      return;
    }

    if (trimmedDisplayName.length < 3) {
      setError('Nama lengkap minimal 3 karakter');
      setLoading(false);
      return;
    }

    if (!trimmedUsername) {
      setError('Username harus diisi');
      setLoading(false);
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username minimal 3 karakter');
      setLoading(false);
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('Username maksimal 20 karakter');
      setLoading(false);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      setError('Username hanya boleh mengandung huruf, angka, dan underscore');
      setLoading(false);
      return;
    }

    try {
      const isAvailable = await userService.checkUsernameAvailability(trimmedUsername);

      if (!isAvailable) {
        setError('Username sudah digunakan. Silakan pilih yang lain.');
        setLoading(false);
        return;
      }

      await userService.updateUserProfile(user.uid, {
        displayName: trimmedDisplayName,
        username: trimmedUsername,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Setup profile error:', err);
      setError('Terjadi kesalahan saat menyimpan profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <>
      {loading && (
        <LoadingScreen
          message="Menyimpan profil..."
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
            <div className="mb-6 bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lengkapi Profil
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Kami perlu beberapa informasi untuk melengkapi akun Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Contoh: Ahmad Rizki"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-12 bg-blue-50 border-blue-100 h-12 rounded-xl focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 font-medium">
                  @
                </span>
                <Input
                  type="text"
                  placeholder="contoh: ahmad123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-12 bg-blue-50 border-blue-100 h-12 rounded-xl focus:bg-white transition-colors"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                3-20 karakter: huruf, angka, underscore
              </p>
            </div>

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
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium"
            >
              Lanjutkan ke Dashboard
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <span className="font-medium">Catatan:</span> Username tidak dapat diubah setelah dibuat. Pastikan username yang Anda pilih sesuai keinginan.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};
