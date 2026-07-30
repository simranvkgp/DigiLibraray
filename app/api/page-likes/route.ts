import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");

  const pageLikes = await prisma.pageLike.findMany({
    where: bookId ? { userId, bookId } : { userId },
    orderBy: { pageNumber: "asc" },
  });
  return NextResponse.json({ pageLikes });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { bookId, pageNumber } = await req.json();
  if (!bookId || !pageNumber) {
    return NextResponse.json({ error: "bookId and pageNumber are required" }, { status: 400 });
  }

  const existing = await prisma.pageLike.findFirst({ where: { userId, bookId, pageNumber } });
  if (existing) {
    await prisma.pageLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }
  const pageLike = await prisma.pageLike.create({ data: { userId, bookId, pageNumber } });
  return NextResponse.json({ liked: true, pageLike }, { status: 201 });
}
