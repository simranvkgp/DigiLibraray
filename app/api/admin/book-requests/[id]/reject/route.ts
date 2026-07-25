import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookRequestRejectSchema } from "@/lib/validations";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const request = await prisma.bookRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = bookRequestRejectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.bookRequest.update({
    where: { id: params.id },
    data: {
      status: "REJECTED",
      resolvedById: actor.id,
      resolvedAt: new Date(),
      adminNote: parsed.data.adminNote || null,
    },
  });

  return NextResponse.json({ request: updated });
}
