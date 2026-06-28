import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Newspaper, Download, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studyMaterialService } from "../../services/studyMaterialService";
import { Skeleton } from "../../components/common/Skeleton";

export default function CurrentAffairsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const { data: material, isLoading, isError, refetch } = useQuery({
    queryKey: ["current-affairs-detail", id],
    queryFn: () => studyMaterialService.getById(id!),
    enabled: !!id,
  });

  const canAccess = material && (material.access === "free" || isAuthenticated);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/current-affairs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Current Affairs
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : isError || !material ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Couldn't load this digest. Please try again.</p>
            <button onClick={() => refetch()} className="btn-outline">Try again</button>
          </div>
        ) : (
          <div className="card p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl flex-shrink-0">
                <Newspaper className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{material.titleEn}</h1>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {material.publishedAt && <span>{new Date(material.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>}
                  <span className={`badge ${material.access === "free" ? "badge-success" : "badge-warning"}`}>{material.access}</span>
                  {material.pageCount && <span>{material.pageCount} pages</span>}
                </div>
              </div>
            </div>

            {material.description && (
              <p className="text-sm text-gray-700 leading-relaxed">{material.description}</p>
            )}

            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              {canAccess ? (
                <>
                  <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" /> View
                  </a>
                  <a href={material.fileUrl} download className="btn-outline text-sm flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download
                  </a>
                </>
              ) : isAuthenticated ? (
                <Link to="/dashboard/subscription" className="bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-600 transition-all">
                  🔒 Unlock with Subscription
                </Link>
              ) : (
                <Link to="/auth/login" className="btn-primary text-sm">Login to Access</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
