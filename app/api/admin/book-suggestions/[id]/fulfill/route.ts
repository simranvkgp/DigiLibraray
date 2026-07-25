import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Grants the suggesting user access to a book that's already in the library
// (picked by the admin in the Access panel), and resolves the suggestion.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestion = await prisma.bookSuggestion.findUnique({ where: { id: params.id } });
  if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  if (suggestion.status !== "PENDING") {
    return NextResponse.json({ error: "That suggestion has already been resolved" }, { status: 409 });
  }

  const { bookId } = await req.json();
  if (!bookId) {
    return NextResponse.json({ error: "Please add the book in the library first, then come back here to give access." }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) {
    return NextResponse.json({ error: "Please add the book in the library first, then come back here to give access." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.bookAccessGrant.upsert({
      where: { userId_bookId: { userId: suggestion.userId, bookId } },
      update: { grantedById: actor.id },
      create: { userId: suggestion.userId, bookId, grantedById: actor.id },
    }),
    prisma.bookSuggestion.update({
      where: { id: params.id },
      data: { status: "ADDED", resolvedById: actor.id, resolvedAt: new Date(), linkedBookId: bookId },
    }),
  ]);

  return NextResponse.json({ success: true });
}
