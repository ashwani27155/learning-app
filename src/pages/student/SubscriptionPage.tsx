import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check, Star, Zap, Crown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { paymentService, openRazorpayCheckout, type SubscriptionRecord } from "../../services/paymentService";

interface PlanConfig {
  plan: string; displayName: string; priceMonthly: number;
  durationDays: number; features: string[]; isActive: boolean;
}

const PLAN_STYLE: Record<string, { icon: React.ElementType; headerBg: string; btnBg: string; badge?: string }> = {
  silver:   { icon: Star,  headerBg: "bg-gray-700",    btnBg: "bg-gray-700 hover:bg-gray-800" },
  gold:     { icon: Zap,   headerBg: "bg-amber-500",   btnBg: "bg-amber-500 hover:bg-amber-600", badge: "Most Popular" },
  platinum: { icon: Crown, headerBg: "bg-violet-600",  btnBg: "bg-violet-600 hover:bg-violet-700" },
};

export default function SubscriptionPage() {
  const { refreshUser } = useAuth();
  const [params] = useSearchParams();
  const returnTo  = params.get("returnTo") ?? "/dashboard";
  const highlight = params.get("plan") ?? "";

  const [subs,        setSubs]        = useState<SubscriptionRecord[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [paying,      setPaying]      = useState<string | null>(null);
  const [couponCode,  setCouponCode]  = useState("");
  const [couponData,  setCouponData]  = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    paymentService.getMySubscriptions()
      .then(setSubs).catch(() => {}).finally(() => setLoadingSubs(false));
  }, []);

  // Load plan configs from DB
  const { data: planRaw } = useQuery({
    queryKey: ["plan-configs-public"],
    queryFn:  () => api.get<any>("/payments/plan-configs"),
    staleTime: 300_000,
  });
  const allPlans: PlanConfig[] = Array.isArray(planRaw?.data) ? planRaw.data
    : Array.isArray(planRaw) ? planRaw : [];
  const paidPlans = allPlans.filter(p => p.isActive && p.plan !== "free");

  const activeSub  = subs.find(s => s.isActive && new Date(s.endDate) > new Date());
  const activePlan = activeSub?.plan ?? "free";

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res: any = await api.get(`/payments/validate-coupon?code=${couponCode.trim().toUpperCase()}&plan=gold`);
      setCouponData(res?.data ?? res);
      toast.success(`Coupon applied! Save ₹${(res?.data ?? res).discount}`);
    } catch (e: any) {
      toast.error(e.message ?? "Invalid coupon");
      setCouponData(null);
    } finally { setCouponLoading(false); }
  };

  const handleUpgrade = async (planKey: string, planName: string) => {
    setPaying(planKey);
    try {
      const order = await paymentService.createOrder(planKey, undefined, couponData?.code);

      // A coupon can fully cover the price — the server reflects that as
      // amount: 0 and verifyPayment() doesn't require a Razorpay signature
      // for zero-amount orders (same path the free plan already uses).
      if (order.amount === 0) {
        await paymentService.verifyPayment({
          razorpay_order_id: "", razorpay_payment_id: "", razorpay_signature: "",
          paymentId: order.paymentId, plan: planKey,
        });
        await refreshUser();
        toast.success(`${planName} plan activated!`);
        setPaying(null);
        paymentService.getMySubscriptions().then(setSubs).catch(() => {});
        return;
      }

      if (!order.keyId) {
        toast.error("Payments are temporarily unavailable. Please try again later.");
        setPaying(null);
        return;
      }

      openRazorpayCheckout(
        order,
        async (paymentData: any) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id:   paymentData.razorpay_order_id,
              razorpay_payment_id: paymentData.razorpay_payment_id,
              razorpay_signature:  paymentData.razorpay_signature,
              paymentId:           order.paymentId,
              plan:                planKey,
            });
            await refreshUser();
            toast.success(`${planName} plan activated!`);
            paymentService.getMySubscriptions().then(setSubs).catch(() => {});
          } catch (e: any) {
            toast.error(e.message ?? "Payment verification failed");
          } finally { setPaying(null); }
        },
        () => setPaying(null),
      );
    } catch (e: any) {
      toast.error(e.message ?? "Could not create order. Please try again.");
      setPaying(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Subscription Plans</h1>
        <p className="page-subtitle">Unlock premium tests, study materials, and live sessions</p>
      </div>

      {/* Current plan banner */}
      {!loadingSubs && (
        <div className={`mb-6 rounded-2xl p-4 flex items-center gap-4 ${activeSub ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200"}`}>
          <div className="text-2xl">{activeSub ? "💎" : "🎁"}</div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">
              Current plan: <span className="capitalize">{activePlan}</span>
            </p>
            {activeSub ? (
              <p className="text-xs text-gray-500 mt-0.5">
                Active until {new Date(activeSub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">You are on the free plan — upgrade to access premium content.</p>
            )}
          </div>
          {returnTo !== "/dashboard" && (
            <Link to={returnTo} className="text-xs text-primary-600 font-semibold hover:underline whitespace-nowrap">← Back</Link>
          )}
        </div>
      )}

      {/* Coupon code */}
      <div className="mb-5 card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <input className="input-field text-sm" placeholder="Have a promo code? Enter here"
            value={couponCode}
            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponData(null); }}
            onKeyDown={e => e.key === "Enter" && applyCoupon()} />
        </div>
        <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="btn-outline text-sm disabled:opacity-50">
          {couponLoading ? "Checking…" : "Apply"}
        </button>
        {couponData && (
          <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            ✓ {couponData.code} — Save ₹{couponData.discount}
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {paidPlans.map(plan => {
          const style = PLAN_STYLE[plan.plan];
          if (!style) return null;
          const Icon        = style.icon;
          const isCurrent   = activePlan === plan.plan;
          const isHighlight = highlight === plan.plan;

          return (
            <div key={plan.plan}
              className={`relative rounded-2xl border-2 overflow-hidden transition-all ${isHighlight ? "shadow-lg scale-[1.02]" : ""} ${isCurrent ? "border-emerald-400" : "border-gray-200"}`}>

              {style.badge && (
                <div className="absolute top-3 right-3">
                  <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{style.badge}</span>
                </div>
              )}

              <div className={`${style.headerBg} text-white px-5 py-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-lg">{plan.displayName}</span>
                </div>
                <div className="text-white/70 text-xs">Full access for {plan.durationDays} days</div>
              </div>

              <div className="p-5">
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-bold text-gray-900">₹{Math.round(plan.priceMonthly / 100)}</span>
                  <span className="text-gray-400 text-sm mb-1">/ month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-emerald-100 text-emerald-700">
                    ✓ Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.plan, plan.displayName)}
                    disabled={!!paying}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 ${style.btnBg}`}
                  >
                    {paying === plan.plan ? "Processing…" : `Upgrade to ${plan.displayName}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-gray-400">
        <p>Plans expire after {paidPlans[0]?.durationDays ?? 30} days. No auto-renewal. Cancel anytime.</p>
        <p className="mt-1">Payments secured by <strong>Razorpay</strong> · UPI, Cards, Net Banking accepted.</p>
      </div>
    </div>
  );
}
