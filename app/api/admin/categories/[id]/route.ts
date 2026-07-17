import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const admin = session?.user as any;
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inUse = await prisma.book.count({ where: { categoryId: params.id } });
  const usersLocked = await prisma.user.count({ where: { categoryId: params.id } });
  if (inUse > 0 || usersLocked > 0) {
    return NextResponse.json(
      { error: `Can't delete — ${inUse} book(s) and ${usersLocked} user(s) reference this category.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
