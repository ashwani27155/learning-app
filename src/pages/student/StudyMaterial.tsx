import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { studyMaterialService, type StudyMaterialItem } from "../../services/studyMaterialService";
import { SkeletonCard } from "../../components/common/Skeleton";
import { EmptyState } from "../../components/common/EmptyState";

const accessColor: Record<string, string> = {
  free: "badge-success", basic: "badge-info", premium: "badge-warning", elite: "badge-error",
};

export default function StudyMaterial() {
  const navigate = useNavigate();
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [materials,  setMaterials]  = useState<StudyMaterialItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    studyMaterialService.getAll()
      .then(setMaterials)
      .catch(e => setError(e.message ?? "Failed to load materials"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter(m => {
    const matchSearch = m.titleEn.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "all" || m.type.toLowerCase() === typeFilter;
    return matchSearch && matchType;
  });

  const handleView = (m: StudyMaterialItem) => {
    if (m.access !== "free" && !isAuthenticated) return;
    window.open(m.fileUrl, "_blank");
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Study Material</h1>
          <p className="page-subtitle">PDFs, Ebooks and study notes</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input className="input-field pl-9" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "pdf", "ebook", "notes"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${typeFilter === t ? "bg-secondary-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {t === "all" ? "All" : t === "pdf" ? "📄 PDF" : t === "ebook" ? "📕 Ebook" : "📓 Notes"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <EmptyState icon="⚠️" title="Couldn't load study materials" description={error}
          action={<button onClick={() => window.location.reload()} className="btn-primary text-sm mt-2">Try Again</button>} />
      ) : filtered.length === 0 && materials.length === 0 ? (
        <EmptyState icon="📚" title="No study materials available yet" description="Check back soon — materials are being uploaded." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No materials match your search"
          action={<button onClick={() => { setSearch(""); setTypeFilter("all"); }}
            className="mt-2 text-primary-600 text-sm font-medium hover:underline">Clear filters</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {filtered.map(m => (
            <div key={m.id} className="card-hover p-5">
              <div className="flex gap-4">
                <div className={`w-14 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${m.type === "PDF" || m.type === "SYLLABUS" ? "bg-red-100" : "bg-primary-100"}`}>
                  {m.type === "PDF" || m.type === "SYLLABUS" ? "📄" : m.type === "EBOOK" ? "📕" : "📓"}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/study-material/${m.id}`} className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1 hover:text-primary-600 transition-colors block">{m.titleEn}</Link>
                  <div className="text-xs text-gray-400 mb-2">{m.type}</div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${accessColor[m.access] ?? "badge-info"}`}>{m.access}</span>
                    {m.pageCount && <span className="text-xs text-gray-400">{m.pageCount} pages</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>⬇️ {m.downloadCount.toLocaleString()}</span>
                  {m.rating > 0 && <span>⭐ {Number(m.rating).toFixed(1)}</span>}
                </div>
                <div className="flex gap-2">
                  <Link to={`/study-material/${m.id}`} className="btn-ghost text-xs border border-gray-200 py-1.5 px-3">ℹ️ Details</Link>
                  {m.access === "free" || isAuthenticated ? (
                    <button onClick={() => handleView(m)} className="btn-ghost text-xs border border-gray-200 py-1.5 px-3">👁️ View</button>
                  ) : (
                    <Link to="/auth/login" className="btn-ghost text-xs border border-gray-200 py-1.5 px-3">👁️ View</Link>
                  )}
                  {m.access === "free" ? (
                    <button onClick={() => handleView(m)} className="btn-primary text-xs py-1.5 px-3">⬇️ Download</button>
                  ) : isAuthenticated ? (
                    <button onClick={() => navigate("/dashboard/subscription")} className="bg-amber-500 text-white text-xs py-1.5 px-3 rounded-xl font-semibold hover:bg-amber-600 transition-all">🔒 Unlock</button>
                  ) : (
                    <Link to="/auth/login" className="bg-primary-600 text-white text-xs py-1.5 px-3 rounded-xl font-semibold hover:bg-primary-700 transition-all">Login to Access</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isAuthenticated && materials.length > 0 && (
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-1">Unlock Premium Study Materials</h3>
          <p className="text-sm text-white/80 mb-4">Create a free account to access all PDFs, Ebooks, and current affairs.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/auth/register" className="bg-white text-primary-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all">Sign Up Free</Link>
            <Link to="/auth/login" className="border border-white/50 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all">Login</Link>
          </div>
        </div>
      )}
    </div>
  );
}
