import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) return null;
  return user;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, className, medium, author, categoryId, institutionName } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return NextResponse.json({ error: "That category doesn't exist" }, { status: 400 });

  let institutionId: string | null = null;
  const institutionNameTrimmed = institutionName?.trim();
  if (institutionNameTrimmed) {
    const existingInstitution = await prisma.institution.findFirst({ where: { name: institutionNameTrimmed } });
    institutionId = existingInstitution
      ? existingInstitution.id
      : (await prisma.institution.create({ data: { name: institutionNameTrimmed } })).id;
  }

  const nameTrimmed = name.trim();
  const classNameTrimmed = className?.trim() || null;
  const mediumTrimmed = medium?.trim() || null;

  const duplicate = await prisma.requestableBookName.findFirst({
    where: {
      id: { not: params.id },
      name: nameTrimmed,
      categoryId,
      className: classNameTrimmed,
      medium: mediumTrimmed,
      institutionId,
    },
  });
  if (duplicate) {
    return NextResponse.json({ error: "That combination of name, class, medium, category and institution already exists" }, { status: 409 });
  }

  const bookName = await prisma.requestableBookName.update({
    where: { id: params.id },
    data: {
      name: nameTrimmed,
      className: classNameTrimmed,
      medium: mediumTrimmed,
      author: author?.trim() || null,
      categoryId,
      institutionId,
    },
    include: { category: true, institution: true },
  });
  return NextResponse.json({ bookName });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.requestableBookName.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
