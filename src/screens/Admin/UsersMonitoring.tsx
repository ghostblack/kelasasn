import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Users, CheckCircle2, Clock, User, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { userMonitoringService, UserMonitoringData } from '@/services/userMonitoringService';
import { userService } from '@/services/userService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const UsersMonitoring: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserMonitoringData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserMonitoringData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserMonitoringData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [confirmingDeleteUserId, setConfirmingDeleteUserId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset to first page on search/sort
  }, [searchQuery, users, sortOrder]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users from monitoring service...');
      const data = await userMonitoringService.getAllUsersWithActivity();
      console.log('Users loaded:', data.length);
      setUsers(data);
      setFilteredUsers(data);

      if (data.length === 0) {
        toast({
          title: 'Info',
          description: 'Belum ada pengguna terdaftar di sistem',
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat data pengguna';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (userData) =>
          userData.user.email.toLowerCase().includes(query) ||
          userData.user.displayName.toLowerCase().includes(query) ||
          userData.user.username?.toLowerCase().includes(query)
      );
    }

    // Sort by createdAt
    filtered.sort((a, b) => {
      const dateA = a.user.createdAt instanceof Date ? a.user.createdAt.getTime() : 0;
      const dateB = b.user.createdAt instanceof Date ? b.user.createdAt.getTime() : 0;
      
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async () => {
    if (!confirmingDeleteUserId) return;
    const userId = confirmingDeleteUserId;
    setConfirmingDeleteUserId(null);

    try {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      await userService.deleteUser(userId);
      
      toast({
        title: 'Berhasil',
        description: 'Akun user dan data terkait berhasil dihapus',
      });
      
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus user',
        variant: 'destructive',
      });
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleViewDetails = (userData: UserMonitoringData) => {
    setSelectedUser(userData);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">User Activity Tracking</span>
           </div>
           <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
             Monitoring <span className="text-gray-400 font-medium ml-2">Pengguna</span>
           </h1>
           <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xl">
             Pantau aktivitas peserta tryout dalam waktu nyata. Lihat progress pengerjaan, skor, dan riwayat sesi pengguna.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={loadUsers} className="bg-gray-900 hover:bg-black text-white px-6 h-11 rounded-none text-xs font-bold uppercase tracking-widest transition-all shadow-sm">
              <Search className="w-4 h-4 mr-2" />
              Refresh Data
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-100 rounded-none p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 border border-gray-100 p-3">
              <Users className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-100 rounded-none p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 border border-gray-100 p-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.reduce((sum, u) => sum + u.completedTryouts, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-100 rounded-none p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 border border-gray-100 p-3">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.reduce((sum, u) => sum + u.inProgressTryouts, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-white border border-gray-100 rounded-none shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari nama, email, atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-none border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-sm"
            />
          </div>
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-full md:w-48 h-11 rounded-none border-gray-100 bg-gray-50/50 uppercase text-[10px] font-bold tracking-widest">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru Mendaftar</SelectItem>
              <SelectItem value="oldest">Terlama Mendaftar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <Table className="border-collapse border border-gray-100 font-mono">
            <TableHeader className="bg-gray-50/80">
              <TableRow className="hover:bg-transparent border-gray-100">
                <TableHead className="w-12 text-center text-[10px] font-bold uppercase text-gray-500 border-r border-gray-100 h-10">No</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-900 border-r border-gray-100 h-10 px-4">Pengguna</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500 border-r border-gray-100 h-10 px-4">Akses Tryout</TableHead>
                <TableHead className="text-center text-[10px] font-bold uppercase text-gray-900 border-r border-gray-100 h-10 px-2">Done</TableHead>
                <TableHead className="text-center text-[10px] font-bold uppercase text-orange-600 border-r border-gray-100 h-10 px-2">Active</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-400 border-r border-gray-100 h-10 px-4">Last Activity</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase text-gray-900 h-10 pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    {searchQuery ? 'No matching records found' : 'No user data available'}
                  </TableCell>
                </TableRow>
              ) : (
                currentUsers.map((userData, index) => (
                  <TableRow key={userData.user.uid} className="hover:bg-blue-50/50 border-gray-100 transition-colors h-11 group">
                    <TableCell className="text-center text-[10px] text-gray-400 border-r border-gray-100 py-1 font-bold">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="border-r border-gray-100 py-1 px-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-900 uppercase truncate max-w-[180px] leading-tight">{userData.user.displayName}</span>
                          <span className="text-[9px] font-medium text-gray-400 truncate max-w-[180px]">{userData.user.email}</span>
                        </div>
                    </TableCell>
                    <TableCell className="border-r border-gray-100 py-1 px-4 min-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {userData.accessibleTryouts.length > 0 ? (
                          userData.accessibleTryouts.map((name, i) => (
                            <Badge key={i} className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] font-black uppercase tracking-tighter rounded-none py-0 h-4">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[9px] text-gray-300 font-bold uppercase italic">No Access</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-[10px] text-gray-900 border-r border-gray-100 py-1 font-black">
                      {userData.completedTryouts}
                    </TableCell>
                    <TableCell className="text-center text-[10px] text-orange-600 border-r border-gray-100 py-1 font-black">
                      {userData.inProgressTryouts}
                    </TableCell>
                    <TableCell className="border-r border-gray-100 py-1 px-4">
                       <span className="text-[10px] text-gray-400 font-bold uppercase truncate block w-full tracking-tighter">
                          {formatDate(userData.lastActivity)}
                       </span>
                    </TableCell>
                    <TableCell className="text-right py-1 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(userData)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-white rounded-none border border-transparent hover:border-blue-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingIds.has(userData.user.uid)}
                          onClick={() => setConfirmingDeleteUserId(userData.user.uid)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-white rounded-none border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Formasi-style Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono">
            <div className="flex items-center shadow-sm">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="w-10 h-10 p-0 rounded-none border-gray-200 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant="outline"
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-10 h-10 p-0 rounded-none border-l-0 border-gray-200 font-black text-xs transition-all",
                    currentPage === i + 1 ? "bg-blue-600 text-white border-blue-600 shadow-inner" : "bg-white text-gray-400 hover:bg-gray-50"
                  )}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-10 h-10 p-0 rounded-none border-l-0 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">PAGE:</span>
              <div className="w-12 h-10 bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-gray-900">
                {currentPage}
              </div>
              <span className="text-[10px] text-gray-300 font-bold uppercase">OF {totalPages}</span>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Aktivitas Pengguna</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.user.displayName}</h3>
                    {selectedUser.user.username && (
                      <p className="text-gray-600">@{selectedUser.user.username}</p>
                    )}
                    <p className="text-sm text-gray-500">{selectedUser.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedUser.totalTryouts}</p>
                    <p className="text-xs text-gray-600">Total Tryout</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedUser.completedTryouts}</p>
                    <p className="text-xs text-gray-600">Selesai</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{selectedUser.inProgressTryouts}</p>
                    <p className="text-xs text-gray-600">Progress</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Riwayat Tryout</h4>
                {selectedUser.tryoutSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Belum ada tryout yang dikerjakan
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedUser.tryoutSessions.map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{session.tryoutName}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-500">
                              Dikerjakan: {formatDate(session.startTime)}
                            </span>
                            {session.completedAt && (
                              <span className="text-sm text-gray-500">
                                Selesai: {formatDate(session.completedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {session.status === 'completed' ? 'Selesai' : 'Progress'}
                          </Badge>
                          {session.status === 'completed' && session.id && (
                            <Link to={`/admin/users/${selectedUser.user.uid}/result/${session.id}`}>
                              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest rounded-none">
                                Lihat Detail
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for User Deletion */}
      <Dialog open={!!confirmingDeleteUserId} onOpenChange={(open) => !open && setConfirmingDeleteUserId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Konfirmasi Hapus Akun
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun user ini secara permanen?
              <span className="block mt-2 font-semibold text-red-600">
                Semua data aktivitas, riwayat tryout, dan hasil ujian user ini juga akan dihapus permanen.
              </span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmingDeleteUserId(null)}
              className="rounded-none h-11"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              className="rounded-none h-11 bg-red-600 hover:bg-red-700 font-bold uppercase tracking-widest text-[10px]"
            >
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
