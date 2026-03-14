import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DesignLandingPage } from "./screens/DesignLandingPage";
import { LoginPage } from "./screens/LoginPage";
import { RegisterPage } from "./screens/RegisterPage";
import { VerifyEmailPage } from "./screens/VerifyEmailPage";
import { WaitingVerificationPage } from "./screens/WaitingVerificationPage";
import { SetupUsernamePage } from "./screens/SetupUsernamePage";
import { SetupProfilePage } from "./screens/SetupProfilePage";
import { HomePage } from "./screens/Dashboard";
import { TryoutsPage } from "./screens/Dashboard/TryoutsPage";
import { RankingPage } from "./screens/Dashboard/RankingPage";
import { JabatanPage } from "./screens/Dashboard/JabatanPage";
import { ProfilePage } from "./screens/Dashboard/ProfilePage";
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
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Toaster } from "./components/ui/toaster";
import { SessionConflictModal } from "./components/SessionConflictModal";
import { useAuth } from "./contexts/AuthContext";
import "../tailwind.css";

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
          <Route path="/" element={<DesignLandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/waiting-verification" element={<WaitingVerificationPage />} />
          <Route path="/setup-username" element={<SetupUsernamePage />} />
          <Route path="/setup-profile" element={<SetupProfilePage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HomePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryouts"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TryoutsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ranking"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RankingPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/jabatan"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <JabatanPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryout/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TryoutDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryout/:id/exam"
            element={
              <ProtectedRoute>
                <TryoutExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryout/:id/result"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TryoutResultPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tryout/:id/review"
            element={
              <ProtectedRoute>
                <TryoutReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/process/:paymentId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentProcessPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/success"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentSuccessPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment-history"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment-qris/:tryoutId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentQRISPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/qris/:paymentId"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentQRISProcessPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/qris-code"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentQRISCodePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/payment/:tryoutId/qris"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PaymentQRISUnifiedPage />
                </DashboardLayout>
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
            <Route path="payments" element={<PaymentsManagement />} />
          </Route>
        </Routes>
        <Toaster />
      </BrowserRouter>
    </>
  );
}

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </StrictMode>,
);
