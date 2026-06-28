import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { DEMO_MODE } from "@/lib/demoMode";

type MaterialType = "PDF" | "Ebook" | "Notes" | "Video" | "Syllabus";
type AccessLevel  = "Free" | "Basic" | "Premium" | "Elite";

interface Material {
  id: string | number; title: string; type: MaterialType; subject: string;
  access: AccessLevel; downloads: number; active: boolean;
  fileSize: string; pages?: number; uploadedOn: string;
  _apiId?: string;
}

const INITIAL: Material[] = [
  { id:1, title:"MPSC Rajyaseva Complete Syllabus 2026", type:"Syllabus", subject:"All Subjects",     access:"Free",    downloads:18400, active:true, fileSize:"2.4 MB", pages:248, uploadedOn:"Jan 5, 2026" },
  { id:2, title:"Maharashtra Geography Complete Notes",  type:"PDF",     subject:"Geography",         access:"Free",    downloads:12300, active:true, fileSize:"4.1 MB", pages:96,  uploadedOn:"Feb 10, 2026" },
  { id:3, title:"Marathi Grammar Complete Guide",        type:"Ebook",   subject:"Marathi Language",  access:"Premium", downloads:7600,  active:true, fileSize:"8.7 MB", pages:320, uploadedOn:"Mar 15, 2026" },
  { id:4, title:"Current Affairs May 2026",              type:"PDF",     subject:"Current Affairs",   access:"Free",    downloads:9800,  active:true, fileSize:"1.8 MB", pages:64,  uploadedOn:"May 1, 2026" },
  { id:5, title:"History Timeline Handbook",             type:"PDF",     subject:"History",           access:"Free",    downloads:11200, active:true, fileSize:"3.2 MB", pages:72,  uploadedOn:"Apr 20, 2026" },
  { id:6, title:"Science & Technology Notes 2026",       type:"Notes",   subject:"Science",           access:"Basic",   downloads:8900,  active:false, fileSize:"2.1 MB", pages:128, uploadedOn:"Apr 25, 2026" },
];

const typeIcon: Record<MaterialType,string> = { PDF:"📄", Ebook:"📕", Notes:"📝", Video:"🎥", Syllabus:"📋" };
const typeColor: Record<MaterialType,string> = { PDF:"bg-red-100", Ebook:"bg-primary-100", Notes:"bg-amber-100", Video:"bg-purple-100", Syllabus:"bg-green-100" };
const accessColor: Record<AccessLevel,string> = { Free:"badge-success", Basic:"badge-info", Premium:"badge-primary", Elite:"badge-warning" };

const SUBJECTS = ["All Subjects","History","Geography","Political Science","General Studies","Marathi Language","English","CSAT","Economics","Science","Current Affairs","Environment"];
const TYPES: MaterialType[] = ["PDF","Ebook","Notes","Video","Syllabus"];
const ACCESS_LEVELS: AccessLevel[] = ["Free","Basic","Premium","Elite"];

const emptyForm = { title:"", type:"PDF" as MaterialType, subject:"All Subjects", access:"Free" as AccessLevel, fileSize:"" };

function mapApiMaterial(m: any, i: number): Material {
  return {
    id:         m.id ?? i + 1,
    _apiId:     m.id,
    title:      m.titleEn ?? m.title ?? "Untitled",
    type:       (m.type ? (m.type.charAt(0) + m.type.slice(1).toLowerCase()) : "PDF") as MaterialType,
    subject:    m.subject?.nameEn ?? "General",
    access:     (m.access ? (m.access.charAt(0).toUpperCase() + m.access.slice(1)) : "Free") as AccessLevel,
    downloads:  m.downloadCount ?? 0,
    active:     m.isActive ?? true,
    fileSize:   m.fileSize ? `${Math.round(Number(m.fileSize) / 1024)} KB` : "—",
    pages:      m.pageCount ?? undefined,
    uploadedOn: m.publishedAt ? new Date(m.publishedAt).toLocaleDateString("en-IN") : "—",
  };
}

export default function AdminStudyMaterial() {
  const qc = useQueryClient();
  const [demoMaterials, setDemoMaterials] = useState<Material[]>(INITIAL);
  const [showUpload, setShowUpload] = useState(false);
  const [editMat,  setEditMat]   = useState<Material | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [filterAccess, setFilterAccess] = useState("All");
  const [filterType,   setFilterType]   = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: apiData } = useQuery({
    queryKey: ["admin-study-materials"],
    queryFn:  () => api.get<any>("/study-materials", { params: { limit: 100 } } as any),
    enabled:  !DEMO_MODE,
  });

  const materials: Material[] = DEMO_MODE
    ? demoMaterials
    : (() => {
        const items = Array.isArray(apiData) ? apiData : (apiData as any)?.data ?? [];
        return items.map(mapApiMaterial);
      })();

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-study-materials"] });

  const filtered = materials.filter(m => {
    const txt = (m.title + m.subject).toLowerCase();
    return (
      (!search || txt.includes(search.toLowerCase())) &&
      (filterAccess === "All" || m.access === filterAccess) &&
      (filterType   === "All" || m.type   === filterType)
    );
  });

  const openEdit = (m: Material) => {
    setEditMat(m);
    setForm({ title:m.title, type:m.type, subject:m.subject, access:m.access, fileSize:m.fileSize });
    setShowUpload(true);
  };

  const confirmDeleteMaterial = async () => {
    const m = deleteTarget;
    if (!m) return;

    if (DEMO_MODE) {
      setDemoMaterials(prev => prev.filter(x => x.id !== m.id));
      toast.success("Material deleted");
      setDeleteTarget(null);
      return;
    }
    try {
      await api.delete(`/study-materials/${m._apiId ?? m.id}`);
      toast.success("Material deleted");
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (id: number | string) => {
    const m = materials.find(x => x.id === id);
    if (!m) return;

    if (DEMO_MODE) {
      setDemoMaterials(prev => prev.map(x => x.id === id ? { ...x, active: !x.active } : x));
      toast.success(m.active ? "Material hidden from students" : "Material visible to students");
      return;
    }
    try {
      await api.put(`/study-materials/${m._apiId ?? id}`, { isActive: !m.active });
      toast.success(m.active ? "Material hidden from students" : "Material visible to students");
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Action failed");
    }
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setForm(f => ({ ...f, fileSize:`${(file.size/1024/1024).toFixed(1)} MB` }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;

    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const apiBase = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:5000/api/v1";

    try {
      if (editMat?._apiId) {
        // Update existing
        const body = new FormData();
        body.append("titleEn", form.title);
        body.append("type",    form.type.toUpperCase());
        body.append("access",  form.access.toLowerCase());
        if (selectedFile) body.append("file", selectedFile);
        const res = await fetch(`${apiBase}/study-materials/${editMat._apiId}`, { method: "PUT", headers, body });
        if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
        toast.success("Material updated");
        refresh();
      } else {
        // Create new with real upload
        if (!selectedFile) { toast.error("Please select a file to upload"); return; }
        setUploading(true);
        setUploadProgress(10);

        const body = new FormData();
        body.append("titleEn", form.title);
        body.append("type",    form.type.toUpperCase());
        body.append("access",  form.access.toLowerCase());
        body.append("file",    selectedFile);

        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 90));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: ${xhr.statusText}`));
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("POST", `${apiBase}/study-materials`);
          if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(body);
        });

        setUploadProgress(100);
        toast.success("Material uploaded successfully");
        refresh();
      }
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setShowUpload(false);
      setEditMat(null);
      setForm(emptyForm);
      setSelectedFile(null);
    }
  };

  const closeModal = () => {
    setShowUpload(false);
    setEditMat(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setUploadProgress(0);
    setUploading(false);
  };

  const totalDownloads = materials.reduce((a,m) => a+m.downloads, 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="page-title">Study Material</h1>
          <p className="page-subtitle">{materials.length} items · {totalDownloads.toLocaleString()} total downloads</p>
        </div>
        <button onClick={() => { setEditMat(null); setForm(emptyForm); setShowUpload(true); }}
          className="btn-primary sm:ml-auto flex-shrink-0">📤 Upload Material</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {ACCESS_LEVELS.map(a => (
          <div key={a} className="card p-4 text-center">
            <div className="text-xl font-bold text-gray-900">{materials.filter(m=>m.access===a).length}</div>
            <div className="text-xs text-gray-500 mt-0.5">{a} materials</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input className="input-field pl-9" placeholder="Search materials..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={filterAccess} onChange={e => setFilterAccess(e.target.value)}>
          <option>All</option>
          {ACCESS_LEVELS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select className="input-field w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option>All</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(m => (
          <div key={m.id} className={`card p-5 flex items-start gap-4 ${!m.active?"opacity-60":""}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${typeColor[m.type]}`}>
              {typeIcon[m.type]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">{m.title}</h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="badge badge-purple text-xs">{m.type}</span>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{m.subject}</span>
                <span className={`badge ${accessColor[m.access]} text-xs`}>{m.access}</span>
                {!m.active && <span className="badge badge-error text-xs">Hidden</span>}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>⬇️ {m.downloads.toLocaleString()}</span>
                <span>📁 {m.fileSize}</span>
                {m.pages && <span>📑 {m.pages}pp</span>}
                <span className="ml-auto">{m.uploadedOn}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={() => openEdit(m)}
                className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition-all" title="Edit">✏️</button>
              <button onClick={() => toggleActive(m.id)}
                className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition-all" title={m.active?"Hide":"Show"}>
                {m.active ? "🙈" : "👁️"}
              </button>
              <button onClick={() => setDeleteTarget(m)}
                className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-all" title="Delete">🗑️</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 card">
            <EmptyState icon="📚" title="No materials found" description="Try adjusting the filters" />
          </div>
        )}
      </div>

      {/* ── Upload / Edit Modal ── */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editMat ? "Edit Material" : "📤 Upload Study Material"}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input className="input-field" placeholder="Material title"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="input-field" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as MaterialType }))}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                  <select className="input-field" value={form.access}
                    onChange={e => setForm(f => ({ ...f, access: e.target.value as AccessLevel }))}>
                    {ACCESS_LEVELS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select className="input-field" value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {!editMat && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Upload</label>
                  <input ref={fileRef} type="file" accept=".pdf,.epub,.mp4,.docx"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]); }} />
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileChange(f); }}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer">
                    {selectedFile ? (
                      <>
                        <div className="text-3xl mb-2">✅</div>
                        <div className="text-sm font-semibold text-gray-800">{selectedFile.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{form.fileSize}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">📂</div>
                        <div className="text-sm font-semibold text-gray-600">Click or drag & drop file here</div>
                        <div className="text-xs text-gray-400 mt-1">PDF, EPUB, MP4, DOCX — max 100MB</div>
                      </>
                    )}
                  </div>
                  {uploading && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all duration-300"
                          style={{ width:`${uploadProgress}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-center">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 btn-ghost border border-gray-200 justify-center">Cancel</button>
              <button onClick={handleSubmit}
                disabled={!form.title.trim()}
                className="flex-1 btn-primary justify-center disabled:opacity-50">
                {editMat ? "Save Changes ✓" : "Upload →"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete material?"
        message={<>This will permanently remove "<strong>{deleteTarget?.title}</strong>" from the library. This cannot be undone.</>}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDeleteMaterial}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
