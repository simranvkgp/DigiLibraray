"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Inbox,
  ListPlus,
  Users,
  GraduationCap,
  Boxes,
  Building2,
  BarChart3,
  Bell,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  LayoutDashboard,
  BookOpen,
  Inbox,
  ListPlus,
  Users,
  GraduationCap,
  Boxes,
  Building2,
  BarChart3,
  Bell,
  Settings,
  ScrollText,
};

export interface AdminNavModule {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
  group: string;
}

export function AdminSidebarNav({ modules }: { modules: AdminNavModule[] }) {
  const pathname = usePathname();

  const groups: { name: string; items: AdminNavModule[] }[] = [];
  for (const m of modules) {
    let group = groups.find((g) => g.name === m.group);
    if (!group) {
      group = { name: m.group, items: [] };
      groups.push(group);
    }
    group.items.push(m);
  }

  return (
    <nav className="space-y-4 p-3">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {group.name}
          </p>
          <div className="space-y-1">
            {group.items.map((m) => {
              const Icon = ICONS[m.icon];
              const active = pathname === m.href || pathname?.startsWith(`${m.href}/`);
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white",
                    active && "border-dash-gold bg-white/10 font-semibold text-white"
                  )}
                >
                  <Icon size={18} />
                  {m.label}
                  {!!m.badge && (
                    <span className="ml-auto rounded-full bg-brandred px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {m.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
