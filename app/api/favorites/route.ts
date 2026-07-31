import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { book: { select: { id: true, title: true, subject: true, coverImageUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ favorites });
  }

  const favorite = await prisma.favorite.findUnique({ where: { userId_bookId: { userId, bookId } } });
  return NextResponse.json({ isFavorite: !!favorite });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { bookId } = await req.json();
  if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });

  const existing = await prisma.favorite.findUnique({ where: { userId_bookId: { userId, bookId } } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ isFavorite: false });
  }
  await prisma.favorite.create({ data: { userId, bookId } });
  return NextResponse.json({ isFavorite: true });
}
