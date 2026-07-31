import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { getBookForViewer } from "@/lib/book-access";
import { BookReader } from "@/components/reader/BookReader";
import { AccessRequiredNotice } from "@/components/books/AccessRequiredNotice";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const session = await auth();
  const user = session!.user as any;
  const userId = user.id as string;
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const lang = await getUserLanguage(userId);

  const result = await getBookForViewer(params.id, userId, isAdmin);
  if (result.status === "NOT_FOUND") notFound();

  const { book } = result;

  if (result.status === "FORBIDDEN") {
    const latestRequest = await prisma.bookRequest.findFirst({
      where: { userId, bookId: book.id },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    });
    return (
      <AccessRequiredNotice
        book={{ id: book.id, title: book.title, coverImageUrl: book.coverImageUrl }}
        lang={lang}
        requestStatus={(latestRequest?.status as any) ?? "NONE"}
      />
    );
  }

  const [progress, bookmarks, favorites] = await Promise.all([
    prisma.readingProgress.findUnique({ where: { userId_bookId: { userId, bookId: book.id } } }),
    prisma.bookmark.findMany({ where: { userId, bookId: book.id }, orderBy: { pageNumber: "asc" } }),
    prisma.favorite.findMany({ where: { userId, bookId: book.id }, orderBy: { pageNumber: "asc" } }),
  ]);

  return (
    <BookReader
      book={{
        id: book.id,
        title: book.title,
        subject: book.subject,
        boardName: book.board.name,
        categoryName: book.category.name,
        fileType: book.fileType,
        pageCount: book.pageCount,
        // Never sent to the client for PDFs — the viewer fetches bytes
        // itself through the authenticated /api/books/[id]/file route.
        drivePreviewUrl: book.fileType === "PDF" ? null : book.drivePreviewUrl,
        driveDownloadUrl: book.fileType === "PDF" ? "" : book.driveDownloadUrl,
      }}
      initialPage={Number(searchParams.page) || progress?.currentPage || 1}
      initialBookmarks={bookmarks}
      initialFavorites={favorites}
      lang={lang}
    />
  );
}
