import { useNavigate } from "react-router-dom";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";
import { Lock, MapPin, ArrowRight } from "lucide-react";

const mockFormasi = [
  {
    id: "1",
    jabatan: "Analis Kebijakan Ahli Pertama",
    instansi: "Kementerian Keuangan",
    lokasi: "Pusat / Seluruh Indonesia",
    kuota: 125,
    pelamar: 450,
    ratio: 4,
    gajiMax: 15.5,
    ratioColor: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "2",
    jabatan: "Auditor Ahli Pertama",
    instansi: "Badan Pemeriksa Keuangan",
    lokasi: "Kantor Perwakilan Prov. Jawa Barat",
    kuota: 45,
    pelamar: 950,
    ratio: 22,
    gajiMax: 12.0,
    ratioColor: "text-rose-600 bg-rose-50",
  },
  {
    id: "3",
    jabatan: "Penyuluh Kesehatan Masyarakat Ahli Pertama",
    instansi: "Kementerian Kesehatan",
    lokasi: "Direktorat Jenderal Kesehatan Masyarakat",
    kuota: 85,
    pelamar: 255,
    ratio: 3,
    gajiMax: 9.5,
    ratioColor: "text-emerald-600 bg-emerald-50",
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
      aria-label="Preview Fitur Formasi CPNS 2026"
    >
      <div className="w-full max-w-[1392px] flex flex-col items-center gap-2.5 px-6 sm:px-8 lg:px-32 py-12 lg:py-20 bg-gray-50 rounded-[24px] lg:rounded-[48px] overflow-hidden">
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
                    Data Formasi
                  </span>
                </Badge>
                <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                  Eksklusif untuk Member Kelas ASN
                </p>
              </div>
            </div>

            <h2 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-3xl lg:text-5xl tracking-[-0.48px] leading-tight lg:leading-[64px] text-center max-w-3xl">
              Intip Peluang Formasi CPNS 2026 Sebelum Mendaftar
            </h2>

            <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-lg lg:text-xl text-center tracking-[-0.24px] leading-7 max-w-2xl">
              Data jumlah pelamar, rasio persaingan, dan prediksi gaji dari 14.000+ formasi SSCASN — hanya di Kelas ASN.
            </p>
          </div>

          {/* Preview Cards */}
          <div
            ref={cardsRef}
            className="relative w-full"
          >
            <div className="flex flex-col gap-4 w-full">
              {mockFormasi.map((item, index) => (
                <Card
                  key={item.id}
                  className={`bg-white rounded-[20px] border-0 shadow-[2px_4px_10.3px_#0000000d] transition-all duration-700 ${
                    cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: cardsVisible ? `${index * 120}ms` : "0ms" }}
                >
                  <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    {/* Left: Jabatan Info */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <h3 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-base lg:text-lg leading-snug">
                        {item.jabatan}
                      </h3>
                      <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-sm">
                        {item.instansi}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-[#1f1f1f80]">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate [font-family:'PP_Neue_Montreal-Book',Helvetica]">
                          {item.lokasi}
                        </span>
                      </div>
                    </div>

                    {/* Right: Stats */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-6 sm:flex sm:items-center">
                      <div className="text-center sm:text-left sm:min-w-[64px]">
                        <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f80] text-xs mb-1">Kuota</p>
                        <p className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-xl">{item.kuota}</p>
                      </div>
                      <div className="text-center sm:text-left sm:min-w-[64px] sm:border-l sm:border-gray-100 sm:pl-6">
                        <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f80] text-xs mb-1">Pelamar</p>
                        <p className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#2c29e2] text-xl">{item.pelamar.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="text-center sm:text-left sm:min-w-[80px] sm:border-l sm:border-gray-100 sm:pl-6">
                        <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f80] text-xs mb-1">Rasio</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.ratioColor}`}>
                          1 : {item.ratio}
                        </span>
                      </div>
                      <div className="hidden lg:block sm:min-w-[90px] sm:border-l sm:border-gray-100 sm:pl-6 text-right">
                        <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f80] text-xs mb-1">Gaji Max</p>
                        <p className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-base">
                          {item.gajiMax} JT
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Gradient + Lock overlay */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-[220px] bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent flex flex-col items-center justify-end pb-0 px-4 z-10 transition-all duration-700 ${
                cardsVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: cardsVisible ? "400ms" : "0ms" }}
            >
              {/* Fake blurred card below */}
              <div className="w-full mb-4 px-0 pointer-events-none select-none blur-[3px] opacity-30">
                <Card className="bg-white rounded-[20px] border-0">
                  <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
                      <div className="h-3 bg-gray-100 rounded-full w-1/3"></div>
                    </div>
                    <div className="flex gap-6">
                      <div className="h-8 bg-gray-100 rounded w-12"></div>
                      <div className="h-8 bg-gray-100 rounded w-12"></div>
                      <div className="h-8 bg-gray-100 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Lock CTA */}
          <div
            className={`flex flex-col items-center gap-5 transition-all duration-700 ${
              cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: cardsVisible ? "500ms" : "0ms" }}
          >
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[2px_4px_24px_#0000001a] border border-gray-100">
              <Lock className="w-6 h-6 text-[#1f1f1f]" />
            </div>
            <div className="text-center space-y-2">
              <p className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-lg">
                Ada 14.500+ Formasi Lainnya
              </p>
              <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#1f1f1fb2] text-base max-w-sm">
                Daftar sekarang untuk melihat semua data formasi, cek rasio persaingan, dan temukan peluang terbaik untuk kamu.
              </p>
            </div>

            <Button
              onClick={() => navigate("/login")}
              className="group inline-flex items-center justify-center gap-4 pl-6 pr-1 py-1 h-auto bg-[#050505] hover:bg-[#050505]/90 rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
            >
              <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-lg tracking-[0] leading-6 whitespace-nowrap">
                Lihat Semua Formasi CPNS 2026
              </span>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center ml-1 flex-shrink-0 group-hover:scale-110 transition-transform">
                <ArrowRight className="w-5 h-5 text-[#1f1f1f] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
