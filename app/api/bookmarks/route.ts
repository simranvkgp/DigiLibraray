import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  if (!bookId) return NextResponse.json({ error: "bookId is required" }, { status: 400 });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, bookId },
    orderBy: { pageNumber: "asc" },
  });
  return NextResponse.json({ bookmarks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { bookId, pageNumber, note } = await req.json();
  if (!bookId || !pageNumber) {
    return NextResponse.json({ error: "bookId and pageNumber are required" }, { status: 400 });
  }

  const bookmark = await prisma.bookmark.create({ data: { userId, bookId, pageNumber, note } });
  return NextResponse.json({ bookmark }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { id } = await req.json();
  const bookmark = await prisma.bookmark.findUnique({ where: { id } });
  if (!bookmark || bookmark.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.bookmark.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
