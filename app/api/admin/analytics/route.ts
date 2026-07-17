import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

export async function GET() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [totalUsers, activeUsers, pendingUsers, totalBooks, viewAgg, downloadAgg, popularBooks, recentLogins, recentActivity] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.user.count({ where: { approvalStatus: "PENDING" } }),
      prisma.book.count(),
      prisma.book.aggregate({ _sum: { viewCount: true } }),
      prisma.book.aggregate({ _sum: { downloadCount: true } }),
      prisma.book.findMany({ orderBy: { viewCount: "desc" }, take: 5, select: { title: true, viewCount: true } }),
      prisma.activityLog.findMany({ where: { action: "LOGIN", createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
      prisma.activityLog.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true, action: true } }),
    ]);

  // Daily logins for the last 30 days, zero-filled.
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap.set(dayKey(d), 0);
  }
  recentLogins.forEach((l) => {
    const k = dayKey(l.createdAt);
    if (dailyMap.has(k)) dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1);
  });

  // Monthly activity for the last 6 months, zero-filled.
  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthlyMap.set(monthKey(d), 0);
  }
  recentActivity.forEach((a) => {
    const k = monthKey(a.createdAt);
    if (monthlyMap.has(k)) monthlyMap.set(k, (monthlyMap.get(k) ?? 0) + 1);
  });

  return NextResponse.json({
    summary: {
      totalUsers,
      activeUsers,
      pendingUsers,
      totalBooks,
      totalViews: viewAgg._sum.viewCount ?? 0,
      totalDownloads: downloadAgg._sum.downloadCount ?? 0,
    },
    popularBooks: popularBooks.map((b) => ({ title: b.title, views: b.viewCount })),
    dailyLogins: Array.from(dailyMap.entries()).map(([date, count]) => ({ date: date.slice(5), count })),
    monthlyActivity: Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count })),
  });
}
