import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Badge count for the sidebar's "New Arrivals" link — books published since
// the user last opened that link. Falls back to account creation date for
// users who've never opened it yet, so the badge doesn't show the whole
// library's worth of books on first login.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const [setting, user] = await Promise.all([
    prisma.setting.findUnique({ where: { userId }, select: { newArrivalsSeenAt: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
  ]);
  const since = setting?.newArrivalsSeenAt ?? user?.createdAt ?? new Date(0);

  const count = await prisma.book.count({
    where: { status: "PUBLISHED", createdAt: { gt: since } },
  });

  return NextResponse.json({ count });
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  await prisma.setting.upsert({
    where: { userId },
    update: { newArrivalsSeenAt: new Date() },
    create: { userId, newArrivalsSeenAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
