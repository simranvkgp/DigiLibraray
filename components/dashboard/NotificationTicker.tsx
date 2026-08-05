import { Megaphone } from "lucide-react";

type TickerItem = {
  id: string;
  title: string;
  type: string;
};

export function NotificationTicker({ items, label }: { items: TickerItem[]; label: string }) {
  if (items.length === 0) return null;

  const track = (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((n) => (
        <span key={n.id} className="whitespace-nowrap text-sm font-semibold text-brandred">
          {n.title}
        </span>
      ))}
    </div>
  );

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <span className="flex shrink-0 items-center gap-1.5 border-r border-border bg-brandred px-3 text-xs font-semibold uppercase tracking-wide text-white">
        <Megaphone size={14} aria-hidden="true" />
        {label}
      </span>
      <div className="flex-1 overflow-hidden py-2.5">
        <div className="flex w-max animate-marquee">
          {track}
          {track}
        </div>
      </div>
    </div>
  );
}
