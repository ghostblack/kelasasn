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
import { Loader2, Search, Users, CheckCircle2, Clock, Calendar, User, Mail, Eye, AlertCircle } from 'lucide-react';
import { userMonitoringService, UserMonitoringData } from '@/services/userMonitoringService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export const UsersMonitoring: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserMonitoringData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserMonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserMonitoringData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError(errorMessage);
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
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (userData) =>
        userData.user.email.toLowerCase().includes(query) ||
        userData.user.displayName.toLowerCase().includes(query) ||
        userData.user.username?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Monitoring Pengguna</h1>
          <p className="text-sm text-gray-500">Pantau aktivitas peserta tryout</p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Pengguna</p>
              <p className="text-xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2.5 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Tryout Selesai</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.reduce((sum, u) => sum + u.completedTryouts, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2.5 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Sedang Dikerjakan</p>
              <p className="text-xl font-semibold text-gray-900">
                {users.reduce((sum, u) => sum + u.inProgressTryouts, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari nama, email, atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Total Tryout</TableHead>
                <TableHead className="text-center">Selesai</TableHead>
                <TableHead className="text-center">Progress</TableHead>
                <TableHead>Aktivitas Terakhir</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchQuery ? 'Tidak ada pengguna yang sesuai dengan pencarian' : 'Belum ada pengguna terdaftar'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userData) => (
                  <TableRow key={userData.user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{userData.user.displayName}</p>
                          {userData.user.username && (
                            <p className="text-sm text-gray-500">@{userData.user.username}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{userData.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-medium">
                        {userData.totalTryouts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {userData.completedTryouts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        {userData.inProgressTryouts}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(userData.lastActivity)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(userData)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          {session.status === 'completed' ? 'Selesai' : 'Progress'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
