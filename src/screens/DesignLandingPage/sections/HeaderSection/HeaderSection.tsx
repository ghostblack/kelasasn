import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Menu, X, LayoutDashboard, Send } from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";
import { AnimatedTextSwitcher } from "../../../../components/AnimatedTextSwitcher";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Fitur Unggulan", href: "#fitur-unggulan" },
  { label: "Data Formasi", href: "#formasi-preview" },
  { label: "Paket Tryout", href: "#paket-tryout" },
  { label: "Testimonial", href: "#testimonial" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  {
    title: "Soal Terbaru 2026",
    description: "Berdasarkan kisi-kisi CPNS 2026",
  },
  {
    title: "Komunitas Belajar",
    description: "Bergabung dengan ribuan peserta",
  },
];

const floatingBadges = [
  {
    text: "Soal Terbaru",
    icon: "/group-2.png",
    className: "top-[139px] left-[356px]",
  },
  {
    text: "Pembahasan Soal",
    icon: "/group-2-1.png",
    className: "top-[385px] left-[13px]",
  },
  {
    text: "Ranking Seluruh Indonesia",
    icon: "/group-2-2.png",
    className: "top-[557px] left-60",
  },
];

export const HeaderSection = (): JSX.Element => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation(0.1);
  const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation(0.1);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleTryoutClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/dashboard/tryouts');
    }
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleTelegramClick = () => {
    window.open('https://t.me/KelasASN', '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="home" className="w-full flex flex-col bg-gray-50 overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="flex w-full max-w-[1280px] mx-auto h-[72px] items-center justify-between px-4 lg:px-8">
          <div className="inline-flex items-center">
            <img
              src="/Frame 1321314500.svg"
              alt="Kelas ASN Logo"
              className="h-10 w-10"
            />
          </div>

          <div className="hidden lg:inline-flex items-center gap-8">
            {!user && (
              <div className="inline-flex items-center gap-8">
                {navItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="relative w-fit [font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-base tracking-[0] leading-6 whitespace-nowrap hover:opacity-70 transition-opacity cursor-pointer"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleDashboardClick}
                  className="w-auto bg-[#2c29e2] hover:bg-[#2c29e2]/90 h-auto rounded-[32px] px-5 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-base tracking-[0] leading-6">
                    Dashboard
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleLoginClick}
                className="w-auto bg-[#050505] hover:bg-[#050505]/90 h-auto rounded-[32px] px-5 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-base tracking-[0] leading-6">
                  Login
                </span>
              </Button>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-[#1f1f1f]" />
            ) : (
              <Menu className="w-6 h-6 text-[#1f1f1f]" />
            )}
          </button>
        </div>

        <div
          className={`lg:hidden absolute top-[72px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-50 ${
            isMobileMenuOpen
              ? "max-h-[400px] opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="flex flex-col px-4 py-6 gap-6">
            {!user && navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-lg tracking-[0] leading-6 hover:text-[#2c27e1] transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ))}
            {user ? (
              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={handleDashboardClick}
                  className="w-full bg-[#2c29e2] hover:bg-[#2c29e2]/90 h-auto rounded-[32px] px-5 py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-base tracking-[0] leading-6">
                    Dashboard
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleLoginClick}
                className="w-full bg-[#050505] hover:bg-[#050505]/90 h-auto rounded-[32px] px-5 py-3 mt-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-base tracking-[0] leading-6">
                  Login
                </span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="w-full mt-[90px] sm:mt-[110px] lg:mt-[150px] pb-12 sm:pb-16 lg:pb-28 relative z-0">
        <div className="flex w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 items-start lg:items-center gap-6 sm:gap-8 lg:gap-8 flex-col lg:flex-row">
        <div ref={heroRef} className={`flex flex-col w-full lg:flex-1 items-start gap-8 sm:gap-10 lg:gap-[72px] lg:pl-12 transition-all duration-800 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-col items-start gap-8 sm:gap-10 lg:gap-12 w-full">
            <div className="flex flex-col items-start gap-4 sm:gap-5 lg:gap-6 w-full">
              <div className="inline-flex items-center gap-2 pl-1 pr-5 py-1 bg-white rounded-2xl overflow-hidden">
                <Badge className="inline-flex items-center justify-center gap-2.5 px-3 py-2 bg-[#19b269] hover:bg-[#19b269] rounded-[32px] h-auto">
                  <span className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-white text-sm tracking-[0] leading-[18px]">
                    CPNS #1
                  </span>
                </Badge>
                <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-black text-base tracking-[0] leading-[18px] whitespace-nowrap">
                  Platform Try Out SKD &amp; SKB
                </span>
              </div>

              <h1 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1e1e1e] text-[28px] sm:text-[36px] md:text-[44px] lg:text-[56px] xl:text-[64px] tracking-[-1.92px] leading-[1.15] max-w-full">
                <AnimatedTextSwitcher
                  texts={[
                    "Persiapan CPNS 2026 Dimulai dari Sini",
                    "Wujudkan Mimpi Jadi ASN 2026 Mulai Hari Ini"
                  ]}
                  interval={5000}
                />
              </h1>

              <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-sm sm:text-base md:text-lg tracking-[-0.20px] leading-6 sm:leading-7 max-w-2xl">
                Latihan try out online dengan simulasi CAT yang identik dengan ujian asli. Dapatkan analisis skor detail dan pembahasan soal lengkap.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Button
                onClick={handleTryoutClick}
                className="group inline-flex items-center justify-center gap-2 sm:gap-3 pl-4 sm:pl-5 pr-1 py-1 bg-[#050505] hover:bg-[#050505]/90 rounded-[32px] h-auto transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-6">
                  Mulai Try Out Gratis
                </span>
                <img
                  className="w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300 group-hover:-rotate-45"
                  alt="Sign up icon"
                  src="/sign-up-icon-container.svg"
                />
              </Button>

              <Button
                onClick={handleTelegramClick}
                variant="outline"
                className="group inline-flex items-center justify-center gap-3 px-6 py-3 bg-white border-gray-200 text-[#1f1f1f] hover:bg-blue-50/50 hover:border-[#229ED9]/30 rounded-[32px] h-auto transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 shadow-sm"
              >
                <Send className="w-5 h-5 text-[#229ED9] group-hover:scale-110 transition-transform" />
                <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-sm sm:text-base tracking-[0] leading-6">
                  Gabung Telegram
                </span>
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-4 sm:gap-6 lg:gap-[34px] flex-wrap">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-start gap-2 sm:gap-3"
              >
                <h3 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-base sm:text-lg lg:text-xl tracking-[-0.48px] leading-7 text-[#1f1f1f]">
                  {feature.title}
                </h3>
                <p className="[font-family:'Inter',Helvetica] font-normal text-[#1f1f1fb2] text-xs sm:text-sm tracking-[-0.16px] leading-5">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div ref={cardRef} className={`relative w-full lg:w-auto lg:flex-shrink-0 transition-all duration-800 delay-300 ${cardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative w-full lg:w-auto">
            <Card className={`relative w-full lg:w-auto h-[400px] sm:h-[450px] md:h-[500px] lg:h-[665px] lg:min-w-[498px] lg:max-w-[498px] gradient-pattern-bg rounded-[24px] lg:rounded-[32px] overflow-hidden border-0 shadow-md`}>
              <CardContent className="p-0 relative w-full h-full flex items-end justify-center">
                <img
                  className="h-full w-auto object-contain object-bottom rounded-[24px] lg:rounded-[32px]"
                  alt="Image"
                  src="/image-65.png"
                />
              </CardContent>
            </Card>

            {floatingBadges.map((badge, index) => {
              const positions = [
                "top-0 -right-32",
                "bottom-32 -left-32",
                "bottom-8 right-0 lg:-right-40"
              ];

              if (index === 0) {
                return (
                  <div
                    key={index}
                    className={`hidden lg:inline-flex items-center justify-center absolute z-40 transition-opacity duration-600 ${positions[index]} ${cardVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transitionDelay: cardVisible ? `${800 + index * 200}ms` : '0ms' }}
                  >
                    <img
                      src="/Frame 1321314296.svg"
                      alt="Floating card"
                      className="w-auto h-auto"
                    />
                  </div>
                );
              }

              if (index === 1) {
                return (
                  <div
                    key={index}
                    className={`hidden lg:inline-flex items-center justify-center absolute z-40 transition-opacity duration-600 ${positions[index]} ${cardVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transitionDelay: cardVisible ? `${800 + index * 200}ms` : '0ms' }}
                  >
                    <img
                      src="/Frame 1321314297.svg"
                      alt="Floating card"
                      className="w-auto h-auto"
                    />
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`hidden lg:inline-flex items-center justify-center absolute z-40 transition-opacity duration-600 ${positions[index]} ${cardVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transitionDelay: cardVisible ? `${800 + index * 200}ms` : '0ms' }}
                >
                  <img
                    src="/Frame 1321314298 copy.svg"
                    alt="Ranking Seluruh Indonesia"
                    className="w-auto h-auto"
                  />
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};
