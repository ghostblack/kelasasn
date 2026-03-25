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
import { Loader2, Search, MessageSquare, Star, AlertCircle, Calendar, User, BookOpen } from 'lucide-react';
import { getAllFeedbacks, TryoutFeedback } from '@/services/tryoutService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export const FeedbackManagement: React.FC = () => {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<TryoutFeedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<TryoutFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tryoutFilter, setTryoutFilter] = useState('all');
  const [uniqueTryouts, setUniqueTryouts] = useState<string[]>([]);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  useEffect(() => {
    filterFeedbacks();
  }, [searchQuery, feedbacks, tryoutFilter]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await getAllFeedbacks();
      setFeedbacks(data);
      
      // Extract unique tryout names for filter
      const tryoutNames = Array.from(new Set(data.map(f => f.tryoutName)));
      setUniqueTryouts(tryoutNames);
      
    } catch (error) {
      console.error('Error loading feedbacks:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data feedback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFeedbacks = () => {
    let filtered = [...feedbacks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.userName.toLowerCase().includes(query) ||
          f.tryoutName.toLowerCase().includes(query) ||
          f.whatIsGood.toLowerCase().includes(query) ||
          f.whatIsMissing.toLowerCase().includes(query)
      );
    }

    if (tryoutFilter !== 'all') {
      filtered = filtered.filter(f => f.tryoutName === tryoutFilter);
    }

    setFilteredFeedbacks(filtered);
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data feedback...</p>
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
              <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">User Testimonials & Feedback</span>
           </div>
           <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
             Feedback <span className="text-gray-400 font-medium ml-2">Pengguna</span>
           </h1>
           <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xl">
             Lihat apa yang dikatakan pengguna tentang try out gratis. Gunakan testimoni untuk promosi dan feedback untuk perbaikan sistem.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={loadFeedbacks} className="bg-gray-900 hover:bg-black text-white px-6 h-11 rounded-none text-xs font-bold uppercase tracking-widest transition-all shadow-sm">
              <Search className="w-4 h-4 mr-2" />
              Refresh Data
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-100 rounded-none p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 border border-blue-100 p-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{feedbacks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-100 rounded-none p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-green-50 border border-green-100 p-3">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Testimoni Bagus</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedbacks.filter(f => f.whatIsGood.length > 20).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-100 rounded-none p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 border border-orange-100 p-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Perlu Perbaikan</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedbacks.filter(f => f.whatIsMissing.length > 5).length}
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
              placeholder="Cari user, tryout, atau isi feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-none border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-sm"
            />
          </div>
          <Select value={tryoutFilter} onValueChange={setTryoutFilter}>
            <SelectTrigger className="w-full md:w-64 h-11 rounded-none border-gray-100 bg-gray-50/50 uppercase text-[10px] font-bold tracking-widest">
              <SelectValue placeholder="Filter Tryout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tryout</SelectItem>
              {uniqueTryouts.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-gray-100 hover:bg-transparent">
                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">User & Tryout</TableHead>
                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">Testimoni (Apa yang Bagus)</TableHead>
                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">Kekurangan (Perlu Perbaikan)</TableHead>
                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                    {searchQuery || tryoutFilter !== 'all' ? 'No matching feedback found' : 'No feedback available yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeedbacks.map((f) => (
                  <TableRow key={f.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors align-top">
                    <TableCell className="py-6 min-w-[200px]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center border border-gray-200">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{f.userName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{f.tryoutName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 min-w-[300px]">
                      <div className="p-3 bg-green-50/30 border border-green-100/50 rounded-lg">
                        <p className="text-xs text-gray-700 leading-relaxed italic">
                          {f.whatIsGood || <span className="text-gray-400">Tidak ada testimoni</span>}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 min-w-[300px]">
                      <div className="p-3 bg-orange-50/30 border border-orange-100/50 rounded-lg">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {f.whatIsMissing || <span className="text-gray-400">Tidak ada laporan kekurangan</span>}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{formatDate(f.createdAt)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
