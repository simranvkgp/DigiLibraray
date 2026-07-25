import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { categoryId: true } });
  if (!user?.categoryId) return NextResponse.json({ bookNames: [] });

  const bookNames = await prisma.requestableBookName.findMany({
    where: { categoryId: user.categoryId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, className: true, author: true },
  });
  return NextResponse.json({ bookNames });
}
