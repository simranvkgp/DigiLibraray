import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { categoryId: true } });
  if (!user?.categoryId) return NextResponse.json({ bookNames: [] });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const where: any = { categoryId: user.categoryId };
  if (q) {
    const qi = q.trim();
    where.OR = [
      { name: { contains: qi, mode: "insensitive" } },
      { className: { contains: qi, mode: "insensitive" } },
      { author: { contains: qi, mode: "insensitive" } },
      { medium: { contains: qi, mode: "insensitive" } },
      { institution: { name: { contains: qi, mode: "insensitive" } } },
    ];
  }

  const bookNames = await prisma.requestableBookName.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      className: true,
      author: true,
      medium: true,
      institution: { select: { name: true } },
    },
  });
  // Normalize institution name for client convenience
  return NextResponse.json({
    bookNames: bookNames.map((b) => ({
      id: b.id,
      name: b.name,
      className: b.className,
      author: b.author,
      medium: b.medium,
      institutionName: b.institution?.name ?? null,
    })),
  });
}
