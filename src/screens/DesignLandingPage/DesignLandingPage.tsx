import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/ui/spinner";
import { FaqSection } from "./sections/FaqSection";
import { FooterSection } from "./sections/FooterSection";
import { HeaderSection } from "./sections/HeaderSection";
import { MainContentSection } from "./sections/MainContentSection";
import { TestimonialSection } from "./sections/TestimonialSection";
import { TryOutSection } from "./sections/TryOutSection";
import { TrustSection } from "./sections/TrustSection";
import { FormasiPreviewSection } from "./sections/FormasiPreviewSection/FormasiPreviewSection";
import { useSEO } from "@/hooks/useSEO";

export const DesignLandingPage = (): JSX.Element => {
  useSEO(
    "Try Out CPNS Gratis 2026 Terlengkap | Kelas ASN",
    "Try out CPNS gratis dengan simulasi CAT BKN + cek data formasi CPNS 2026 terlengkap: jumlah pelamar, rasio persaingan, dan peluang lolos."
  );
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Early escape if still loading auth state
    if (loading) return;

    if (user) {
      console.log('DesignLandingPage: Authenticated user detected, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // If we have a user in localStorage, show loading immediately to prevent flash
  const hasPossibleSession = localStorage.getItem('current_user_id');
  if (loading && hasPossibleSession) {
    return <LoadingScreen message="Menyiapkan dashboard..." type="spinner" fullScreen overlay />;
  }

  return (
    <div className="bg-white w-full flex flex-col">
      <HeaderSection />
      <FormasiPreviewSection />
      <MainContentSection />
      <TrustSection />
      <TryOutSection />
      <TestimonialSection />
      <FaqSection />
      <FooterSection />
    </div>
  );
};
