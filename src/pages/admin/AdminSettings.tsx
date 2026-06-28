import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, CreditCard, Shield, Zap, Eye, Gift, HelpCircle, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

interface PlanConfig {
  id: string; plan: string; displayName: string;
  priceMonthly: number; durationDays: number;
  features: string[]; isActive: boolean;
}

interface FAQ {
  id: string; question: string; questionMr?: string;
  answer: string; answerMr?: string;
  category?: string; orderIndex: number; isActive: boolean;
}

const FAQ_EMPTY: Omit<FAQ, "id" | "isActive"> = {
  question: "", questionMr: "", answer: "", answerMr: "", category: "", orderIndex: 0,
};

const PLAN_COLORS: Record<string, string> = {
  free:     "border-gray-200 bg-gray-50",
  silver:   "border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100",
  gold:     "border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-50",
  platinum: "border-violet-300 bg-gradient-to-b from-violet-50 to-purple-50",
};

const PLAN_BADGE: Record<string, string> = {
  free:     "bg-gray-100 text-gray-600",
  silver:   "bg-gray-200 text-gray-700",
  gold:     "bg-amber-100 text-amber-700",
  platinum: "bg-violet-100 text-violet-700",
};

function ToggleSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-violet-600" : "bg-gray-200"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function FAQSection({ qc, faqForm, setFaqForm, editFaqId, setEditFaqId, showFaqForm, setShowFaqForm }: {
  qc: ReturnType<typeof useQueryClient>;
  faqForm: Omit<FAQ, "id" | "isActive">; setFaqForm: React.Dispatch<React.SetStateAction<Omit<FAQ, "id" | "isActive">>>;
  editFaqId: string | null; setEditFaqId: (id: string | null) => void;
  showFaqForm: boolean; setShowFaqForm: (v: boolean) => void;
}) {
  const { data: faqsRaw, isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn:  () => api.get<any>("/admin/faqs?includeInactive=true"),
    staleTime: 30_000,
  });
  const faqs: FAQ[] = Array.isArray(faqsRaw?.data) ? faqsRaw.data
    : Array.isArray(faqsRaw) ? faqsRaw : [];

  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-faqs"] });
    qc.invalidateQueries({ queryKey: ["faqs"] });
  };

  const createFaq = useMutation({
    mutationFn: (body: Omit<FAQ, "id" | "isActive">) => api.post("/admin/faqs", body),
    onSuccess: () => { toast.success("FAQ created"); invalidate(); setShowFaqForm(false); setFaqForm(FAQ_EMPTY); },
    onError:   () => toast.error("Failed to create FAQ"),
  });

  const updateFaq = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Omit<FAQ, "id">> }) => api.put(`/admin/faqs/${id}`, body),
    onSuccess: () => { toast.success("FAQ updated"); invalidate(); setShowFaqForm(false); setEditFaqId(null); setFaqForm(FAQ_EMPTY); },
    onError:   () => toast.error("Failed to update FAQ"),
  });

  const deleteFaq = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/faqs/${id}`),
    onSuccess: () => { toast.success("FAQ deleted"); invalidate(); },
    onError:   () => toast.error("Failed to delete FAQ"),
    onSettled: () => setDeleteTarget(null),
  });

  const toggleFaq = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/faqs/${id}/toggle`),
    onSuccess: () => invalidate(),
    onError:   () => toast.error("Failed to toggle FAQ"),
  });

  const openCreate = () => { setEditFaqId(null); setFaqForm(FAQ_EMPTY); setShowFaqForm(true); };
  const openEdit   = (f: FAQ) => {
    setEditFaqId(f.id);
    setFaqForm({ question: f.question, questionMr: f.questionMr ?? "", answer: f.answer, answerMr: f.answerMr ?? "", category: f.category ?? "", orderIndex: f.orderIndex });
    setShowFaqForm(true);
  };
  const handleSave = () => {
    const body = { ...faqForm, orderIndex: Number(faqForm.orderIndex) };
    if (editFaqId) updateFaq.mutate({ id: editFaqId, body });
    else createFaq.mutate(body);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary-600" />
          <h3 className="font-bold text-gray-900">FAQ Management</h3>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add FAQ
        </button>
      </div>

      {/* Inline form */}
      {showFaqForm && (
        <div className="mb-5 border border-primary-200 rounded-2xl p-4 bg-primary-50 space-y-3">
          <h4 className="font-semibold text-gray-800 text-sm">{editFaqId ? "Edit FAQ" : "New FAQ"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Question (English) *</label>
              <input className="input-field" value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} placeholder="e.g. Is this platform free?" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Question (Marathi)</label>
              <input className="input-field" value={faqForm.questionMr} onChange={e => setFaqForm(f => ({ ...f, questionMr: e.target.value }))} placeholder="मराठी प्रश्न" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Answer (English) *</label>
              <textarea rows={3} className="input-field resize-none" value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} placeholder="Answer in English…" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Answer (Marathi)</label>
              <textarea rows={2} className="input-field resize-none" value={faqForm.answerMr} onChange={e => setFaqForm(f => ({ ...f, answerMr: e.target.value }))} placeholder="मराठी उत्तर…" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <input className="input-field" value={faqForm.category} onChange={e => setFaqForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. General, Tests, Billing" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Order Index</label>
              <input type="number" min={0} className="input-field" value={faqForm.orderIndex} onChange={e => setFaqForm(f => ({ ...f, orderIndex: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowFaqForm(false); setEditFaqId(null); setFaqForm(FAQ_EMPTY); }} className="btn-ghost border border-gray-200 text-sm">Cancel</button>
            <button onClick={handleSave} disabled={createFaq.isPending || updateFaq.isPending} className="btn-primary text-sm disabled:opacity-60">
              {createFaq.isPending || updateFaq.isPending ? "Saving…" : editFaqId ? "Update FAQ" : "Create FAQ"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-6">Loading FAQs…</p>
      ) : faqs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No FAQs yet. Click "Add FAQ" to create the first one.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {faqs.map(f => (
            <div key={f.id} className="flex items-start gap-3 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <span className="text-sm font-medium text-gray-900 line-clamp-1">{f.question}</span>
                  {f.category && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex-shrink-0">{f.category}</span>}
                </div>
                <p className="text-xs text-gray-400 ml-3.5 line-clamp-1">{f.answer}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleFaq.mutate(f.id)} title={f.isActive ? "Disable" : "Enable"} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  {f.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(f)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete FAQ?"
        message={<>This will permanently remove "<strong>{deleteTarget?.question}</strong>". This cannot be undone.</>}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => deleteTarget && deleteFaq.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function AdminSettings() {
  const qc = useQueryClient();

  const [platform, setPlatform] = useState({ name: "MPSC Sadhak", tagline: "Your Exam Partner", supportEmail: "support@mpsc-sadhak.com", supportWhatsApp: "+91 99999 99999", website: "https://mpsc-sadhak.com" });
  const [examConfig, setExamConfig] = useState({ defaultDuration: "60", negativeMarking: "0.33", autoSaveInterval: "30", maxAttempts: "0", resultDelay: "immediate" });
  const [featureFlags, setFeatureFlags] = useState({ guestTests: true, leaderboard: true, dailyPractice: true, registrationOpen: true, maintenanceMode: false });
  const [sectionVisibility, setSectionVisibility] = useState({ hero: true, testSeries: true, studyMaterial: true, features: true, testimonials: true, ctaBanner: true });
  const [dashboardVisibility, setDashboardVisibility] = useState({ referAndShare: true });
  const [saving, setSaving] = useState("");
  const [editPlan, setEditPlan] = useState<PlanConfig | null>(null);
  const [editFeatures, setEditFeatures] = useState("");
  const [editPrice, setEditPrice]       = useState("");

  // FAQ state
  const [faqForm, setFaqForm]       = useState<Omit<FAQ, "id" | "isActive">>(FAQ_EMPTY);
  const [editFaqId, setEditFaqId]   = useState<string | null>(null);
  const [showFaqForm, setShowFaqForm] = useState(false);

  // ── Load general settings ──────────────────────────────────────────────────
  useEffect(() => {
    api.get<any>("/admin/settings").then(s => {
      const d = s?.data ?? s;
      if (d.siteName)         setPlatform(p => ({ ...p, name: d.siteName }));
      if (d.siteTagline)      setPlatform(p => ({ ...p, tagline: d.siteTagline }));
      if (d.supportEmail)     setPlatform(p => ({ ...p, supportEmail: d.supportEmail }));
      if (d.supportWhatsApp)  setPlatform(p => ({ ...p, supportWhatsApp: d.supportWhatsApp }));
      if (d.website)          setPlatform(p => ({ ...p, website: d.website }));
      if (d.defaultDuration !== undefined)  setExamConfig(c => ({ ...c, defaultDuration: String(d.defaultDuration) }));
      if (d.negativeMarking !== undefined)  setExamConfig(c => ({ ...c, negativeMarking: String(d.negativeMarking) }));
      if (d.registrationOpen !== undefined) setFeatureFlags(f => ({ ...f, registrationOpen: d.registrationOpen }));
      if (d.maintenanceMode !== undefined)  setFeatureFlags(f => ({ ...f, maintenanceMode: d.maintenanceMode }));
      if (d.sectionVisibility) setSectionVisibility(sv => ({ ...sv, ...d.sectionVisibility }));
      if (d.dashboardVisibility) setDashboardVisibility(dv => ({ ...dv, ...d.dashboardVisibility }));
    }).catch(() => {});
  }, []);

  // ── Load plan configs from DB ──────────────────────────────────────────────
  const { data: plansRaw } = useQuery({
    queryKey: ["admin-plan-configs"],
    queryFn:  () => api.get<any>("/admin/plan-configs"),
    staleTime: 60_000,
  });
  const plans: PlanConfig[] = Array.isArray(plansRaw?.data)
    ? plansRaw.data
    : Array.isArray(plansRaw) ? plansRaw : [];

  // ── Update plan config mutation ────────────────────────────────────────────
  const updatePlan = useMutation({
    mutationFn: ({ plan, body }: { plan: string; body: any }) =>
      api.put(`/admin/plan-configs/${plan}`, body),
    onSuccess: () => {
      toast.success("Plan updated and saved to database");
      qc.invalidateQueries({ queryKey: ["admin-plan-configs"] });
      setEditPlan(null);
    },
    onError: () => toast.error("Failed to save plan"),
  });

  const openEditPlan = (p: PlanConfig) => {
    setEditPlan(p);
    setEditPrice(p.plan === "free" ? "0" : String(Math.round(p.priceMonthly / 100)));
    setEditFeatures(p.features.join("\n"));
  };

  const handleSavePlan = () => {
    if (!editPlan) return;
    updatePlan.mutate({
      plan: editPlan.plan,
      body: {
        priceMonthly: editPlan.plan === "free" ? 0 : Number(editPrice) * 100,
        features: editFeatures.split("\n").map(f => f.trim()).filter(Boolean),
      },
    });
  };

  const saveSettings = async (section: string, data: object) => {
    setSaving(section);
    try {
      await api.put("/admin/settings", data);
      toast.success("Saved successfully");
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setSaving(""); }
  };

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Platform Info */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-primary-600" />
          <h3 className="font-bold text-gray-900">Platform Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Platform Name *</label>
            <input className="input-field" value={platform.name} onChange={e => setPlatform(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tagline</label>
            <input className="input-field" value={platform.tagline} onChange={e => setPlatform(p => ({ ...p, tagline: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Support Email *</label>
            <input type="email" className="input-field" value={platform.supportEmail} onChange={e => setPlatform(p => ({ ...p, supportEmail: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Support WhatsApp</label>
            <input className="input-field" value={platform.supportWhatsApp} onChange={e => setPlatform(p => ({ ...p, supportWhatsApp: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Website URL</label>
            <input className="input-field" value={platform.website} onChange={e => setPlatform(p => ({ ...p, website: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={() => saveSettings("platform", { siteName: platform.name, siteTagline: platform.tagline, supportEmail: platform.supportEmail, supportWhatsApp: platform.supportWhatsApp, website: platform.website })}
            disabled={saving === "platform"} className="btn-primary text-sm disabled:opacity-60">
            {saving === "platform" ? "Saving…" : "Save Platform Info"}
          </button>
        </div>
      </div>

      {/* Exam Config */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-primary-600" />
          <h3 className="font-bold text-gray-900">Exam Configuration</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Default Duration (min)</label>
            <input type="number" min={10} className="input-field" value={examConfig.defaultDuration}
              onChange={e => setExamConfig(c => ({ ...c, defaultDuration: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Negative Marking Value</label>
            <input type="number" step={0.01} min={0} className="input-field" value={examConfig.negativeMarking}
              onChange={e => setExamConfig(c => ({ ...c, negativeMarking: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Auto-save Interval (sec)</label>
            <input type="number" min={10} className="input-field" value={examConfig.autoSaveInterval}
              onChange={e => setExamConfig(c => ({ ...c, autoSaveInterval: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Max Retakes (0 = unlimited)</label>
            <input type="number" min={0} className="input-field" value={examConfig.maxAttempts}
              onChange={e => setExamConfig(c => ({ ...c, maxAttempts: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Default Result Timing</label>
            <select className="input-field" value={examConfig.resultDelay}
              onChange={e => setExamConfig(c => ({ ...c, resultDelay: e.target.value }))}>
              <option value="immediate">Immediate — shown right after submit</option>
              <option value="after_all">After all candidates submit</option>
              <option value="manual">Manual — admin publishes when ready</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={() => saveSettings("exam", { defaultDuration: Number(examConfig.defaultDuration), negativeMarking: Number(examConfig.negativeMarking), autoSaveInterval: Number(examConfig.autoSaveInterval), maxAttempts: Number(examConfig.maxAttempts), resultDelay: examConfig.resultDelay })}
            disabled={saving === "exam"} className="btn-primary text-sm disabled:opacity-60">
            {saving === "exam" ? "Saving…" : "Save Exam Config"}
          </button>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="card p-6 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-600" />
            <h3 className="font-bold text-gray-900">Feature Flags</h3>
          </div>
          <button onClick={() => saveSettings("flags", { registrationOpen: featureFlags.registrationOpen, maintenanceMode: featureFlags.maintenanceMode })}
            disabled={saving === "flags"} className="btn-primary text-sm disabled:opacity-60">
            {saving === "flags" ? "Saving…" : "Save Flags"}
          </button>
        </div>
        <ToggleSwitch value={featureFlags.guestTests}      onChange={v => setFeatureFlags(f => ({ ...f, guestTests: v }))}      label="Allow Guest Tests (no login for free tests)" />
        <ToggleSwitch value={featureFlags.leaderboard}     onChange={v => setFeatureFlags(f => ({ ...f, leaderboard: v }))}     label="Enable Leaderboard" />
        <ToggleSwitch value={featureFlags.dailyPractice}   onChange={v => setFeatureFlags(f => ({ ...f, dailyPractice: v }))}   label="Enable Daily Practice" />
        <ToggleSwitch value={featureFlags.registrationOpen} onChange={v => setFeatureFlags(f => ({ ...f, registrationOpen: v }))} label="Open Registration (new signups allowed)" />
        <ToggleSwitch value={featureFlags.maintenanceMode}  onChange={v => setFeatureFlags(f => ({ ...f, maintenanceMode: v }))}  label="Maintenance Mode" />
      </div>

      {/* Homepage Sections */}
      <div className="card p-6 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary-600" />
            <h3 className="font-bold text-gray-900">Homepage Sections</h3>
          </div>
          <button onClick={() => saveSettings("sections", { sectionVisibility })}
            disabled={saving === "sections"} className="btn-primary text-sm disabled:opacity-60">
            {saving === "sections" ? "Saving…" : "Save Sections"}
          </button>
        </div>
        <ToggleSwitch value={sectionVisibility.hero}          onChange={v => setSectionVisibility(s => ({ ...s, hero: v }))}          label="Hero Banner" />
        <ToggleSwitch value={sectionVisibility.testSeries}    onChange={v => setSectionVisibility(s => ({ ...s, testSeries: v }))}    label="Test Series" />
        <ToggleSwitch value={sectionVisibility.studyMaterial} onChange={v => setSectionVisibility(s => ({ ...s, studyMaterial: v }))} label="Study Material" />
        <ToggleSwitch value={sectionVisibility.features}      onChange={v => setSectionVisibility(s => ({ ...s, features: v }))}      label="Why Choose MPSC Sadhak (Features)" />
        <ToggleSwitch value={sectionVisibility.testimonials}  onChange={v => setSectionVisibility(s => ({ ...s, testimonials: v }))}  label="Student Success Stories (Testimonials)" />
        <ToggleSwitch value={sectionVisibility.ctaBanner}     onChange={v => setSectionVisibility(s => ({ ...s, ctaBanner: v }))}     label="CTA Banner" />
      </div>

      {/* Student Dashboard Sections */}
      <div className="card p-6 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary-600" />
            <h3 className="font-bold text-gray-900">Student Dashboard</h3>
          </div>
          <button onClick={() => saveSettings("dashboard", { dashboardVisibility })}
            disabled={saving === "dashboard"} className="btn-primary text-sm disabled:opacity-60">
            {saving === "dashboard" ? "Saving…" : "Save"}
          </button>
        </div>
        <ToggleSwitch value={dashboardVisibility.referAndShare} onChange={v => setDashboardVisibility(d => ({ ...d, referAndShare: v }))} label="Refer & Share" />
      </div>

      {/* Subscription Plans — DB-backed */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-primary-600" />
          <h3 className="font-bold text-gray-900">Subscription Plans</h3>
        </div>
        <p className="text-xs text-gray-400 mb-5">Prices are saved to the database and used live by the payment system.</p>

        {plans.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading plans…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(p => (
              <div key={p.plan} className={`border rounded-2xl p-4 flex flex-col gap-3 ${PLAN_COLORS[p.plan] ?? "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${PLAN_BADGE[p.plan] ?? "bg-gray-100 text-gray-600"}`}>
                    {p.displayName}
                  </span>
                  <button onClick={() => openEditPlan(p)}
                    className="text-[11px] font-semibold text-primary-600 hover:text-primary-800 bg-white border border-primary-200 hover:border-primary-400 px-2 py-0.5 rounded-lg transition-all">
                    Edit
                  </button>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {p.plan === "free" ? "Free" : `₹${Math.round(p.priceMonthly / 100)}`}
                  {p.plan !== "free" && <span className="text-xs font-normal text-gray-500">/mo</span>}
                </div>
                <ul className="space-y-1 flex-1">
                  {p.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                  {p.features.length > 4 && (
                    <li className="text-xs text-gray-400">+{p.features.length - 4} more…</li>
                  )}
                </ul>
                <div className={`text-[10px] font-semibold ${p.isActive ? "text-emerald-600" : "text-red-500"}`}>
                  {p.isActive ? "● Active" : "● Inactive"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ Management */}
      <FAQSection qc={qc} faqForm={faqForm} setFaqForm={setFaqForm}
        editFaqId={editFaqId} setEditFaqId={setEditFaqId}
        showFaqForm={showFaqForm} setShowFaqForm={setShowFaqForm} />

      {/* Edit Plan Modal */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit {editPlan.displayName} Plan</h3>
              <button onClick={() => setEditPlan(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 text-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Monthly Price (₹) {editPlan.plan === "free" && <span className="text-gray-400 font-normal">(locked at ₹0)</span>}
                </label>
                <input type="number" min={0} className="input-field"
                  value={editPrice}
                  disabled={editPlan.plan === "free"}
                  onChange={e => setEditPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Features (one per line)</label>
                <textarea rows={8} className="input-field resize-none text-sm font-mono"
                  value={editFeatures}
                  onChange={e => setEditFeatures(e.target.value)}
                  placeholder="Unlimited Mock Tests&#10;Advanced Analytics&#10;Live Tests" />
                <p className="text-xs text-gray-400 mt-1">Each line = one feature bullet shown to students</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditPlan(null)} className="flex-1 btn-ghost border border-gray-200 justify-center">Cancel</button>
              <button onClick={handleSavePlan} disabled={updatePlan.isPending}
                className="flex-1 btn-primary justify-center disabled:opacity-60">
                {updatePlan.isPending ? "Saving…" : "Save to Database"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
