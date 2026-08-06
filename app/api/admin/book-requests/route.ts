import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const requests = await prisma.bookRequest.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { include: { institution: true, category: true, board: true } },
      book: { include: { category: true, board: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      note: r.note,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        institution: r.user.institution?.name ?? "—",
        category: r.user.category?.name ?? "—",
        board: r.user.board?.name ?? "—",
      },
      book: {
        id: r.book.id,
        title: r.book.title,
        subject: r.book.subject,
        className: r.book.className,
        coverImageUrl: r.book.coverImageUrl,
        category: r.book.category?.name ?? "—",
        board: r.book.board?.name ?? "—",
      },
    })),
  });
}
