import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || actor.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { role } = await req.json();
  if (role !== "ADMIN" && role !== "USER") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (params.id === actor.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
  if (target?.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot change a super admin's role" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: params.id }, data: { role } });

  await prisma.activityLog.create({
    data: { userId: actor.id, action: role === "ADMIN" ? "PROMOTE_TO_ADMIN" : "DEMOTE_TO_USER", metadata: JSON.stringify({ targetUserId: params.id }) },
  });

  return NextResponse.json({ success: true, user: updated });
}
