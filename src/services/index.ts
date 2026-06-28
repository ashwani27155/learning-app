/**
 * API Service Layer (Axios instances + React Query hooks)
 *
 * services/
 *   api.ts              — Axios base instance, interceptors (auth token, refresh, error handling)
 *
 *   authService.ts      → login, register, logout, forgotPassword, resetPassword,
 *                          verifyEmail, verifyOTP, refreshToken, getMe
 *
 *   testSeriesService.ts → getAll, getById, enroll, getEnrolled, getByExam,
 *                           getGroupWise, getSubjectWise, getPYQ, getLive
 *
 *   testService.ts      → getTest, startAttempt, saveResponse, submitTest,
 *                          getResult, getLeaderboard, getReview
 *
 *   questionService.ts  → getAll, create, update, delete, importFromExcel,
 *                          exportToExcel, getBySubject, bulkApprove
 *
 *   studyMaterialService.ts → getAll, getById, getBySubject, download, upload,
 *                              getCurrentAffairs, getEbooks, getPDFs
 *
 *   analyticsService.ts → getStudentAnalytics, getSubjectAnalytics,
 *                          getProgressReport, getWeakTopics, getStreak
 *
 *   userService.ts      → getProfile, updateProfile, changePassword,
 *                          uploadAvatar, getMyTests, getMyResults
 *
 *   paymentService.ts   → createOrder, verifyPayment, getHistory,
 *                          applyCoupon, getPlans, subscribe
 *
 *   adminService.ts     → getDashboardStats, getUsers, updateUser,
 *                          toggleUserStatus, getSystemHealth
 *
 *   notificationService.ts → getAll, markRead, markAllRead,
 *                             sendPushNotification (admin)
 *
 *   discussionService.ts → getPosts, createPost, replyToPost,
 *                           upvote, downvote, resolvePost
 *
 *   leaderboardService.ts → getGlobal, getByTest, getByExam, getMyRank
 *
 *   subjectService.ts   → getAll, getChapters, getTopics
 */
export {};
