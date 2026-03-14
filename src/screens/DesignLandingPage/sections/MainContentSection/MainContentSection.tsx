import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";

const features = [
  {
    title: "Simulasi CAT Realistis",
    description:
      "Sistem ujian yang sepenuhnya identik dengan CAT BKN resmi. Rasakan pengalaman ujian yang autentik untuk meningkatkan kesiapan dan mengurangi kecemasan saat ujian sesungguhnya.",
  },
  {
    title: "Pembahasan Soal Komprehensif",
    description:
      "Setiap soal dilengkapi pembahasan mendalam dengan penjelasan step-by-step. Pahami konsep dan strategi untuk meningkatkan pemahaman materi ujian secara signifikan.",
  },
  {
    title: "Ranking Nasional Real-Time",
    description:
      "Pantau posisi Anda dibanding dengan ribuan peserta lain di seluruh Indonesia. Motivasi diri dengan melihat progres dan kompetisi yang sehat.",
  },
  {
    title: "Komunitas Peserta Aktif",
    description:
      "Terhubung dengan ribuan peserta CPNS 2026 lainnya. Diskusi, berbagi tips, dan belajar bersama dalam komunitas yang suportif dan berdedikasi.",
  },
];

export const MainContentSection = (): JSX.Element => {
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation(0.2);
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation(0.2);

  return (
    <section id="fitur-unggulan" className="w-full flex justify-center py-16 lg:py-28">
      <div className="w-full max-w-[1440px] px-4 lg:px-8">
        <div className="flex w-full items-start lg:items-center gap-8 lg:gap-16 flex-col lg:flex-row">

        <div ref={contentRef} className={`flex flex-col w-full lg:flex-1 items-start gap-8 lg:gap-12 transition-all duration-800 delay-200 ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} lg:order-2`}>
          <div className="flex flex-col w-full items-start gap-6">
            <h2 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-[28px] sm:text-[36px] lg:text-[48px] tracking-[-1.44px] leading-tight">
              Fitur Unggulan untuk Kesuksesan Anda
            </h2>
          </div>

          <div className="flex flex-col items-start gap-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[72px] gap-y-6 w-full">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-start gap-3 transition-all duration-600 ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: contentVisible ? `${400 + index * 150}ms` : '0ms' }}
                >
                  <h3 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-lg sm:text-xl lg:text-2xl tracking-[-0.72px] leading-7">
                    {feature.title}
                  </h3>
                  <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#1f1f1fb2] text-sm sm:text-base tracking-[-0.16px] leading-6">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div ref={cardRef} className={`hidden lg:flex lg:flex-col relative items-center flex-shrink-0 transition-all duration-800 ${cardVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'} lg:order-1`}>
          <div className="relative w-auto">
            <Card className={`relative w-auto h-[570px] min-w-[480px] max-w-[480px] gradient-pattern-bg-subtle rounded-[27.77px] overflow-hidden border-0 shadow-md`}>
              <CardContent className="p-0 relative w-full h-full">
                <img
                  className="w-full h-full object-cover object-center rounded-[27.77px]"
                  alt="Image"
                  src="/image-68.png"
                  loading="eager"
                />
              </CardContent>
            </Card>

            <div className="absolute bottom-8 left-6 z-30">
              <div className="bg-white rounded-[32px] px-4 py-3 flex items-center gap-3 shadow-lg">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="#EC4899"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1f1f1f]">Pembahasan</p>
                  <p className="text-xs text-[#1f1f1f99]">Lengkap dan Detail</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};
