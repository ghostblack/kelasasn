import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DummyTryout {
  id: string;
  name: string;
  description: string;
  price: number;
  totalQuestions: number;
  requirement?: string;
  illustration: string;
}

export const TryOutSection = (): JSX.Element => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.2);
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation(0.2);
  const navigate = useNavigate();

  const dummyTryouts: DummyTryout[] = [
    {
      id: "1",
      name: "Try Out Gratis",
      description: "Paket try out gratis untuk mengenal sistem dan format soal CPNS. Cocok untuk pemula yang ingin memulai persiapan.",
      price: 0,
      totalQuestions: 110,
      requirement: "Follow Instagram @kelasasn",
      illustration: "https://illustrations.popsy.co/pink/reading-list.svg"
    },
    {
      id: "2",
      name: "Try Out Premium",
      description: "Soal berkualitas tinggi dengan pembahasan lengkap dari tim expert. Akses ranking nasional dan analisis mendalam.",
      price: 10000,
      totalQuestions: 110,
      illustration: "https://illustrations.popsy.co/blue/target.svg"
    },
    {
      id: "3",
      name: "Paket 3 Try Out",
      description: "Hemat! 3 paket premium dengan soal eksklusif, pembahasan video, dan fitur ranking khusus untuk persiapan maksimal.",
      price: 25000,
      totalQuestions: 330,
      illustration: "https://illustrations.popsy.co/green/trophy.svg"
    }
  ];

  const formatPrice = (price: number): string => {
    if (price === 0) return "Gratis";
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const getCardConfig = (tryout: DummyTryout) => {
    if (tryout.price === 0) {
      return {
        badgeColor: "bg-[#f1daf0] text-[#ef579b]",
        buttonColor: "bg-black hover:bg-black/90",
        buttonText: "Mulai Sekarang",
        type: "Gratis",
        isPopular: false
      };
    }
    if (tryout.price === 25000) {
      return {
        badgeColor: "bg-emerald-100 text-emerald-700",
        buttonColor: "bg-black hover:bg-black/90",
        buttonText: "Mulai Sekarang",
        type: "Hemat 🔥",
        isPopular: false
      };
    }
    return {
      badgeColor: "bg-[#8583f1] text-white",
      buttonColor: "bg-black hover:bg-black/90",
      buttonText: "Mulai Sekarang",
      type: "Premium",
      isPopular: true
    };
  };

  const getFeatures = (tryout: DummyTryout): string[] => {
    if (tryout.price === 0) {
      return [
        "Soal standar sesuai format resmi",
        "Pembahasan dasar setiap soal",
        "Ranking umum peserta",
        `Syarat: ${tryout.requirement}`
      ];
    }
    if (tryout.price === 25000) {
      return [
        "Soal eksklusif dibuat tim expert",
        "Pembahasan video lengkap",
        "Ranking khusus dengan analisis detail",
        "Akses grup diskusi premium"
      ];
    }
    return [
      "Soal berkualitas tinggi terkurasi",
      "Pembahasan lengkap & mendalam",
      "Ranking nasional real-time",
      "Tips & trik dari mentor"
    ];
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
                      Paket Try Out
                    </span>
                  </Badge>

                  <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                    Murah Tapi Tidak Murahan
                  </p>
                </div>
              </div>

              <h2 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-3xl lg:text-5xl tracking-[-0.48px] leading-tight lg:leading-[64px] text-center">
                Pilih Try Out Yang Tersedia
              </h2>

              <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-lg lg:text-2xl text-center tracking-[-0.24px] leading-7">
                Pilih Try Out Sesuai Kebutuhanmu
              </p>
            </div>

            <div ref={cardsRef} className="flex gap-6 lg:gap-12 w-full items-stretch flex-col lg:flex-row">
              {dummyTryouts.map((tryout, index) => {
                const config = getCardConfig(tryout);
                const features = getFeatures(tryout);

                return (
                  <Card
                    key={tryout.id}
                    className={`group relative flex-1 min-w-0 w-full h-auto bg-white rounded-[32px] overflow-visible shadow-[2px_4px_10.3px_#0000001a] ${config.isPopular ? 'border-2 border-[#8583f1] ring-4 ring-[#8583f1]/20' : 'border-0'} transition-all duration-800 hover:scale-105 hover:shadow-xl ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: cardsVisible ? `${index * 150}ms` : '0ms' }}
                  >
                    {config.isPopular && (
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
                              className={`flex-shrink-0 ${config.badgeColor} rounded-full px-3 py-1.5 hover:${config.badgeColor}`}
                            >
                              <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-xs">
                                {config.type}
                              </span>
                            </Badge>
                            <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                              <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-xs">{tryout.totalQuestions} Soal</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-sm text-gray-600 leading-relaxed">
                        {tryout.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-2xl text-gray-900">
                            {formatPrice(tryout.price)}
                          </span>
                        </div>
                        <span className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-sm text-gray-500">
                          {tryout.totalQuestions} soal
                        </span>
                      </div>

                      <div className="space-y-2 py-2">
                        {features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-black text-sm leading-6">
                              {feature}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => handleTryoutClick(tryout.id)}
                        className={`w-full h-auto ${config.buttonColor} text-white rounded-[32px] px-4 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95`}
                      >
                        <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-base lg:text-lg tracking-[0] leading-6 lg:leading-8">
                          {config.buttonText}
                        </span>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={() => navigate('/login')}
              className={`group inline-flex items-center justify-center gap-4 pl-6 pr-1 py-1 h-auto bg-[#050505] hover:bg-[#050505]/90 rounded-[32px] overflow-hidden transition-all duration-600 delay-500 hover:scale-105 hover:shadow-lg active:scale-95 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-lg tracking-[0] leading-6 whitespace-nowrap">
                Lihat Paket Try Out Lain
              </span>
              <img
                className="w-12 h-12 transition-transform duration-300 group-hover:-rotate-45"
                alt="Sign up icon"
                src="/sign-up-icon-container.svg"
              />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
