import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Star, BadgeCheck, Sparkles, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { api } from "../../lib/api";
import { SkeletonKPICard } from "../../components/common/Skeleton";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { DEMO_MODE } from "@/lib/demoMode";

interface Testimonial {
  id:           string;
  name:         string;
  photo?:       string | null;
  examCleared?: string | null;
  yearCleared?: number | null;
  content:      string;
  rating:       number;
  isFeatured:   boolean;
  isApproved:   boolean;
  createdAt:    string;
}

const MOCK_TESTIMONIALS: Testimonial[] = [
  { id: "1", name: "Priya Deshmukh", examCleared: "MPSC Rajyaseva", yearCleared: 2025, content: "MPSC Sadhak's mock tests were a game changer for my preparation!", rating: 5, isFeatured: true,  isApproved: true,  createdAt: "2026-01-10" },
  { id: "2", name: "Rahul Bhosale",  examCleared: "PSI",            yearCleared: 2025, content: "The bilingual question bank helped me understand concepts in Marathi too.", rating: 4, isFeatured: false, isApproved: true,  createdAt: "2026-02-14" },
  { id: "3", name: "Sneha Patil",    examCleared: "STI",            yearCleared: 2026, content: "Just cleared my prelims — the analytics showed exactly where I was weak.", rating: 5, isFeatured: false, isApproved: false, createdAt: "2026-05-20" },
];

interface TestimonialForm {
  name: string; examCleared: string; yearCleared: string; content: string; rating: string;
}

function TestimonialFormModal({ onClose, onSaved, onDemoSave }: {
  onClose: () => void; onSaved: () => void;
  onDemoSave?: (data: Partial<Testimonial>) => void;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<TestimonialForm>({
    defaultValues: { rating: "5" },
  });

  const onSubmit = async (data: TestimonialForm) => {
    try {
      const payload = {
        name:        data.name.trim(),
        examCleared: data.examCleared.trim() || undefined,
        yearCleared: data.yearCleared ? Number(data.yearCleared) : undefined,
        content:     data.content.trim(),
        rating:      Number(data.rating),
      };
      if (DEMO_MODE) {
        onDemoSave?.(payload);
        toast.success("Testimonial added");
        onSaved();
        return;
      }
      await api.post("/admin/testimonials", payload);
      toast.success("Testimonial added");
      qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Add Testimonial</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
            <input className="input-field" placeholder="e.g. Priya Deshmukh" {...register("name", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Cleared</label>
              <input className="input-field" placeholder="e.g. MPSC Rajyaseva" {...register("examCleared")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Cleared</label>
              <input type="number" className="input-field" placeholder="2026" {...register("yearCleared")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial *</label>
            <textarea className="input-field w-full h-24 resize-none" placeholder="What did the student say?" {...register("content", { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select className="input-field" {...register("rating")}>
              {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} star{r > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {isSubmitting ? "Saving…" : "Add Testimonial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageTestimonials() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "featured">("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [demoTestimonials, setDemoTestimonials] = useState<Testimonial[]>(MOCK_TESTIMONIALS);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn:  () => api.get<any>("/admin/testimonials"),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? { data: MOCK_TESTIMONIALS } : undefined,
  });
  const testimonials: Testimonial[] = DEMO_MODE ? demoTestimonials : ((data as any)?.data ?? []);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-testimonials"] });

  const filtered = testimonials.filter(t => {
    if (filter === "pending"  && t.isApproved)  return false;
    if (filter === "approved" && !t.isApproved) return false;
    if (filter === "featured" && !t.isFeatured) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [t.name, t.examCleared, t.content].filter(Boolean).some(v => v!.toLowerCase().includes(q));
  });

  const toggleApprove = (t: Testimonial) => {
    if (DEMO_MODE) {
      setDemoTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, isApproved: !x.isApproved } : x));
      toast.success(t.isApproved ? "Testimonial unapproved" : "Testimonial approved");
      return;
    }
    api.patch(`/admin/testimonials/${t.id}/approve`)
      .then(() => { toast.success(t.isApproved ? "Testimonial unapproved" : "Testimonial approved"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"));
  };

  const toggleFeature = (t: Testimonial) => {
    if (DEMO_MODE) {
      setDemoTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, isFeatured: !x.isFeatured } : x));
      toast.success(t.isFeatured ? "Removed from featured" : "Marked as featured");
      return;
    }
    api.patch(`/admin/testimonials/${t.id}/feature`)
      .then(() => { toast.success(t.isFeatured ? "Removed from featured" : "Marked as featured"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"));
  };

  const confirmDeleteTestimonial = () => {
    const t = deleteTarget;
    if (!t) return;
    if (DEMO_MODE) {
      setDemoTestimonials(prev => prev.filter(x => x.id !== t.id));
      toast.success("Testimonial deleted");
      setDeleteTarget(null);
      return;
    }
    api.delete(`/admin/testimonials/${t.id}`)
      .then(() => { toast.success("Testimonial deleted"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"))
      .finally(() => setDeleteTarget(null));
  };

  const handleDemoSave = (data: Partial<Testimonial>) => {
    setDemoTestimonials(prev => [{
      id: String(Date.now()), rating: 5, isFeatured: false, isApproved: false,
      createdAt: new Date().toISOString(), ...data,
    } as Testimonial, ...prev]);
  };

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "pending",  label: "Pending Approval" },
    { key: "approved", label: "Approved" },
    { key: "featured", label: "Featured" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Testimonials</h1>
          <p className="page-subtitle">Approve and feature student success stories shown on the homepage</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)
          : [
              { label: "Total",           value: testimonials.length },
              { label: "Pending Approval",value: testimonials.filter(t => !t.isApproved).length },
              { label: "Approved",        value: testimonials.filter(t => t.isApproved).length },
              { label: "Featured",        value: testimonials.filter(t => t.isFeatured).length },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by name, exam or content..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f.key ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)
          : filtered.map(t => (
              <div key={t.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                      <div className="text-xs text-gray-400">{[t.examCleared, t.yearCleared].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {t.isFeatured && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Featured</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-4">"{t.content}"</p>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => toggleApprove(t)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      t.isApproved ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    }`}>
                    <BadgeCheck className="w-3.5 h-3.5" /> {t.isApproved ? "Unapprove" : "Approve"}
                  </button>
                  <button
                    onClick={() => toggleFeature(t)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      t.isFeatured ? "text-gray-500 hover:bg-gray-100" : "text-amber-600 hover:bg-amber-50"
                    }`}>
                    <Sparkles className="w-3.5 h-3.5" /> {t.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                  <button onClick={() => setDeleteTarget(t)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full card">
            <EmptyState icon="💬" title="No testimonials found" description="Try a different filter or search, or add one manually" />
          </div>
        )}
      </div>

      {showForm && (
        <TestimonialFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => setShowForm(false)}
          onDemoSave={handleDemoSave}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete testimonial?"
        message={<>This will permanently remove the testimonial from <strong>{deleteTarget?.name}</strong>. This cannot be undone.</>}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDeleteTestimonial}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
