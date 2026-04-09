import { useNavigate } from "react-router-dom";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";
import { Lock, MapPin, Building2, TrendingUp } from "lucide-react";

const mockFormasi = [
  {
    id: "1",
    jabatan: "Analis Kebijakan Ahli Pertama",
    instansi: "Kementerian Keuangan",
    lokasi: "Pusat",
    kuota: 125,
    pelamar: 450,
    ratio: 4,
    ratioColor: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "2",
    jabatan: "Auditor Ahli Pertama",
    instansi: "Badan Pemeriksa Keuangan",
    lokasi: "Prov. Jawa Barat",
    kuota: 45,
    pelamar: 950,
    ratio: 22,
    ratioColor: "text-rose-600 bg-rose-50",
  },
  {
    id: "3",
    jabatan: "Penyuluh Kesehatan Masyarakat",
    instansi: "Kementerian Kesehatan",
    lokasi: "Pusat",
    kuota: 85,
    pelamar: 255,
    ratio: 3,
    ratioColor: "text-emerald-600 bg-emerald-50",
  },
];

const mockInstansi = [
  {
    id: "1",
    nama: "Kementerian Keuangan",
    jenis: "Kementerian",
    tukinMin: 10.3,
    tukinMax: 46.9,
    tierEmoji: "👑",
    tierBadge: "bg-amber-50 text-amber-700 border-amber-300",
    tierLabel: "Kesultanan",
  },
  {
    id: "2",
    nama: "Pemerintah Provinsi DKI Jakarta",
    jenis: "Pemerintah Daerah",
    tukinMin: 8.5,
    tukinMax: 35.0,
    tierEmoji: "💎",
    tierBadge: "bg-purple-50 text-purple-700 border-purple-300",
    tierLabel: "Adipati",
  },
  {
    id: "3",
    nama: "Kementerian Hukum & HAM",
    jenis: "Kementerian",
    tukinMin: 3.1,
    tukinMax: 33.2,
    tierEmoji: "⚜️",
    tierBadge: "bg-blue-50 text-blue-700 border-blue-300",
    tierLabel: "Bangsawan",
  },
];

export const FormasiPreviewSection = (): JSX.Element => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.2);
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation(0.15);
  const navigate = useNavigate();

  return (
    <section
      id="formasi-preview"
      className="w-full flex justify-center py-16 lg:py-28 px-4 sm:px-6"
      aria-label="Preview Fitur Formasi & Instansi CPNS 2026"
    >
      <div className="w-full max-w-[1392px] flex flex-col items-center gap-2.5 px-6 sm:px-8 lg:px-16 py-12 lg:py-20 bg-gray-50 rounded-[24px] lg:rounded-[48px] overflow-hidden relative">
        <div className="flex flex-col items-center gap-12 lg:gap-16 w-full">

          {/* Header */}
          <div
            ref={headerRef}
            className={`inline-flex flex-col gap-6 items-center transition-all duration-800 ${
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center justify-center pl-1 pr-5 py-1 bg-white rounded-[100px] border border-solid border-[#f4f4f4] shadow-[0px_8px_48px_#0000000a]">
              <div className="inline-flex items-center gap-2">
                <Badge className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#19b269] rounded-[100px] hover:bg-[#19b269]">
                  <span className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-white text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                    Preview Fitur
                  </span>
                </Badge>
                <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                  Eksklusif untuk Member Kelas ASN
                </p>
              </div>
            </div>

            <h2 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-3xl lg:text-5xl tracking-[-0.48px] leading-tight lg:leading-[64px] text-center max-w-3xl">
              Intip Peluang & Analisis Instansi Sebelum Mendaftar
            </h2>

            <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-lg lg:text-xl text-center tracking-[-0.24px] leading-7 max-w-2xl">
              Akses data formasi lengkap dengan rasio persaingan, serta intip gaji dan tier tunjangan kinerja (tukin) dari seluruh instansi di Indonesia.
            </p>
          </div>

          {/* Bento Box Layout */}
          <div
            ref={cardsRef}
            className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 relative pb-20"
          >
            {/* Left Box: Formasi */}
            <div className={`bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-sm flex flex-col relative transition-all duration-700 ${
                cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}>
              <div className="mb-6">
                <h3 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-xl lg:text-2xl flex items-center gap-2">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><MapPin className="w-5 h-5"/></span>
                  Eksplorasi Formasi
                </h3>
              </div>
              <div className="flex flex-col gap-4 flex-1">
                {mockFormasi.map((item) => (
                  <Card key={item.id} className="bg-gray-50/50 rounded-[20px] border border-gray-100 shadow-none">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 min-w-0">
                        <h4 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-sm leading-tight truncate">
                          {item.jabatan}
                        </h4>
                        <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] text-xs text-gray-500 mt-1 truncate">
                          {item.instansi} • {item.lokasi}
                        </p>
                      </div>
                      <div className="flex gap-4 sm:border-l sm:border-gray-200 sm:pl-4">
                        <div className="text-center">
                          <p className="text-[10px] font-medium text-gray-400">Kuota</p>
                          <p className="font-bold text-gray-800 text-sm">{item.kuota}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-medium text-gray-400">Rasio</p>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.ratioColor}`}>
                            1 : {item.ratio}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Box: Instansi */}
            <div className={`bg-white rounded-[32px] p-6 lg:p-8 border border-gray-100 shadow-sm flex flex-col relative transition-all duration-700 ${
                cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`} style={{ transitionDelay: "150ms" }}>
              <div className="mb-6">
                <h3 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-xl lg:text-2xl flex items-center gap-2">
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Building2 className="w-5 h-5"/></span>
                  Analisis Gaji & Tukin
                </h3>
              </div>
              <div className="flex flex-col gap-4 flex-1">
                {mockInstansi.map((item) => (
                  <Card key={item.id} className="bg-gray-50/50 rounded-[20px] border border-gray-100 shadow-none">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                           <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${item.tierBadge}`}>
                              {item.tierEmoji} {item.tierLabel}
                           </span>
                        </div>
                        <h4 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-sm leading-tight truncate">
                          {item.nama}
                        </h4>
                        <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] text-xs text-gray-500 mt-1 truncate">
                          {item.jenis}
                        </p>
                      </div>
                      <div className="flex gap-4 sm:border-l sm:border-gray-200 sm:pl-4 items-center">
                         <div className="text-right">
                           <p className="text-[10px] font-medium text-gray-400 flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3"/> Gaji + Tukin</p>
                           <p className="font-bold text-[#1f1f1f] text-sm mt-0.5">
                              {item.tukinMin} - {item.tukinMax} jt
                           </p>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Gradient Overlay bottom to cover both bento boxes */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-[280px] bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent flex flex-col items-center justify-end pb-0 px-4 z-10 transition-all duration-700 pointer-events-none ${
                cardsVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
            </div>
          </div>

          {/* Unified Lock CTA */}
          <div
            className={`relative z-20 -mt-32 md:-mt-40 flex flex-col items-center gap-5 transition-all duration-700 ${
              cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[2px_4px_24px_#0000001a] border border-gray-100">
              <Lock className="w-6 h-6 text-[#1f1f1f]" />
            </div>
            <div className="text-center space-y-2">
              <p className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-lg lg:text-xl">
                Buka Kunci Untuk Mengakses Semua Data
              </p>
              <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#1f1f1fb2] text-base max-w-lg mx-auto">
                Daftar sekarang untuk melihat semua formasi, cek histori persaingan kuota, dan bedah tuntas level komponen gaji impianmu di tiap instansi.
              </p>
            </div>

            <Button
              onClick={() => navigate("/login")}
              className="group mt-2 inline-flex items-center justify-center gap-3 pl-5 pr-1 py-1 h-auto bg-[#050505] hover:bg-[#050505]/90 rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-base lg:text-lg tracking-[0] leading-6 whitespace-nowrap">
                Eksplorasi Data Lengkap
              </span>
              <img
                className="w-12 h-12 transition-transform duration-300 group-hover:-rotate-45"
                alt="Lihat formasi"
                src="/sign-up-icon-container.svg"
              />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
