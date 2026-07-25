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

  const suggestions = await prisma.bookSuggestion.findMany({
    where: status ? { status } : undefined,
    include: {
      user: { include: { institution: true, category: true, board: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    suggestions: suggestions.map((s) => ({
      id: s.id,
      title: s.title,
      author: s.author,
      subject: s.subject,
      className: s.className,
      note: s.note,
      status: s.status,
      adminNote: s.adminNote,
      createdAt: s.createdAt,
      resolvedAt: s.resolvedAt,
      user: {
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
        institution: s.user.institution?.name ?? "—",
        category: s.user.category?.name ?? "—",
        board: s.user.board?.name ?? "—",
      },
    })),
  });
}
