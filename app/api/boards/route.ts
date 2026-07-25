import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_BOARDS = ["CBSE", "ICSE", "Haryana Board", "Punjab Board", "Rajasthan Board", "University", "Others"];

export async function GET() {
  let boards = await prisma.board.findMany({ orderBy: { order: "asc" } });
  if (boards.length === 0) {
    await prisma.board.createMany({
      data: DEFAULT_BOARDS.map((name, i) => ({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        order: i,
      })),
    });
    boards = await prisma.board.findMany({ orderBy: { order: "asc" } });
  }
  return NextResponse.json({ boards });
}
