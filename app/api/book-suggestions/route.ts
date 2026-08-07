import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookSuggestionSchema } from "@/lib/validations";
import { sendPushToAdmins } from "@/lib/push";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const suggestions = await prisma.bookSuggestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ suggestions });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const body = await req.json();
  const parsed = bookSuggestionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { title, author, subject, className, medium, note } = parsed.data;

  const suggestion = await prisma.bookSuggestion.create({
    data: {
      userId,
      title,
      author: author || null,
      subject: subject || null,
      className: className || null,
      medium: medium || null,
      note: note || null,
    },
  });

  const requester = session.user as any;
  sendPushToAdmins(
    "New book request",
    `${requester.name ?? "A user"} requested "${title}"`,
    "/admin/requests"
  ).catch(() => {});

  return NextResponse.json({ suggestion }, { status: 201 });
}
