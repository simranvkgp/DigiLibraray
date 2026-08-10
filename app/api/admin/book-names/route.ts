import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const bookNames = await prisma.requestableBookName.findMany({
    orderBy: [{ category: { order: "asc" } }, { name: "asc" }],
    include: { category: true, institution: true },
  });
  return NextResponse.json({ bookNames });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, categoryId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return NextResponse.json({ error: "That category doesn't exist" }, { status: 400 });

  const existing = await prisma.requestableBookName.findFirst({
    where: { name: name.trim(), categoryId, className: null, medium: null, institutionId: null },
  });
  if (existing) return NextResponse.json({ error: "That name already exists for this category" }, { status: 409 });

  const bookName = await prisma.requestableBookName.create({
    data: { name: name.trim(), categoryId },
    include: { category: true },
  });
  return NextResponse.json({ bookName }, { status: 201 });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  // With no categoryId, wipe every category's book names — used by the
  // page-level "Remove all" control. With one, scope the delete to just
  // that category so clearing e.g. Secondary doesn't touch University.
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: "That category doesn't exist" }, { status: 400 });
    const result = await prisma.requestableBookName.deleteMany({ where: { categoryId } });
    return NextResponse.json({ deleted: result.count });
  }

  const result = await prisma.requestableBookName.deleteMany({});
  return NextResponse.json({ deleted: result.count });
}
