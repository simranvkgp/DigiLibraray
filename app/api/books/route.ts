import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookFormSchema } from "@/lib/validations";
import { parseDriveLink } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") ?? "recent";

  const where: any = {
    status: "PUBLISHED",
    categoryId: user.categoryId ?? undefined,
    boardId: user.boardId ?? undefined,
  };

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { subject: { contains: q } },
      { author: { contains: q } },
      { keywords: { contains: q } },
    ];
  }

  const orderBy =
    sort === "title"
      ? { title: "asc" as const }
      : sort === "popular"
      ? { viewCount: "desc" as const }
      : { createdAt: "desc" as const };

  const books = await prisma.book.findMany({
    where,
    include: { category: true, board: true },
    orderBy,
    take: 60,
  });

  const favoriteBookIds = new Set(
    (await prisma.favorite.findMany({ where: { userId: user.id, bookId: { in: books.map((b) => b.id) } } })).map(
      (f) => f.bookId
    )
  );

  return NextResponse.json({
    books: books.map((b) => ({
      id: b.id,
      title: b.title,
      subject: b.subject,
      className: b.className,
      description: b.description,
      version: b.version,
      boardName: b.board.name,
      categoryName: b.category.name,
      coverImageUrl: b.coverImageUrl,
      thumbnailUrl: b.thumbnailUrl,
      fileType: b.fileType,
      pageCount: b.pageCount,
      readingTimeMinutes: b.readingTimeMinutes,
      isFavorite: favoriteBookIds.has(b.id),
    })),
  });
}

// Admin-only: add a book via a pasted Google Drive share link.
export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bookFormSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let driveParts;
  try {
    driveParts = parseDriveLink(parsed.data.driveShareUrl);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const book = await prisma.book.create({
    data: {
      title: parsed.data.title,
      subject: parsed.data.subject,
      className: parsed.data.className,
      description: parsed.data.description,
      version: parsed.data.version,
      author: parsed.data.author,
      keywords: parsed.data.keywords,
      categoryId: parsed.data.categoryId,
      boardId: parsed.data.boardId,
      driveFileId: driveParts.fileId,
      driveShareUrl: parsed.data.driveShareUrl,
      drivePreviewUrl: driveParts.previewUrl,
      driveDownloadUrl: driveParts.downloadUrl,
      coverImageUrl: parsed.data.coverImageUrl || null,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      fileType: parsed.data.fileType,
      pageCount: parsed.data.pageCount,
      readingTimeMinutes: parsed.data.readingTimeMinutes,
    },
  });

  return NextResponse.json({ book }, { status: 201 });
}
