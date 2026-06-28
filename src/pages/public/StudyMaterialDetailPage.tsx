import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Download, Eye, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studyMaterialService } from "../../services/studyMaterialService";
import { Skeleton } from "../../components/common/Skeleton";

const TYPE_ICON: Record<string, string> = {
  PDF: "📄", SYLLABUS: "📄", EBOOK: "📕", NOTES: "📓", CURRENT_AFFAIRS: "📰",
};

export default function StudyMaterialDetailPage() {
  const { materialId } = useParams<{ materialId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: material, isLoading, isError, refetch } = useQuery({
    queryKey: ["study-material-detail", materialId],
    queryFn: () => studyMaterialService.getById(materialId!),
    enabled: !!materialId,
  });

  const canAccess = material && (material.access === "free" || isAuthenticated);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/study-material" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Study Material
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : isError || !material ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Couldn't load this material. Please try again.</p>
            <button onClick={() => refetch()} className="btn-outline">Try again</button>
          </div>
        ) : (
          <div className="card p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${material.type === "PDF" || material.type === "SYLLABUS" ? "bg-red-100" : "bg-primary-100"}`}>
                {TYPE_ICON[material.type] ?? <FileText className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{material.titleEn}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{material.titleMr}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className={`badge ${material.access === "free" ? "badge-success" : material.access === "basic" ? "badge-info" : material.access === "premium" ? "badge-warning" : "badge-error"}`}>{material.access}</span>
                  <span className="uppercase tracking-wide">{material.type}</span>
                  {material.pageCount && <span>{material.pageCount} pages</span>}
                  {material.fileSize && <span>{(material.fileSize / (1024 * 1024)).toFixed(1)} MB</span>}
                  {material.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{Number(material.rating).toFixed(1)}</span>}
                </div>
              </div>
            </div>

            {material.description && (
              <p className="text-sm text-gray-700 leading-relaxed border-t border-gray-100 pt-4">{material.description}</p>
            )}

            <div className="flex items-center gap-5 text-xs text-gray-400 border-t border-gray-100 pt-4">
              <span>👁️ {material.viewCount.toLocaleString()} views</span>
              <span>⬇️ {material.downloadCount.toLocaleString()} downloads</span>
            </div>

            <div className="flex flex-wrap gap-3">
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
                <button onClick={() => navigate("/dashboard/subscription")} className="bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-600 transition-all">
                  🔒 Unlock with Subscription
                </button>
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
