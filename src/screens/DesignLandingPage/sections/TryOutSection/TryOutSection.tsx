import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";
import { CheckCircle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Feature {
  text: string;
  locked: boolean;
}

interface DummyTryout {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  totalQuestions: string | number;
  type: string;
  badgeColor: string;
  buttonColor: string;
  isPopular: boolean;
  features: Feature[];
}

export const TryOutSection = (): JSX.Element => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.2);
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();

  const dummyTryouts: DummyTryout[] = [
    {
      id: "1",
      name: "Try Out Starter",
      description: "Coba simulasi sistem CAT gratis untuk menguji kesiapan dasar Anda. Cocok untuk pemula.",
      price: 0,
      totalQuestions: 110,
      type: "Gratis",
      badgeColor: "bg-[#f1daf0] text-[#ef579b]",
      buttonColor: "bg-black hover:bg-black/90",
      isPopular: false,
      features: [
        { text: "Simulasi CAT Resmi BKN", locked: false },
        { text: "Ranking Biasa", locked: false },
        { text: "Pembahasan Detail & Lengkap", locked: true },
        { text: "Analisis Skor & Evaluasi", locked: true },
        { text: "Akses Berulang", locked: true },
      ]
    },
    {
      id: "2",
      name: "VIP Bundling",
      description: "Akses semua fitur, semua soal, data formasi, dan pembahasan eksklusif. Investasi terbaik lulus CPNS!",
      price: 30000,
      originalPrice: 60000,
      totalQuestions: "Semua",
      type: "Super Hemat 🔥",
      badgeColor: "bg-emerald-100 text-emerald-700",
      buttonColor: "bg-black hover:bg-black/90",
      isPopular: true,
      features: [
        { text: "Akses Data Formasi & Instansi", locked: false },
        { text: "Akses SEMUA paket Try Out", locked: false },
        { text: "Pembahasan Text Komprehensif", locked: false },
        { text: "Ranking Nasional Real-time", locked: false },
        { text: "Analisis Kelemahan Materi", locked: false },
      ]
    },
    {
      id: "3",
      name: "Premium Satuan",
      description: "Beli eceran untuk 1x Try Out Premium spesifik. Tetap mendapatkan soal HOTS terupdate.",
      price: 15000,
      originalPrice: 25000,
      totalQuestions: 110,
      type: "Satuan",
      badgeColor: "bg-[#8583f1] text-white",
      buttonColor: "bg-black hover:bg-black/90",
      isPopular: false,
      features: [
        { text: "1x Akses Try Out Premium", locked: false },
        { text: "Soal Terupdate Berbasis HOTS", locked: false },
        { text: "Ranking Nasional", locked: false },
        { text: "Pembahasan Text Terbatas", locked: false },
        { text: "Analisis Kelemahan", locked: true },
      ]
    }
  ];

  const formatPrice = (price: number): string => {
    if (price === 0) return "Gratis";
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const handleTryoutClick = (tryoutId: string) => {
    navigate(`/login`);
  };

  return (
    <section id="paket-tryout" className="w-full flex justify-center py-16 lg:py-28 px-4 sm:px-6">
      <div className="w-full max-w-[1392px] flex flex-col items-start gap-2.5 px-6 sm:px-8 lg:px-32 py-12 lg:py-20 bg-gray-50 rounded-[24px] lg:rounded-[48px] overflow-visible">
        <div className="flex flex-col items-center gap-[68px] w-full">
          <div className="flex flex-col items-center gap-[68px] w-full">
            <div ref={headerRef} className={`inline-flex flex-col gap-6 items-center transition-all duration-800 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center justify-center pl-1 pr-5 py-1 bg-white rounded-[100px] border border-solid border-[#f4f4f4] shadow-[0px_8px_48px_#0000000a]">
                <div className="inline-flex items-center gap-2">
                  <Badge className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#19b269] rounded-[100px] hover:bg-[#19b269]">
                    <span className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-white text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                      Paket Harga
                    </span>
                  </Badge>

                  <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                     Promo Spesial Hari Ini
                  </p>
                </div>
              </div>

              <h2 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-3xl lg:text-5xl tracking-[-0.48px] leading-tight lg:leading-[64px] text-center">
                Investasi Terbaik Untuk Masa Depan
              </h2>

              <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-lg lg:text-2xl text-center tracking-[-0.24px] leading-7 max-w-2xl">
                Pilih paket cerdas sesuai dengan kebutuhan dan target sukses Anda. Mulai dari yang gratis hingga garansi fitur terlengkap.
              </p>
            </div>

            <div ref={cardsRef} className="flex gap-6 lg:gap-12 w-full items-stretch flex-col lg:flex-row">
              {dummyTryouts.map((tryout, index) => {
                return (
                  <Card
                    key={tryout.id}
                    className={`group relative flex-1 min-w-0 w-full h-auto bg-white rounded-[32px] overflow-visible shadow-[2px_4px_10.3px_#0000001a] ${tryout.isPopular ? 'border-2 border-[#8583f1] ring-4 ring-[#8583f1]/20' : 'border-0'} transition-all duration-800 hover:scale-105 hover:shadow-xl ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: cardsVisible ? `${index * 150}ms` : '0ms' }}
                  >
                    {tryout.isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-gradient-to-r from-[#8583f1] to-[#2c29e2] text-white px-6 py-2 rounded-full shadow-lg">
                          <span className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-sm whitespace-nowrap">
                            ⭐ Paling Populer
                          </span>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-gray-900 text-xl leading-tight">
                              {tryout.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`flex-shrink-0 ${tryout.badgeColor} rounded-full px-3 py-1.5 border-0 hover:${tryout.badgeColor}`}
                            >
                              <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-xs">
                                {tryout.type}
                              </span>
                            </Badge>
                            <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                              <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-xs">{tryout.totalQuestions} Soal</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-sm text-gray-600 leading-relaxed min-h-[40px]">
                        {tryout.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                           {tryout.originalPrice && (
                             <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] text-sm text-gray-400 line-through mr-1">
                               {formatPrice(tryout.originalPrice)}
                             </span>
                           )}
                          <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-2xl text-gray-900">
                            {formatPrice(tryout.price)}
                          </span>
                        </div>
                        <span className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-sm text-gray-500">
                          {tryout.totalQuestions} soal
                        </span>
                      </div>

                      <div className="space-y-2 py-2 border-t border-gray-100/50 pt-4">
                        {tryout.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            {feature.locked ? (
                               <Lock className="h-4.5 w-4.5 text-gray-300 mt-0.5 flex-shrink-0" />
                            ) : (
                               <CheckCircle className={`h-4.5 w-4.5 mt-0.5 flex-shrink-0 ${tryout.isPopular ? 'text-[#8583f1]' : 'text-green-600'}`} />
                            )}
                            <p className={`[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-sm leading-6 ${feature.locked ? 'text-gray-400' : 'text-black'}`}>
                              {feature.text}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={() => handleTryoutClick(tryout.id)}
                          className={`w-full h-auto ${tryout.buttonColor} text-white rounded-[32px] px-4 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95`}
                        >
                          <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-base lg:text-lg tracking-[0] leading-6 lg:leading-8">
                            {tryout.isPopular ? 'Ambil Promo Sekarang' : 'Pilih Paket Ini'}
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
