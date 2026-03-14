import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User authenticated successfully, UID:', user.uid);

      console.log('Checking admin status...');
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      console.log('Admin document exists:', adminDoc.exists());

      if (adminDoc.exists()) {
        console.log('Admin data:', adminDoc.data());
      }

      if (!adminDoc.exists() || adminDoc.data()?.role !== 'admin') {
        await auth.signOut();
        toast({
          title: 'Akses Ditolak',
          description: adminDoc.exists()
            ? 'Role Anda bukan admin. Gunakan halaman login user biasa.'
            : 'Akun Anda tidak terdaftar sebagai admin. Hubungi administrator.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Login Berhasil',
        description: `Selamat datang, ${adminDoc.data()?.displayName || 'Admin'}!`,
      });

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      let errorMessage = 'Gagal login';
      let errorDetails = '';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Email atau password salah';
        errorDetails = 'Pastikan email dan password yang Anda masukkan benar.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Akun tidak ditemukan';
        errorDetails = 'Email ini belum terdaftar. Silakan buat akun admin terlebih dahulu.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
        errorDetails = 'Pastikan format email Anda benar (contoh: admin@kelasasn.com)';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan login';
        errorDetails = 'Akun sementara diblokir. Coba lagi nanti atau reset password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Koneksi gagal';
        errorDetails = 'Periksa koneksi internet Anda dan coba lagi.';
      } else {
        errorDetails = error.message;
      }

      toast({
        title: errorMessage,
        description: errorDetails,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingResetEmail(true);
    setResetError('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
      setTimeout(() => {
        setShowForgotPasswordDialog(false);
        setResetEmailSent(false);
        setResetEmail('');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errorMessage = 'Gagal mengirim email reset password';

      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Email tidak terdaftar';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Format email tidak valid';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
      }

      setResetError(errorMessage);
    } finally {
      setSendingResetEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin Panel</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Masuk ke dashboard admin KelasASN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@kelasasn.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordDialog(true);
                    setResetEmail(email);
                  }}
                  className="text-sm text-blue-600 hover:underline font-medium"
                  disabled={loading}
                >
                  Lupa Password?
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </Button>

            <div className="text-center pt-4 space-y-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline block w-full font-medium"
              >
                ← Kembali ke halaman utama
              </button>
              <div className="text-xs text-gray-600 pt-3 border-t">
                Belum punya akun admin?{' '}
                <a
                  href="/create-admin.html"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Buat akun admin
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Lupa Password Admin?
            </DialogTitle>
            <DialogDescription>
              {resetEmailSent ? (
                'Email reset password berhasil dikirim!'
              ) : (
                'Masukkan email admin Anda dan kami akan mengirimkan link untuk reset password'
              )}
            </DialogDescription>
          </DialogHeader>

          {resetEmailSent ? (
            <div className="py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-gray-700 mb-2">
                  Kami telah mengirimkan link reset password ke:
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {resetEmail}
                </p>
                <p className="text-xs text-gray-600 mt-3">
                  Silakan cek email Anda dan klik link untuk reset password
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendPasswordReset} className="space-y-4 pt-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
                <Input
                  type="email"
                  placeholder="Email Admin"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={sendingResetEmail}
                  className="pl-12 h-11"
                />
              </div>

              {resetError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPasswordDialog(false);
                    setResetEmail('');
                    setResetError('');
                  }}
                  disabled={sendingResetEmail}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={sendingResetEmail}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {sendingResetEmail ? 'Mengirim...' : 'Kirim Link Reset'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
