import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { DEMO_MODE } from "@/lib/demoMode";

const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const step2Schema = z.object({
  targetExam: z.string().min(1, "Please select a target exam"),
  district: z.string().optional(),
  referral: z.string().optional(),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;

const exams = [
  { key: "RAJYASEVA", label: "Rajyaseva",  desc: "Class I & II Gazetted (Group A)" },
  { key: "PSI",       label: "PSI",        desc: "Police Sub Inspector (Group B)" },
  { key: "STI",       label: "STI",        desc: "Sales Tax Inspector (Group B)" },
  { key: "ASO",       label: "ASO",        desc: "Asst. Section Officer (Group B)" },
  { key: "COMBINED",  label: "Combined",   desc: "Group B Combined Exam" },
];

const districts = [
  "Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana",
  "Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna",
  "Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded",
  "Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad",
  "Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha",
  "Washim","Yavatmal",
];

function strengthScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8)             s++;
  if (/[A-Z]/.test(pw))          s++;
  if (/[0-9]/.test(pw))          s++;
  if (/[^A-Za-z0-9]/.test(pw))   s++;
  return s;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-600"];


export default function RegisterPage() {
  const [step,      setStep]      = useState(1);
  const [step1Data, setStep1Data] = useState<Step1 | null>(null);
  const [showPass,  setShowPass]  = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnPlan = searchParams.get("plan");
  const { login, register } = useAuth();

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) });

  const selectedExam = form2.watch("targetExam");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) form2.setValue("referral", ref);
  }, [searchParams, form2]);

  const onStep1 = (data: Step1) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2 = async (data: Step2) => {
    if (!step1Data) return;

    if (DEMO_MODE) {
      await login(step1Data.email, "demo");
      toast.success("Account created! Welcome to MPSC Sadhak 🎉");
      navigate(returnPlan ? `/dashboard/subscription?plan=${returnPlan}` : "/dashboard");
      return;
    }

    try {
      await register({
        name: step1Data.name.trim(),
        email: step1Data.email.trim(),
        phone: step1Data.phone.trim(),
        password: step1Data.password,
        language: "mr",
        targetExam: data.targetExam,
        district: data.district,
        referral: data.referral,
      });
      toast.success("Account created! Welcome to MPSC Sadhak 🎉");
      navigate(returnPlan ? `/dashboard/subscription?plan=${returnPlan}` : "/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Registration failed. Please try again.");
      setStep(1);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #f4effe 0%, #e8d9fd 50%, #f0e8ff 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-phonepe-card flex items-center justify-center text-white font-bold text-2xl shadow-purple-md">
              M
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Free forever — no credit card required</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 2 && (
                <div className={`w-12 h-1 rounded-full ${step > s ? "bg-primary-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-20 text-xs text-gray-400 mb-6">
          <span className={step >= 1 ? "text-primary-600 font-medium" : ""}>Basic Info</span>
          <span className={step >= 2 ? "text-primary-600 font-medium" : ""}>Exam Details</span>
        </div>

        <div className="card p-8 shadow-lg">
          {step === 1 ? (
            <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  className={`input-field ${form1.formState.errors.name ? "border-red-400" : ""}`}
                  placeholder="Arjun Patil"
                  {...form1.register("name")}
                />
                {form1.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-600">{form1.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  className={`input-field ${form1.formState.errors.email ? "border-red-400" : ""}`}
                  placeholder="your@email.com"
                  {...form1.register("email")}
                />
                {form1.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-600">{form1.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 flex-shrink-0">
                    +91
                  </span>
                  <input
                    type="tel"
                    className={`input-field ${form1.formState.errors.phone ? "border-red-400" : ""}`}
                    placeholder="9XXXXXXXXX"
                    {...form1.register("phone")}
                  />
                </div>
                {form1.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{form1.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className={`input-field pr-14 ${form1.formState.errors.password ? "border-red-400" : ""}`}
                    placeholder="Minimum 8 characters"
                    {...form1.register("password")}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-medium">
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                {form1.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-600">{form1.formState.errors.password.message}</p>
                )}
                {/* Password strength meter */}
                {(() => {
                  const pw = form1.watch("password") ?? "";
                  const score = pw.length > 0 ? strengthScore(pw) : 0;
                  if (pw.length === 0) return null;
                  return (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? STRENGTH_COLORS[score] : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <p className={`text-[10px] font-semibold ${score <= 1 ? "text-red-500" : score === 2 ? "text-amber-500" : "text-emerald-600"}`}>
                        {STRENGTH_LABELS[score]}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <button type="submit" className="btn-primary w-full justify-center">
                Continue →
              </button>
            </form>
          ) : (
            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Exam *</label>
                <div className="grid grid-cols-2 gap-2">
                  {exams.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => form2.setValue("targetExam", e.key)}
                      className={`py-2.5 px-3 rounded-xl border-2 text-left transition-all ${
                        selectedExam === e.key
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`text-sm font-bold ${selectedExam === e.key ? "text-primary-700" : "text-gray-700"}`}>{e.label}</div>
                      <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{e.desc}</div>
                    </button>
                  ))}
                </div>
                {form2.formState.errors.targetExam && (
                  <p className="mt-1 text-xs text-red-600">{form2.formState.errors.targetExam.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <select className="input-field" {...form2.register("district")}>
                  <option value="">-- Select District --</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referral Code (Optional)
                </label>
                <input
                  className="input-field"
                  placeholder="Enter referral code for bonus"
                  {...form2.register("referral")}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost border border-gray-200 flex-1 justify-center"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={form2.formState.isSubmitting}
                  className="btn-primary flex-1 justify-center disabled:opacity-60"
                >
                  {form2.formState.isSubmitting ? "Creating account…" : "🎉 Create Account"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary-600 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
