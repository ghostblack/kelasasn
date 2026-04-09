import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DesignLandingPage } from "./screens/DesignLandingPage";
import { LoginPage } from "./screens/LoginPage";
import { RegisterPage } from "./screens/RegisterPage";
import { HomePage } from "./screens/Dashboard";
import { TryoutsPage } from "./screens/Dashboard/TryoutsPage";
import { RankingPage } from "./screens/Dashboard/RankingPage";
import { JabatanPage } from "./screens/Dashboard/JabatanPage";
import { ProfilePage } from "./screens/Dashboard/ProfilePage";
import { CPNSFormasiPage } from "./screens/Dashboard/CPNSFormasiPage";
import { CPNSInstansiPage } from "./screens/Dashboard/CPNSInstansiPage";
import { CPNSInstansiDetailPage } from "./screens/Dashboard";
import { TryoutDetailPage } from "./screens/Dashboard/TryoutDetailPage";
import { TryoutExamPage } from "./screens/Dashboard/TryoutExamPage";
import { TryoutResultPage } from "./screens/Dashboard/TryoutResultPage";
import { TryoutReviewPage } from "./screens/Dashboard/TryoutReviewPage";
import { PaymentPage } from "./screens/Dashboard/PaymentPage";
import { PaymentProcessPage } from "./screens/Dashboard/PaymentProcessPage";
import { PaymentSuccessPage } from "./screens/Dashboard/PaymentSuccessPage";
import { PaymentHistoryPage } from "./screens/Dashboard/PaymentHistoryPage";
import { PaymentQRISPage } from "./screens/Dashboard/PaymentQRISPage";
import { PaymentQRISProcessPage } from "./screens/Dashboard/PaymentQRISProcessPage";
import { PaymentQRISCodePage } from "./screens/Dashboard/PaymentQRISCodePage";
import { PaymentQRISUnifiedPage } from "./screens/Dashboard/PaymentQRISUnifiedPage";
import { AdminLoginPage } from "./screens/AdminLoginPage";
import { AdminDashboard } from "./screens/Admin/AdminDashboard";
import { AdminHome } from "./screens/Admin/AdminHome";
import { TryoutsManagement } from "./screens/Admin/TryoutsManagement";
import { CreateTryoutPage } from "./screens/Admin/CreateTryoutPage";
import { ClaimCodesManagement } from "./screens/Admin/ClaimCodesManagement";
import { TryoutQuestionCategories } from "./screens/Admin/TryoutQuestionCategories";
import { TryoutQuestionInput } from "./screens/Admin/TryoutQuestionInput";
import { TryoutQuestionList } from "./screens/Admin/TryoutQuestionList";
import { UsersMonitoring } from "./screens/Admin/UsersMonitoring";
import { PaymentsManagement } from "./screens/Admin/PaymentsManagement";
import { FormasiAccessManagement } from "./screens/Admin/FormasiAccessManagement";
import { QuestionsManagement } from "./screens/Admin/QuestionsManagement";
import { FeedbackManagement } from "./screens/Admin/FeedbackManagement";
import { UserTryoutDetails } from "./screens/Admin/UserTryoutDetails";
import { PromoBannerManagement } from "./screens/Admin/PromoBannerManagement";
import { AuthProvider } from "./contexts/AuthContext";
import { MaintenanceProvider, useMaintenanceMode } from "./contexts/MaintenanceContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Toaster } from "./components/ui/toaster";
import { SessionConflictModal } from "./components/SessionConflictModal";
import { PromoBannerModal } from "./components/PromoBannerModal";
import { MaintenancePage } from "./screens/MaintenancePage";
import { useAuth } from "./contexts/AuthContext";
import "../tailwind.css";

// Guard component that shows maintenance page for non-admin routes
function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isMaintenance, maintenanceMessage, loading: mLoading } = useMaintenanceMode();
  const { isAdmin, loading: aLoading } = useAuth();

  // Izinkan akses jika di localhost atau ngrok (untuk development/testing)
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.includes('ngrok-free.app');
  
  if (mLoading || aLoading) return null; 
  
  // Tampilkan halaman maintenance HANYA jika:
  // 1. Sedang maintenance
  // 2. BUKAN di lingkungan lokal/ngrok
  // 3. User BUKAN admin
  if (isMaintenance && !isLocal && !isAdmin) {
    return <MaintenancePage message={maintenanceMessage} />;
  }
  
  return <>{children}</>;
}

function AppWrapper() {
  const { showSessionConflict, setShowSessionConflict, conflictDeviceInfo } = useAuth();

  return (
    <>
      <SessionConflictModal
        isOpen={showSessionConflict}
        onClose={() => setShowSessionConflict(false)}
        newDeviceInfo={conflictDeviceInfo}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MaintenanceGuard><DesignLandingPage /></MaintenanceGuard>} />
          <Route path="/login" element={<MaintenanceGuard><LoginPage /></MaintenanceGuard>} />
          <Route path="/register" element={<MaintenanceGuard><RegisterPage /></MaintenanceGuard>} />
          <Route path="/register" element={<MaintenanceGuard><RegisterPage /></MaintenanceGuard>} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <HomePage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryouts"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <TryoutsPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ranking"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <RankingPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jabatan"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <JabatanPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/formasi"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <CPNSFormasiPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/instansi"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <CPNSInstansiPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/instansi/:kode"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <CPNSInstansiDetailPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryout/:id"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <TryoutDetailPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryout/:id/exam"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <TryoutExamPage />
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryout/:id/result"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <TryoutResultPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryout/:id/review"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <TryoutReviewPage />
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <PaymentPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/process/:paymentId"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <PaymentProcessPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/success"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <PaymentSuccessPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment-history"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <PaymentHistoryPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment-qris/:tryoutId"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <PaymentQRISPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/qris/:paymentId"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <PaymentQRISProcessPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/qris-code"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <PaymentQRISCodePage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/qris"
            element={
              <ProtectedRoute>
                <MaintenanceGuard>
                  <DashboardLayout>
                    <PaymentQRISUnifiedPage />
                  </DashboardLayout>
                </MaintenanceGuard>
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminHome />} />
            <Route path="tryouts" element={<TryoutsManagement />} />
            <Route path="tryouts/create" element={<CreateTryoutPage />} />
            <Route path="tryouts/edit/:id" element={<CreateTryoutPage />} />
            <Route path="tryouts/:tryoutId/questions" element={<TryoutQuestionCategories />} />
            <Route path="tryouts/:tryoutId/questions/:category/input" element={<TryoutQuestionInput />} />
            <Route path="tryouts/:tryoutId/questions/:category/list" element={<TryoutQuestionList />} />
            <Route path="tryouts/:tryoutId/questions/:category/edit/:questionId" element={<TryoutQuestionInput />} />
            <Route path="claim-codes" element={<ClaimCodesManagement />} />
            <Route path="users" element={<UsersMonitoring />} />
            <Route path="users/:userId/result/:resultId" element={<UserTryoutDetails />} />
            <Route path="payments" element={<PaymentsManagement />} />
            <Route path="formasi-access" element={<FormasiAccessManagement />} />
            <Route path="questions" element={<QuestionsManagement />} />
            <Route path="feedback" element={<FeedbackManagement />} />
            <Route path="promo-banner" element={<PromoBannerManagement />} />
          </Route>
        </Routes>
        <Toaster />
        <PromoBannerModal />
      </BrowserRouter>
    </>
  );
}

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <MaintenanceProvider>
        <AppWrapper />
      </MaintenanceProvider>
    </AuthProvider>
  </StrictMode>,
);
