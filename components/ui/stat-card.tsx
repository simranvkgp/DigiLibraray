import type { LucideIcon } from "lucide-react";

const TONE_STYLES = {
  navy: "bg-dash-navy text-white",
  success: "bg-success text-white",
  gold: "bg-dash-gold text-dash-navy",
  accent: "bg-dash-blue text-white",
  warning: "bg-warning text-white",
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = "navy",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: keyof typeof TONE_STYLES;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${TONE_STYLES[tone]}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-text-secondary">{label}</p>
        <p className="font-display text-2xl font-semibold text-dash-navy">{value}</p>
        {sublabel && <p className="text-xs text-text-secondary">{sublabel}</p>}
      </div>
    </div>
  );
}
