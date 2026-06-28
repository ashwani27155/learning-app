/**
 * Zustand Store Structure
 *
 * authStore
 *   state:   user, token, isAuthenticated, isLoading
 *   actions: login, logout, register, refreshToken, updateProfile
 *
 * testAttemptStore        — active test session state
 *   state:   testId, currentQuestion, responses, timeLeft, status,
 *            sectionId, palette, isSubmitting
 *   actions: setResponse, markForReview, clearResponse, nextQuestion,
 *            prevQuestion, jumpToQuestion, submitTest, syncToServer
 *
 * notificationStore
 *   state:   notifications[], unreadCount
 *   actions: markRead, markAllRead, removeNotification
 *
 * uiStore
 *   state:   language (mr|en), theme, sidebarOpen, isMobile
 *   actions: toggleLanguage, toggleTheme, setSidebarOpen
 *
 * cartStore                — for purchasing courses/materials
 *   state:   items[], coupon, total, discount
 *   actions: addItem, removeItem, applyCoupon, clearCart
 */
export {};
