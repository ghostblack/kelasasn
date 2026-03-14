import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";

const testimonials = [
  {
    quote:
      "Platform ini benar-benar mengubah cara saya belajar. Soal-soal yang interaktif dan pembahasan yang detail membuat saya lebih percaya diri menghadapi ujian. Berkat Kelas ASN, saya berhasil lulus CPNS 2024!",
    name: "Siti Aminah",
    organization: "Kementerian Pendidikan",
  },
  {
    quote:
      "Bank soal yang lengkap dengan simulasi CAT yang realistis benar-benar mempersiapkan saya dengan baik. Saya tahu persis apa yang akan dihadapi di ujian asli. Lulus CPNS 2024 adalah bukti dari strategi belajar yang tepat!",
    name: "Ahmad Rizki",
    organization: "Kementerian Pekerjaan Umum",
  },
  {
    quote:
      "Fitur ranking nasional memotivasi saya untuk terus belajar dan berkembang. Komunitas yang solid juga menjadi tempat saling berbagi tips dan trik sukses. Terima kasih Kelas ASN, saya lulus CPNS 2024!",
    name: "Rina Wardani",
    organization: "Kementerian Kesehatan",
  },
];

export const TestimonialSection = (): JSX.Element => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.2);
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation(0.2);

  return (
    <section id="testimonial" className="w-full flex justify-center py-16 lg:py-28">
      <div className="flex w-full max-w-[1172px] px-4 lg:px-8 flex-col items-center gap-12 lg:gap-16">
        <header ref={headerRef} className={`flex flex-col gap-6 items-center transition-all duration-800 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Badge
            variant="outline"
            className="inline-flex items-center justify-center pl-1 pr-5 py-1 bg-white rounded-[100px] border border-solid border-[#f4f4f4] shadow-[0px_8px_48px_#0000000a] h-auto"
          >
            <div className="inline-flex items-center gap-2">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#19b269] rounded-[100px]">
                <span className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-white text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                  Testimoni
                </span>
              </div>
              <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                Apa yang mereka Katakan
              </span>
            </div>
          </Badge>

          <h2 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-3xl lg:text-5xl tracking-[-0.48px] leading-tight lg:leading-[64px] text-center">
            Cerita Sukses Peserta Kami
          </h2>

          <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-lg lg:text-2xl text-center tracking-[-0.24px] leading-7 max-w-[600px]">
            Ribuan peserta telah membuktikan kesuksesan mereka melalui Kelas ASN dan berhasil lulus CPNS 2024
          </p>
        </header>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`bg-neutral-50 rounded-[15px] border-0 shadow-sm transition-all duration-800 hover:scale-105 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: cardsVisible ? `${index * 150}ms` : '0ms' }}
            >
              <CardContent className="flex flex-col h-full min-h-[400px] items-start justify-between p-6">
                <img
                  className="h-[42px] mb-4"
                  alt="Quote icon"
                  src="/si-quote-duotone-2.svg"
                />

                <p className="flex-1 [font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-black text-xl tracking-[0] leading-7 mb-6">
                  {testimonial.quote}
                </p>

                <div className="flex flex-col gap-1 w-full">
                  <h3 className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-black text-lg tracking-[0] leading-6">
                    {testimonial.name}
                  </h3>
                  <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-gray-600 text-base tracking-[0] leading-6">
                    {testimonial.organization}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
