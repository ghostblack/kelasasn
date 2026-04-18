import React from 'react';
import { Lock, ArrowRight, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface LockedFeatureOverlayProps {
  type?: 'formasi' | 'instansi' | 'detail' | 'ranking';
}

export const LockedFeatureOverlay: React.FC<LockedFeatureOverlayProps> = ({ type = 'detail' }) => {
  const navigate = useNavigate();

  const renderTeaserCards = () => {
    const mockData = type === 'instansi' ? [
      { id: '1', title: 'Kementerian Keuangan', subtitle: 'K/L Pusat / Seluruh Indonesia', label: 'Tukin Nasional Tertinggi', val1: '⭐ 4.9', val2: 'Cat. 1', color: 'text-amber-600 bg-amber-50' },
      { id: '2', title: 'Komisi Pemilihan Umum', subtitle: 'Lembaga Non-Struktural', label: 'Kerja Santai (Non-Pemilu)', val1: '⭐ 4.5', val2: 'Pusat', color: 'text-blue-600 bg-blue-50' },
    ] : type === 'ranking' ? [
      { id: '1', title: 'Leaderboard Nasional', subtitle: 'Kompetisi Peserta se-Indonesia', label: 'Real-time', val1: '👑 Top 10', val2: 'Live', color: 'text-yellow-600 bg-yellow-50' },
      { id: '2', title: 'Analisis Kompetitor', subtitle: 'Perbandingan Poin Langsung', label: 'Akurat', val1: '💯 Detail', val2: 'Pro', color: 'text-blue-600 bg-blue-50' },
    ] : [
      { id: '1', title: 'Analis Kebijakan Ahli Pertama', subtitle: 'Kementerian Sekretariat Negara', label: 'Peluang Emas', val1: '12', val2: '0', color: 'text-emerald-600 bg-emerald-50' },
      { id: '2', title: 'Auditor Ahli Pertama', subtitle: 'Kementerian Keuangan', label: 'Gaji 15JT+', val1: '45', val2: '22', color: 'text-amber-600 bg-amber-50' },
    ];

    return (
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mb-12 px-4 pointer-events-none select-none">
        {mockData.map((item, index) => (
          <Card
            key={item.id}
            className="bg-white rounded-[20px] border-0 shadow-[2px_4px_10.3px_#0000000d] animate-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <CardContent className="p-5 flex items-center gap-6">
              <div className="flex-1 space-y-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                   <h3 className="font-bold text-[#1f1f1f] text-sm lg:text-base leading-tight truncate">
                     {item.title}
                   </h3>
                   {type === 'instansi' && <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] h-4 font-black">PREVIEW</Badge>}
                </div>
                <p className="font-medium text-[#1f1f1fb2] text-[10px] lg:text-xs">
                  {item.subtitle}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                   {type === 'instansi' ? <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> : <MapPin className="h-3 w-3" />}
                   <span>{item.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-[#1f1f1f80] text-[9px] mb-0.5 uppercase font-bold">{type === 'instansi' ? 'Rating' : 'Kuota'}</p>
                  <p className="font-black text-[#1f1f1f] text-sm">{item.val1}</p>
                </div>
                <div className="text-right border-l border-gray-100 pl-4">
                  <p className="text-[#1f1f1f80] text-[9px] mb-0.5 uppercase font-bold">{type === 'instansi' ? 'Status' : 'Pelamar'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black ${item.color}`}>
                    {item.val2}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-[35] bg-gradient-to-b from-white/0 via-white/80 to-white flex flex-col items-center justify-end pb-20 sm:justify-center sm:pb-0 overflow-y-auto">
      {/* Dynamic Background Elements - Cleaned up */}

      {/* Content Container */}
      <div className="relative w-full flex flex-col items-center max-w-4xl mx-auto">
        {/* Teaser Header */}
        <div className="text-center space-y-3 mb-6 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
           <div className="inline-flex items-center justify-center pl-1 pr-4 py-1 bg-white rounded-full border border-emerald-100 shadow-sm mb-4">
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0 text-[10px] px-2 h-6 mr-3">DISKON 50%</Badge>
              <span className="text-[11px] font-bold text-gray-700">Akses Semua Fitur Premium (1 Tahun)</span>
           </div>
           <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase max-w-3xl mx-auto px-4">
             {type === 'instansi' ? (
               <>Cek <span className="text-blue-600">Rating & Tukin</span> <br className="hidden md:block"/> Instansi Favorit Kamu</>
             ) : type === 'ranking' ? (
               <>Akses <span className="text-yellow-500">Peringkat Nasional</span> <br className="hidden md:block"/> Rasakan Persaingan Asli</>
             ) : (
               <>Lihat <span className="text-blue-600">Peluang Kelulusan</span> <br className="hidden md:block"/> di Formasi Pilihan</>
             )}
           </h2>
           <p className="text-gray-500 font-medium text-sm md:text-base max-w-xl mx-auto leading-relaxed opacity-80 mt-2">
             {type === 'instansi' 
               ? 'Buka rincian tingkatan Tukin dan rating lingkungan kerja K/L & Lembaga untuk tentukan target pilihanmu.' 
               : type === 'ranking'
               ? 'Bandingkan nilai kamu dengan puluhan ribu peserta lain dari seluruh Indonesia dan evaluasi posisi peringkatmu sekarang juga.'
               : 'Dapatkan data eksklusif jumlah pelamar, rincian gaji, dan rasio persaingan realtime dari 14.000+ data SSCASN.'}
           </p>
        </div>

        {/* Teaser Cards */}
        {renderTeaserCards()}

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-6 px-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
           <div className="text-center space-y-5 max-w-md mx-auto">
             <Button
               onClick={() => navigate('/dashboard/tryouts?category=bundling')}
               className="group relative inline-flex items-center justify-center gap-3 pl-6 pr-2 py-2 h-auto bg-gray-900 hover:bg-black rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 border-0 focus:ring-0"
             >
               <span className="font-black text-white text-[11px] sm:text-xs tracking-widest uppercase flex items-center gap-2">
                 Daftar VIP Bundling
                 <div className="flex items-center gap-1.5 ml-1 bg-white/20 px-2 py-1 rounded-md text-[9px] sm:text-[10px] tracking-wider">
                   <span className="line-through opacity-50 text-white font-medium">Rp60K</span>
                   <span className="text-emerald-400 font-black">Rp30K</span>
                 </div>
               </span>
               <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                  <ArrowRight className="w-6 h-6 text-white group-hover:-rotate-45 transition-transform" />
               </div>
             </Button>
             
             <div className="flex flex-col items-center gap-2 bg-emerald-50/50 backdrop-blur-sm border border-emerald-100/50 p-4 rounded-3xl mx-auto">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-relaxed text-center">
                   ✅ Sudah Termasuk Semua Try Out, Instansi & Formasi<br/>
                   ✅ Masa Berlaku Sangat Panjang (1 Tahun Penuh)
                </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
