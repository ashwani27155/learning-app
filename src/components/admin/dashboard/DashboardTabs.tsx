export interface DashboardTab { id: string; label: string; }

interface DashboardTabsProps {
  tabs: DashboardTab[];
  active: string;
  onChange: (id: string) => void;
}

export function DashboardTabs({ tabs, active, onChange }: DashboardTabsProps) {
  return (
    <div className="inline-flex bg-primary-50 border border-primary-100 rounded-xl p-1 gap-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
            active === t.id
              ? "bg-white text-primary-700 shadow-purple-sm"
              : "text-gray-500 hover:text-primary-600"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
