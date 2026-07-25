import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const request = await prisma.bookRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const [updated] = await prisma.$transaction([
    prisma.bookRequest.update({
      where: { id: params.id },
      data: { status: "APPROVED", resolvedById: actor.id, resolvedAt: new Date() },
    }),
    prisma.bookAccessGrant.upsert({
      where: { userId_bookId: { userId: request.userId, bookId: request.bookId } },
      update: { grantedById: actor.id },
      create: { userId: request.userId, bookId: request.bookId, grantedById: actor.id },
    }),
  ]);

  return NextResponse.json({ request: updated });
}
