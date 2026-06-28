import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import { testService } from "../../services/testService";
import { DiscussionThread } from "../../components/discussion/DiscussionThread";

export default function TestDiscussionPage() {
  const { testId } = useParams<{ testId: string }>();

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => testService.getTest(testId!),
    enabled: !!testId,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to={testId ? `/test/${testId}/instructions` : "/dashboard/my-tests"} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to test
        </Link>

        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <MessagesSquare className="w-5 h-5 text-primary-600" />
            Test Discussion
          </h1>
          <p className="page-subtitle">
            {test ? <>Discuss <span className="font-medium text-gray-700">{test.titleEn}</span> with fellow aspirants — ask doubts, share strategies, and help each other.</>
                  : "Discuss this test with fellow aspirants — ask doubts, share strategies, and help each other."}
          </p>
        </div>

        {testId && <DiscussionThread testId={testId} emptyTitle="No discussion yet" emptyDescription="Be the first to ask a question or share your thoughts about this test." />}
      </div>
    </div>
  );
}
