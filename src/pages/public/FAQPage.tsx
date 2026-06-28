import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface FAQ {
  id: string;
  question: string;
  questionMr?: string;
  answer: string;
  answerMr?: string;
  category?: string;
  orderIndex: number;
}

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(null);

  const { data: faqsRaw, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn:  () => api.get<any>("/faqs"),
    staleTime: 600_000,
  });

  const faqs: FAQ[] = Array.isArray(faqsRaw?.data) ? faqsRaw.data
    : Array.isArray(faqsRaw) ? faqsRaw : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 mb-10">Everything you need to know about MPSC Sadhak.</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card px-5 py-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No FAQs available at the moment.</p>
      ) : (
        <div className="space-y-3">
          {faqs.map(f => (
            <div key={f.id} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === f.id ? null : f.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 text-sm">{f.question}</span>
                <span className="text-gray-400 text-lg flex-shrink-0 ml-3">{open === f.id ? "−" : "+"}</span>
              </button>
              {open === f.id && (
                <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                  {f.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-sm text-gray-500 text-center">
        Still have questions?{" "}
        <a href="/contact" className="text-primary-600 hover:underline">Contact us</a>
      </p>
    </div>
  );
}
