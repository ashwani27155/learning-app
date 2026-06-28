import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ProtectedRoute, AdminRoute } from "./components/common/ProtectedRoute";

import PublicLayout from "@/components/layout/PublicLayout";
import StudentLayout from "@/components/layout/StudentLayout";
import AdminLayout from "@/components/layout/AdminLayout";

// Public pages
import HomePage from "@/pages/public/HomePage";
import PricingPage from "@/pages/public/PricingPage";
import GroupTestsPage from "@/pages/public/GroupTestsPage";
import AboutPage from "@/pages/public/AboutPage";
import ContactPage from "@/pages/public/ContactPage";
import FAQPage from "@/pages/public/FAQPage";
import PrivacyPage from "@/pages/public/PrivacyPage";
import TermsPage from "@/pages/public/TermsPage";
import NotFoundPage from "@/pages/public/NotFoundPage";

// Auth pages
import StudentLoginPage from "@/pages/auth/StudentLoginPage";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";

// Student pages
import StudentDashboard from "@/pages/student/StudentDashboard";
import MyTests from "@/pages/student/MyTests";
import MyResults from "@/pages/student/MyResults";
import Analytics from "@/pages/student/Analytics";
import StudyMaterial from "@/pages/student/StudyMaterial";
import StudentProfile from "@/pages/student/StudentProfile";
import NotificationsPage from "@/pages/student/NotificationsPage";
import SubscriptionPage from "@/pages/student/SubscriptionPage";
import DailyPractice from "@/pages/student/DailyPractice";
import FlashcardMode from "@/pages/student/FlashcardMode";
import Leaderboard from "@/pages/student/Leaderboard";
import BookmarkedQuestionsPage from "@/pages/student/BookmarkedQuestionsPage";
import ReferralsPage from "@/pages/student/ReferralsPage";

// Test flow pages
import TestInstructionsPage from "@/pages/student/TestInstructionsPage";
import TestAttempt from "@/pages/student/TestAttempt";
import TestResult from "@/pages/student/TestResult";
import TestDiscussionPage from "@/pages/student/TestDiscussionPage";
import TestAnalysisPage from "@/pages/student/TestAnalysisPage";
import QuestionReviewPage from "@/pages/student/QuestionReviewPage";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import QuestionBank from "@/pages/admin/QuestionBank";
import ManageTestSeries from "@/pages/admin/ManageTestSeries";
import ManageUsers from "@/pages/admin/ManageUsers";
import AdminStudyMaterial from "@/pages/admin/AdminStudyMaterial";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import AuditLogs from "@/pages/admin/AuditLogs";
import AdminLiveMonitor from "@/pages/admin/AdminLiveMonitor";
import PaperBuilder from "@/pages/admin/PaperBuilder";
import ManageCoupons from "@/pages/admin/ManageCoupons";
import ManageTestimonials from "@/pages/admin/ManageTestimonials";
import ManageNotifications from "@/pages/admin/ManageNotifications";
import ManageDiscussions from "@/pages/admin/ManageDiscussions";
import TestSeriesPage from "@/pages/public/TestSeriesPage";
import PublicLeaderboardPage from "@/pages/public/PublicLeaderboardPage";
import CurrentAffairsPage from "@/pages/public/CurrentAffairsPage";
import CurrentAffairsDetailPage from "@/pages/public/CurrentAffairsDetailPage";
import StudyMaterialDetailPage from "@/pages/public/StudyMaterialDetailPage";
import TestLeaderboardPage from "@/pages/student/TestLeaderboardPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              {/* ── Public ──────────────────────────────────────────────────── */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/test-series" element={<TestSeriesPage />} />
                <Route path="/study-material" element={<StudyMaterial />} />
                <Route path="/study-material/:materialId" element={<StudyMaterialDetailPage />} />
                <Route path="/test-series/group/:group" element={<GroupTestsPage />} />
                <Route path="/leaderboard" element={<PublicLeaderboardPage />} />
                <Route path="/current-affairs" element={<CurrentAffairsPage />} />
                <Route path="/current-affairs/:id" element={<CurrentAffairsDetailPage />} />
                <Route path="/about"   element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq"     element={<FAQPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms"   element={<TermsPage />} />
              </Route>

              {/* ── Auth ────────────────────────────────────────────────────── */}
              <Route path="/auth/login"            element={<StudentLoginPage />} />
              <Route path="/admin-login"            element={<AdminLoginPage />} />
              <Route path="/auth/register"         element={<RegisterPage />} />
              <Route path="/auth/forgot-password"  element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password"   element={<ResetPasswordPage />} />
              <Route path="/auth/verify-email"     element={<VerifyEmailPage />} />

              {/* ── Test flow — guests allowed for free tests ────────────────── */}
              <Route path="/test/:testId/instructions" element={<TestInstructionsPage />} />
              <Route path="/test/:testId/attempt"      element={<TestAttempt />} />
              <Route path="/test/:testId/result/:attemptId" element={<TestResult />} />
              <Route path="/test/:testId/result/:attemptId/review" element={<QuestionReviewPage />} />
              <Route path="/test/:testId/result/:attemptId/analysis" element={<TestAnalysisPage />} />
              <Route path="/test/:testId/discussion"        element={<TestDiscussionPage />} />
              <Route path="/test/:testId/leaderboard"       element={<TestLeaderboardPage />} />

              {/* ── Student dashboard (requires login) ─────────────────────── */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<StudentLayout />}>
                  <Route index                  element={<StudentDashboard />} />
                  <Route path="my-tests"        element={<MyTests />} />
                  <Route path="my-results"      element={<MyResults />} />
                  <Route path="analytics"       element={<Analytics />} />
                  <Route path="study-material"  element={<StudyMaterial />} />
                  <Route path="profile"         element={<StudentProfile />} />
                  <Route path="notifications"   element={<NotificationsPage />} />
                  <Route path="subscription"    element={<SubscriptionPage />} />
                  <Route path="daily-practice"  element={<DailyPractice />} />
                  <Route path="flashcards"      element={<FlashcardMode />} />
                  <Route path="leaderboard"     element={<Leaderboard />} />
                  <Route path="bookmarks"       element={<BookmarkedQuestionsPage />} />
                  <Route path="referrals"       element={<ReferralsPage />} />
                </Route>
              </Route>

              {/* ── Admin (requires admin role) ─────────────────────────────── */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index                  element={<AdminDashboard />} />
                  <Route path="question-bank"   element={<QuestionBank />} />
                  <Route path="test-series"     element={<ManageTestSeries />} />
                  <Route path="users"           element={<ManageUsers />} />
                  <Route path="study-material"  element={<AdminStudyMaterial />} />
                  <Route path="analytics"       element={<AdminAnalytics />} />
                  <Route path="settings"        element={<AdminSettings />} />
                  <Route path="audit-logs"      element={<AuditLogs />} />
                  <Route path="live-monitor/:testId" element={<AdminLiveMonitor />} />
                  <Route path="paper-builder"        element={<PaperBuilder />} />
                  <Route path="coupons"              element={<ManageCoupons />} />
                  <Route path="testimonials"         element={<ManageTestimonials />} />
                  <Route path="notifications"        element={<ManageNotifications />} />
                  <Route path="discussions"          element={<ManageDiscussions />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: "12px", fontSize: "14px" },
              success: { iconTheme: { primary: "#7c3aed", secondary: "#fff" } },
            }}
          />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}
