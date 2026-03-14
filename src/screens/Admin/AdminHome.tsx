import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/spinner';
import { getAllQuestions } from '@/services/questionService';
import { getAllTryouts } from '@/services/tryoutService';
import { deleteAllRankings } from '@/services/rankingService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileText, BookOpen, Users, TrendingUp, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const AdminHome: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalTryouts: 0,
    totalUsers: 0,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [questions, tryouts, usersSnapshot, resultsSnapshot] = await Promise.all([
        getAllQuestions(),
        getAllTryouts(),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'tryout_results')),
      ]);

      setStats({
        totalQuestions: questions.length,
        totalTryouts: tryouts.length,
        totalUsers: usersSnapshot.size,
        totalParticipants: resultsSnapshot.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllRankings = async () => {
    try {
      setDeleting(true);
      await deleteAllRankings();

      toast({
        title: 'Berhasil',
        description: 'Semua data ranking berhasil dihapus',
      });

      setShowDeleteDialog(false);
      await loadStats();
    } catch (error) {
      console.error('Error deleting rankings:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus data ranking',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat statistik..." type="spinner" fullScreen overlay />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-gray-600 mt-1">Kelola seluruh sistem KelasASN</p>
      </div>

      {stats.totalQuestions === 0 && (
        <Alert className="bg-yellow-50 border border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-700" />
          <AlertTitle className="text-yellow-900 font-medium">Setup Firebase Rules Diperlukan</AlertTitle>
          <AlertDescription className="text-yellow-800 text-sm">
            Jika Anda tidak bisa membuat soal, pastikan Firebase Rules sudah di-setup dengan benar.
            Lihat file <span className="font-medium">SETUP_FIREBASE_RULES.md</span> untuk panduan lengkap.
          </AlertDescription>
        </Alert>
      )}

      {stats.totalQuestions > 0 && (
        <Alert className="bg-green-50 border border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-700" />
          <AlertTitle className="text-green-900 font-medium">System Berjalan Normal</AlertTitle>
          <AlertDescription className="text-green-800 text-sm">
            Database terhubung dengan baik. Anda sudah bisa mengelola soal dan tryout.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Soal</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">{stats.totalQuestions}</div>
            <p className="text-xs text-gray-500 mt-1">Soal tersedia</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Try Out</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">{stats.totalTryouts}</div>
            <p className="text-xs text-gray-500 mt-1">Try out dibuat</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Pengguna terdaftar</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Peserta</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">{stats.totalParticipants}</div>
            <p className="text-xs text-gray-500 mt-1">Try out dikerjakan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-900">Panduan Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Pastikan Firebase Rules sudah di-setup</li>
              <li>Buat soal terlebih dahulu di menu "Kelola Soal"</li>
              <li>Setelah ada soal, buat paket try out di menu "Kelola Try Out"</li>
              <li>User dapat melihat dan membeli tryout yang sudah dibuat</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="border border-red-200">
          <CardHeader>
            <CardTitle className="text-base font-medium text-red-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <p className="text-sm text-gray-700 mb-3">
                Hapus semua data ranking untuk memulai dari awal. Ini akan menghapus semua hasil try out dan ranking.
              </p>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="w-full"
                disabled={stats.totalParticipants === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Semua Ranking
              </Button>
              {stats.totalParticipants === 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Tidak ada data ranking untuk dihapus
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Konfirmasi Hapus Data
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-700" />
              <AlertTitle className="text-red-900 font-medium">Peringatan</AlertTitle>
              <AlertDescription className="text-red-800 text-sm">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Semua hasil try out peserta ({stats.totalParticipants} data)</li>
                  <li>Semua data ranking</li>
                  <li>Riwayat skor pengguna</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Catatan:</strong> Data pengguna, try out, dan soal tidak akan terhapus.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllRankings}
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Hapus Semua Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
