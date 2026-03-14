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

export const DesignLandingPage = (): JSX.Element => {
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
      <MainContentSection />
      <TryOutSection />
      <TestimonialSection />
      <FaqSection />
      <FooterSection />
    </div>
  );
};
