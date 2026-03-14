import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingScreen } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Building2, Users, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllJabatan, searchJabatan } from '@/services/jabatanService';
import { Jabatan } from '@/types';

export const JabatanPage = () => {
  const navigate = useNavigate();
  const [jabatan, setJabatan] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadJabatan();
  }, []);

  const loadJabatan = async () => {
    try {
      const data = await getAllJabatan(100);
      setJabatan(data);
    } catch (error) {
      console.error('Error loading jabatan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const kategori = selectedKategori === 'all' ? undefined : selectedKategori;
      const data = await searchJabatan(searchTerm, kategori);
      setJabatan(data);
    } catch (error) {
      console.error('Error searching jabatan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedKategori]);

  const getKategoriBadgeColor = (kategori: string) => {
    const colors = {
      Teknis: 'bg-blue-50 text-blue-700 border-blue-200',
      Kesehatan: 'bg-green-50 text-green-700 border-green-200',
      Pendidikan: 'bg-orange-50 text-orange-700 border-orange-200',
      Umum: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return colors[kategori as keyof typeof colors] || colors.Umum;
  };

  if (loading) {
    return <LoadingScreen message="Memuat data jabatan..." type="spinner" fullScreen overlay />;
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const categories = [
    { value: 'all', label: 'Semua' },
    { value: 'Teknis', label: 'Teknis' },
    { value: 'Kesehatan', label: 'Kesehatan' },
    { value: 'Pendidikan', label: 'Pendidikan' },
    { value: 'Umum', label: 'Umum' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Daftar Jabatan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Temukan informasi jabatan dan formasi CPNS 2024
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari jabatan, instansi, atau kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 bg-white border-gray-200/60 focus:border-gray-300 rounded-xl text-sm"
          />
        </div>
        <Select value={selectedKategori} onValueChange={setSelectedKategori}>
          <SelectTrigger className="w-full md:w-[200px] h-11 bg-white border-gray-200/60 focus:border-gray-300 rounded-xl">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {jabatan.length === 0 ? (
        <div className="bg-white border border-gray-200/60 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tidak Ada Jabatan
          </h3>
          <p className="text-sm text-gray-500">
            Tidak ditemukan jabatan sesuai pencarian Anda
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {jabatan.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200/60 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-300"
                >
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {item.namaJabatan}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`${getKategoriBadgeColor(item.kategori)} text-xs`}
                            >
                              {item.kategori}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-2 truncate">{item.instansi}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {item.formasi} formasi
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              PG: {item.passingGrade}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(item.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Kode Jabatan
                        </h4>
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-200">
                          {item.kodeJabatan}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Kualifikasi
                        </h4>
                        <ul className="space-y-1.5">
                          {item.kualifikasi.map((kual, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-600 font-bold mt-0.5">•</span>
                              <span>{kual}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {item.relatedTryouts.length > 0 && (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/dashboard/tryouts')}
                            className="border-gray-200/60 hover:bg-gray-50 text-sm h-9"
                          >
                            Lihat Try Out Terkait
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm text-gray-500 text-center">
            Menampilkan {jabatan.length} jabatan
          </p>
        </>
      )}
    </div>
  );
};
