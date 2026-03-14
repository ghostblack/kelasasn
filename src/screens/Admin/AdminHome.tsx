import React, { useEffect, useState } from 'react';
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight italic">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">System Analytics & Overview</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white border border-gray-100 rounded-none flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Soal</span>
            <FileText className="h-4 w-4 text-gray-300" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</span>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight font-medium">Bank Soal Aktif</p>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-none flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Try Out</span>
            <BookOpen className="h-4 w-4 text-gray-300" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{stats.totalTryouts}</span>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight font-medium">Paket Tersedia</p>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-none flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Pengguna</span>
            <Users className="h-4 w-4 text-gray-300" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight font-medium">Peserta Terdaftar</p>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-none flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Peserta</span>
            <TrendingUp className="h-4 w-4 text-gray-300" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{stats.totalParticipants}</span>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight font-medium">Ujian Selesai</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 border border-gray-100 bg-white">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Panduan Operasional</h2>
          <div className="space-y-4">
            {[
              "Pastikan Firebase Rules dikonfigurasi dengan benar.",
              "Inventarisir soal melalui menu Kelola Soal.",
              "Susun paket simulasi pada menu Kelola Try Out.",
              "Monitor aktivitas dan transaksi secara berkala."
            ].map((text, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-[10px] font-bold text-blue-600 mt-1 bg-blue-50 w-5 h-5 flex items-center justify-center rounded-none border border-blue-100 flex-shrink-0">{i+1}</span>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 border border-red-100 bg-white">
          <div className="flex items-center gap-2 mb-6 text-red-600">
            <Trash2 className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Critical Actions</h2>
          </div>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed uppercase tracking-tight font-medium">
            Penghapusan data ranking bersifat permanen. Seluruh riwayat skor dan peringkat peserta akan dihapus dari sistem.
          </p>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="outline"
            className="w-full rounded-none border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 text-xs font-bold uppercase tracking-widest"
            disabled={stats.totalParticipants === 0}
          >
            Reset System Ranking
          </Button>
        </div>
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
