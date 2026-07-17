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

  const users = await prisma.user.findMany({
    where: status ? { approvalStatus: status } : undefined,
    include: {
      institution: true,
      category: true,
      board: true,
      _count: { select: { bookAccess: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      mobileNumber: u.mobileNumber,
      institution: u.institution?.name ?? "—",
      category: u.category?.name ?? "—",
      board: u.board?.name ?? "—",
      approvalStatus: u.approvalStatus,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      booksRead: u._count.bookAccess,
    })),
  });
}
