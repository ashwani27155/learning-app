import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { testService } from "../../services/testService";
import { TestAnalysisPanel } from "../../components/test/TestAnalysisPanel";
import { Skeleton } from "../../components/common/Skeleton";

export default function TestAnalysisPage() {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();

  const { data: result, isLoading, isError, refetch } = useQuery({
    queryKey: ["test-result", testId, attemptId],
    queryFn: () => testService.getResult(testId!, attemptId!),
    enabled: !!testId && !!attemptId,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          to={testId && attemptId ? `/test/${testId}/result/${attemptId}` : "/dashboard/my-results"}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to result
        </Link>

        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            Detailed Analysis
          </h1>
          <p className="page-subtitle">
            {result ? <>In-depth performance breakdown for <span className="font-medium text-gray-700">{result.test.titleEn}</span></>
                    : "In-depth performance breakdown for this attempt"}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : isError || !result ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Couldn't load this analysis. Please try again.</p>
            <button onClick={() => refetch()} className="btn-outline">Try again</button>
          </div>
        ) : (
          <TestAnalysisPanel result={result} />
        )}
      </div>
    </div>
  );
}
