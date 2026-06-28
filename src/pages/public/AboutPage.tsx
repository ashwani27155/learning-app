import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function formatStat(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(0)}L+`;
  if (n >= 1_000)   return `${(n / 1_000).toFixed(0)}k+`;
  return `${n}+`;
}

export default function AboutPage() {
  const { data: statsRaw } = useQuery({
    queryKey: ["public-stats"],
    queryFn:  () => api.get<any>("/stats"),
    staleTime: 300_000,
  });
  const stats = (statsRaw as any)?.data ?? statsRaw ?? null;

  const statCards = [
    { val: stats ? formatStat(stats.users)     : "50,000+",   label: "Students"     },
    { val: stats ? formatStat(stats.series)    : "2,500+",    label: "Test Series"  },
    { val: stats ? formatStat(stats.questions) : "1,50,000+", label: "Questions"    },
    { val: stats ? formatStat(stats.attempts)  : "10,000+",   label: "Tests Taken"  },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">About MPSC Sadhak</h1>
      <p className="text-gray-600 text-lg leading-relaxed mb-6">
        MPSC Sadhak is Maharashtra's leading online exam preparation platform, built to help lakhs of aspirants crack MPSC exams with confidence. Our bilingual (English & Marathi) test series, smart analytics, and expert-crafted question bank make preparation effective and accessible.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {statCards.map(({ val, label }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-xl font-bold text-primary-600">{val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        To make quality MPSC preparation accessible to every aspirant across Maharashtra, regardless of their location or background — in both English and Marathi.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Us</h2>
      <p className="text-gray-600">
        Email:{" "}
        <a href="/contact" className="text-primary-600 hover:underline">Contact Page</a>
      </p>
    </div>
  );
}
