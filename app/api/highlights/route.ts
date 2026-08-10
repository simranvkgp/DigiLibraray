import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");

  const highlights = await prisma.highlight.findMany({
    where: bookId ? { userId, bookId } : { userId },
    orderBy: { pageNumber: "asc" },
  });
  return NextResponse.json({ highlights });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { bookId, pageNumber, text, rects, color } = await req.json();
  if (!bookId || !pageNumber || !text || !rects) {
    return NextResponse.json({ error: "bookId, pageNumber, text and rects are required" }, { status: 400 });
  }

  const highlight = await prisma.highlight.create({
    data: { userId, bookId, pageNumber, text, rects: JSON.stringify(rects), color: color || "yellow" },
  });
  return NextResponse.json({ highlight }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { id } = await req.json();
  const highlight = await prisma.highlight.findUnique({ where: { id } });
  if (!highlight || highlight.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.highlight.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
