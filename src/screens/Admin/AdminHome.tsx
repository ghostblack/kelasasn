import React, { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/ui/spinner';
import { getAllQuestions } from '@/services/questionService';
import { getAllTryouts } from '@/services/tryoutService';
import { deleteAllRankings } from '@/services/rankingService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileText, BookOpen, Users, TrendingUp, CircleAlert as AlertCircle, Trash2, Activity, Bell, Construction, Power } from 'lucide-react';
import { getMaintenanceStatus, setMaintenanceStatus } from '@/services/maintenanceService';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalTryouts: 0,
    totalUsers: 0,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Kami sedang melakukan pemeliharaan sistem. Silakan coba lagi dalam beberapa saat.');
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  useEffect(() => {
    loadStats();
    loadMaintenanceStatus();
  }, []);

  const loadStats = async () => {
    try {
      setHasError(false);
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
      setHasError(true);
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

  const loadMaintenanceStatus = async () => {
    try {
      const status = await getMaintenanceStatus();
      setMaintenanceActive(status.isActive);
      if (status.message) setMaintenanceMessage(status.message);
    } catch (error) {
      console.error('Error loading maintenance status:', error);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!user) return;
    try {
      setTogglingMaintenance(true);
      const newStatus = !maintenanceActive;
      await setMaintenanceStatus(newStatus, maintenanceMessage, user.uid);
      setMaintenanceActive(newStatus);
      toast({
        title: newStatus ? '🔧 Maintenance Mode Aktif' : '✅ Website Kembali Online',
        description: newStatus
          ? 'Website sekarang dalam mode maintenance. Hanya admin yang bisa mengakses.'
          : 'Website sekarang bisa diakses oleh semua pengguna.',
      });
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status maintenance',
        variant: 'destructive',
      });
    } finally {
      setTogglingMaintenance(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat statistik..." type="spinner" fullScreen overlay />;
  }

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">Live Platform Analytics</span>
           </div>
           <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
             Dashboard <span className="text-gray-400 font-medium ml-2">Overview</span>
           </h1>
           <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xl">
             Manage and monitor your online tryout platform performance, user registrations, and system health in real-time.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button className="bg-gray-900 hover:bg-black text-white px-6 h-11 rounded-none text-xs font-bold uppercase tracking-widest transition-all">
              <Activity className="w-4 h-4 mr-2" />
              Global Activity
           </Button>
           <Button variant="outline" className="border-gray-100 hover:border-gray-200 text-gray-500 px-4 h-11 rounded-none">
              <Bell className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* Sub Navigation / Tabs */}
      <div className="flex items-center gap-8 border-b border-transparent overflow-x-auto custom-scrollbar pb-1">
         {[
           { label: 'Overview', active: true },
           { label: 'Active Tryouts', active: false },
           { label: 'Registrations', active: false },
           { label: 'Finance', active: false },
           { label: 'Security', active: false },
         ].map((tab) => (
           <button
             key={tab.label}
             className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
               tab.active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-300 hover:text-gray-500'
             }`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative p-8 bg-white border border-gray-100 transition-all hover:border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div className="p-2 bg-blue-50 text-blue-500">
               <FileText className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-none">+12.5%</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Questions</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-extrabold text-gray-900 tracking-tighter">{stats.totalQuestions}</span>
             <span className="text-xs font-medium text-gray-300 italic">items</span>
          </div>
        </div>

        <div className="group relative p-8 bg-white border border-gray-100 transition-all hover:border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div className="p-2 bg-purple-50 text-purple-500">
               <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-none">Stable</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Try Out Packages</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-extrabold text-gray-900 tracking-tighter">{stats.totalTryouts}</span>
             <span className="text-xs font-medium text-gray-300 italic">live</span>
          </div>
        </div>

        <div className="group relative p-8 bg-white border border-gray-100 transition-all hover:border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div className="p-2 bg-orange-50 text-orange-500">
               <Users className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-none">+34 New</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Registered Users</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-extrabold text-gray-900 tracking-tighter">{stats.totalUsers}</span>
             <span className="text-xs font-medium text-gray-300 italic">verified</span>
          </div>
        </div>

        <div className="group relative p-8 bg-white border border-gray-100 transition-all hover:border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div className="p-2 bg-green-50 text-green-500">
               <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-400">Total Runs</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sessions Completed</p>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-extrabold text-gray-900 tracking-tighter">{stats.totalParticipants}</span>
             <span className="text-xs font-medium text-gray-300 italic">results</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-6">
        {/* Alerts & News Area */}
        <div className="lg:col-span-8 space-y-6">
           {hasError && (
             <div className="p-6 bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-4">
                <div className="flex gap-4">
                   <div className="w-10 h-10 bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                   </div>
                   <div>
                      <h3 className="text-xs font-bold text-red-900 uppercase tracking-widest mb-1">Permission or Data Error</h3>
                      <p className="text-sm text-red-700/80 leading-relaxed">
                        There was an error loading system statistics. This might be due to security rules or a connection issue.
                      </p>
                   </div>
                </div>
             </div>
           )}

           <div className="p-10 bg-white border border-gray-100">
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-l-4 border-blue-500 pl-4 h-4 flex items-center">
                    Operational Guidelines
                 </h2>
                 <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 {[
                   { title: "Security Rules", desc: "Ensure IAM and security rules are matching production standards.", status: "Verified" },
                   { title: "Question Bank", desc: "Keep the item difficulty balanced across all active packages.", status: "Managed" },
                   { title: "Financial Audits", desc: "Review claim codes and payment logs at the end of each session.", status: "Pending" },
                   { title: "User Activities", desc: "Monitor for suspicious registration or trial activities.", status: "Active" }
                 ].map((item, i) => (
                   <div key={i} className="group cursor-default">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight">{item.title}</span>
                         <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">{item.status}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium group-hover:text-gray-600 transition-colors">
                        {item.desc}
                      </p>
                      <div className="h-0.5 bg-gray-50 mt-4 overflow-hidden">
                         <div className="h-full bg-blue-500 transition-all duration-1000 w-0 group-hover:w-full" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Action Sidebar Area */}
        <div className="lg:col-span-4 space-y-6">
           {/* Maintenance Mode Toggle */}
           <div className={`p-10 border transition-all ${
             maintenanceActive
               ? 'bg-orange-50 border-orange-200'
               : 'bg-gray-50 border-gray-100'
           }`}>
              <div className="flex flex-col items-center text-center">
                 <div className={`w-16 h-16 border rounded-full flex items-center justify-center mb-6 shadow-sm transition-all ${
                   maintenanceActive
                     ? 'bg-orange-100 border-orange-200'
                     : 'bg-white border-gray-100'
                 }`}>
                    <Construction className={`w-6 h-6 ${
                      maintenanceActive ? 'text-orange-500' : 'text-gray-400'
                    }`} />
                 </div>
                 <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Maintenance Mode</h3>
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 ${
                   maintenanceActive
                     ? 'bg-orange-100 text-orange-700'
                     : 'bg-green-100 text-green-700'
                 }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      maintenanceActive ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
                    }`} />
                    {maintenanceActive ? 'Maintenance Aktif' : 'Online'}
                 </div>
                 <p className="text-xs text-gray-400 leading-relaxed mb-4 font-medium">
                   {maintenanceActive
                     ? 'Website dalam mode maintenance. Hanya admin yang bisa mengakses.'
                     : 'Website berjalan normal dan bisa diakses oleh semua pengguna.'}
                 </p>
                 <textarea
                   value={maintenanceMessage}
                   onChange={(e) => setMaintenanceMessage(e.target.value)}
                   placeholder="Pesan maintenance untuk pengguna..."
                   className="w-full text-xs border border-gray-200 rounded-lg p-3 mb-4 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-orange-300 focus:border-orange-300 bg-white"
                   disabled={togglingMaintenance}
                 />
                 <Button
                   className={`w-full h-12 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
                     maintenanceActive
                       ? 'bg-green-600 hover:bg-green-700 text-white'
                       : 'bg-orange-500 hover:bg-orange-600 text-white'
                   }`}
                   onClick={handleToggleMaintenance}
                   disabled={togglingMaintenance}
                 >
                   <Power className="w-4 h-4 mr-2" />
                   {togglingMaintenance
                     ? 'Memproses...'
                     : maintenanceActive
                       ? 'Matikan Maintenance'
                       : 'Aktifkan Maintenance'}
                 </Button>
              </div>
           </div>

           <div className="p-10 bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                 <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Reset System State</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-8 uppercase tracking-tight font-medium">
                Dangerous action. This will permanently wipe all results and ranking data while preserving users and questions.
              </p>
              <Button
                variant="outline"
                className="w-full h-12 rounded-none border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 bg-white text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={stats.totalParticipants === 0}
              >
                Reset Ranking Database
              </Button>
           </div>
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
