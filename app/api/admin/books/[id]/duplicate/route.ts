import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const admin = session?.user as any;
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const original = await prisma.book.findUnique({ where: { id: params.id } });
  if (!original) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const { id, createdAt, updatedAt, viewCount, downloadCount, ...rest } = original;
  const copy = await prisma.book.create({
    data: { ...rest, title: `${original.title} (copy)`, status: "DRAFT" },
  });

  return NextResponse.json({ book: copy }, { status: 201 });
}
