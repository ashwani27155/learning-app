import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const schema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const user = await login(data.email, data.password);
      if (user.role !== "admin" && user.role !== "superadmin") {
        toast.error("Access denied. This portal is for admins only.");
        return;
      }
      toast.success(`Welcome, ${user?.name?.split(" ")?.[0] || "Admin"}!`);
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message ?? "Login failed. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #060b18 0%, #0a1628 40%, #0d1f3c 70%, #091525 100%)" }}
    >
      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient glow blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-600 opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-900 opacity-15 blur-3xl pointer-events-none" />

      {/* Top brand bar */}
      <div
        className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-slate-800"
        style={{ background: "rgba(6, 11, 24, 0.9)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-phonepe-gradient flex items-center justify-center text-white text-xs font-bold">
            M
          </div>
          <span className="text-white font-semibold text-sm">MPSC Sadhak</span>
          <span className="text-slate-600 mx-1">/</span>
          <span className="text-slate-400 text-xs">Administration</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
          Secure Connection
        </div>
      </div>

      {/* Center vault card */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-48px)] px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Card */}
          <div
            className="rounded-2xl border p-8"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              borderColor: "rgba(59, 130, 246, 0.2)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 0 1px rgba(59,130,246,0.08), 0 32px 64px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.06)",
            }}
          >
            {/* Identity block */}
            <div className="text-center mb-2">
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center border"
                style={{
                  background: "linear-gradient(135deg, #3b0764 0%, #7c3aed 100%)",
                  borderColor: "rgba(59,130,246,0.4)",
                  boxShadow: "0 0 20px rgba(59,130,246,0.25)",
                }}
              >
                <ShieldCheck className="w-6 h-6 text-primary-300" />
              </div>
              <h2 className="text-white font-semibold text-lg mt-3">Admin Sign In</h2>
              <p className="text-slate-500 text-xs mt-1">Restricted — Authorised Personnel Only</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-[10px] uppercase tracking-wider">Secure Portal</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Demo credentials */}
            <div className="rounded-xl border border-dashed border-slate-700 p-3 mb-5" style={{ background: "rgba(15,23,42,0.5)" }}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                🔑 Demo — Click to fill credentials
              </p>
              <button
                type="button"
                onClick={() => { setValue("email", "admin@mpsc.com"); setValue("password", "Admin@123"); }}
                className="w-full text-left p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-primary-600 transition-all"
              >
                <div className="text-xs font-bold text-primary-400 mb-1">⚙️ Demo Admin Account</div>
                <div className="text-xs text-slate-500 font-mono">admin@mpsc.com · Admin@123</div>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  className={`w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600
                    border transition-all focus:outline-none focus:ring-2
                    bg-slate-900/80
                    ${errors.email
                      ? "border-red-700 focus:ring-red-500/20"
                      : "border-slate-700 focus:ring-primary-500/30 focus:border-primary-500"
                    }`}
                  placeholder="admin@example.com"
                  {...register("email")}
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className={`w-full px-4 py-3 pr-14 rounded-xl text-sm text-white placeholder-slate-600
                      border transition-all focus:outline-none focus:ring-2
                      bg-slate-900/80
                      ${errors.password
                        ? "border-red-700 focus:ring-red-500/20"
                        : "border-slate-700 focus:ring-primary-500/30 focus:border-primary-500"
                      }`}
                    placeholder="Enter password"
                    {...register("password")}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors">
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                <div className="text-right mt-1">
                  <Link to="/auth/forgot-password" className="text-xs text-slate-500 hover:text-slate-300 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                  text-white transition-all disabled:opacity-50 mt-2 hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}
              >
                <ShieldCheck className="w-4 h-4" />
                {isSubmitting ? "Verifying…" : "Admin Sign In"}
              </button>
            </form>
          </div>

          {/* Below card links */}
          <div className="text-center mt-5">
            <p className="text-xs text-slate-600">
              Student?{" "}
              <Link to="/auth/login" className="text-slate-400 font-medium hover:text-white hover:underline transition-colors">
                Go to Student Login →
              </Link>
            </p>
            <p className="text-[10px] text-slate-700 mt-3">MPSC Sadhak Admin Console v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
