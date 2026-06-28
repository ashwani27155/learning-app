/**
 * Application Route Structure
 *
 * PUBLIC ROUTES  → accessible without login
 * AUTH ROUTES    → login/register pages (redirect to dashboard if logged in)
 * STUDENT ROUTES → protected, requires authentication
 * ADMIN ROUTES   → protected, requires admin/superadmin role
 */

// ─── Public Routes ────────────────────────────────────────────────────────────
// /                           → HomePage
// /about                      → AboutPage
// /contact                    → ContactPage
// /pricing                    → PricingPage
// /test-series                → TestSeriesListPage (public catalog)
// /test-series/:seriesId      → TestSeriesDetailPage
// /study-material             → StudyMaterialPage (public catalog)
// /current-affairs            → CurrentAffairsPage
// /current-affairs/:id        → CurrentAffairsDetailPage
// /leaderboard                → PublicLeaderboardPage
// /blog                       → BlogPage
// /blog/:slug                 → BlogPostPage
// /faq                        → FAQPage
// /terms                      → TermsPage
// /privacy                    → PrivacyPage

// ─── Auth Routes ──────────────────────────────────────────────────────────────
// /auth/login                 → LoginPage
// /auth/register              → RegisterPage
// /auth/forgot-password       → ForgotPasswordPage
// /auth/reset-password        → ResetPasswordPage
// /auth/verify-email          → EmailVerificationPage
// /auth/verify-otp            → OTPVerificationPage

// ─── Student Routes (Protected) ──────────────────────────────────────────────
// /dashboard                  → StudentDashboardPage
// /dashboard/profile          → StudentProfilePage
// /dashboard/my-tests         → MyTestsPage (enrolled, attempted, bookmarked)
// /dashboard/my-results       → MyResultsPage (all past results)
// /dashboard/analytics        → PerformanceAnalyticsPage
// /dashboard/bookmarks        → BookmarkedQuestionsPage
// /dashboard/notifications    → NotificationsPage
// /dashboard/subscription     → SubscriptionPage
// /dashboard/referrals        → ReferralsPage

// ─── Test Flow Routes ─────────────────────────────────────────────────────────
// /test-series/:seriesId/enroll           → EnrollPage
// /test/:testId/instructions              → TestInstructionsPage
// /test/:testId/attempt                   → TestAttemptPage   (FULLSCREEN)
// /test/:testId/result/:attemptId         → TestResultPage
// /test/:testId/result/:attemptId/review  → QuestionReviewPage
// /test/:testId/analysis                  → TestAnalysisPage
// /test/:testId/leaderboard               → TestLeaderboardPage
// /test/:testId/discussion                → TestDiscussionPage

// ─── Study Material Routes ────────────────────────────────────────────────────
// /study-material/:materialId             → StudyMaterialViewerPage (PDF/Ebook)
// /study-material/subject/:subjectId      → SubjectMaterialPage

// ─── Admin Routes (Protected - Admin Only) ────────────────────────────────────
// /admin                                  → AdminDashboardPage
// /admin/users                            → UsersManagementPage
// /admin/users/:userId                    → UserDetailPage
// /admin/test-series                      → AdminTestSeriesPage
// /admin/test-series/create               → CreateTestSeriesPage
// /admin/test-series/:seriesId/edit       → EditTestSeriesPage
// /admin/test-series/:seriesId/tests      → ManageTestsPage
// /admin/tests/create                     → CreateTestPage
// /admin/tests/:testId/edit               → EditTestPage
// /admin/tests/:testId/questions          → ManageTestQuestionsPage
// /admin/question-bank                    → QuestionBankPage
// /admin/question-bank/create             → CreateQuestionPage
// /admin/question-bank/import             → BulkImportQuestionsPage (Excel)
// /admin/question-bank/:questionId/edit   → EditQuestionPage
// /admin/study-material                   → AdminStudyMaterialPage
// /admin/study-material/upload            → UploadMaterialPage
// /admin/current-affairs                  → AdminCurrentAffairsPage
// /admin/current-affairs/create           → CreateCurrentAffairsPage
// /admin/live-tests                       → AdminLiveTestsPage
// /admin/live-tests/schedule              → ScheduleLiveTestPage
// /admin/results                          → AdminResultsPage
// /admin/analytics                        → AdminAnalyticsPage
// /admin/subscriptions                    → SubscriptionsManagementPage
// /admin/payments                         → PaymentsPage
// /admin/coupons                          → CouponsManagementPage
// /admin/notifications/send               → SendNotificationPage
// /admin/blog                             → AdminBlogPage
// /admin/blog/create                      → CreateBlogPostPage
// /admin/testimonials                     → TestimonialsManagementPage
// /admin/settings                         → AdminSettingsPage
// /admin/subjects                         → SubjectsManagementPage

export {};
