"use client";

import { useState } from "react";
import { Megaphone, BookPlus, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { translate, type Lang } from "@/lib/i18n/translate";
import { formatRelativeTime, notificationBadgeVariant } from "@/lib/utils";

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

function NotificationPill({ item, onSelect }: { item: NotificationItem; onSelect: (item: NotificationItem) => void }) {
  const Icon = TYPE_ICON[item.type] ?? Bell;
  const variant = notificationBadgeVariant(item.type);
  const styles = VARIANT_STYLES[variant];
  const isUnread = !item.readAt;

  return (
    <button
      onClick={() => onSelect(item)}
      className={`flex w-64 flex-shrink-0 items-center gap-2.5 rounded-xl border border-l-[3px] px-3 py-2.5 text-left transition-colors hover:shadow-card-hover ${styles.border} ${
        isUnread ? "border-dash-gold/40 bg-dash-gold/10 shadow-card" : "border-border bg-transparent"
      }`}
    >
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
        <Icon size={14} aria-hidden="true" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {isUnread && <span aria-hidden="true" className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-dash-gold" />}
        <span className={`truncate text-sm ${isUnread ? "font-semibold text-dash-navy" : "font-medium text-dash-navy"}`}>{item.title}</span>
        <span className="ml-auto flex-shrink-0 text-xs text-text-secondary">{formatRelativeTime(item.createdAt)}</span>
      </div>
    </button>
  );
}

export function NotificationsPanel({ items, lang = "en" }: { items: NotificationItem[]; lang?: Lang }) {
  const t = (key: string) => translate(lang, key);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const track = (
    <div className="flex flex-shrink-0 items-center gap-3 pr-3">
      {items.map((n) => (
        <NotificationPill key={n.id} item={n} onSelect={setSelected} />
      ))}
    </div>
  );

  const SelectedIcon = selected ? TYPE_ICON[selected.type] ?? Bell : Bell;

  return (
    <>
      <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-medium text-dash-navy">{t("dashboard.notifications")}</h2>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">{t("dashboard.noNotifications")}</p>
        ) : (
          <div className="mt-3 overflow-hidden">
            <div className="flex w-max animate-marquee">
              {track}
              {track}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={notificationBadgeVariant(selected.type)}>{selected.type.replace("_", " ")}</Badge>
                  <DialogDescription className="m-0">{formatRelativeTime(selected.createdAt)}</DialogDescription>
                </div>
                <DialogTitle className="flex items-center gap-2">
                  <SelectedIcon size={18} className="text-dash-navy" aria-hidden="true" />
                  {selected.title}
                </DialogTitle>
              </DialogHeader>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">{selected.body}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
