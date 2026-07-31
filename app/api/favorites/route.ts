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

  const favorites = await prisma.favorite.findMany({ where: { userId, bookId }, orderBy: { pageNumber: "asc" } });
  const isFavorite = favorites.some((f) => f.pageNumber === null);
  return NextResponse.json({ isFavorite, favorites });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { bookId, pageNumber } = await req.json();
  if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });
  const page = pageNumber ?? null;

  const existing = await prisma.favorite.findFirst({ where: { userId, bookId, pageNumber: page } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ isFavorite: false, favorite: null });
  }
  const favorite = await prisma.favorite.create({ data: { userId, bookId, pageNumber: page } });
  return NextResponse.json({ isFavorite: true, favorite }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { id } = await req.json();
  const favorite = await prisma.favorite.findUnique({ where: { id } });
  if (!favorite || favorite.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.favorite.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
