import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookRequestSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  // Rejected requests are a dead end for the requester — only surface the
  // ones still pending admin review or already approved.
  const requests = await prisma.bookRequest.findMany({
    where: { userId, status: { in: ["PENDING", "APPROVED"] } },
    include: { book: { select: { id: true, title: true, subject: true, className: true, category: { select: { name: true } }, board: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = session.user as any;
  const userId = user.id as string;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const body = await req.json();
  const parsed = bookRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { bookId, note } = parsed.data;

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book || book.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Mirrors the category scoping in GET /api/books — a user should only be
  // able to request books from their own (locked) category, even via a
  // direct API call that bypasses the library listing UI.
  if (!isAdmin && book.categoryId !== user.categoryId) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const existingGrant = await prisma.bookAccessGrant.findUnique({ where: { userId_bookId: { userId, bookId } } });
  if (existingGrant) {
    return NextResponse.json({ error: "You already have access to this book" }, { status: 400 });
  }

  const existingPending = await prisma.bookRequest.findFirst({ where: { userId, bookId, status: "PENDING" } });
  if (existingPending) {
    return NextResponse.json({ error: "You already have a pending request for this book" }, { status: 409 });
  }

  const request = await prisma.bookRequest.create({
    data: { userId, bookId, note: note || null },
  });

  return NextResponse.json({ request }, { status: 201 });
}
