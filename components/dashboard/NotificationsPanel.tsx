import { Megaphone, BookPlus, Bell } from "lucide-react";
import { translate, type Lang } from "@/lib/i18n/translate";
import { notificationBadgeVariant } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: Date | string;
  readAt: Date | string | null;
}

const TYPE_ICON: Record<string, typeof Megaphone> = {
  ANNOUNCEMENT: Megaphone,
  NEW_BOOK: BookPlus,
  MAINTENANCE: Bell,
};

// Same categorization already used for notification Badges elsewhere in the
// app (lib/utils.ts notificationBadgeVariant) — just mapped to this panel's
// icon-circle/left-border colors instead of a text badge.
const VARIANT_STYLES = {
  success: { icon: "bg-success/10 text-success", border: "border-l-success" },
  warning: { icon: "bg-warning/10 text-warning", border: "border-l-warning" },
  accent: { icon: "bg-dash-blue/10 text-dash-blue", border: "border-l-dash-blue" },
} as const;

function NotificationPill({ item }: { item: NotificationItem }) {
  const Icon = TYPE_ICON[item.type] ?? Bell;
  const variant = notificationBadgeVariant(item.type);
  const styles = VARIANT_STYLES[variant];
  const isUnread = !item.readAt;

  return (
    <div
      className={`flex w-44 flex-shrink-0 items-center gap-2 rounded-lg border border-l-[3px] px-2.5 py-2 transition-colors ${styles.border} ${
        isUnread ? "border-dash-gold/40 bg-dash-gold/10 shadow-card" : "border-border bg-transparent"
      }`}
    >
      <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
        <Icon size={12} aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {isUnread && <span aria-hidden="true" className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-dash-gold" />}
        <span className={`truncate text-xs ${isUnread ? "font-semibold text-dash-navy" : "font-medium text-dash-navy"}`}>{item.title}</span>
      </div>
    </div>
  );
}

export function NotificationsPanel({ items, lang = "en" }: { items: NotificationItem[]; lang?: Lang }) {
  const t = (key: string) => translate(lang, key);

  const track = (
    <div className="flex flex-shrink-0 items-center gap-2 pr-2">
      {items.map((n) => (
        <NotificationPill key={n.id} item={n} />
      ))}
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-card">
      <h2 className="font-display text-sm font-medium text-dash-navy">{t("dashboard.notifications")}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-text-secondary">{t("dashboard.noNotifications")}</p>
      ) : (
        <div className="mt-2 overflow-hidden">
          <div className="flex w-max animate-marquee-reverse">
            {track}
            {track}
          </div>
        </div>
      )}
    </div>
  );
}
