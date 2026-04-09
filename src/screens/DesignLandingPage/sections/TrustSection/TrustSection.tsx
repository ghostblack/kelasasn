import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { Users, BookOpen, CheckCircle, Award } from "lucide-react";
import { useScrollAnimation } from "../../../../hooks/useScrollAnimation";
import { landingService, LandingStats } from "../../../../services/landingService";

const StatCounter = ({ value, label, icon: Icon, delay = 0 }: { value: number; label: string; icon: any; delay?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const { ref, isVisible } = useScrollAnimation(0.2);

  useEffect(() => {
    if (isVisible) {
      const controls = animate(0, value, {
        duration: 2,
        delay,
        ease: "easeOut",
        onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      });
      return () => controls.stop();
    }
  }, [isVisible, value, delay]);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center p-8 rounded-3xl bg-white border border-gray-100 shadow-sm transition-all duration-700 hover:shadow-md hover:-translate-y-1 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border border-gray-100">
        <Icon className="w-7 h-7 text-[#1f1f1f]" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h3 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1e1e1e] text-4xl sm:text-5xl tracking-[-1.44px]">
          {displayValue.toLocaleString("id-ID")}+
        </h3>
        <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1fb2] text-sm sm:text-base tracking-[-0.16px]">
          {label}
        </p>
      </div>
    </div>
  );
};

export const TrustSection = (): JSX.Element => {
  const [stats, setStats] = useState<LandingStats>({ totalUsers: 0, totalParticipants: 0 });
  const { ref: sectionRef, isVisible } = useScrollAnimation(0.1);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await landingService.getLandingStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  return (
    <section ref={sectionRef} className="w-full flex justify-center py-16 lg:py-28 bg-gray-50/50">
      <div className="w-full max-w-[1280px] px-4 lg:px-8">
        <div className="flex flex-col items-center text-center mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 pl-1 pr-5 py-1 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
          >
            <div className="inline-flex items-center justify-center gap-2.5 px-3 py-2 bg-[#19b269] rounded-[32px] h-auto">
              <span className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-white text-sm tracking-[0] leading-[18px]">
                #1 Terpercaya
              </span>
            </div>
            <span className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-[#1f1f1f] text-sm sm:text-base tracking-[0] leading-[18px] whitespace-nowrap">
              & Terbukti
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-[#1e1e1e] text-[28px] sm:text-[36px] lg:text-[48px] tracking-[-1.44px] leading-tight max-w-3xl"
          >
            Pilihan Utama Ribuan Calon ASN Indonesia
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-[#1f1f1fb2] text-sm sm:text-base md:text-lg tracking-[-0.16px] leading-6 sm:leading-7 max-w-2xl"
          >
            Kami berkomitmen memberikan pengalaman belajar terbaik dengan data yang transparan dan hasil yang nyata.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCounter
            icon={Users}
            label="Peserta Kelas ASN"
            value={(stats.totalUsers > 0 ? stats.totalUsers : 0) + 1250}
            delay={0}
          />
          <StatCounter
            icon={BookOpen}
            label="Try Out Dikerjakan"
            value={(stats.totalParticipants > 0 ? stats.totalParticipants : 0) + 4850}
            delay={0.1}
          />
          <StatCounter
            icon={Award}
            label="Lulus SKD"
            value={Math.floor(((stats.totalUsers > 0 ? stats.totalUsers : 0) + 1250) * 0.45)}
            delay={0.2}
          />
          <StatCounter
            icon={CheckCircle}
            label="Alumni"
            value={Math.floor(((stats.totalUsers > 0 ? stats.totalUsers : 0) + 1250) * 0.85)}
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
};
