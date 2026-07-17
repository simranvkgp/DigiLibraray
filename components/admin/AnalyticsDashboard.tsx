"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translate, type Lang } from "@/lib/i18n/translate";

interface AnalyticsData {
  summary: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    totalBooks: number;
    totalViews: number;
    totalDownloads: number;
  };
  popularBooks: { title: string; views: number }[];
  dailyLogins: { date: string; count: number }[];
  monthlyActivity: { month: string; count: number }[];
}

const NAVY = "#182956";
const ACCENT = "#4A90D6";

export function AnalyticsDashboard({ lang = "en" }: { lang?: Lang }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const t = (key: string) => translate(lang, key);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-sm text-text-secondary">{t("admin.analytics.loading")}</p>;

  const summaryCards = [
    { label: t("admin.dashboard.totalUsers"), value: data.summary.totalUsers },
    { label: t("admin.analytics.activeUsers"), value: data.summary.activeUsers },
    { label: t("admin.analytics.pendingUsers"), value: data.summary.pendingUsers, warn: data.summary.pendingUsers > 0 },
    { label: t("admin.nav.books"), value: data.summary.totalBooks },
    { label: t("admin.dashboard.totalViews"), value: data.summary.totalViews },
    { label: t("admin.analytics.totalDownloads"), value: data.summary.totalDownloads },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-text-secondary">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`data-text text-2xl font-medium ${s.warn ? "text-warning" : "text-navy"}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("admin.analytics.dailyLogins")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.dailyLogins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("admin.analytics.popularBooks")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.popularBooks} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Bar dataKey="views" fill={NAVY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t("admin.analytics.monthlyActivity")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
