import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { motion } from 'framer-motion';
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
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/spinner';

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

  const { user, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

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

  if (authLoading) {
    return <LoadingScreen message="Memeriksa sesi admin..." type="spinner" fullScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] font-sans antialiased text-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-10">
           <Link to="/" className="flex flex-col items-center group">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-green-600 transition-colors mb-4">
                 <img src="/Frame 1321314500.svg" alt="Logo" className="h-7 w-7 brightness-0 invert" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-900 tracking-tight text-xl">KelasASN</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Admin Portal</span>
              </div>
           </Link>
        </div>

        <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center border-b border-gray-50/50">
            <CardTitle className="text-lg font-semibold tracking-tight">Selamat Datang Kembali</CardTitle>
            <CardDescription className="text-xs text-gray-400 font-medium">
              Masukkan kredensial Anda untuk mengakses panel kontrol.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Karyawan</Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@kelasasn.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 bg-gray-50/50 border-gray-100 pl-10 text-sm focus:bg-white focus:ring-0 focus:border-gray-200 transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kata Sandi</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordDialog(true);
                      setResetEmail(email);
                    }}
                    className="text-[10px] text-blue-500 hover:text-blue-600 font-bold uppercase tracking-wider"
                    disabled={loading}
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative group">
                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors">
                    <Shield className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 bg-gray-50/50 border-gray-100 pl-10 text-sm focus:bg-white focus:ring-0 focus:border-gray-200 transition-all rounded-xl"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-blue-100" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Otentikasi...</span>
                  </div>
                ) : (
                  'Masuk ke Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
          <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-center">
             <button
                type="button"
                onClick={() => navigate('/')}
                className="text-[11px] text-gray-400 hover:text-gray-600 font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                ← Kembali ke Situs
              </button>
          </div>
        </Card>
        
        <div className="mt-8 text-center text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
           &copy; 2024 KelasASN Admin System
        </div>
      </motion.div>

      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="bg-white p-8">
            <DialogHeader className="space-y-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                 <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-gray-900">
                Lupa Password Admin?
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 leading-relaxed font-medium">
                {resetEmailSent ? (
                  'Email pemulihan telah dikirim. Periksa kotak masuk Anda.'
                ) : (
                  'Masukkan email administratif Anda untuk menerima tautan pemulihan kata sandi.'
                )}
              </DialogDescription>
            </DialogHeader>

            {resetEmailSent ? (
              <div className="py-8">
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-green-100/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-sm font-bold text-green-900 mb-1">Email Terkirim!</h4>
                  <p className="text-xs text-green-700 font-medium">
                    Tautan telah dikirim ke: <br/> 
                    <span className="font-bold underline mt-1 block">{resetEmail}</span>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendPasswordReset} className="space-y-6 pt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Administratif</Label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="admin@kelasasn.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={sendingResetEmail}
                      className="h-11 bg-gray-50 border-gray-100 pl-10 text-sm focus:bg-white focus:ring-0 focus:border-gray-200 transition-all rounded-xl"
                    />
                  </div>
                </div>

                {resetError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-2 text-xs font-semibold text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowForgotPasswordDialog(false);
                      setResetEmail('');
                      setResetError('');
                    }}
                    disabled={sendingResetEmail}
                    className="flex-1 h-11 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendingResetEmail}
                    className="flex-[2] h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm shadow-blue-100"
                  >
                    {sendingResetEmail ? 'Mengirim...' : 'Kirim Link Reset'}
                  </Button>
                </div>
              </form>
            )}
          </div>
          <div className="bg-gray-50 py-4 px-8 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Keamanan Sistem KelasASN
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
