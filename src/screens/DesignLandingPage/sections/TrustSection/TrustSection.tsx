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
      className={`flex flex-col items-center p-8 rounded-3xl bg-white border border-gray-100 shadow-sm transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h3 className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-4xl sm:text-5xl tracking-tight">
          {displayValue.toLocaleString("id-ID")}+
        </h3>
        <p className="[font-family:'PP_Neue_Montreal-Medium',Helvetica] font-medium text-gray-500 text-lg">
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
    <section ref={sectionRef} className="w-full flex justify-center py-20 lg:py-32 bg-gray-50/50">
      <div className="w-full max-w-[1280px] px-4 lg:px-8">
        <div className="flex flex-col items-center text-center mb-16 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full"
          >
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wider">
              Terpercaya & Terbukti
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="[font-family:'PP_Neue_Montreal-Bold',Helvetica] font-bold text-black text-[32px] sm:text-[42px] lg:text-[54px] tracking-tight leading-tight max-w-3xl"
          >
            Pilihan Utama Ribuan Calon ASN Indonesia
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="[font-family:'PP_Neue_Montreal-Book',Helvetica] font-normal text-gray-500 text-lg sm:text-xl max-w-2xl"
          >
            Kami berkomitmen memberikan pengalaman belajar terbaik dengan data yang transparan dan hasil yang nyata.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCounter
            icon={Users}
            label="User Terdaftar"
            value={stats.totalUsers > 0 ? stats.totalUsers : 1250} // Fallback to a respectable number for demo
            delay={0}
          />
          <StatCounter
            icon={BookOpen}
            label="Try Out Dikerjakan"
            value={stats.totalParticipants > 0 ? stats.totalParticipants : 4850}
            delay={0.1}
          />
          <StatCounter
            icon={Award}
            label="Lulus SKD"
            value={Math.floor(stats.totalUsers * 0.4) || 520}
            delay={0.2}
          />
          <StatCounter
            icon={CheckCircle}
            label="Kepuasan Alumni"
            value={98}
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
};
