import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studyMaterialService } from "../../services/studyMaterialService";
import { Skeleton } from "../../components/common/Skeleton";
import { EmptyState } from "../../components/common/EmptyState";

export default function CurrentAffairsPage() {
  const [search, setSearch] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: materials, isLoading, isError, refetch } = useQuery({
    queryKey: ["current-affairs"],
    queryFn: () => studyMaterialService.getAll({ type: "CURRENT_AFFAIRS" }),
  });

  const filtered = (materials ?? []).filter(m => m.titleEn.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary-600" />
            Current Affairs
          </h1>
          <p className="page-subtitle">Daily and monthly current affairs digests curated for MPSC aspirants.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input-field pl-9" placeholder="Search current affairs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : isError ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Couldn't load current affairs. Please try again.</p>
            <button onClick={() => refetch()} className="btn-outline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📰"
            title={search ? "No matches found" : "No current affairs yet"}
            description={search ? "Try a different search term." : "Check back soon — new digests are published regularly."}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(m => (
              <Link key={m.id} to={`/current-affairs/${m.id}`} className="card-hover p-5 flex gap-4 items-start block">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl flex-shrink-0">📰</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{m.titleEn}</h3>
                  {m.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {m.publishedAt && <span>{new Date(m.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    <span className={`badge ${m.access === "free" ? "badge-success" : "badge-warning"}`}>{m.access}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isAuthenticated && (
          <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-center text-white">
            <h3 className="text-lg font-bold mb-1">Never miss an update</h3>
            <p className="text-sm text-white/80 mb-4">Create a free account to bookmark digests and get notified of new releases.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/auth/register" className="bg-white text-primary-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all">Sign Up Free</Link>
              <Link to="/auth/login" className="border border-white/50 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all">Login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
