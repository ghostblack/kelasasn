import { Separator } from "../../../../components/ui/separator";
import { Instagram, Send, MessageSquare } from "lucide-react";

const navigationLinks = [
  { label: "Home", href: "#" },
  { label: "Try Out", href: "#" },
  { label: "Fitur", href: "#" },
  { label: "FAQs", href: "#" },
];

const productLinks = [
  { label: "Try Out", href: "#" },
  { label: "Daftar Posisi 2024", href: "#" },
  { label: "Login", href: "#" },
];

export const FooterSection = (): JSX.Element => {
  return (
    <footer className="w-full relative bg-[#1f1f1f] overflow-hidden py-16 lg:py-28">
      <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 bottom-[-127px] [font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#ffffff14] text-[400px] tracking-[-12.00px] leading-[566px] whitespace-nowrap pointer-events-none">
        KELASN
      </div>

      <div className="flex flex-col max-w-[1280px] mx-auto px-4 lg:px-8 items-start gap-8 lg:gap-[43px] relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-8 w-full">
          <div className="flex items-center gap-3 lg:gap-5 flex-wrap">
            <div className="flex items-center p-[12.39px]">
              <img
                src="/Frame 1321314500.svg"
                alt="Kelas ASN Logo"
                className="h-10 w-10"
              />
            </div>

            <Separator
              orientation="vertical"
              className="h-[26px] bg-white/20"
            />

            <div className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-lg tracking-[-0.18px] leading-6 whitespace-nowrap">
              Tempat Tryout CPNS Terbaik
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-6 flex-wrap">
            <div className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#ffffffb2] text-lg tracking-[-0.18px] leading-6 whitespace-nowrap">
              Temukan Kami Di
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.instagram.com/kelasasn.id/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 text-white"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://www.threads.net/@kelasasn.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 text-white"
              >
                <MessageSquare className="w-5 h-5" />
              </a>
              <a 
                href="https://t.me/KelasASN" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 text-white"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-8 w-full">
          <div className="max-w-[284px] [font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-base tracking-[0] leading-6">
            Jl. Karangmojo Wonosari , Karangmojo, Gunungkidul, Yogyakarta
          </div>

          <div className="flex items-start gap-8 lg:gap-6 flex-wrap justify-between lg:justify-start w-full lg:w-auto">
            <nav className="flex flex-col w-[193px] items-start gap-6">
              <div className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#ffffffb2] text-lg tracking-[-0.18px] leading-6">
                Navigation
              </div>
              <div className="flex flex-col items-start gap-4 w-full">
                {navigationLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-white text-lg tracking-[-0.18px] leading-6 hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>

            <nav className="flex flex-col w-[193px] items-start gap-6">
              <div className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#ffffffb2] text-lg tracking-[-0.18px] leading-6">
                Produk
              </div>
              <div className="flex flex-col items-start gap-4 w-full">
                {productLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-white text-lg tracking-[-0.18px] leading-6 hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};
