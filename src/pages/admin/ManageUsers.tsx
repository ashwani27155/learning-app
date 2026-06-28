import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { DEMO_MODE } from "@/lib/demoMode";

type Plan   = "Free" | "Basic" | "Premium" | "Elite";

interface User {
  id: string | number; name: string; email: string; phone: string;
  plan: Plan; exam: string; district: string;
  joined: string; active: boolean; tests: number; avgScore: number;
}

const INITIAL_USERS: User[] = [
  { id:1, name:"Priya Deshmukh",  email:"priya@gmail.com",   phone:"9876543210", plan:"Premium", exam:"Rajyaseva", district:"Pune",       joined:"Jan 15, 2026", active:true,  tests:45, avgScore:78 },
  { id:2, name:"Rahul Bhosale",   email:"rahul@gmail.com",   phone:"9765432109", plan:"Free",    exam:"PSI",       district:"Nashik",      joined:"Feb 3, 2026",  active:true,  tests:12, avgScore:65 },
  { id:3, name:"Anjali Kulkarni", email:"anjali@gmail.com",  phone:"9654321098", plan:"Elite",   exam:"STI",       district:"Mumbai",      joined:"Mar 20, 2026", active:true,  tests:67, avgScore:84 },
  { id:4, name:"Amit Shinde",     email:"amit@gmail.com",    phone:"9543210987", plan:"Basic",   exam:"ASO",       district:"Aurangabad",  joined:"Apr 5, 2026",  active:false, tests:8,  avgScore:52 },
  { id:5, name:"Sneha Patil",     email:"sneha@gmail.com",   phone:"9432109876", plan:"Premium", exam:"Rajyaseva", district:"Nagpur",      joined:"May 1, 2026",  active:true,  tests:23, avgScore:71 },
  { id:6, name:"Vikram Jadhav",   email:"vikram@gmail.com",  phone:"9321098765", plan:"Free",    exam:"PSI",       district:"Kolhapur",    joined:"May 10, 2026", active:true,  tests:5,  avgScore:48 },
  { id:7, name:"Meera Kulkarni",  email:"meera@gmail.com",   phone:"9210987654", plan:"Basic",   exam:"STI",       district:"Solapur",     joined:"May 15, 2026", active:true,  tests:18, avgScore:67 },
];

const planColor: Record<Plan, string> = {
  Free:"badge bg-gray-100 text-gray-600",
  Basic:"badge-info",
  Premium:"badge-primary",
  Elite:"badge-warning",
};

const PLANS: Plan[] = ["Free","Basic","Premium","Elite"];


export default function ManageUsers() {
  const qc = useQueryClient();
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [planFilter, setPlanFilter]   = useState("All");
  const [examFilter, setExamFilter]   = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewUser, setViewUser]       = useState<User | null>(null);
  const [viewTab, setViewTab]         = useState<"profile" | "history">("profile");
  const [editPlan, setEditPlan]       = useState<User | null>(null);
  const [newPlan, setNewPlan]         = useState<Plan>("Free");
  const [confirmAction, setConfirmAction] = useState<User | null>(null);
  const [selected, setSelected]       = useState<string[]>([]);
  const [confirmBulk, setConfirmBulk] = useState<"block" | "activate" | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn:  () => api.get<any>(`/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`),
    enabled:  !DEMO_MODE,
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });

  const rawUsers: User[] = DEMO_MODE
    ? INITIAL_USERS
    : (apiData?.data ?? []).map((u: any) => ({
        id:       u.id,
        name:     u.name,
        email:    u.email,
        phone:    u.phone,
        plan:     (u.subscriptions?.[0]?.plan ?? "free").charAt(0).toUpperCase() + (u.subscriptions?.[0]?.plan ?? "free").slice(1) as Plan,
        exam:     u.profile?.targetExam ?? "—",
        district: u.profile?.district  ?? "—",
        joined:   new Date(u.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }),
        active:   u.isActive,
        tests:    u._count?.testAttempts ?? 0,
        avgScore: u.avgScore ?? 0,
      }));

  const { data: attemptsData, isLoading: attemptsLoading } = useQuery({
    queryKey: ["admin-user-attempts", viewUser?.id],
    queryFn:  () => api.get<any>(`/admin/users/${viewUser?.id}/attempts?page=1&limit=10`),
    enabled:  !!viewUser && viewTab === "history" && !DEMO_MODE,
    staleTime: 30_000,
  });
  const attempts: any[] = attemptsData?.data ?? [];

  const totalUsers = apiData?.total ?? rawUsers.length;
  const totalPages = apiData?.totalPages ?? 1;

  const filtered = rawUsers.filter(u => {
    return (
      (planFilter === "All"   || u.plan  === planFilter) &&
      (examFilter === "All"   || u.exam  === examFilter) &&
      (statusFilter === "All" || (statusFilter === "Active" ? u.active : !u.active))
    );
  });

  const { mutate: toggleBlock } = useMutation({
    mutationFn: (id: string | number) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => { toast.success("User status updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message ?? "Action failed"),
    onSettled: () => setConfirmAction(null),
  });

  const { mutate: bulkBlock, isPending: bulkBlocking } = useMutation({
    mutationFn: () => api.post("/admin/users/bulk-block", { ids: selected }),
    onSuccess: () => {
      toast.success(`${selected.length} users blocked`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Bulk action failed"),
    onSettled: () => setConfirmBulk(null),
  });

  const { mutate: bulkActivate, isPending: bulkActivating } = useMutation({
    mutationFn: () => api.post("/admin/users/bulk-activate", { ids: selected }),
    onSuccess: () => {
      toast.success(`${selected.length} users activated`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Bulk action failed"),
    onSettled: () => setConfirmBulk(null),
  });

  const { mutate: doEditPlan } = useMutation({
    mutationFn: ({ id, plan }: { id: string | number; plan: string }) =>
      api.put(`/admin/users/${id}/plan`, { plan }),
    onSuccess: () => {
      toast.success(`Plan updated to ${newPlan}`);
      setEditPlan(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update plan"),
  });

  const handleEditPlan = () => {
    if (!editPlan) return;
    doEditPlan({ id: editPlan.id, plan: newPlan.toLowerCase() });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    toggleBlock(confirmAction.id as string);
  };

  const handleConfirmBulk = () => {
    if (confirmBulk === "block") bulkBlock();
    else if (confirmBulk === "activate") bulkActivate();
  };

  const toggleSelect = (id: string | number) => {
    const sid = String(id);
    setSelected(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]);
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(u => String(u.id)));
  };

  const exportCSV = () => {
    const header = "Name,Email,Phone,Plan,Exam,District,Joined,Status,Tests,Avg Score\n";
    const rows = filtered.map(u =>
      `${u.name},${u.email},${u.phone},${u.plan},${u.exam},${u.district},${u.joined},${u.active?"Active":"Blocked"},${u.tests},${u.avgScore}%`
    ).join("\n");
    const blob = new Blob([header + rows], { type:"text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "users.csv";
    a.click();
    toast.success("CSV exported");
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{totalUsers.toLocaleString()} total users · page {page} of {totalPages}</p>
        </div>
        <button onClick={exportCSV} className="btn-outline text-sm sm:ml-auto flex-shrink-0">⬇️ Export CSV</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {PLANS.map(p => (
          <div key={p} className="card p-4 text-center">
            <div className="text-xl font-bold text-gray-900">{filtered.filter(u=>u.plan===p).length}</div>
            <div className="text-xs text-gray-500 mt-0.5">{p} (this page)</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input className="input-field pl-9" placeholder="Search by name, email or phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option>All</option>
          {PLANS.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className="input-field w-auto" value={examFilter} onChange={e => setExamFilter(e.target.value)}>
          <option>All</option>
          <option>Rajyaseva</option><option>PSI</option><option>STI</option><option>ASO</option>
        </select>
        <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option>All</option>
          <option>Active</option>
          <option>Blocked</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl bg-primary-50 border border-primary-100">
          <span className="text-sm font-semibold text-primary-700">{selected.length} selected</span>
          <button onClick={() => setConfirmBulk("activate")} className="btn-outline text-xs py-1.5">✅ Activate</button>
          <button onClick={() => setConfirmBulk("block")} className="btn-outline text-xs py-1.5 text-red-600 border-red-200 hover:bg-red-50">🚫 Block</button>
          <button onClick={() => setSelected([])} className="text-xs text-gray-400 hover:text-gray-600 ml-auto">Clear selection</button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-center w-10">
                  <input type="checkbox" className="rounded border-gray-300"
                    checked={filtered.length > 0 && selected.length === filtered.length}
                    onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Exam / District</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tests</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-10 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                : null}
              {!isLoading && filtered.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${selected.includes(String(u.id)) ? "bg-primary-50/40" : ""}`}>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" className="rounded border-gray-300"
                      checked={selected.includes(String(u.id))}
                      onChange={() => toggleSelect(u.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                        {u.name.split(" ").map(n=>n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                        <div className="text-xs text-gray-400">{u.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${planColor[u.plan]}`}>{u.plan}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="font-medium text-gray-900 text-sm">{u.exam}</div>
                    <div className="text-xs text-gray-400">{u.district}</div>
                    <div className="text-xs text-gray-300">Joined {u.joined}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{u.tests}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-sm ${u.avgScore>=70?"text-emerald-600":u.avgScore>=55?"text-amber-600":"text-red-500"}`}>
                      {u.avgScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${u.active?"badge-success":"badge-error"}`}>
                      {u.active?"Active":"Blocked"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setViewUser(u); setViewTab("profile"); }}
                        className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600 transition-all" title="View profile">👁️</button>
                      <button onClick={() => { setEditPlan(u); setNewPlan(u.plan); }}
                        className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition-all" title="Edit plan">💎</button>
                      <button onClick={() => setConfirmAction(u)}
                        className={`p-1.5 rounded-lg transition-all ${u.active?"hover:bg-red-50 text-red-500":"hover:bg-emerald-50 text-emerald-600"}`}
                        title={u.active?"Block user":"Activate user"}>
                        {u.active?"🚫":"✅"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8}>
                  <EmptyState icon="🔍" title="No users match the current filters" />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-gray-400">
            Showing {filtered.length} of {totalUsers.toLocaleString()} users
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="btn-ghost border border-gray-200 text-xs disabled:opacity-40">← Prev</button>
              <span className="text-xs text-gray-500">Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="btn-ghost border border-gray-200 text-xs disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* ── View User Modal ── */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">User Profile</h3>
              <button onClick={() => setViewUser(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl">
                  {viewUser.name.split(" ").map(n=>n[0]).join("")}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{viewUser.name}</div>
                  <span className={`badge ${viewUser.active?"badge-success":"badge-error"} text-xs`}>{viewUser.active?"Active":"Blocked"}</span>
                </div>
              </div>

              <div className="flex gap-1 mb-4 border-b border-gray-100">
                <button onClick={() => setViewTab("profile")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${viewTab==="profile"?"border-primary-500 text-primary-700":"border-transparent text-gray-400 hover:text-gray-600"}`}>
                  Profile
                </button>
                <button onClick={() => setViewTab("history")}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${viewTab==="history"?"border-primary-500 text-primary-700":"border-transparent text-gray-400 hover:text-gray-600"}`}>
                  Test History
                </button>
              </div>

              {viewTab === "profile" ? (
                <div className="space-y-3">
                  {[
                    { label:"Email",    value:viewUser.email },
                    { label:"Phone",    value:viewUser.phone },
                    { label:"Plan",     value:viewUser.plan },
                    { label:"Exam",     value:viewUser.exam },
                    { label:"District", value:viewUser.district },
                    { label:"Joined",   value:viewUser.joined },
                    { label:"Tests",    value:`${viewUser.tests} tests attempted` },
                    { label:"Avg Score",value:`${viewUser.avgScore}%` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-500 font-medium">{row.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {DEMO_MODE && (
                    <p className="text-xs text-gray-400 text-center py-6">Test history is unavailable in demo mode.</p>
                  )}
                  {!DEMO_MODE && attemptsLoading && (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)
                  )}
                  {!DEMO_MODE && !attemptsLoading && attempts.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">No test attempts yet.</p>
                  )}
                  {!DEMO_MODE && !attemptsLoading && attempts.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-gray-50">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{a.test?.titleEn ?? "Test"}</div>
                        <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-sm font-bold ${a.percentage>=70?"text-emerald-600":a.percentage>=55?"text-amber-600":"text-red-500"}`}>
                          {Math.round(a.percentage ?? 0)}%
                        </span>
                        <span className={`badge text-xs ${a.isPassed?"badge-success":"badge-error"}`}>{a.isPassed?"Pass":"Fail"}</span>
                        {a.rank ? <span className="text-xs text-gray-400">Rank #{a.rank}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setViewUser(null)} className="flex-1 btn-ghost border border-gray-200 justify-center">Close</button>
              <button onClick={() => { setEditPlan(viewUser); setNewPlan(viewUser.plan); setViewUser(null); }}
                className="flex-1 btn-primary justify-center">Edit Plan</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Plan Modal ── */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit Subscription Plan</h3>
              <button onClick={() => setEditPlan(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Changing plan for <strong>{editPlan.name}</strong></p>
              <p className="text-xs text-gray-400">Current plan: <span className="font-bold">{editPlan.plan}</span></p>
              <div className="grid grid-cols-2 gap-2">
                {PLANS.map(p => (
                  <button key={p} type="button" onClick={() => setNewPlan(p)}
                    className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${newPlan===p?"border-primary-500 bg-primary-50 text-primary-700":"border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditPlan(null)} className="flex-1 btn-ghost border border-gray-200 justify-center">Cancel</button>
              <button onClick={handleEditPlan} className="flex-1 btn-primary justify-center">Save Plan ✓</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.active ? "Block user?" : "Activate user?"}
        message={<>{confirmAction?.active ? "This will deactivate the account; the user's data is kept and the account can be re-activated later." : "Re-activate"} <strong>{confirmAction?.name}</strong>?</>}
        confirmLabel={confirmAction?.active ? "Block" : "Activate"}
        tone={confirmAction?.active ? "danger" : "default"}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={!!confirmBulk}
        title={confirmBulk === "block" ? "Block selected users?" : "Activate selected users?"}
        message={<>{confirmBulk === "block" ? "Deactivate" : "Re-activate"} <strong>{selected.length}</strong> selected user{selected.length === 1 ? "" : "s"}?</>}
        confirmLabel={confirmBulk === "block" ? "Block all" : "Activate all"}
        tone={confirmBulk === "block" ? "danger" : "default"}
        isLoading={bulkBlocking || bulkActivating}
        onConfirm={handleConfirmBulk}
        onCancel={() => setConfirmBulk(null)}
      />
    </div>
  );
}
