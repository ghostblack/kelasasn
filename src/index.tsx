import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DesignLandingPage } from "./screens/DesignLandingPage";
import { LoginPage } from "./screens/LoginPage";
import { RegisterPage } from "./screens/RegisterPage";
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
import { QuestionsManagement } from "./screens/Admin/QuestionsManagement";
import { UserTryoutDetails } from "./screens/Admin/UserTryoutDetails";
import { AuthProvider } from "./contexts/AuthContext";
import { MaintenanceProvider, useMaintenanceMode } from "./contexts/MaintenanceContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Toaster } from "./components/ui/toaster";
import { SessionConflictModal } from "./components/SessionConflictModal";
import { MaintenancePage } from "./screens/MaintenancePage";
import { useAuth } from "./contexts/AuthContext";
import "../tailwind.css";

// Guard component that shows maintenance page for non-admin routes
function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isMaintenance, maintenanceMessage, loading } = useMaintenanceMode();

  if (loading) return null; // Will show while MaintenanceContext loads; auth loading handles the full-page spinner
  if (isMaintenance) return <MaintenancePage message={maintenanceMessage} />;
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
          <Route path="/setup-username" element={<MaintenanceGuard><SetupUsernamePage /></MaintenanceGuard>} />
          <Route path="/setup-profile" element={<MaintenanceGuard><SetupProfilePage /></MaintenanceGuard>} />

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
            <Route path="users/:userId/result/:resultId" element={<UserTryoutDetails />} />
            <Route path="payments" element={<PaymentsManagement />} />
            <Route path="questions" element={<QuestionsManagement />} />
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
      <MaintenanceProvider>
        <AppWrapper />
      </MaintenanceProvider>
    </AuthProvider>
  </StrictMode>,
);
