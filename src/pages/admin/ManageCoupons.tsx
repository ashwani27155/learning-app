import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Tag, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { api } from "../../lib/api";
import { SkeletonKPICard } from "../../components/common/Skeleton";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { DEMO_MODE } from "@/lib/demoMode";

type DiscountType = "percentage" | "fixed";

interface Coupon {
  id:            string;
  code:          string;
  discountType:  DiscountType;
  discountValue: number;
  maxDiscount?:  number | null;
  minOrder:      number;
  usageLimit?:   number | null;
  usedCount:     number;
  validFrom:     string;
  validTill:     string;
  isActive:      boolean;
}

const MOCK_COUPONS: Coupon[] = [
  { id: "1", code: "WELCOME50",  discountType: "percentage", discountValue: 50, maxDiscount: 500,  minOrder: 0,   usageLimit: 1000, usedCount: 412, validFrom: "2026-01-01", validTill: "2026-12-31", isActive: true },
  { id: "2", code: "FLAT200",    discountType: "fixed",      discountValue: 200, maxDiscount: null, minOrder: 999, usageLimit: 500,  usedCount: 88,  validFrom: "2026-03-01", validTill: "2026-06-30", isActive: true },
  { id: "3", code: "EXPIRED10",  discountType: "percentage", discountValue: 10, maxDiscount: 100,  minOrder: 0,   usageLimit: null, usedCount: 230, validFrom: "2025-01-01", validTill: "2025-12-31", isActive: false },
];

interface CouponForm {
  code:          string;
  discountType:  DiscountType;
  discountValue: string;
  maxDiscount:   string;
  minOrder:      string;
  usageLimit:    string;
  validFrom:     string;
  validTill:     string;
}

function CouponFormModal({ coupon, onClose, onSaved, onDemoSave }: {
  coupon?: Coupon; onClose: () => void; onSaved: () => void;
  onDemoSave?: (data: Partial<Coupon>, id?: string) => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!coupon;

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<CouponForm>({
    defaultValues: coupon ? {
      code:          coupon.code,
      discountType:  coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscount:   coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      minOrder:      String(coupon.minOrder ?? 0),
      usageLimit:    coupon.usageLimit != null ? String(coupon.usageLimit) : "",
      validFrom:     coupon.validFrom.slice(0, 10),
      validTill:     coupon.validTill.slice(0, 10),
    } : { discountType: "percentage", minOrder: "0" },
  });

  const onSubmit = async (data: CouponForm) => {
    try {
      const payload = {
        code:          data.code.trim().toUpperCase(),
        discountType:  data.discountType,
        discountValue: Number(data.discountValue),
        maxDiscount:   data.maxDiscount ? Number(data.maxDiscount) : undefined,
        minOrder:      data.minOrder ? Number(data.minOrder) : 0,
        usageLimit:    data.usageLimit ? Number(data.usageLimit) : undefined,
        validFrom:     data.validFrom,
        validTill:     data.validTill,
      };
      if (DEMO_MODE) {
        onDemoSave?.(payload, isEdit ? coupon!.id : undefined);
        toast.success(isEdit ? "Coupon updated" : "Coupon created");
        onSaved();
        return;
      }
      if (isEdit) await api.put(`/admin/coupons/${coupon!.id}`, payload);
      else        await api.post("/admin/coupons", payload);
      toast.success(isEdit ? "Coupon updated" : "Coupon created");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{isEdit ? "Edit Coupon" : "Add New Coupon"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
            <input className="input-field uppercase" placeholder="e.g. WELCOME50" {...register("code", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
              <select className="input-field" {...register("discountType", { required: true })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
              <input type="number" step="0.01" className="input-field" placeholder="e.g. 50" {...register("discountValue", { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
              <input type="number" className="input-field" placeholder="Optional cap" {...register("maxDiscount")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
              <input type="number" className="input-field" placeholder="0" {...register("minOrder")} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
            <input type="number" className="input-field" placeholder="Leave blank for unlimited" {...register("usageLimit")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
              <input type="date" className="input-field" {...register("validFrom", { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Till *</label>
              <input type="date" className="input-field" {...register("validTill", { required: true })} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {isSubmitting ? "Saving…" : isEdit ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RedemptionsModal({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupon-redemptions", coupon.code],
    queryFn:  () => api.get<any>(`/admin/coupons/${encodeURIComponent(coupon.code)}/redemptions?page=1&limit=20`),
  });
  const summary = data?.data?.summary;
  const payments: any[] = data?.data?.payments ?? [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Redemptions — {coupon.code}</h2>
            <p className="text-xs text-gray-400">Who redeemed this coupon and what it drove</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-lg font-bold text-gray-900">{summary?.redemptions ?? 0}</div>
                  <div className="text-[11px] text-gray-400">Paid redemptions</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-lg font-bold text-emerald-600">₹{(summary?.totalRevenue ?? 0).toLocaleString()}</div>
                  <div className="text-[11px] text-gray-400">Revenue driven</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-lg font-bold text-amber-600">₹{(summary?.totalDiscount ?? 0).toLocaleString()}</div>
                  <div className="text-[11px] text-gray-400">Discount given</div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent redemptions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {payments.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">No redemptions recorded yet.</p>
                  )}
                  {payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-gray-50">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{p.user?.name ?? "—"}</div>
                        <div className="text-xs text-gray-400 truncate">{p.user?.email ?? "—"}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-gray-900">₹{p.amount}</div>
                        <div className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 btn-ghost border border-gray-200 justify-center">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function ManageCoupons() {
  const qc = useQueryClient();
  const [showForm, setShowForm]     = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [redemptionsTarget, setRedemptionsTarget] = useState<Coupon | null>(null);
  const [search, setSearch] = useState("");
  const [demoCoupons, setDemoCoupons] = useState<Coupon[]>(MOCK_COUPONS);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn:  () => api.get<any>("/admin/coupons"),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? { data: MOCK_COUPONS } : undefined,
  });
  const coupons: Coupon[] = DEMO_MODE ? demoCoupons : ((data as any)?.data ?? []);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });

  const toggleActive = (c: Coupon) => {
    if (DEMO_MODE) {
      setDemoCoupons(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !x.isActive } : x));
      toast.success("Coupon status updated");
      return;
    }
    api.patch(`/admin/coupons/${c.id}/toggle`)
      .then(() => { toast.success("Coupon status updated"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"));
  };

  const confirmDeleteCoupon = () => {
    const c = deleteTarget;
    if (!c) return;
    if (DEMO_MODE) {
      setDemoCoupons(prev => prev.filter(x => x.id !== c.id));
      toast.success("Coupon deleted");
      setDeleteTarget(null);
      return;
    }
    api.delete(`/admin/coupons/${c.id}`)
      .then(() => { toast.success("Coupon deleted"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"))
      .finally(() => setDeleteTarget(null));
  };

  const handleDemoSave = (couponData: Partial<Coupon>, existingId?: string) => {
    if (existingId) {
      setDemoCoupons(prev => prev.map(c => c.id === existingId ? { ...c, ...couponData } : c));
    } else {
      const newCoupon: Coupon = {
        id: String(Date.now()),
        usedCount: 0,
        isActive: true,
        minOrder: 0,
        ...couponData,
      } as Coupon;
      setDemoCoupons(prev => [newCoupon, ...prev]);
    }
  };

  const isExpired = (c: Coupon) => new Date(c.validTill) < new Date();

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Coupons</h1>
          <p className="page-subtitle">Create and manage discount coupons for subscriptions</p>
        </div>
        <button onClick={() => { setEditCoupon(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)
          : [
              { label: "Total Coupons", value: coupons.length },
              { label: "Active",        value: coupons.filter(c => c.isActive && !isExpired(c)).length },
              { label: "Expired",       value: coupons.filter(isExpired).length },
              { label: "Total Redemptions", value: coupons.reduce((a, c) => a + (c.usedCount ?? 0), 0) },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input-field pl-9" placeholder="Search by coupon code..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Coupon list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonKPICard key={i} />)
          : filtered.map(c => {
              const expired = isExpired(c);
              return (
                <div key={c.id} className={`card p-5 transition-all ${(!c.isActive || expired) ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm tracking-wide">{c.code}</div>
                        <div className="text-xs text-gray-400">
                          {c.discountType === "percentage" ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                          {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      expired ? "bg-gray-100 text-gray-500" : c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {expired ? "Expired" : c.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <button
                      type="button"
                      onClick={() => !DEMO_MODE && setRedemptionsTarget(c)}
                      disabled={DEMO_MODE}
                      className="bg-gray-50 rounded-lg p-2 hover:bg-primary-50 transition-colors disabled:cursor-default disabled:hover:bg-gray-50"
                      title={DEMO_MODE ? undefined : "View redemption breakdown"}
                    >
                      <div className="text-sm font-bold text-gray-900">{c.usedCount}</div>
                      <div className="text-[10px] text-gray-400">Used</div>
                    </button>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-sm font-bold text-gray-900">{c.usageLimit ?? "∞"}</div>
                      <div className="text-[10px] text-gray-400">Limit</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-sm font-bold text-gray-900">₹{c.minOrder}</div>
                      <div className="text-[10px] text-gray-400">Min order</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Valid {new Date(c.validFrom).toLocaleDateString("en-IN")} → {new Date(c.validTill).toLocaleDateString("en-IN")}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => { setEditCoupon(c); setShowForm(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(c)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        c.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {c.isActive ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full card">
            <EmptyState
              icon="🏷️"
              title={coupons.length === 0 ? "No coupons yet" : "No coupons match your search"}
              description={coupons.length === 0 ? "Create your first discount coupon to boost conversions" : "Try a different search term"}
            />
          </div>
        )}
      </div>

      {showForm && (
        <CouponFormModal
          coupon={editCoupon ?? undefined}
          onClose={() => { setShowForm(false); setEditCoupon(null); }}
          onSaved={() => { setShowForm(false); setEditCoupon(null); }}
          onDemoSave={handleDemoSave}
        />
      )}

      {redemptionsTarget && (
        <RedemptionsModal coupon={redemptionsTarget} onClose={() => setRedemptionsTarget(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete coupon?"
        message={<>This will permanently remove <strong>{deleteTarget?.code}</strong>. This cannot be undone.</>}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDeleteCoupon}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
