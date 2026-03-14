import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion";
import { Button } from "../../../../components/ui/button";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";

const faqItems = [
  {
    id: "item-1",
    question: "Apakah soal Kelas ASN sudah terbaru?",
    answer:
      "Ya! Semua soal kami dirancang berdasarkan kisi-kisi resmi CPNS 2026 dengan sistem CAT yang identik dengan ujian BKN asli. Kami terus memperbarui bank soal secara berkala mengikuti perkembangan dan peraturan terbaru CPNS.",
  },
  {
    id: "item-2",
    question: "Apakah ada paket gratis di Kelas ASN?",
    answer:
      "Tentu! Kami menyediakan try out gratis dengan fitur dasar untuk membantu Anda memulai persiapan. Tersedia juga paket premium yang dilengkapi pembahasan detail, analisis performa mendalam, dan akses ke ribuan soal tambahan.",
  },
  {
    id: "item-3",
    question: "Berapa lama akses try out dapat digunakan?",
    answer:
      "Akses try out gratis dapat digunakan tanpa batas waktu. Untuk paket premium, Anda mendapatkan akses selama 1 tahun penuh sejak tanggal pembelian dengan fitur-fitur premium lengkap.",
  },
  {
    id: "item-4",
    question: "Apakah setiap soal memiliki pembahasan?",
    answer:
      "Ya! Setiap soal dilengkapi dengan pembahasan detail yang mudah dipahami beserta penjelasan konsep. Paket premium juga menyediakan video pembahasan untuk topik-topik penting yang membantu pemahaman lebih mendalam.",
  },
];

export const FaqSection = (): JSX.Element => {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation(0.2);
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation(0.2);

  return (
    <section id="faq" className="w-full flex justify-center bg-gray-50 py-16 lg:py-28">
      <div className="flex w-full max-w-[1176px] px-4 lg:px-8 items-start gap-8 lg:gap-[79px] flex-col lg:flex-row">
        <div ref={leftRef} className={`flex flex-col w-full lg:w-[519px] items-start gap-8 lg:gap-12 transition-all duration-800 ${leftVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
          <div className="flex flex-col items-start gap-6 w-full">
            <div className="flex flex-col items-start gap-8 w-full">
              <div className="inline-flex items-center justify-center pl-1 pr-5 py-1 bg-white rounded-[100px] border border-solid border-[#f4f4f4] shadow-[0px_8px_48px_#0000000a]">
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-[#19b269] rounded-[100px]">
                    <div className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-white text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                      Bingung ?
                    </div>
                  </div>

                  <div className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-sm tracking-[-0.14px] leading-5 whitespace-nowrap">
                    Kalau Bingung Tanya di sini
                  </div>
                </div>
              </div>

              <h2 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1f1f1f] text-3xl lg:text-[56px] tracking-[-1.68px] leading-tight lg:leading-[64px]">
                Pertanyaan Umum
              </h2>

              <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-lg tracking-[-0.18px] leading-6">
                Jawaban untuk pertanyaan yang paling sering diajukan tentang platform kami
              </p>
            </div>
          </div>

          <Button className="group inline-flex items-center justify-center gap-4 pl-6 pr-1 py-1 h-auto bg-[#050505] rounded-[32px] overflow-hidden hover:bg-[#050505]/90 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95">
            <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-lg tracking-[0] leading-6 whitespace-nowrap">
              Lihat Semua FAQs
            </span>

            <img
              className="w-12 h-12 transition-transform duration-300 group-hover:-rotate-45"
              alt="Sign up icon"
              src="/sign-up-icon-container.svg"
            />
          </Button>
        </div>

        <div ref={rightRef} className={`flex flex-col items-start gap-6 flex-1 transition-all duration-800 delay-200 ${rightVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
          <Accordion
            type="single"
            collapsible
            defaultValue="item-1"
            className="flex flex-col items-start gap-6 w-full"
          >
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="flex flex-col items-start px-6 py-[18px] w-full bg-white rounded-3xl border-0"
              >
                <AccordionTrigger className="flex items-center justify-between w-full hover:no-underline [&[data-state=open]>img]:rotate-180">
                  <h3 className="[font-family:'Rethink_Sans',Helvetica] font-bold text-[#1f1f1f] text-2xl tracking-[-0.72px] leading-8 text-left pr-4">
                    {item.question}
                  </h3>
                </AccordionTrigger>
                {item.answer && (
                  <AccordionContent className="pt-4">
                    <p className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#1f1f1fb2] text-base tracking-[-0.16px] leading-6">
                      {item.answer}
                    </p>
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
