import { Badge } from "@/components/ui/badge";
import { notificationBadgeVariant } from "@/lib/utils";

type TickerItem = {
  id: string;
  title: string;
  type: string;
};

export function NotificationTicker({ items, label }: { items: TickerItem[]; label: string }) {
  if (items.length === 0) return null;

  const track = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((n) => (
        <span key={n.id} className="flex items-center gap-2 whitespace-nowrap text-sm">
          <Badge variant={notificationBadgeVariant(n.type)}>{n.type.replace("_", " ")}</Badge>
          <span className="font-medium text-navy">{n.title}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="mt-6 flex items-stretch overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <span className="flex shrink-0 items-center border-r border-border bg-navy px-3 text-xs font-semibold uppercase tracking-wide text-white">
        {label}
      </span>
      <div className="overflow-hidden py-2.5">
        <div className="flex w-max animate-marquee">
          {track}
          {track}
        </div>
      </div>
    </div>
  );
}
