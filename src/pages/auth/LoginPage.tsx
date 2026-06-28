import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user?.name?.split(" ")?.[0] || "User"}!`);
      navigate(user.role === "admin" || user.role === "superadmin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Login failed. Please try again.");
    }
  };

  const fill = (email: string, password: string) => {
    setValue("email", email);
    setValue("password", password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg,#f4effe 0%,#e8d9fd 50%,#f0e8ff 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-phonepe-card flex items-center justify-center text-white font-bold text-2xl shadow-purple-md">
              M
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Welcome Back!</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue your preparation</p>
        </div>

        {/* Demo credentials */}
        <div className="rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-4 mb-4">
          <p className="text-xs font-bold text-primary-700 uppercase tracking-wide mb-3">
            🔑 Quick Access — Click to fill
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fill("student@mpsc.com", "Student@123")}
              className="text-left p-3 bg-white rounded-xl border border-emerald-200 hover:border-emerald-400 transition-all"
            >
              <div className="text-xs font-bold text-emerald-700 mb-1">🎓 Student</div>
              <div className="text-xs text-gray-500 font-mono">student@mpsc.com</div>
            </button>
            <button
              type="button"
              onClick={() => fill("admin@mpsc.com", "Admin@123")}
              className="text-left p-3 bg-white rounded-xl border border-primary-200 hover:border-primary-400 transition-all"
            >
              <div className="text-xs font-bold text-primary-700 mb-1">⚙️ Admin</div>
              <div className="text-xs text-gray-500 font-mono">admin@mpsc.com</div>
            </button>
          </div>
        </div>

        <div className="card p-8 shadow-purple-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className={`input-field ${errors.email ? "border-red-400 focus:ring-red-300" : ""}`}
                placeholder="your@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className={`input-field ${errors.password ? "border-red-400 focus:ring-red-300" : ""}`}
                placeholder="Enter password"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
              <div className="text-right mt-1">
                <Link to="/auth/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center mt-2 disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Login →"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-primary-600 font-semibold hover:underline">
              Register for free
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By logging in you agree to our{" "}
          <Link to="/terms" className="hover:underline">Terms</Link> &amp;{" "}
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
