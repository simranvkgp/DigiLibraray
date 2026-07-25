import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  if (categories.length === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Secondary", slug: "secondary", order: 0 },
        { name: "Senior Secondary", slug: "senior-secondary", order: 1 },
        { name: "University", slug: "university", order: 2 },
      ],
    });
    categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  }
  return NextResponse.json({ categories });
}
