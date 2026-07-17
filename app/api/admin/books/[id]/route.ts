import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) return null;
  return user;
}

// Handles: edit fields, and status transitions (archive/hide/publish) via
// { status: "ARCHIVED" | "HIDDEN" | "PUBLISHED" } in the body.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const book = await prisma.book.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ book });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.book.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
