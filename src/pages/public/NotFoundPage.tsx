import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #f4effe 0%, #e8d9fd 50%, #f0e8ff 100%)" }}
    >
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-phonepe-card flex items-center justify-center text-white font-bold text-3xl shadow-purple-md mx-auto mb-6">
          M
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-lg font-semibold text-gray-700 mb-2">Page not found</p>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or may have been moved.</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-xl bg-phonepe-card text-white font-semibold shadow-purple-md hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
