import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySelectionSchema } from "@/lib/validations";

// Secondary and Senior Secondary are treated as one switchable group; University
// is a separate, permanently sealed group. A user may move between Secondary
// and Senior Secondary at any time, but can never move into or out of University.
const SWITCHABLE_SLUGS = ["secondary", "senior-secondary"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { category: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = categorySelectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const nextCategory = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!nextCategory) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  if (user.categoryLocked) {
    const currentSlug = user.category?.slug;
    const isCurrentSwitchable = currentSlug ? SWITCHABLE_SLUGS.includes(currentSlug) : false;
    const isNextSwitchable = SWITCHABLE_SLUGS.includes(nextCategory.slug);

    if (!isCurrentSwitchable || !isNextSwitchable) {
      return NextResponse.json(
        { error: "University is permanent and can't be switched to or from." },
        { status: 409 }
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { categoryId: nextCategory.id, categoryLocked: true },
  });

  return NextResponse.json({ success: true });
}
