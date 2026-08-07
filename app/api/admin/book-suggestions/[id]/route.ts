import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suggestion = await prisma.bookSuggestion.findUnique({ where: { id: params.id } });
  if (!suggestion) return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });

  await prisma.bookSuggestion.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
