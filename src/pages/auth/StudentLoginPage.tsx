import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { BookOpen, BarChart2, Trophy, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const schema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

const features = [
  { icon: BookOpen,  label: "2,500+ Tests" },
  { icon: BarChart2, label: "Smart Analytics" },
  { icon: Trophy,    label: "Leaderboard" },
  { icon: Zap,       label: "Daily Practice" },
];

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      const user = await login(data.email, data.password);
      if (user.role === "admin" || user.role === "superadmin") {
        toast.error("Use the Admin Login portal to sign in as admin.");
        return;
      }
      toast.success(`Welcome back, ${user?.name?.split(" ")?.[0] || "User"}!`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Login failed. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 py-10"
      style={{ background: "linear-gradient(160deg, #0f0a2e 0%, #6d28d9 30%, #7c3aed 65%, #a78bfa 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary-400 opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-accent-400 opacity-15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-700 opacity-10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold text-3xl shadow-purple-lg mx-auto">
              M
            </div>
            <div>
              <div className="text-2xl font-bold text-white mt-2">MPSC Sadhak</div>
              <div className="text-xs text-primary-200 font-semibold tracking-widest uppercase">Student Portal</div>
            </div>
          </Link>
          <p className="text-white/70 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
            Join 50,000+ aspirants preparing smarter with bilingual mock tests &amp; AI analytics.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs">
              <Icon className="w-3 h-3" />
              {label}
            </div>
          ))}
        </div>

        {/* Demo box */}
        <div className="rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 p-4 mb-4">
          <p className="text-xs font-bold text-primary-700 uppercase tracking-wide mb-2">
            🔑 Demo — Click to fill credentials
          </p>
          <button
            type="button"
            onClick={() => { setValue("email", "student@mpsc.com"); setValue("password", "Student@123"); }}
            className="w-full text-left p-3 bg-white rounded-xl border border-emerald-200 hover:border-emerald-400 transition-all"
          >
            <div className="text-xs font-bold text-emerald-700 mb-1">🎓 Demo Student Account</div>
            <div className="text-xs text-gray-500 font-mono">student@mpsc.com · Student@123</div>
          </button>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-purple-lg p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Student Sign In</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className={`input-field ${errors.email ? "border-red-400 focus:ring-red-300" : ""}`}
                placeholder="your@email.com"
                {...register("email")}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={`input-field pr-14 ${errors.password ? "border-red-400 focus:ring-red-300" : ""}`}
                  placeholder="Enter password"
                  {...register("password")}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors">
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
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
              {isSubmitting ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-primary-600 font-semibold hover:underline">
              Register for free
            </Link>
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex justify-center gap-8 mt-7 text-center">
          {[["50K+", "Students"], ["94%", "Success Rate"], ["1.5L+", "Questions"]].map(([num, label]) => (
            <div key={label}>
              <p className="text-white font-bold text-xl">{num}</p>
              <p className="text-white/60 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-5 text-center">
          <p className="text-xs text-white/30">
            By logging in you agree to our{" "}
            <Link to="/terms" className="hover:underline">Terms</Link> &amp;{" "}
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
