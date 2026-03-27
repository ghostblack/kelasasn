import { useNavigate } from "react-router-dom";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";
import { Lock, MapPin, Search, ArrowRight, ShieldCheck } from "lucide-react";

const mockFormasi = [
  {
    id: "1",
    jabatan: "ANALIS KEBIJAKAN AHLI PERTAMA",
    instansi: "KEMENTERIAN KEUANGAN",
    lokasi: "PUSAT / SELURUH INDONESIA",
    kuota: 125,
    pelamar: 450,
    ratio: 4,
    gajiMax: 15.5
  },
  {
    id: "2",
    jabatan: "AUDITOR AHLI PERTAMA",
    instansi: "BADAN PEMERIKSA KEUANGAN",
    lokasi: "KANTOR PERWAKILAN PROVINSI JAWA BARAT",
    kuota: 45,
    pelamar: 950,
    ratio: 22,
    gajiMax: 12.0
  },
  {
    id: "3",
    jabatan: "PENYULUH KESEHATAN MASYARAKAT AHLI PERTAMA",
    instansi: "KEMENTERIAN KESEHATAN",
    lokasi: "DIREKTORAT JENDERAL KESEHATAN MASYARAKAT",
    kuota: 85,
    pelamar: 255,
    ratio: 3,
    gajiMax: 9.5
  }
];

export const FormasiPreviewSection = (): JSX.Element => {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();

  return (
    <section 
      ref={sectionRef} 
      id="formasi-preview" 
      className={`w-full flex justify-center py-16 lg:py-24 bg-gray-50 transition-all duration-800 ${
        sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      <div className="w-full max-w-[1000px] px-4 lg:px-8">
        <div className="flex flex-col items-center mb-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            <ShieldCheck className="w-4 h-4" />
            Fitur Eksklusif KelasASN
          </div>
          <h2 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-[28px] sm:text-[36px] lg:text-[48px] tracking-[-1.44px] leading-tight">
            Intip Peluang Formasi CPNS 2026
          </h2>
          <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#1f1f1fb2] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Satu-satunya platform yang menyajikan data rincian formasi, jumlah pelamar realtime, hingga bocoran gaji maksimal untuk bantu kamu menyusun strategi jitu.
          </p>
        </div>

        <div className="relative w-full rounded-[30px] overflow-hidden bg-white border border-gray-200 shadow-xl shadow-gray-200/50">
          
          {/* Mock Header Search/Filter */}
          <div className="flex flex-col md:flex-row border-b border-gray-100 bg-white">
             <div className="relative flex-1 opacity-70 pointer-events-none">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
               <input 
                 disabled
                 placeholder="CARI JABATAN ATAU INSTANSI IMPIANMU..." 
                 className="w-full pl-14 h-16 bg-white outline-none text-gray-900 font-mono text-[10px] sm:text-xs uppercase placeholder:text-gray-300"
               />
             </div>
             <div className="hidden md:flex items-center justify-center px-8 bg-gray-50 border-l border-gray-100 opacity-70">
               <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500">
                 Filter Tersedia
               </span>
             </div>
          </div>

          {/* Cards List - Desktop Table feeling, Mobile Cards */}
          <div className="relative">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-0 sm:divide-y sm:divide-gray-100">
              {mockFormasi.map((item) => (
                <div key={item.id} className="relative group bg-white border border-gray-100 sm:border-0 rounded-2xl sm:rounded-none p-4 sm:p-5 sm:flex sm:items-center sm:gap-6 hover:bg-blue-50/50 transition-colors">
                  <div className="flex-1 space-y-2">
                    <h4 className="text-xs sm:text-[13px] font-black text-blue-600 uppercase leading-snug">
                      {item.jabatan}
                    </h4>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-tight">
                      {item.instansi}
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase mt-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.lokasi}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 mt-4 border-t border-gray-50 sm:border-0 sm:pt-0 sm:mt-0 sm:flex sm:items-center">
                    <div className="text-center sm:text-left">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Kuota</p>
                      <p className="text-xs sm:text-sm font-black text-gray-900">{item.kuota}</p>
                    </div>
                    <div className="text-center sm:text-left sm:pl-6 sm:border-l sm:border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Pelamar</p>
                      <p className="text-xs sm:text-sm font-black text-blue-600">{item.pelamar}</p>
                    </div>
                    <div className="text-center sm:text-left sm:pl-6 sm:border-l sm:border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Rasio</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        item.ratio > 20 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        1:{item.ratio}
                      </span>
                    </div>
                  </div>
                  
                  <div className="hidden lg:block pl-6 border-l border-gray-100 min-w-[120px] text-right">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Gaji Max</p>
                    <p className="text-sm font-black text-gray-800 uppercase tabular-nums">{item.gajiMax} JT</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Gradient Overlay for the "Locked" effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-white via-white/90 to-transparent flex flex-col items-center justify-end pb-8 px-4 z-10 pointer-events-none">
              <div className="pointer-events-auto flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center shadow-xl shadow-gray-900/20 mb-2">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="text-center space-y-2 mb-2">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Terkunci</h3>
                  <p className="text-xs font-bold text-gray-500 max-w-[280px]">
                    Ada 14.500+ formasi lainnya. Login sekarang untuk melihat semuanya dan mulai tentukan targetmu!
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-600/30 active:scale-95"
                >
                  Buka Akses Formasi Lengkap
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
            
            {/* Fake bottom items to make the gradient look natural over content */}
            <div className="p-4 sm:p-6 opacity-30 pointer-events-none select-none filter blur-[2px]">
              <div className="sm:flex sm:items-center sm:gap-6 p-4 sm:p-5">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
                <div className="flex gap-8 pt-4 sm:pt-0">
                  <div className="h-8 bg-gray-100 rounded w-12"></div>
                  <div className="h-8 bg-gray-100 rounded w-12"></div>
                  <div className="h-8 bg-gray-100 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
