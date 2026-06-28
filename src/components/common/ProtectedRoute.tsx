import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f7f4fc" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
}

export function AdminRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin-login" replace />;
  if (user.role !== "admin" && user.role !== "superadmin")
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
