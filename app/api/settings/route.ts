import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const settings = await prisma.setting.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const body = await req.json();
  const allowed = ["theme", "language", "emailNotifications", "pushNotifications"];
  const data: Record<string, any> = {};
  for (const key of allowed) if (key in body) data[key] = body[key];

  const settings = await prisma.setting.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return NextResponse.json({ settings });
}
