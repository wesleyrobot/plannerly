"use client";

export type CalendarViewType = "month" | "week" | "day";

interface ViewSwitcherProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const views: { key: CalendarViewType; label: string }[] = [
  { key: "month", label: "Mensal" },
  { key: "week", label: "Semanal" },
  { key: "day", label: "Diário" },
];

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl overflow-hidden">
      {views.map((v) => (
        <button
          key={v.key}
          onClick={() => onViewChange(v.key)}
          className={`chalk-text px-4 py-1.5 text-sm tracking-wider transition-all ${
            currentView === v.key
              ? "bg-[#f0c040]/15 text-[#f0c040]"
              : "text-[#888] hover:bg-white/5 hover:text-[#a0a0b0]"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
