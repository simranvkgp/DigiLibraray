import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { bookId, currentPage, totalPages } = await req.json();
  if (!bookId || !currentPage) {
    return NextResponse.json({ error: "bookId and currentPage are required" }, { status: 400 });
  }

  const percentComplete = totalPages ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  const progress = await prisma.readingProgress.upsert({
    where: { userId_bookId: { userId, bookId } },
    update: { currentPage, totalPages, percentComplete, lastReadAt: new Date() },
    create: { userId, bookId, currentPage, totalPages, percentComplete },
  });

  await prisma.bookAccess.upsert({
    where: { userId_bookId: { userId, bookId } },
    update: { lastOpenedAt: new Date() },
    create: { userId, bookId },
  });

  await prisma.book.update({ where: { id: bookId }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json({ progress });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });

  const progress = await prisma.readingProgress.findUnique({ where: { userId_bookId: { userId, bookId } } });
  return NextResponse.json({ progress });
}
