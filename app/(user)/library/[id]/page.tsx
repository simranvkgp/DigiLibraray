import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { BookReader } from "@/components/reader/BookReader";

export default async function ReaderPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const lang = await getUserLanguage(userId);

  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: { category: true, board: true },
  });
  if (!book || book.status === "HIDDEN" || book.status === "DRAFT") notFound();

  const [progress, bookmarks] = await Promise.all([
    prisma.readingProgress.findUnique({ where: { userId_bookId: { userId, bookId: book.id } } }),
    prisma.bookmark.findMany({ where: { userId, bookId: book.id }, orderBy: { pageNumber: "asc" } }),
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
        drivePreviewUrl: book.drivePreviewUrl,
        driveDownloadUrl: book.driveDownloadUrl,
      }}
      initialPage={progress?.currentPage ?? 1}
      initialBookmarks={bookmarks}
      lang={lang}
    />
  );
}
