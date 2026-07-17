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

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recipients: true } } },
    take: 30,
  });
  return NextResponse.json({ notifications });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, body, type, categoryId, boardId } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "title and body are required" }, { status: 400 });

  const recipients = await prisma.user.findMany({
    where: {
      approvalStatus: "APPROVED",
      categoryId: categoryId || undefined,
      boardId: boardId || undefined,
    },
    select: { id: true },
  });

  const notification = await prisma.notification.create({
    data: {
      title,
      body,
      type: type ?? "ANNOUNCEMENT",
      recipients: { create: recipients.map((r) => ({ userId: r.id })) },
    },
  });

  return NextResponse.json({ notification, recipientCount: recipients.length }, { status: 201 });
}
