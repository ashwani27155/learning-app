import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Zap, Star, Crown, Shield } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface PlanConfig {
  plan: string; displayName: string; priceMonthly: number;
  durationDays: number; features: string[]; isActive: boolean;
}

const PLAN_META: Record<string, {
  icon: React.ElementType; badge?: string;
  color: string; headerBg: string; iconBg: string;
  checkColor: string; btnClass: string;
}> = {
  free: {
    icon: Shield,
    color: "border-gray-200",
    headerBg: "bg-gray-50",
    iconBg: "bg-gray-100 text-gray-600",
    checkColor: "text-gray-500",
    btnClass: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  },
  silver: {
    icon: Star,
    color: "border-gray-300",
    headerBg: "bg-gradient-to-b from-slate-100 to-gray-50",
    iconBg: "bg-gray-200 text-gray-700",
    checkColor: "text-gray-600",
    btnClass: "bg-gray-700 text-white hover:bg-gray-800",
  },
  gold: {
    icon: Zap, badge: "Most Popular",
    color: "border-amber-400 shadow-lg shadow-amber-100",
    headerBg: "bg-gradient-to-b from-amber-400 to-yellow-300",
    iconBg: "bg-white/60 text-amber-700",
    checkColor: "text-amber-600",
    btnClass: "bg-amber-500 text-white hover:bg-amber-600",
  },
  platinum: {
    icon: Crown, badge: "Best Value",
    color: "border-violet-400",
    headerBg: "bg-gradient-to-b from-violet-700 to-purple-500",
    iconBg: "bg-white/20 text-white",
    checkColor: "text-violet-600",
    btnClass: "bg-violet-600 text-white hover:bg-violet-700",
  },
};

const FALLBACK_PLANS: PlanConfig[] = [
  { plan: "free",     displayName: "Free",     priceMonthly: 0,     durationDays: 0,  isActive: true, features: ["2 Test Series", "3 Mock Tests/month", "5 PDF Downloads", "Basic Analytics", "Daily Quiz"] },
  { plan: "silver",   displayName: "Silver",   priceMonthly: 29900, durationDays: 30, isActive: true, features: ["5 Test Series", "15 Mock Tests/month", "20 PDF Downloads", "Standard Analytics", "Ad-free", "Weekly Current Affairs"] },
  { plan: "gold",     displayName: "Gold",     priceMonthly: 59900, durationDays: 30, isActive: true, features: ["Unlimited Test Series", "Unlimited Mock Tests", "Unlimited PDFs", "Advanced Analytics", "Live Tests", "Ebooks", "Daily Current Affairs"] },
  { plan: "platinum", displayName: "Platinum", priceMonthly: 99900, durationDays: 30, isActive: true, features: ["Everything in Gold", "1:1 Instructor Q&A", "Priority Support", "Early Access", "Certificate on Pass", "Study Plan Guidance"] },
];

export default function PricingPage() {
  const { user } = useAuth();

  const { data: planRaw } = useQuery({
    queryKey: ["plan-configs-public"],
    queryFn:  () => api.get<any>("/payments/plan-configs"),
    staleTime: 300_000,
  });

  const plans: PlanConfig[] = (() => {
    const raw = Array.isArray(planRaw?.data) ? planRaw.data
      : Array.isArray(planRaw) ? planRaw : [];
    return raw.length > 0 ? raw : FALLBACK_PLANS;
  })();

  const currentPlan = (user?.subscriptions?.[0] as any)?.plan ?? "free";

  return (
    <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-white to-purple-50/30">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block bg-primary-100 text-primary-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wide">
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-primary-600 to-violet-500 bg-clip-text text-transparent">
              Success Plan
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Start free, upgrade anytime. All plans include access to the full MPSC Sadhak platform.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {plans.filter(p => p.isActive).map(plan => {
            const meta = PLAN_META[plan.plan] ?? PLAN_META.free;
            const Icon = meta.icon;
            const isPlatinum = plan.plan === "platinum";
            const isCurrent  = currentPlan === plan.plan;

            return (
              <div key={plan.plan}
                className={`relative rounded-3xl border-2 overflow-hidden flex flex-col transition-all hover:-translate-y-1 bg-white ${meta.color}`}>

                {/* Badge */}
                {meta.badge && (
                  <div className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${plan.plan === "gold" ? "bg-amber-500 text-white" : "bg-violet-600 text-white"}`}>
                    {meta.badge}
                  </div>
                )}

                {/* Header */}
                <div className={`px-6 pt-7 pb-5 ${meta.headerBg}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${meta.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className={`text-xl font-black mb-1 ${isPlatinum ? "text-white" : "text-gray-900"}`}>
                    {plan.displayName}
                  </h3>
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl font-black ${isPlatinum ? "text-white" : "text-gray-900"}`}>
                      {plan.priceMonthly === 0 ? "Free" : `₹${Math.round(plan.priceMonthly / 100)}`}
                    </span>
                    {plan.priceMonthly > 0 && (
                      <span className={`text-sm pb-1 ${isPlatinum ? "text-primary-200" : "text-gray-500"}`}>/month</span>
                    )}
                  </div>
                  {plan.durationDays > 0 && (
                    <p className={`text-xs mt-1 ${isPlatinum ? "text-primary-200" : "text-gray-400"}`}>
                      {plan.durationDays}-day · Cancel anytime
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="px-6 py-5 flex-1 space-y-2.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${meta.checkColor}`} />
                      <span className="text-sm text-gray-700">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-6 pb-7 pt-2">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl text-center text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Current Plan
                    </div>
                  ) : (
                    <Link
                      to={user ? "/dashboard/subscription" : "/auth/login"}
                      state={{ plan: plan.plan }}
                      className={`block w-full py-2.5 rounded-xl text-center text-sm font-bold transition-all ${meta.btnClass}`}
                    >
                      {plan.priceMonthly === 0 ? "Get Started Free" : `Get ${plan.displayName}`}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          {["No hidden charges", "Cancel anytime", "Instant activation", "30-day access guarantee"].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
